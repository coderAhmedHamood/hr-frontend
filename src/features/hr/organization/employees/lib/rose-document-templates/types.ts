export type RoseDocumentLanguage = 'ar' | 'en' | 'bilingual';

/** Default language when opening any Rose form prep wizard. */
export const DEFAULT_ROSE_DOCUMENT_LANGUAGE: RoseDocumentLanguage = 'ar';



export type DocumentLocale = 'ar' | 'en';



export type LocalizedText = {

  ar: string;

  en: string;

};



export type RoseMergeFieldKey =

  | 'employee.name'

  | 'employee.nameEn'

  | 'employee.employeeCode'

  | 'employee.nationalId'

  | 'employee.nationality'

  | 'employee.gender'

  | 'employee.position'

  | 'employee.department'

  | 'employee.branch'

  | 'employee.hireDate'

  | 'employee.email'

  | 'employee.phone'

  | 'employee.address'

  | 'company.nameAr'

  | 'company.nameEn';



export type RoseFieldGridSlot = {

  fieldKey: RoseMergeFieldKey;

  visible: boolean;

  labelAr?: string;

  labelEn?: string;

};



export type RoseResignationTemplateContent = {

  title: LocalizedText;

  openingLine: LocalizedText;

  greeting: LocalizedText;

  reasonsHeading: LocalizedText;

  bodyIntro: LocalizedText;

  bodyClosing: LocalizedText;

  footerApplicantLabel: LocalizedText;

  footerSignatureLabel: LocalizedText;

  footerDateLabel: LocalizedText;

  fieldSlots: RoseFieldGridSlot[];

};



export type RoseClearanceTemplateContent = {

  title: LocalizedText;

  employeeNameLabel: LocalizedText;

  nationalIdLabel: LocalizedText;

  legalDeclaration: LocalizedText;

  reasonHeading: LocalizedText;

  footerNameLabel: LocalizedText;

  footerDateLabel: LocalizedText;

  footerSignatureLabel: LocalizedText;

  fieldSlots: RoseFieldGridSlot[];

};



export type RoseSettlementTemplateContent = {

  title: LocalizedText;

  bodyParagraphs: LocalizedText[];

  footerApplicantLabel: LocalizedText;

  footerSignatureLabel: LocalizedText;

  footerDateLabel: LocalizedText;

  fieldSlots: RoseFieldGridSlot[];

};



export type RoseExperienceTemplateContent = {

  title: LocalizedText;

  bodyIntro: LocalizedText;

  performanceHeading: LocalizedText;

  performanceTraits: LocalizedText;

  closingWish: LocalizedText;

  managerSignatureTitle: LocalizedText;

  fieldSlots: RoseFieldGridSlot[];

};



export type RoseDocumentWizardBase = {

  language: RoseDocumentLanguage;

  footerDateIso: string;

  fieldVisibility: Partial<Record<RoseMergeFieldKey, boolean>>;

  fieldOverrides: Partial<Record<RoseMergeFieldKey, string>>;

};



export type ResignationWizardPayload = RoseDocumentWizardBase & {

  absenceStartIso: string;

  addressedToAr: string;

  addressedToEn: string;

  reasonLines: string[];

};



export type ClearanceWizardPayload = RoseDocumentWizardBase & {

  reasonTextAr: string;

  reasonTextEn: string;

};



export type SettlementWizardPayload = RoseDocumentWizardBase & {

  endDateIso: string;

  serviceStartIso: string;

};



export type ExperienceWizardPayload = RoseDocumentWizardBase & {

  serviceStartIso: string;

  endDateIso: string;

  certificateDateIso: string;

  performanceTextAr: string;

  performanceTextEn: string;

};



export type RoseFieldRow = {

  label: string;

  value: string;

};



export type RoseDocumentBlock =

  | { type: 'title'; text: LocalizedText; variant?: 'boxed' | 'underlined' }

  | { type: 'field_grid'; locale: DocumentLocale; rows: RoseFieldRow[] }

  | { type: 'labeled_rows'; locale: DocumentLocale; rows: RoseFieldRow[] }

  | { type: 'paragraphs'; locale: DocumentLocale; lines: string[]; spacing?: 'normal' | 'compact' }

  | { type: 'reasons'; locale: DocumentLocale; heading: string; lines: string[] }

  | { type: 'text_box'; locale: DocumentLocale; heading: string; content: string }

  | {

      type: 'signature_footer';

      locale: DocumentLocale;

      applicantLabel: string;

      applicantName: string;

      signatureLabel: string;

      dateLabel: string;

      dateGregorian: string;

    }

  | {

      type: 'inline_signature_footer';

      locale: DocumentLocale;

      nameLabel: string;

      name: string;

      dateLabel: string;

      dateGregorian: string;

      signatureLabel: string;

    }

  | { type: 'manager_signature'; locale: DocumentLocale; title: string }

  | { type: 'spacer'; size?: 'sm' | 'md' | 'lg' };



export type RoseDocumentPrintModel = {

  language: RoseDocumentLanguage;

  companyNameAr: string;

  companyNameEn: string;

  blocks: RoseDocumentBlock[];

};



/** @deprecated Use RoseDocumentPrintModel */

export type RoseResignationPrintModel = RoseDocumentPrintModel;



export type RoseFormKind = 'resignation' | 'clearance' | 'settlement' | 'experience';


