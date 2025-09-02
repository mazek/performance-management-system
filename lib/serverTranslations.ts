import { translations, Language } from './translations';

export function getTranslation(language: Language) {
  return translations[language];
}

export function getErrorMessage(language: Language, errorKey: string) {
  const t = getTranslation(language);
  
  switch (errorKey) {
    case 'invalidCredentials':
      return t.auth.errors.invalidCredentials;
    case 'invalidData':
      return t.auth.errors.invalidData;
    case 'accountInactive':
      return t.auth.errors.accountInactive;
    case 'loginError':
      return t.auth.errors.loginError;
    default:
      return t.auth.errors.loginError;
  }
}