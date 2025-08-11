import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';
import { Config } from './index';

// Initialize i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    lng: Config.DEFAULT_LOCALE,
    fallbackLng: Config.DEFAULT_LOCALE,
    supportedLngs: Config.SUPPORTED_LOCALES,
    
    backend: {
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
    },
    
    ns: ['common', 'auth', 'documents'],
    defaultNS: 'common',
    
    detection: {
      order: ['querystring', 'header'],
      lookupQuerystring: 'locale',
      lookupHeader: 'accept-language',
      caches: false,
    },
    
    interpolation: {
      escapeValue: false, // Not needed for server-side
    },
  });

export const localizationMiddleware = middleware.handle(i18next);

// Export i18next instance for use in other parts of the application
export { i18next };