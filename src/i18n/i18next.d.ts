import type { uk } from './uk';

// Makes t() keys type-checked: t('form.titel') is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof uk;
    };
  }
}
