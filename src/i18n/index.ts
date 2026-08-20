import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { uk } from './uk';

export const DEFAULT_LOCALE = 'uk';

/**
 * Resources are bundled inline rather than fetched, so initialisation completes
 * synchronously and no Suspense boundary is required.
 */
void i18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  resources: { [DEFAULT_LOCALE]: { translation: uk } },
  interpolation: { escapeValue: false },
});

export default i18n;
