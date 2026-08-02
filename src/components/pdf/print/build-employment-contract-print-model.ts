import { formatDisplayDate } from '@/shared/utils';

export type EmploymentContractPrintPartyGender = 'male' | 'female' | null | undefined;

export type EmploymentContractPrintArticleInput = {
  code: string;
  titleAr: string;
  bodyAr: string;
};

export type EmploymentContractPrintModelInput = {
  companyNameAr: string;
  companyNameEn?: string | null;
  /** From company settings / form — never a baked-in person name. */
  employerRepresentativeName?: string | null;
  employerRepresentativeTitle?: string | null;
  employeeNameAr: string;
  employeeGender?: EmploymentContractPrintPartyGender;
  nationalId?: string | null;
  nationality?: string | null;
  jobTitleAr?: string | null;
  workCityAr?: string | null;
  branchNameAr?: string | null;
  contractNumber: string;
  natureLabelAr: string;
  arrangementLabelAr: string;
  agreementDateIso: string;
  startDate: string;
  endDate?: string | null;
  probationDays?: number | string | null;
  annualLeaveDays?: number | string | null;
  noticeDays?: number | string | null;
  resignationPenalty?: number | string | null;
  monthlyRestDays?: number | string | null;
  baseSalary: string;
  currency: string;
  allowancesNote?: string | null;
  deductionsNote?: string | null;
  allowanceRows?: { labelAr: string; amount: string }[];
  /** Selected contract articles from the catalog (source of legal wording). */
  articles: EmploymentContractPrintArticleInput[];
};

function parseIsoLocal(iso: string): Date | null {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Gregorian `yyyy/mm/dd` for print. */
export function formatContractGregorianDate(iso: string): string {
  return formatDisplayDate(iso) || '—';
}

/** Hijri (Umm al-Qura) `yyyy/mm/dd` for print. */
export function formatContractHijriDate(iso: string): string {
  const d = parseIsoLocal(iso);
  if (!d) return '—';
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(d);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value?.padStart(2, '0');
    const day = parts.find((p) => p.type === 'day')?.value?.padStart(2, '0');
    if (!y || !m || !day) return '—';
    return `${y}/${m}/${day}`;
  } catch {
    return '—';
  }
}

const MERGE_TOKEN_RE = /\{\{([a-zA-Z0-9_.]+)\}\}/g;

export function interpolateContractArticleText(
  template: string | undefined | null,
  tokens: Record<string, string>,
): string {
  if (!template) return '';
  return template.replace(MERGE_TOKEN_RE, (_, key: string) => {
    const v = tokens[key];
    return v != null && v !== '' ? v : '—';
  });
}

function genderContractTokens(gender: 'male' | 'female'): Record<string, string> {
  if (gender === 'male') {
    return {
      e_noun: 'الموظف',
      e_title: 'السيد',
      e_ack: 'يقر',
      e_agree: 'يوافق',
      e_commit: 'يتعهد',
      e_deserve: 'يستحق',
      e_her: 'له',
      e_refer: 'إليه',
      e_breach: 'أخل',
      e_absent: 'تغيب',
      e_refuse: 'رفض',
      e_sign: 'توقيعه',
      e_knew: 'علم',
    };
  }
  return {
    e_noun: 'الموظفة',
    e_title: 'السيدة',
    e_ack: 'تقر',
    e_agree: 'توافق',
    e_commit: 'تتعهد',
    e_deserve: 'تستحق',
    e_her: 'لها',
    e_refer: 'إليها',
    e_breach: 'أخلت',
    e_absent: 'تغيبت',
    e_refuse: 'رفضت',
    e_sign: 'توقيعها',
    e_knew: 'علمت',
  };
}

function formatAllowancesProse(
  rows: { labelAr: string; amount: string }[] | undefined,
  currency: string,
): string {
  const list = (rows ?? []).filter((r) => r.labelAr.trim());
  if (list.length === 0) return '';
  return list
    .map((r) => `${r.labelAr.trim()} (${r.amount || '0'} ${currency})`.trim())
    .join('، ');
}

function tokenOrDash(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : '—';
}

function optionalNumberToken(value: number | string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—';
  return String(value).trim();
}

function isAnnexPreamble(a: EmploymentContractPrintArticleInput): boolean {
  const code = a.code.trim().toLowerCase();
  return code === 'annex-preamble' || code === 'annex_preamble' || code.includes('preamble');
}

function isAnnexArticle(a: EmploymentContractPrintArticleInput): boolean {
  const code = a.code.trim().toLowerCase();
  const title = a.titleAr.trim();
  return (
    code.startsWith('annex')
    || code.startsWith('ملحق')
    || /^البند(\s|$)/.test(title)
    || title === 'تمهيد'
  );
}

export function buildEmploymentContractPrintTokens(
  input: EmploymentContractPrintModelInput,
): Record<string, string> {
  const gender = input.employeeGender === 'male' ? 'male' : 'female';
  const currency = input.currency || 'SAR';
  const natureRaw = input.natureLabelAr?.trim() || '';
  const nature = natureRaw
    ? (natureRaw.includes('عقد') ? natureRaw : `عقد ${natureRaw}`)
    : '—';

  return {
    ...genderContractTokens(gender),
    employeeName: tokenOrDash(input.employeeNameAr),
    'employee.name': tokenOrDash(input.employeeNameAr),
    nationalId: tokenOrDash(input.nationalId),
    'employee.nationalId': tokenOrDash(input.nationalId),
    nationality: tokenOrDash(input.nationality),
    'employee.nationality': tokenOrDash(input.nationality),
    jobTitle: tokenOrDash(input.jobTitleAr),
    'employee.position': tokenOrDash(input.jobTitleAr),
    branch: tokenOrDash(input.branchNameAr),
    'employee.branch': tokenOrDash(input.branchNameAr),
    city: tokenOrDash(input.workCityAr || input.branchNameAr),
    companyName: tokenOrDash(input.companyNameAr),
    'company.nameAr': tokenOrDash(input.companyNameAr),
    salary: tokenOrDash(input.baseSalary),
    baseSalary: tokenOrDash(input.baseSalary),
    currency,
    allowancesList: formatAllowancesProse(input.allowanceRows, currency),
    allowancesNote: input.allowancesNote?.trim() || '',
    deductionsNote: input.deductionsNote?.trim() || '',
    probationDays: optionalNumberToken(input.probationDays),
    annualLeaveDays: optionalNumberToken(input.annualLeaveDays),
    noticeDays: optionalNumberToken(input.noticeDays),
    resignationPenalty: optionalNumberToken(input.resignationPenalty),
    monthlyRestDays: optionalNumberToken(input.monthlyRestDays),
    contractNumber: tokenOrDash(input.contractNumber),
    nature,
    arrangement: tokenOrDash(input.arrangementLabelAr),
    startDate: formatContractGregorianDate(input.startDate),
    endDate: input.endDate ? formatContractGregorianDate(input.endDate) : '—',
  };
}

export type BuiltEmploymentContractPrintModel = {
  companyNameAr: string;
  companyNameEn?: string | null;
  contractNumber: string;
  agreementHijri: string;
  agreementGregorian: string;
  agreementLeadAr: string;
  party1LineAr: string;
  party2LineAr: string;
  annexLeadAr: string;
  annexParty1LineAr: string;
  annexParty2LineAr: string;
  natureLabelAr: string;
  arrangementLabelAr: string;
  startDate: string;
  endDate: string;
  probationDaysLabel: string;
  annualLeaveDaysLabel: string;
  baseSalary: string;
  currency: string;
  mainArticles: { code: string; titleAr: string; bodyAr: string }[];
  annexPreambleAr: string;
  annexArticles: { code: string; titleAr: string; bodyAr: string }[];
  employeeTitleAr: string;
  employeeRoleNounAr: string;
  employerRepresentativeName: string;
};

export function buildEmploymentContractPrintModel(
  input: EmploymentContractPrintModelInput,
): BuiltEmploymentContractPrintModel {
  const gender = input.employeeGender === 'male' ? 'male' : 'female';
  const g = genderContractTokens(gender);
  const employeeTitleAr = g.e_title;
  const employeeRoleNounAr = g.e_noun;

  const tokens = buildEmploymentContractPrintTokens(input);
  const mapArticle = (a: EmploymentContractPrintArticleInput) => ({
    code: a.code,
    titleAr: interpolateContractArticleText(a.titleAr, tokens),
    bodyAr: interpolateContractArticleText(a.bodyAr, tokens),
  });

  const mainArticles: { code: string; titleAr: string; bodyAr: string }[] = [];
  const annexArticles: { code: string; titleAr: string; bodyAr: string }[] = [];
  let annexPreambleAr = '';

  for (const a of input.articles ?? []) {
    if (!a.titleAr.trim() && !a.bodyAr.trim()) continue;
    const mapped = mapArticle(a);
    if (isAnnexPreamble(a) || a.titleAr.trim() === 'تمهيد') {
      annexPreambleAr = mapped.bodyAr;
      continue;
    }
    if (isAnnexArticle(a)) {
      annexArticles.push(mapped);
    } else {
      mainArticles.push(mapped);
    }
  }

  const company = tokenOrDash(input.companyNameAr);
  const rep = input.employerRepresentativeName?.trim() || '';
  const repTitle = input.employerRepresentativeTitle?.trim() || '';
  const id = tokenOrDash(input.nationalId);
  const nationality = tokenOrDash(input.nationality);
  const empName = tokenOrDash(input.employeeNameAr);

  const agreementIso = input.agreementDateIso || input.startDate;
  const hijri = formatContractHijriDate(agreementIso);
  const gregorian = formatContractGregorianDate(agreementIso);

  const agreementLeadAr = `تم الاتفاق في تاريخ ${hijri} هـ الموافق ${gregorian} م بين كل من:`;

  const party1Rep = rep
    ? (repTitle ? `${repTitle} / ${rep}` : rep)
    : 'المفوض عنها';
  const party1LineAr =
    `- ${company} وتمثلها ${party1Rep} بصفتها صاحبة العمل – الطرف الأول`;

  const party2LineAr =
    `- ${employeeTitleAr} / ${empName} ،هوية رقم (${id})،(${nationality})، ويشار ${g.e_refer} فيما يلي بالطرف الثاني، وحيث أن كلا الطرفين في كامل أهليتهم المعتبرة شرعاً للتعاقد قانونياً فقد اتفقا على العقد حسب المواد المبينة أدناه.`;

  const annexLeadAr = `تم تحرير هذا الملحق في تاريخ ${hijri} هـ الموافق ${gregorian} م`;
  const annexParty1LineAr =
    `- ${company} وتمثلها ${party1Rep} بصفتها صاحبة العمل – الطرف الأول`;
  const annexParty2LineAr =
    `- ${employeeTitleAr} / ${empName} ،هوية رقم (${id})،(${nationality})، ويشار ${g.e_refer} بـ"${employeeRoleNounAr} الطرف الثاني"`;

  return {
    companyNameAr: company,
    companyNameEn: input.companyNameEn,
    contractNumber: tokenOrDash(input.contractNumber),
    agreementHijri: hijri,
    agreementGregorian: gregorian,
    agreementLeadAr,
    party1LineAr,
    party2LineAr,
    annexLeadAr,
    annexParty1LineAr,
    annexParty2LineAr,
    natureLabelAr: input.natureLabelAr,
    arrangementLabelAr: input.arrangementLabelAr,
    startDate: input.startDate,
    endDate: input.endDate ?? '',
    probationDaysLabel:
      input.probationDays != null && String(input.probationDays).trim() !== ''
        ? `${input.probationDays} يوم`
        : '—',
    annualLeaveDaysLabel:
      input.annualLeaveDays != null && String(input.annualLeaveDays).trim() !== ''
        ? `${input.annualLeaveDays} يوم`
        : '—',
    baseSalary: input.baseSalary,
    currency: input.currency,
    mainArticles,
    annexPreambleAr,
    annexArticles,
    employeeTitleAr,
    employeeRoleNounAr,
    employerRepresentativeName: rep,
  };
}
