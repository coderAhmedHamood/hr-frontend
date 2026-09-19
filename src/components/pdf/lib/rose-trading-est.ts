/** Branding for HR letterhead PDFs — Rose Trading Est. */
export const ROSE_TRADING_EST = {
  nameAr: 'مؤسسة روز للتجارة',
  nameEn: 'ROSE TRADING ESTABLISHMENT',
  crNumber: '1010688907',
  /** Fixed employer representative (party 1) shown in contract preambles, regardless of trade name. */
  representativeTitleAr: 'السيدة',
  representativeNameAr: 'مها فرحان عطا الله العنزي',
} as const;

/** Full Arabic+Latin string for UI only. */
export const ROSE_TRADING_CR_AR = `س.ت ${ROSE_TRADING_EST.crNumber}`;
