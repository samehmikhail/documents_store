import { Request, Response, NextFunction } from 'express';
import { Config } from '../config';

interface LocalizedRequest extends Request {
  locale?: string;
  t?: (key: string, params?: Record<string, any>) => string;
}

// Simple localization middleware
export const localizationMiddleware = (req: LocalizedRequest, res: Response, next: NextFunction): void => {
  // Get locale from header, query param, or default
  const headerLocale = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  const queryLocale = req.query.locale as string;
  
  let locale = queryLocale || headerLocale || Config.DEFAULT_LOCALE;
  
  // Validate locale is supported
  if (!Config.SUPPORTED_LOCALES.includes(locale)) {
    locale = Config.DEFAULT_LOCALE;
  }
  
  req.locale = locale;
  
  // Simple translation function
  req.t = (key: string, params: Record<string, any> = {}) => {
    const translations = getTranslations(locale);
    let translation = translations[key] || key;
    
    // Simple parameter replacement
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
    
    return translation;
  };
  
  next();
};

// Simple in-memory translations
const translations: Record<string, Record<string, string>> = {
  en: {
    'welcome': 'Welcome',
    'document.uploaded': 'Document uploaded successfully',
    'document.deleted': 'Document deleted successfully',
    'document.notFound': 'Document not found',
    'auth.loginSuccess': 'Login successful',
    'auth.loginFailed': 'Invalid credentials',
    'auth.unauthorized': 'Unauthorized access',
    'auth.forbidden': 'Insufficient permissions',
    'validation.required': 'This field is required',
    'server.error': 'Internal server error'
  },
  es: {
    'welcome': 'Bienvenido',
    'document.uploaded': 'Documento subido exitosamente',
    'document.deleted': 'Documento eliminado exitosamente',
    'document.notFound': 'Documento no encontrado',
    'auth.loginSuccess': 'Inicio de sesión exitoso',
    'auth.loginFailed': 'Credenciales inválidas',
    'auth.unauthorized': 'Acceso no autorizado',
    'auth.forbidden': 'Permisos insuficientes',
    'validation.required': 'Este campo es obligatorio',
    'server.error': 'Error interno del servidor'
  },
  fr: {
    'welcome': 'Bienvenue',
    'document.uploaded': 'Document téléchargé avec succès',
    'document.deleted': 'Document supprimé avec succès',
    'document.notFound': 'Document non trouvé',
    'auth.loginSuccess': 'Connexion réussie',
    'auth.loginFailed': 'Identifiants invalides',
    'auth.unauthorized': 'Accès non autorisé',
    'auth.forbidden': 'Permissions insuffisantes',
    'validation.required': 'Ce champ est obligatoire',
    'server.error': 'Erreur interne du serveur'
  }
};

const getTranslations = (locale: string): Record<string, string> => {
  return translations[locale] || translations[Config.DEFAULT_LOCALE] || {};
};

export { LocalizedRequest };