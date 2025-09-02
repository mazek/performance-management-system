import { AuthProvider } from '@prisma/client';

// Active Directory configuration
export interface ADConfig {
  enabled: boolean;
  domain: string;
  url: string;
  baseDN: string;
  username?: string;
  password?: string;
  tlsOptions?: {
    rejectUnauthorized: boolean;
  };
  searchFilter?: string;
  searchAttributes?: string[];
}

// SAML configuration
export interface SAMLConfig {
  enabled: boolean;
  entryPoint: string;
  issuer: string;
  cert: string;
  callbackUrl: string;
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  identifierFormat?: string;
  attributeMapping?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    employeeId?: string;
    department?: string;
  };
}

// OAuth configuration
export interface OAuthConfig {
  enabled: boolean;
  provider: 'google' | 'microsoft' | 'github' | 'custom';
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  callbackUrl: string;
  scope?: string[];
  attributeMapping?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    employeeId?: string;
  };
}

// Main auth configuration
export interface AuthConfig {
  providers: {
    local: {
      enabled: boolean;
      allowRegistration: boolean;
      requireEmailVerification: boolean;
      passwordPolicy?: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        maxAge?: number; // days
      };
    };
    activeDirectory?: ADConfig;
    saml?: SAMLConfig;
    oauth?: OAuthConfig[];
  };
  sessionConfig: {
    secret: string;
    maxAge: number; // seconds
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  defaultProvider: AuthProvider;
  allowProviderSelection: boolean;
}

// Get session secret with validation
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required. Please set it in your .env file.');
}

// Default configuration
export const defaultAuthConfig: AuthConfig = {
  providers: {
    local: {
      enabled: true,
      allowRegistration: false,
      requireEmailVerification: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAge: 90,
      },
    },
  },
  sessionConfig: {
    secret: SESSION_SECRET,
    maxAge: 86400, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  defaultProvider: AuthProvider.LOCAL,
  allowProviderSelection: false,
};

// Load configuration from database or environment
export async function loadAuthConfig(): Promise<AuthConfig> {
  // This would load from SystemConfiguration table
  // For now, return default config
  return defaultAuthConfig;
}

// Validate provider configuration
export function validateProviderConfig(provider: AuthProvider, config: any): boolean {
  switch (provider) {
    case AuthProvider.ACTIVE_DIRECTORY:
      return !!(config?.domain && config?.url && config?.baseDN);
    case AuthProvider.SAML:
      return !!(config?.entryPoint && config?.issuer && config?.cert);
    case AuthProvider.OAUTH:
      return !!(config?.clientId && config?.clientSecret && config?.callbackUrl);
    case AuthProvider.LOCAL:
      return true;
    default:
      return false;
  }
}