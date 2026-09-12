export interface TaxGroup {
  id: string;
  name: string; // الاسم (e.g. "ضريبة 15%", "0% ضريبة")
  country: string; // الدولة (e.g. "الولايات المتحدة")
  taxPayableAccount: string; // حساب الضريبة المستحقة (e.g. "252000 الضريبة مستحقة الدفع")
  taxReceivableAccount: string; // حساب الضريبة مستحقة القبض (e.g. "132000 الضريبة مستحقة القبض")
  advanceTaxAccount?: string; // حساب الضريبة المسبقة
  sequence?: number; // تسلسل (e.g. 10)
  posReceiptTitle?: string; // العناوين على إيصالات نقطة البيع
  precedingSubtotal?: string; // الناتج الفرعي السابق
}
