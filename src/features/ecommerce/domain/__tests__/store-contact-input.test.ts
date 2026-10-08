import {
  DEFAULT_STORE_COUNTRY,
  type StoreCountry,
} from '@/features/ecommerce/domain/constants/store-country';
import {
  parseStoreMobile,
  sanitizeMobileTyping,
  storeMobileForField,
} from '@/features/ecommerce/domain/store-mobile';
import { suggestEmail } from '@/shared/lib/email-typos';

const SA: StoreCountry = {
  code: 'SA',
  nameAr: 'السعودية',
  nameEn: 'Saudi Arabia',
  currencyCode: 'SAR',
  phoneCode: '966',
  mapRegion: 'SA',
  mobileLength: 9,
  mobilePrefixes: ['5'],
  mobileExample: '501234567',
};
const YE = DEFAULT_STORE_COUNTRY;
const e164 = (value: string, country: StoreCountry) => {
  const r = parseStoreMobile(value, country);
  return r.ok ? r.e164 : r.reason;
};

describe('store mobile', () => {
  it('reads every Saudi form as one number', () => {
    for (const value of [
      '+966562428504',
      '966562428504',
      '0562428504',
      '9660562428504',
      '00966 56 242 8504',
      '٠٥٦٢٤٢٨٥٠٤',
    ]) {
      expect(e164(value, SA)).toBe('+966562428504');
    }
  });

  it('follows the store country: Yemen has its own code and length', () => {
    expect(e164('0771234567', YE)).toBe('+967771234567');
    expect(e164('0562428504', YE)).toBe('prefix');
    expect(e164('+966562428504', YE)).toBe('country');
    expect(e164('77123', YE)).toBe('length');
    expect(e164('77a1234567', YE)).toBe('letters');
  });

  it('keeps digits only while typing and shows a saved number in local form', () => {
    expect(sanitizeMobileTyping('05a6-2 4٢')).toBe('056242');
    expect(sanitizeMobileTyping('+966 5')).toBe('+9665');
    expect(storeMobileForField('+967771234567', YE)).toBe('771234567');
  });
});

describe('email typos', () => {
  it('suggests the provider for a slip and leaves company domains', () => {
    expect(suggestEmail('aalomari@gmaic.com')).toBe('aalomari@gmail.com');
    expect(suggestEmail('a@hotmial.com')).toBe('a@hotmail.com');
    expect(suggestEmail('aalomari@cleanlife.sa')).toBeNull();
    expect(suggestEmail('a@gmail.com')).toBeNull();
  });
});
