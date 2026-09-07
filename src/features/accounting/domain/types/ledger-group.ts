export type LedgerGroup = {
  id: string;
  name: string; // مجموعة دفتر الأستاذ (e.g. IFRS, GAAP)
  excludedJournals: string[]; // دفاتر اليومية المستثناة (e.g. ['المشتريات'])
};
