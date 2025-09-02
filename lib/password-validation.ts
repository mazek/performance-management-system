import { defaultAuthConfig } from './auth-providers';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge?: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(
  password: string, 
  policy?: PasswordPolicy
): PasswordValidationResult {
  const errors: string[] = [];
  const actualPolicy = policy || defaultAuthConfig.providers.local.passwordPolicy!;
  
  // Check minimum length
  if (password.length < actualPolicy.minLength) {
    errors.push(`Password must be at least ${actualPolicy.minLength} characters long`);
  }
  
  // Check for uppercase letters
  if (actualPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letters
  if (actualPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for numbers
  if (actualPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters
  if (actualPolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const weakPasswords = [
    'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
    'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
    'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael'
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more secure password');
  }
  
  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push('Password should not contain sequential characters');
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain more than 2 repeated characters in a row');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function generatePasswordStrengthScore(password: string): number {
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;
  
  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10;
  if (/(?:abc|bcd|cde|123|234|345)/i.test(password)) score -= 10;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

export function getPasswordStrengthLabel(score: number): string {
  if (score < 30) return 'Weak';
  if (score < 50) return 'Fair';
  if (score < 70) return 'Good';
  if (score < 90) return 'Strong';
  return 'Very Strong';
}