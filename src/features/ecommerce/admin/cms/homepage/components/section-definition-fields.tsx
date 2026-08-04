'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { FieldDefinition } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import type { DataSourceConfig } from '@/features/ecommerce/storefront/page-builder/domain/data-source';
import { getValueAtPath, setValueAtPath } from '@/features/ecommerce/admin/cms/shared/object-path';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SectionDraft = Record<string, unknown>;

type Props = {
  fields: FieldDefinition[];
  value: SectionDraft;
  onChange: (next: SectionDraft) => void;
};

function resolveFieldLabel(label: LocalizableString, locale: string): string {
  return locale === 'en' ? label.en : label.ar;
}

function LocalizedPair({
  labelAr,
  labelEn,
  value,
  onChange,
  multiline = false,
}: {
  labelAr: string;
  labelEn: string;
  value: LocalizableString | null | undefined;
  onChange: (next: LocalizableString | null) => void;
  multiline?: boolean;
}) {
  const current = value ?? { ar: '', en: '' };
  const Field = multiline ? Textarea : Input;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{labelAr}</Label>
        <Field
          value={current.ar}
          onChange={(event) => onChange({ ...current, ar: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{labelEn}</Label>
        <Field
          value={current.en}
          onChange={(event) => onChange({ ...current, en: event.target.value })}
        />
      </div>
    </div>
  );
}

function DataSourceEditor({
  value,
  allowedKinds,
  onChange,
}: {
  value: DataSourceConfig | undefined;
  allowedKinds: readonly string[];
  onChange: (next: DataSourceConfig) => void;
}) {
  const t = useTranslations('ecommerceAdmin.homepage.fields');
  const kind = value?.kind ?? allowedKinds[0] ?? 'manual';

  function setKind(nextKind: string) {
    switch (nextKind) {
      case 'manual':
        onChange({ kind: 'manual', entityIds: [] });
        break;
      case 'category':
        onChange({ kind: 'category', categoryId: crypto.randomUUID(), limit: 12 });
        break;
      case 'tag':
        onChange({ kind: 'tag', tag: '', limit: 12 });
        break;
      case 'collection':
        onChange({ kind: 'collection', collectionId: '', limit: 12 });
        break;
      case 'query':
        onChange({
          kind: 'query',
          sort: 'createdAt',
          sortDirection: 'desc',
          limit: 10,
          categoryId: null,
          tag: null,
        });
        break;
      case 'recommendation':
        onChange({ kind: 'recommendation', slot: 'homepage', limit: 10 });
        break;
      default:
        break;
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-3">
      <div className="space-y-1.5">
        <Label>{t('dataSourceKind')}</Label>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedKinds.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value?.kind === 'manual' ? (
        <div className="space-y-1.5">
          <Label>{t('entityIds')}</Label>
          <Textarea
            value={value.entityIds.join(', ')}
            onChange={(event) =>
              onChange({
                kind: 'manual',
                entityIds: event.target.value
                  .split(',')
                  .map((part) => part.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      ) : null}

      {value?.kind === 'tag' ? (
        <>
          <div className="space-y-1.5">
            <Label>{t('tag')}</Label>
            <Input value={value.tag} onChange={(event) => onChange({ ...value, tag: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('limit')}</Label>
            <Input
              type="number"
              value={value.limit}
              onChange={(event) => onChange({ ...value, limit: Number(event.target.value) || 1 })}
            />
          </div>
        </>
      ) : null}

      {value?.kind === 'category' ? (
        <>
          <div className="space-y-1.5">
            <Label>{t('categoryId')}</Label>
            <Input
              value={value.categoryId}
              onChange={(event) => onChange({ ...value, categoryId: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('limit')}</Label>
            <Input
              type="number"
              value={value.limit}
              onChange={(event) => onChange({ ...value, limit: Number(event.target.value) || 1 })}
            />
          </div>
        </>
      ) : null}

      {value?.kind === 'collection' ? (
        <>
          <div className="space-y-1.5">
            <Label>{t('collectionId')}</Label>
            <Input
              value={value.collectionId}
              onChange={(event) => onChange({ ...value, collectionId: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('limit')}</Label>
            <Input
              type="number"
              value={value.limit}
              onChange={(event) => onChange({ ...value, limit: Number(event.target.value) || 1 })}
            />
          </div>
        </>
      ) : null}

      {value?.kind === 'query' ? (
        <>
          <div className="space-y-1.5">
            <Label>{t('sort')}</Label>
            <Select value={value.sort} onValueChange={(sort) => onChange({ ...value, sort: sort as typeof value.sort })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['createdAt', 'price', 'sales', 'name'].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('sortDirection')}</Label>
            <Select
              value={value.sortDirection}
              onValueChange={(sortDirection) =>
                onChange({ ...value, sortDirection: sortDirection as typeof value.sortDirection })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">asc</SelectItem>
                <SelectItem value="desc">desc</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('limit')}</Label>
            <Input
              type="number"
              value={value.limit}
              onChange={(event) => onChange({ ...value, limit: Number(event.target.value) || 1 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('tag')}</Label>
            <Input
              value={value.tag ?? ''}
              onChange={(event) => onChange({ ...value, tag: event.target.value || null })}
            />
          </div>
        </>
      ) : null}

      {value?.kind === 'recommendation' ? (
        <>
          <div className="space-y-1.5">
            <Label>{t('slot')}</Label>
            <Input value={value.slot} onChange={(event) => onChange({ ...value, slot: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('limit')}</Label>
            <Input
              type="number"
              value={value.limit}
              onChange={(event) => onChange({ ...value, limit: Number(event.target.value) || 1 })}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

type SlideDraft = {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  title?: LocalizableString;
  alt?: LocalizableString;
  href?: string;
};

type FeatureDraft = {
  id: string;
  icon: string;
  title: LocalizableString;
  description: LocalizableString;
};

export function SectionDefinitionFields({ fields, value, onChange }: Props) {
  const locale = useLocale();
  const t = useTranslations('ecommerceAdmin.homepage');
  const tFields = useTranslations('ecommerceAdmin.homepage.fields');

  const grouped = React.useMemo(() => {
    const groups: Record<string, FieldDefinition[]> = {
      content: [],
      settings: [],
      style: [],
      dataSource: [],
      metadata: [],
    };
    for (const field of fields) {
      groups[field.group].push(field);
    }
    return groups;
  }, [fields]);

  function patch(path: string, nextValue: unknown) {
    onChange(setValueAtPath(value, path, nextValue));
  }

  function renderField(field: FieldDefinition) {
    const fieldValue = getValueAtPath(value, field.path);
    const label = resolveFieldLabel(field.label, locale);

    if (field.control === 'localized-text' || field.control === 'localized-textarea') {
      return (
        <LocalizedPair
          key={field.key}
          labelAr={`${label} (${tFields('localeAr')})`}
          labelEn={`${label} (${tFields('localeEn')})`}
          value={fieldValue as LocalizableString | null | undefined}
          multiline={field.control === 'localized-textarea'}
          onChange={(next) => patch(field.path, next)}
        />
      );
    }

    if (field.control === 'boolean') {
      return (
        <div key={field.key} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <Label>{label}</Label>
          <Switch checked={Boolean(fieldValue)} onCheckedChange={(checked) => patch(field.path, checked)} />
        </div>
      );
    }

    if (field.control === 'number') {
      return (
        <div key={field.key} className="space-y-1.5">
          <Label>{label}</Label>
          <Input
            type="number"
            value={typeof fieldValue === 'number' ? fieldValue : Number(fieldValue) || 0}
            onChange={(event) => patch(field.path, Number(event.target.value))}
          />
        </div>
      );
    }

    if (field.control === 'theme' || field.control === 'layout' || field.control === 'select' || field.control === 'link-target') {
      const fromMeta =
        field.meta && 'options' in field.meta ? field.meta.options.map((option) => option.value) : [];
      const resolvedOptions =
        fromMeta.length > 0
          ? fromMeta
          : field.control === 'theme'
            ? ['light', 'dark', 'system']
            : field.control === 'link-target'
              ? ['_self', '_blank']
              : [];

      return (
        <div key={field.key} className="space-y-1.5">
          <Label>{label}</Label>
          <Select
            value={String(fieldValue ?? resolvedOptions[0] ?? '')}
            onValueChange={(next) => patch(field.path, next)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {resolvedOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.control === 'visibility') {
      const visibility = (fieldValue as { mobile?: boolean; tablet?: boolean; desktop?: boolean }) ?? {
        mobile: true,
        tablet: true,
        desktop: true,
      };
      return (
        <div key={field.key} className="space-y-2 rounded-lg border border-border p-3">
          <Label>{label}</Label>
          {(
            [
              ['mobile', tFields('visibilityMobile')],
              ['tablet', tFields('visibilityTablet')],
              ['desktop', tFields('visibilityDesktop')],
            ] as const
          ).map(([key, deviceLabel]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">{deviceLabel}</span>
              <Switch
                checked={Boolean(visibility[key])}
                onCheckedChange={(checked) => patch(field.path, { ...visibility, [key]: checked })}
              />
            </div>
          ))}
        </div>
      );
    }

    if (field.control === 'data-source') {
      const allowedKinds =
        field.meta && 'allowedKinds' in field.meta ? field.meta.allowedKinds : (['manual'] as const);
      return (
        <div key={field.key} className="space-y-1.5">
          <Label>{label}</Label>
          <DataSourceEditor
            value={fieldValue as DataSourceConfig | undefined}
            allowedKinds={allowedKinds}
            onChange={(next) => patch(field.path, next)}
          />
        </div>
      );
    }

    if (field.control === 'slide-list') {
      const slides = (Array.isArray(fieldValue) ? fieldValue : []) as SlideDraft[];
      return (
        <div key={field.key} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>{label}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patch(field.path, [
                  ...slides,
                  {
                    id: crypto.randomUUID(),
                    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=80',
                    alt: { ar: '', en: '' },
                    title: { ar: '', en: '' },
                  },
                ])
              }
            >
              {tFields('addSlide')}
            </Button>
          </div>
          {slides.map((slide, index) => (
            <div key={slide.id} className="space-y-3 rounded-lg border border-border bg-muted/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">#{index + 1}</Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => patch(field.path, slides.filter((item) => item.id !== slide.id))}
                >
                  {tFields('removeSlide')}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label>{tFields('imageUrl')}</Label>
                <Input
                  value={slide.imageUrl}
                  onChange={(event) => {
                    const next = [...slides];
                    next[index] = { ...slide, imageUrl: event.target.value };
                    patch(field.path, next);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{tFields('href')}</Label>
                <Input
                  value={slide.href ?? ''}
                  onChange={(event) => {
                    const next = [...slides];
                    next[index] = { ...slide, href: event.target.value || undefined };
                    patch(field.path, next);
                  }}
                />
              </div>
              <LocalizedPair
                labelAr={tFields('titleAr')}
                labelEn={tFields('titleEn')}
                value={slide.title}
                onChange={(title) => {
                  const next = [...slides];
                  next[index] = { ...slide, title: title ?? undefined };
                  patch(field.path, next);
                }}
              />
              <LocalizedPair
                labelAr={tFields('altAr')}
                labelEn={tFields('altEn')}
                value={slide.alt}
                onChange={(alt) => {
                  const next = [...slides];
                  next[index] = { ...slide, alt: alt ?? undefined };
                  patch(field.path, next);
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    if (field.control === 'feature-list') {
      const features = (Array.isArray(fieldValue) ? fieldValue : []) as FeatureDraft[];
      return (
        <div key={field.key} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>{label}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patch(field.path, [
                  ...features,
                  {
                    id: crypto.randomUUID(),
                    icon: 'truck',
                    title: { ar: '', en: '' },
                    description: { ar: '', en: '' },
                  },
                ])
              }
            >
              {tFields('addFeature')}
            </Button>
          </div>
          {features.map((feature, index) => (
            <div key={feature.id} className="space-y-3 rounded-lg border border-border bg-muted/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">#{index + 1}</Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => patch(field.path, features.filter((item) => item.id !== feature.id))}
                >
                  {tFields('removeFeature')}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label>{tFields('icon')}</Label>
                <Select
                  value={feature.icon}
                  onValueChange={(icon) => {
                    const next = [...features];
                    next[index] = { ...feature, icon };
                    patch(field.path, next);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['truck', 'shield', 'sparkles', 'headphones'].map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <LocalizedPair
                labelAr={tFields('titleAr')}
                labelEn={tFields('titleEn')}
                value={feature.title}
                onChange={(title) => {
                  const next = [...features];
                  next[index] = { ...feature, title: title ?? { ar: '', en: '' } };
                  patch(field.path, next);
                }}
              />
              <LocalizedPair
                labelAr={tFields('descriptionAr')}
                labelEn={tFields('descriptionEn')}
                value={feature.description}
                multiline
                onChange={(description) => {
                  const next = [...features];
                  next[index] = { ...feature, description: description ?? { ar: '', en: '' } };
                  patch(field.path, next);
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    if (
      field.control === 'text' ||
      field.control === 'textarea' ||
      field.control === 'url' ||
      field.control === 'store-path' ||
      field.control === 'image' ||
      field.control === 'datetime'
    ) {
      const Field = field.control === 'textarea' ? Textarea : Input;
      return (
        <div key={field.key} className="space-y-1.5">
          <Label>{label}</Label>
          <Field
            value={fieldValue == null ? '' : String(fieldValue)}
            onChange={(event) =>
              patch(field.path, event.target.value === '' && !field.required ? null : event.target.value)
            }
          />
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1.5">
        <Label>{label}</Label>
        <Input
          value={fieldValue == null ? '' : String(fieldValue)}
          onChange={(event) => patch(field.path, event.target.value)}
        />
      </div>
    );
  }

  const groupOrder = ['content', 'settings', 'style', 'dataSource', 'metadata'] as const;

  return (
    <div className="space-y-6">
      {groupOrder.map((group) => {
        const groupFields = grouped[group];
        if (groupFields.length === 0) return null;
        return (
          <section key={group} className="space-y-3 border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
            <h3 className="text-sm font-semibold text-foreground">{t(`groups.${group}`)}</h3>
            <div className="space-y-3">{groupFields.map(renderField)}</div>
          </section>
        );
      })}
    </div>
  );
}
