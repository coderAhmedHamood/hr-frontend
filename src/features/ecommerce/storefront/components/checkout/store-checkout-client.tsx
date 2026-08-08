'use client';

import * as React from 'react';
import Image from 'next/image';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import {
  Check,
  ChevronLeft,
  CreditCard,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  CheckoutAddressInput,
  CheckoutPaymentMethod,
} from '@/features/ecommerce/storefront/domain/checkout';
import { calculateShippingFee } from '@/features/ecommerce/storefront/domain/checkout';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import { placeStorefrontOrder } from '@/features/ecommerce/storefront/lib/checkout-actions';
import { PartnerAuthApiError } from '@/features/ecommerce/storefront/domain/partner-auth';
import {
  createPartnerAddress,
  formatPartnerAddressLine,
  listPartnerAddresses,
  type PartnerAddress,
} from '@/features/ecommerce/storefront/lib/api/partner-addresses-api';
import { useStorefrontCartProducts } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-products';
import { useStorefrontCartUi } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-ui';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { buildProductDisplay, resolveDiscountPercent, resolveLineCompareAtPrice, resolveLineUnitPrice } from '@/features/ecommerce/storefront/lib/product-display';
import { ProductGridSkeleton } from '@/features/ecommerce/storefront/components/catalog/loading-skeleton';
import { StoreErrorState } from '@/features/ecommerce/storefront/components/catalog/store-error-state';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import {
  MAX_PAYMENT_PROOF_BYTES,
  MAX_PAYMENT_PROOF_FILES,
  compressPaymentProofToDataUrl,
} from '@/features/ecommerce/domain/lib/payment-proofs';
import { Button } from '@/components/ui/button';
import { GoogleLocationPicker, type GoogleLocationValue } from '@/components/ui/google-location-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { storeLoginHref, storeRegisterHref } from '@/features/ecommerce/storefront/lib/store-auth-return';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  GeoCascadeSelect,
  type GeoCascadeValue,
} from '@/features/system/organization/geo/components/geo-cascade-select';
import { usePublicGeoCountries } from '@/features/system/organization/geo/hooks/use-geo';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/shared/utils';
import type { StorefrontLocale } from '@/i18n/routing';

type StepId = 'address' | 'payment' | 'review';

const STEPS: { id: StepId; icon: typeof MapPin }[] = [
  { id: 'address', icon: MapPin },
  { id: 'payment', icon: Wallet },
  { id: 'review', icon: ShieldCheck },
];

type CheckoutClientProps = {
  checkoutConfig: StorefrontCompanyConfig['checkout'];
  currency: string;
};

export function StoreCheckoutClient({ checkoutConfig, currency: storeCurrency }: CheckoutClientProps) {
  const t = useTranslations('storefront');
  const format = useFormatter();
  const locale = useLocale() as StorefrontLocale;
  const router = useRouter();
  const lines = useStorefrontCartUi((s) => s.lines);
  const clearCart = useStorefrontCartUi((s) => s.clear);
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const clearSession = useStorefrontCustomerUi((s) => s.clearSession);
  const { data: products, isLoading, isError, refetch } = useStorefrontCartProducts();
  const [authReady, setAuthReady] = React.useState(false);

  React.useEffect(() => {
    const finish = () => setAuthReady(true);
    const unsub = useStorefrontCustomerUi.persist.onFinishHydration(finish);
    if (useStorefrontCustomerUi.persist.hasHydrated()) finish();
    return unsub;
  }, []);

  const cities = checkoutConfig.cities;
  const freeThreshold = checkoutConfig.freeShippingThreshold;
  const paymentMethods = checkoutConfig.paymentMethods;
  const companyId = getStorefrontCompanyId();
  const { data: geoCountries = [], isLoading: geoCountriesLoading } = usePublicGeoCountries(
    companyId,
    Boolean(companyId),
  );
  const useGeoCascade = geoCountries.length > 0;

  const [step, setStep] = React.useState<StepId>('address');
  const [address, setAddress] = React.useState<CheckoutAddressInput>(() => ({
    fullName: '',
    phone: '',
    countryId: null,
    cityId: null,
    districtId: null,
    city: checkoutConfig.defaultCity || cities[0] || 'صنعاء',
    district: '',
    street: '',
    notes: '',
  }));
  const [customerNote, setCustomerNote] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<CheckoutPaymentMethod>(
    () => paymentMethods[0] ?? 'cash_on_delivery',
  );
  const [paymentProofs, setPaymentProofs] = React.useState<Array<{ url: string; name: string }>>(
    [],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [addressErrors, setAddressErrors] = React.useState<
    Partial<Record<keyof CheckoutAddressInput, string>>
  >({});
  const [savedAddresses, setSavedAddresses] = React.useState<PartnerAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = React.useState(false);
  const [addressesError, setAddressesError] = React.useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | 'new'>('new');
  const appliedDefaultAddressRef = React.useRef(false);

  React.useEffect(() => {
    if (!authReady) return;
    if (accessToken) return;
    router.replace(storeLoginHref('/store/checkout'));
  }, [authReady, accessToken, router]);

  React.useEffect(() => {
    if (!customer) return;
    setAddress((prev) => ({
      ...prev,
      fullName: prev.fullName.trim() || customer.name || '',
      phone: prev.phone.trim() || customer.phone || '',
    }));
  }, [customer]);

  const loadSavedAddresses = React.useCallback(async () => {
    if (!accessToken) return;
    setAddressesLoading(true);
    setAddressesError(null);
    try {
      const result = await listPartnerAddresses(accessToken, {
        partnerId: customer?.partnerId,
        companyId: customer?.companyId || undefined,
        limit: 100,
      });
      const sorted = [...result.items].sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        const rank = (type: string) => (type === 'shipping' ? 0 : type === 'main' ? 1 : 2);
        return rank(a.addressType) - rank(b.addressType);
      });
      setSavedAddresses(sorted);
      if (!appliedDefaultAddressRef.current && sorted.length > 0) {
        const preferred = sorted.find((item) => item.isDefault) ?? sorted[0]!;
        appliedDefaultAddressRef.current = true;
        setSelectedAddressId(preferred.id);
        setAddress((prev) => ({
          ...prev,
          fullName: prev.fullName.trim() || customer?.name || '',
          phone: prev.phone.trim() || customer?.phone || '',
          countryId: preferred.countryId ?? null,
          cityId: preferred.cityId ?? null,
          districtId: preferred.districtId ?? null,
          city: preferred.city?.trim() || prev.city,
          district: preferred.district?.trim() || '',
          street: preferred.street?.trim() || '',
          notes: preferred.notes?.trim() || '',
          lat: preferred.latitude != null ? Number(preferred.latitude) : undefined,
          lng: preferred.longitude != null ? Number(preferred.longitude) : undefined,
        }));
      }
    } catch (err) {
      if (err instanceof PartnerAuthApiError && (err.status === 401 || err.status === 403)) {
        clearSession();
        router.replace(storeLoginHref('/store/checkout'));
        return;
      }
      setSavedAddresses([]);
      setAddressesError(t('checkout.addressesLoadFailed'));
    } finally {
      setAddressesLoading(false);
    }
  }, [accessToken, clearSession, customer, router, t]);

  React.useEffect(() => {
    if (!authReady || !accessToken) return;
    void loadSavedAddresses();
  }, [authReady, accessToken, loadSavedAddresses]);

  function applySavedAddress(row: PartnerAddress) {
    setSelectedAddressId(row.id);
    setAddressErrors({});
    setAddress((prev) => ({
      ...prev,
      fullName: prev.fullName.trim() || customer?.name || '',
      phone: prev.phone.trim() || customer?.phone || '',
      countryId: row.countryId ?? null,
      cityId: row.cityId ?? null,
      districtId: row.districtId ?? null,
      city: row.city?.trim() || prev.city,
      district: row.district?.trim() || '',
      street: row.street?.trim() || '',
      notes: row.notes?.trim() || '',
      lat: row.latitude != null ? Number(row.latitude) : undefined,
      lng: row.longitude != null ? Number(row.longitude) : undefined,
      mapAddress: undefined,
    }));
  }

  function startNewAddress() {
    setSelectedAddressId('new');
    setAddressErrors({});
    setAddress((prev) => ({
      ...prev,
      countryId: null,
      cityId: null,
      districtId: null,
      city: useGeoCascade ? '' : checkoutConfig.defaultCity || cities[0] || prev.city,
      district: '',
      street: '',
      notes: '',
      lat: undefined,
      lng: undefined,
      mapAddress: undefined,
    }));
  }

  const showAddressForm = selectedAddressId === 'new' || savedAddresses.length === 0;
  const selectedSaved =
    selectedAddressId !== 'new'
      ? savedAddresses.find((row) => row.id === selectedAddressId)
      : undefined;

  async function ensureAddressBookEntry() {
    if (!accessToken || !customer?.partnerId || selectedAddressId !== 'new') return;
    try {
      const created = await createPartnerAddress(accessToken, {
        partnerId: customer.partnerId,
        addressType: 'shipping',
        label: address.city,
        countryId: address.countryId ?? null,
        cityId: address.cityId ?? null,
        districtId: address.districtId ?? null,
        city: address.city,
        district: address.district,
        street: address.street,
        notes: address.notes ?? null,
        latitude: address.lat ?? null,
        longitude: address.lng ?? null,
        isDefault: savedAddresses.length === 0,
        countryCode: address.countryId ? null : 'YE',
      });
      setSavedAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
    } catch {
      /* order can still proceed with snapshot address */
    }
  }

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const cartLines = lines
    .map((line) => {
      const product = productById.get(line.productId);
      if (!product) return null;
      const variant = line.variantId
        ? product.variants.find((item) => item.id === line.variantId)
        : undefined;
      const unitPrice = resolveLineUnitPrice(product, variant);
      const compareAt = resolveLineCompareAtPrice(product, unitPrice);
      const discountPercent = resolveDiscountPercent(unitPrice, compareAt);
      const lineName = variant ? variant.nameAr : product.name;
      return { line, product, variant, unitPrice, compareAt, discountPercent, lineName };
    })
    .filter(Boolean) as Array<{
    line: (typeof lines)[number];
    product: NonNullable<ReturnType<typeof productById.get>>;
    variant: NonNullable<ReturnType<typeof productById.get>>['variants'][number] | undefined;
    unitPrice: NonNullable<ReturnType<typeof productById.get>>['price'];
    compareAt: NonNullable<ReturnType<typeof productById.get>>['compareAtPrice'];
    discountPercent: number | null;
    lineName: string;
  }>;

  const currency = cartLines[0]?.unitPrice.currency ?? storeCurrency ?? 'YER';
  const subtotal = cartLines.reduce((sum, item) => sum + item.unitPrice.amount * item.line.quantity, 0);
  const shipping = calculateShippingFee(subtotal, currency, {
    freeShippingThreshold: freeThreshold,
    standardShippingFee: checkoutConfig.standardShippingFee,
  });
  const total = subtotal + shipping.amount;
  const itemCount = cartLines.reduce((sum, item) => sum + item.line.quantity, 0);
  const freeShippingProgress = Math.min(100, (subtotal / Math.max(freeThreshold, 1)) * 100);

  function formatPrice(amount: number) {
    return format.number(amount, { style: 'currency', currency });
  }

  function validateAddress(): boolean {
    const errors: Partial<Record<keyof CheckoutAddressInput, string>> = {};
    if (!address.fullName.trim()) errors.fullName = t('checkout.errors.required');
    if (!address.phone.trim() || address.phone.replace(/\D/g, '').length < 9) {
      errors.phone = t('checkout.errors.phone');
    }
    if (useGeoCascade) {
      if (!address.countryId) errors.city = t('checkout.errors.cityRequired');
      else if (!address.cityId || !address.city.trim()) errors.city = t('checkout.errors.cityRequired');
      if (!address.districtId || !address.district.trim()) {
        errors.district = t('checkout.errors.required');
      }
    } else if (cities.length === 0) {
      errors.city = t('checkout.errors.citiesUnavailable');
    } else if (!address.city.trim()) {
      errors.city = t('checkout.errors.cityRequired');
    } else if (
      (selectedAddressId === 'new' || savedAddresses.length === 0) &&
      !cities.includes(address.city)
    ) {
      errors.city = t('checkout.errors.cityRequired');
    } else if (!address.district.trim()) {
      errors.district = t('checkout.errors.required');
    }
    if (!address.street.trim()) errors.street = t('checkout.errors.required');
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goNext() {
    if (step === 'address') {
      if (!validateAddress()) return;
      if (selectedAddressId === 'new') {
        void ensureAddressBookEntry().finally(() => setStep('payment'));
        return;
      }
      setStep('payment');
      return;
    }
    if (step === 'payment') setStep('review');
  }

  function goBack() {
    if (step === 'payment') setStep('address');
    if (step === 'review') setStep('payment');
  }

  async function submitOrder() {
    if (!accessToken) {
      toast.error(t('checkout.loginRequiredToast'));
      router.replace(storeLoginHref('/store/checkout'));
      return;
    }
    if (!validateAddress()) {
      setStep('address');
      return;
    }
    setSubmitting(true);
    try {
      const result = await placeStorefrontOrder({
        locale,
        address,
        paymentMethod,
        customerNote: customerNote.trim() || null,
        accessToken,
        paymentProofUrls:
          paymentMethod === 'card' ? paymentProofs.map((item) => item.url) : [],
        lines: cartLines.map(({ line, product, unitPrice, lineName }) => {
          const display = buildProductDisplay(product);
          return {
            productId: product.id,
            variantId: line.variantId,
            productName: lineName,
            productSlug: product.slug,
            quantity: line.quantity,
            unitPrice,
            imageUrl: display.imageUrl,
          };
        }),
      });
      if (!result.ok) {
        toast.error(result.error || t('checkout.placeError'));
        return;
      }
      const order = result.order;
      clearCart();
      toast.custom(
        () => (
          <div
            role="status"
            className="pointer-events-auto inline-flex max-w-[min(100vw-2rem,22rem)] items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground shadow-soft"
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="whitespace-nowrap font-medium">{t('checkout.placeSuccess')}</span>
          </div>
        ),
        { duration: 2800, unstyled: true, className: '!w-auto !max-w-none !border-0 !bg-transparent !p-0 !shadow-none' },
      );
      router.push(
        `/store/orders/${order.orderNumber}?phone=${encodeURIComponent(address.phone.trim())}`,
      );
    } catch {
      toast.error(t('checkout.placeError'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!authReady || !accessToken) {
    return (
      <StoreEmptyState
        icon={ShieldCheck}
        title={t('checkout.loginRequiredTitle')}
        description={t('checkout.loginRequiredDescription')}
      >
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href={storeLoginHref('/store/checkout')} prefetch={false}>
              {t('checkout.loginRequiredAction')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={storeRegisterHref('/store/checkout')} prefetch={false}>
              {t('checkout.registerRequiredAction')}
            </Link>
          </Button>
        </div>
      </StoreEmptyState>
    );
  }

  if (lines.length === 0) {
    return (
      <StoreEmptyState icon={PackageSearch} title={t('cart.empty')} description={t('checkout.emptyCartHint')}>
        <Link
          href="/store/products"
          prefetch={false}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          {t('cart.continueShopping')}
        </Link>
      </StoreEmptyState>
    );
  }

  if (isLoading) {
    return <ProductGridSkeleton count={3} columns={{ mobile: 1, tablet: 1, desktop: 1 }} />;
  }

  if (isError) {
    return <StoreErrorState onRetry={() => refetch()} />;
  }

  const stepIndex = STEPS.findIndex((item) => item.id === step);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 max-w-full space-y-5">
        {/* Progress */}
        <nav aria-label={t('checkout.title')} className="rounded-2xl border border-border bg-card px-3 py-4 sm:px-5">
          <ol className="relative grid grid-cols-3 gap-2">
            <div
              className="pointer-events-none absolute start-[16.66%] end-[16.66%] top-4 hidden h-0.5 bg-border sm:block"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute start-[16.66%] top-4 hidden h-0.5 origin-left bg-primary transition-transform duration-300 sm:block rtl:origin-right"
              style={{
                width: '66.68%',
                transform: `scaleX(${stepIndex / (STEPS.length - 1)})`,
              }}
              aria-hidden
            />
            {STEPS.map(({ id, icon: Icon }, index) => {
              const active = index === stepIndex;
              const done = index < stepIndex;
              return (
                <li key={id} className="relative z-[1] flex flex-col items-center gap-2 text-center">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                      done && 'border-primary bg-primary text-primary-foreground',
                      active && 'border-primary bg-primary/10 text-primary',
                      !active && !done && 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-medium sm:text-xs',
                      active || done ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {t(`checkout.steps.${id}`)}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Address */}
        {step === 'address' ? (
          <section className="min-w-0 rounded-2xl border border-border bg-card">
            <header className="flex items-center gap-3 border-b border-border/80 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-arabic-display text-base font-semibold leading-snug text-foreground sm:text-lg">
                  {t('checkout.chooseAddressTitle')}
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t('checkout.chooseAddressHint')}
                </p>
              </div>
              <Link
                href="/store/account/addresses"
                prefetch={false}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                {t('checkout.manageAddresses')}
              </Link>
            </header>
            <div className="grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-5 sm:p-6">
              <div className="space-y-2 sm:col-span-2">
                <p className="text-sm font-medium text-foreground">
                  {t('checkout.savedAddresses')}
                </p>
                {addressesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-xl bg-muted/50" />
                    ))}
                  </div>
                ) : addressesError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
                    {addressesError}
                    <button
                      type="button"
                      className="ms-2 underline"
                      onClick={() => void loadSavedAddresses()}
                    >
                      {t('checkout.retryAddresses')}
                    </button>
                  </div>
                ) : savedAddresses.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
                    {t('checkout.noSavedAddresses')}
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {savedAddresses.map((row) => {
                      const active = selectedAddressId === row.id;
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => applySavedAddress(row)}
                          className={cn(
                            'rounded-xl border px-3 py-3 text-start transition-colors',
                            active
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40',
                          )}
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {row.label || t('account.addresses.defaultLabel')}
                            {row.isDefault ? (
                              <span className="ms-2 text-[11px] font-medium text-primary">
                                {t('account.addresses.defaultBadge')}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatPartnerAddressLine(row) || t('checkout.incompleteAddress')}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={startNewAddress}
                  className={cn(
                    'mt-1 w-full rounded-xl border border-dashed px-3 py-3 text-start text-sm transition-colors',
                    selectedAddressId === 'new'
                      ? 'border-primary bg-primary/5 font-medium text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {t('checkout.useNewAddress')}
                </button>
              </div>

              <Field label={t('checkout.fullName')} error={addressErrors.fullName} className="sm:col-span-2">
                <Input
                  value={address.fullName}
                  onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                  autoComplete="name"
                  className={checkoutFieldClassName}
                />
              </Field>
              <Field label={t('checkout.phone')} error={addressErrors.phone} className="sm:col-span-2">
                <Input
                  dir="ltr"
                  value={address.phone}
                  onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="77xxxxxxx"
                  autoComplete="tel"
                  className={cn(checkoutFieldClassName, 'text-right')}
                />
              </Field>

              {!showAddressForm && selectedSaved ? (
                <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 sm:col-span-2">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedSaved.label || t('account.addresses.defaultLabel')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPartnerAddressLine(selectedSaved)}
                  </p>
                  {(addressErrors.district || addressErrors.street || addressErrors.city) && (
                    <p className="mt-2 text-xs text-destructive">
                      {t('checkout.savedAddressIncomplete')}
                    </p>
                  )}
                </div>
              ) : null}

              {showAddressForm ? (
                <>
                  {useGeoCascade ? (
                    <div className="sm:col-span-2">
                      <GeoCascadeSelect
                        companyId={companyId}
                        mode="public"
                        value={{
                          countryId: address.countryId ?? null,
                          cityId: address.cityId ?? null,
                          districtId: address.districtId ?? null,
                          countryCode: null,
                          city: address.city,
                          district: address.district,
                        }}
                        onChange={(geo: GeoCascadeValue) =>
                          setAddress((prev) => ({
                            ...prev,
                            countryId: geo.countryId,
                            cityId: geo.cityId,
                            districtId: geo.districtId,
                            city: geo.city,
                            district: geo.district,
                          }))
                        }
                        labels={{
                          country: t('checkout.country'),
                          city: t('checkout.city'),
                          district: t('checkout.district'),
                        }}
                      />
                      {(addressErrors.city || addressErrors.district) && (
                        <p className="mt-1.5 text-xs text-destructive">
                          {addressErrors.city || addressErrors.district}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <Field label={t('checkout.city')} error={addressErrors.city}>
                        {geoCountriesLoading ? (
                          <p className="text-sm text-muted-foreground">…</p>
                        ) : cities.length === 0 ? (
                          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                            {t('checkout.errors.citiesUnavailable')}
                          </p>
                        ) : (
                          <Select
                            value={cities.includes(address.city) ? address.city : undefined}
                            onValueChange={(city) => setAddress((prev) => ({ ...prev, city }))}
                          >
                            <SelectTrigger className={checkoutFieldClassName}>
                              <SelectValue placeholder={t('checkout.cityPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      <Field label={t('checkout.district')} error={addressErrors.district}>
                        <Input
                          value={address.district}
                          onChange={(e) =>
                            setAddress((prev) => ({ ...prev, district: e.target.value }))
                          }
                          className={checkoutFieldClassName}
                        />
                      </Field>
                    </>
                  )}
                  <Field label={t('checkout.street')} error={addressErrors.street} className="sm:col-span-2">
                    <Input
                      value={address.street}
                      onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                      className={checkoutFieldClassName}
                    />
                  </Field>
                  <div className="min-w-0 space-y-2.5 p-0 sm:col-span-2 sm:p-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium leading-snug text-foreground">
                        {t('checkout.mapLocation')}
                      </Label>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t('checkout.mapLocationHint')}
                      </p>
                    </div>
                    <GoogleLocationPicker
                      value={
                        address.lat != null && address.lng != null
                          ? { lat: address.lat, lng: address.lng, address: address.mapAddress ?? '' }
                          : null
                      }
                      onLocationChange={(location: GoogleLocationValue) =>
                        setAddress((prev) => ({
                          ...prev,
                          lat: location.lat,
                          lng: location.lng,
                          mapAddress: location.address,
                        }))
                      }
                      height={280}
                      className="min-w-0 max-w-full"
                    />
                  </div>
                  <Field label={t('checkout.notes')} className="sm:col-span-2">
                    <Textarea
                      rows={3}
                      value={address.notes ?? ''}
                      onChange={(e) => setAddress((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder={t('checkout.notesPlaceholder')}
                      className="min-h-[6.5rem] w-full min-w-0 max-w-full rounded-xl border-input px-3.5 py-3 text-base leading-relaxed sm:text-sm"
                    />
                  </Field>
                </>
              ) : null}

              <Field label={t('checkout.customerNote')} className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder={t('checkout.customerNotePlaceholder')}
                  className="min-h-[4.5rem] w-full min-w-0 max-w-full rounded-xl border-input px-3.5 py-3 text-base leading-relaxed sm:text-sm"
                />
              </Field>
            </div>
          </section>
        ) : null}

        {/* Payment */}
        {step === 'payment' ? (
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <header className="flex items-center gap-3 border-b border-border px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="font-arabic-display text-base font-semibold text-foreground sm:text-lg">
                  {t('checkout.paymentTitle')}
                </h2>
                <p className="text-xs text-muted-foreground">{t('checkout.paymentHint')}</p>
              </div>
            </header>
            <div className="grid gap-3 p-5">
              {paymentMethods.map((id) => {
                const Icon = id === 'card' ? CreditCard : Truck;
                const selected = paymentMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(id);
                      if (id === 'cash_on_delivery') {
                        setPaymentProofs([]);
                      }
                    }}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-4 text-start transition-all',
                      selected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/30 hover:bg-muted/30',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary',
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {t(`checkout.paymentMethods.${id}.label`)}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {t(`checkout.paymentMethods.${id}.description`)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background',
                      )}
                      aria-hidden
                    >
                      {selected ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </button>
                );
              })}
              {paymentMethod !== 'cash_on_delivery' ? (
                <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t('checkout.paymentProofHint')}
                  </p>
                  <div>
                    <Label htmlFor="payment-proof" className="text-sm font-medium">
                      {t('checkout.paymentProofLabel')}
                    </Label>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('checkout.paymentProofLimit', {
                        max: MAX_PAYMENT_PROOF_FILES,
                        count: paymentProofs.length,
                      })}
                    </p>
                    <Input
                      id="payment-proof"
                      type="file"
                      accept="image/*"
                      disabled={paymentProofs.length >= MAX_PAYMENT_PROOF_FILES}
                      className="mt-2 h-11 cursor-pointer rounded-xl file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        e.target.value = '';
                        if (files.length === 0) return;

                        void (async () => {
                          const remaining = MAX_PAYMENT_PROOF_FILES - paymentProofs.length;
                          if (remaining <= 0) {
                            toast.error(t('checkout.errors.paymentProofMax', { max: MAX_PAYMENT_PROOF_FILES }));
                            return;
                          }

                          const selected = files.slice(0, remaining);
                          if (files.length > remaining) {
                            toast.error(t('checkout.errors.paymentProofMax', { max: MAX_PAYMENT_PROOF_FILES }));
                          }

                          for (const file of selected) {
                            if (!file.type.startsWith('image/')) {
                              toast.error(t('checkout.errors.paymentProofType'));
                              continue;
                            }
                            if (file.size > MAX_PAYMENT_PROOF_BYTES) {
                              toast.error(t('checkout.errors.paymentProofSize'));
                              continue;
                            }
                            try {
                              const result = await compressPaymentProofToDataUrl(file);
                              setPaymentProofs((prev) => {
                                if (prev.length >= MAX_PAYMENT_PROOF_FILES) return prev;
                                return [...prev, { url: result, name: file.name }];
                              });
                            } catch {
                              toast.error(t('checkout.errors.paymentProofType'));
                            }
                          }
                        })();
                      }}
                    />
                    {paymentProofs.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {paymentProofs.map((proof, index) => (
                          <li
                            key={`${proof.name}-${index}`}
                            className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-2.5 py-2"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={proof.url}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-foreground">
                                {proof.name || t('checkout.paymentProofAttached')}
                              </p>
                              <button
                                type="button"
                                className="mt-1 text-xs text-destructive hover:underline"
                                onClick={() =>
                                  setPaymentProofs((prev) => prev.filter((_, i) => i !== index))
                                }
                              >
                                {t('checkout.paymentProofRemove')}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {t('checkout.paymentMockHint')}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Review */}
        {step === 'review' ? (
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <header className="flex items-center gap-3 border-b border-border px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="font-arabic-display text-base font-semibold text-foreground sm:text-lg">
                  {t('checkout.reviewTitle')}
                </h2>
                <p className="text-xs text-muted-foreground">{t('checkout.reviewHint')}</p>
              </div>
            </header>
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">{t('checkout.steps.address')}</p>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => setStep('address')}
                    >
                      {t('checkout.edit')}
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{address.fullName}</p>
                  <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                    {address.phone}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.city} · {address.district}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{address.street}</p>
                  {address.mapAddress ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground" dir="auto">
                      📍 {address.mapAddress}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">{t('checkout.steps.payment')}</p>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => setStep('payment')}
                    >
                      {t('checkout.edit')}
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {t(`checkout.paymentMethods.${paymentMethod}.label`)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(`checkout.paymentMethods.${paymentMethod}.description`)}
                  </p>
                  {paymentMethod === 'card' && paymentProofs.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {paymentProofs.map((proof, index) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={`${proof.name}-${index}`}
                            src={proof.url}
                            alt=""
                            className="h-10 w-10 rounded-md border border-border object-cover"
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('checkout.paymentProofAttachedCount', { count: paymentProofs.length })}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Actions: physical [back | continue] so in RTL “متابعة” sits on the start (right). */}
        <div dir="ltr" className="hidden items-center justify-between gap-3 sm:flex">
          {step !== 'address' ? (
            <Button type="button" variant="outline" className="rounded-xl" onClick={goBack} disabled={submitting}>
              <ChevronLeft className="me-1 h-4 w-4" aria-hidden />
              {t('checkout.back')}
            </Button>
          ) : (
            <Button type="button" variant="outline" className="rounded-xl" asChild>
              <Link href="/store/cart" prefetch={false}>
                {t('checkout.backToCart')}
              </Link>
            </Button>
          )}
          {step !== 'review' ? (
            <Button
              type="button"
              className="min-w-36 rounded-xl"
              onClick={goNext}
              disabled={step === 'address' && addressesLoading}
            >
              {t('checkout.continue')}
            </Button>
          ) : (
            <Button
              type="button"
              className="min-w-44 rounded-xl"
              onClick={() => void submitOrder()}
              disabled={submitting}
            >
              {submitting ? t('checkout.placing') : t('checkout.placeOrder')}
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-arabic-display text-base font-semibold text-foreground">
              {t('checkout.summary')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('checkout.itemsInCart', { count: itemCount })}
            </p>
          </div>

          <ul className="max-h-52 space-y-3 overflow-y-auto px-5 py-4">
            {cartLines.map(({ line, product, unitPrice, compareAt, discountPercent, lineName }) => {
              const display = buildProductDisplay(product);
              const key = line.variantId ? `${product.id}::${line.variantId}` : product.id;
              return (
                <li key={key} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {display.imageUrl ? (
                      <Image
                        src={display.imageUrl}
                        alt={display.imageAlt}
                        fill
                        unoptimized
                        className="object-contain p-1"
                      />
                    ) : null}
                    <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{lineName}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] tabular-nums">
                      <span className="font-medium text-foreground">{formatPrice(unitPrice.amount)}</span>
                      {compareAt ? (
                        <span className="text-muted-foreground line-through">
                          {formatPrice(compareAt.amount)}
                        </span>
                      ) : null}
                      {discountPercent ? (
                        <span className="font-semibold text-secondary">
                          {t('components.discount', { percent: discountPercent })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="space-y-3 border-t border-border px-5 py-4">
            {shipping.amount > 0 ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t('checkout.freeShippingHint', { amount: freeThreshold })}</span>
                  <span>{Math.round(freeShippingProgress)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-secondary transition-[width] duration-300"
                    style={{ ['--progress' as string]: `${freeShippingProgress}%`, width: 'var(--progress)' }}
                  />
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-secondary/10 px-3 py-2 text-xs font-medium text-secondary">
                {t('checkout.freeShippingUnlocked')}
              </p>
            )}

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('cart.subtotal')}</dt>
                <dd className="font-medium tabular-nums text-foreground">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('checkout.shipping')}</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {shipping.amount === 0 ? t('checkout.freeShipping') : formatPrice(shipping.amount)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3">
                <dt className="font-semibold text-foreground">{t('cart.total')}</dt>
                <dd className="text-base font-bold tabular-nums text-foreground">{formatPrice(total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>

      {/* Mobile sticky actions */}
      <div
        className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('cart.total')}</span>
          <span className="font-bold tabular-nums text-foreground">{formatPrice(total)}</span>
        </div>
        <div dir="ltr" className="flex gap-2">
          {step !== 'address' ? (
            <Button type="button" variant="outline" className="rounded-xl" onClick={goBack} disabled={submitting}>
              {t('checkout.back')}
            </Button>
          ) : (
            <Button type="button" variant="outline" className="rounded-xl" asChild>
              <Link href="/store/cart" prefetch={false}>
                {t('checkout.backToCart')}
              </Link>
            </Button>
          )}
          {step !== 'review' ? (
            <Button
              type="button"
              className="flex-1 rounded-xl"
              onClick={goNext}
              disabled={step === 'address' && addressesLoading}
            >
              {t('checkout.continue')}
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 rounded-xl"
              onClick={() => void submitOrder()}
              disabled={submitting}
            >
              {submitting ? t('checkout.placing') : t('checkout.placeOrder')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const checkoutFieldClassName =
  'h-12 min-h-12 w-full min-w-0 max-w-full rounded-xl border-input bg-background px-3.5 py-0 text-base leading-normal sm:text-sm';

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 max-w-full space-y-2', className)}>
      <Label className="block text-sm font-medium leading-snug text-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs leading-relaxed text-destructive">{error}</p> : null}
    </div>
  );
}
