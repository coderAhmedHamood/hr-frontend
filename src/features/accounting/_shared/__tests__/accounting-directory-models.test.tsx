import { act, renderHook } from '@testing-library/react';
import type { ListFilterInlineSelect } from '@/components/ui/list-filter-bar';

type ChromeConfig = {
  onSearchChange: (value: string) => void;
  inlineSelects?: readonly ListFilterInlineSelect[];
  status?: { onChange: (value: string) => void };
  dateRange?: { onChange: (value: { from: string; to: string }) => void };
};

const mockRouter = { push: jest.fn() };
let mockLatestConfig: ChromeConfig | null = null;

jest.mock('@/features/accounting/_shared/hooks/use-accounting-directory-chrome', () => {
  const React = require('react') as typeof import('react');
  return {
    useAccountingDirectoryChrome: (config: ChromeConfig) => {
      mockLatestConfig = config;
      return mockRouter;
    },
    useDirectoryView: (defaultView: 'table' | 'grid') => React.useState(defaultView),
  };
});

import { useCustomersDirectoryModel } from '@/features/accounting/customers/hooks/useCustomersDirectoryModel';
import { useCustomerProductsDirectoryModel } from '@/features/accounting/customer-products/hooks/useCustomerProductsDirectoryModel';
import { useCustomerPaymentsDirectoryModel } from '@/features/accounting/customer-payments/hooks/useCustomerPaymentsDirectoryModel';
import { useCustomerCreditNotesDirectoryModel } from '@/features/accounting/customer-credit-notes/hooks/useCustomerCreditNotesDirectoryModel';
import { useCustomerInvoicesDirectoryModel } from '@/features/accounting/customer-invoices/hooks/useCustomerInvoicesDirectoryModel';
import { useVendorsDirectoryModel } from '@/features/accounting/vendors/hooks/useVendorsDirectoryModel';
import { useVendorBillsDirectoryModel } from '@/features/accounting/vendor-bills/hooks/useVendorBillsDirectoryModel';
import { useVendorRefundsDirectoryModel } from '@/features/accounting/vendor-refunds/hooks/useVendorRefundsDirectoryModel';
import { useVendorPaymentsDirectoryModel } from '@/features/accounting/vendor-payments/hooks/useVendorPaymentsDirectoryModel';
import { useVendorProductsDirectoryModel } from '@/features/accounting/vendor-products/hooks/useVendorProductsDirectoryModel';
import { useCustomersStore } from '@/features/accounting/customers/lib/customers-store';
import { MOCK_CUSTOMERS } from '@/features/accounting/customers/lib/mock-customers';
import { useCustomerProductsStore } from '@/features/accounting/customer-products/lib/customer-products-store';
import { INITIAL_MOCK_PRODUCTS } from '@/features/accounting/customer-products/lib/mock-customer-products';
import { useCustomerPaymentsStore } from '@/features/accounting/customer-payments/lib/customer-payments-store';
import { INITIAL_MOCK_PAYMENTS } from '@/features/accounting/customer-payments/lib/mock-customer-payments';
import { useCustomerCreditNotesStore } from '@/features/accounting/customer-credit-notes/lib/customer-credit-notes-store';
import { INITIAL_MOCK_CREDIT_NOTES } from '@/features/accounting/customer-credit-notes/lib/mock-customer-credit-notes';
import { useCustomerInvoicesStore } from '@/features/accounting/customer-invoices/lib/customer-invoices-store';
import { INITIAL_MOCK_INVOICES } from '@/features/accounting/customer-invoices/lib/mock-customer-invoices';
import { useVendorsStore } from '@/features/accounting/vendors/lib/vendors-store';
import { MOCK_VENDORS } from '@/features/accounting/vendors/lib/mock-vendors';
import { useVendorBillsStore } from '@/features/accounting/vendor-bills/lib/vendor-bills-store';
import { INITIAL_MOCK_VENDOR_BILLS } from '@/features/accounting/vendor-bills/lib/mock-vendor-bills';
import { useVendorRefundsStore } from '@/features/accounting/vendor-refunds/lib/vendor-refunds-store';
import { INITIAL_MOCK_VENDOR_REFUNDS } from '@/features/accounting/vendor-refunds/lib/mock-vendor-refunds';
import { useVendorPaymentsStore } from '@/features/accounting/vendor-payments/lib/vendor-payments-store';
import { INITIAL_MOCK_VENDOR_PAYMENTS } from '@/features/accounting/vendor-payments/lib/mock-vendor-payments';
import { formatAccountingAmount } from '@/features/accounting/_shared/lib/format-accounting-amount';

function config() {
  if (!mockLatestConfig) throw new Error('Directory chrome config was not registered');
  return mockLatestConfig;
}

function select(id: string) {
  const item = config().inlineSelects?.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Filter ${id} was not registered`);
  return item;
}

describe('accounting directory models', () => {
  beforeEach(() => {
    mockLatestConfig = null;
    useCustomersStore.setState({ customers: MOCK_CUSTOMERS });
    useCustomerProductsStore.setState({ products: INITIAL_MOCK_PRODUCTS });
    useCustomerPaymentsStore.setState({ payments: INITIAL_MOCK_PAYMENTS });
    useCustomerCreditNotesStore.setState({ creditNotes: INITIAL_MOCK_CREDIT_NOTES });
    useCustomerInvoicesStore.setState({ invoices: INITIAL_MOCK_INVOICES });
    useVendorsStore.setState({ vendors: MOCK_VENDORS });
    useVendorBillsStore.setState({ bills: INITIAL_MOCK_VENDOR_BILLS });
    useVendorRefundsStore.setState({ refunds: INITIAL_MOCK_VENDOR_REFUNDS });
    useVendorPaymentsStore.setState({ payments: INITIAL_MOCK_VENDOR_PAYMENTS });
  });

  it('filters customers by search', () => {
    const { result } = renderHook(() => useCustomersDirectoryModel());
    act(() => config().onSearchChange('اسم غير موجود'));
    expect(result.current.customers).toHaveLength(0);
  });

  it('filters products by product type', () => {
    const { result } = renderHook(() => useCustomerProductsDirectoryModel());
    act(() => select('type').onChange('service'));
    expect(result.current.products.length).toBeGreaterThan(0);
    expect(result.current.products.every((item) => item.type === 'service')).toBe(true);
  });

  it('filters payments by posting status', () => {
    const { result } = renderHook(() => useCustomerPaymentsDirectoryModel());
    act(() => config().status?.onChange('draft'));
    expect(result.current.payments.every((item) => item.state === 'draft')).toBe(true);
  });

  it('filters credit notes by payment status', () => {
    const { result } = renderHook(() => useCustomerCreditNotesDirectoryModel());
    act(() => select('payment-status').onChange('paid'));
    expect(result.current.creditNotes.length).toBeGreaterThan(0);
    expect(result.current.creditNotes.every((item) => item.paymentState === 'paid')).toBe(true);
  });

  it('filters invoices by payment status', () => {
    const { result } = renderHook(() => useCustomerInvoicesDirectoryModel());
    act(() => select('payment-status').onChange('paid'));
    expect(result.current.invoices.length).toBeGreaterThan(0);
    expect(result.current.invoices.every((item) => item.paymentState === 'paid')).toBe(true);
  });

  it('filters dated directories with the shared date range control', () => {
    const { result } = renderHook(() => useCustomerInvoicesDirectoryModel());
    act(() => config().dateRange?.onChange({ from: '1900-01-01', to: '1900-12-31' }));
    expect(result.current.invoices).toHaveLength(0);
  });

  it('formats accounting amounts with Western digits', () => {
    expect(formatAccountingAmount(1000, 'SAR')).toBe('1,000.00 SAR');
  });

  it('filters vendors by search', () => {
    const { result } = renderHook(() => useVendorsDirectoryModel());
    act(() => config().onSearchChange('اسم غير موجود'));
    expect(result.current.vendors).toHaveLength(0);
  });

  it('filters vendor bills by payment status', () => {
    const { result } = renderHook(() => useVendorBillsDirectoryModel());
    act(() => select('payment-status').onChange('paid'));
    expect(result.current.bills.length).toBeGreaterThan(0);
    expect(result.current.bills.every((item) => item.paymentState === 'paid')).toBe(true);
  });

  it('filters vendor refunds by payment status', () => {
    const { result } = renderHook(() => useVendorRefundsDirectoryModel());
    act(() => select('payment-status').onChange('paid'));
    expect(result.current.refunds.length).toBeGreaterThan(0);
    expect(result.current.refunds.every((item) => item.paymentState === 'paid')).toBe(true);
  });

  it('filters vendor payments by posting status', () => {
    const { result } = renderHook(() => useVendorPaymentsDirectoryModel());
    act(() => config().status?.onChange('draft'));
    expect(result.current.payments.every((item) => item.state === 'draft')).toBe(true);
  });

  it('filters vendor products by product type', () => {
    const { result } = renderHook(() => useVendorProductsDirectoryModel());
    act(() => select('type').onChange('service'));
    expect(result.current.products.length).toBeGreaterThan(0);
    expect(result.current.products.every((item) => item.type === 'service')).toBe(true);
  });
});
