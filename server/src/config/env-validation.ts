import logger from '@/integrations/logger';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const WEAK_SECRETS = [
  'change_this_in_production',
  'market-monitor-secret-key',
  'market-monitor-refresh-secret-key',
  'development_jwt_secret_change_in_production',
  'development_refresh_secret_change_in_production',
  'password-with-at-least-32-characters',
];

const MINIMUM_SECRET_LENGTH = 32;

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical: JWT_SECRET
  if (!process.env.JWT_SECRET) {
    errors.push(
      'JWT_SECRET is not set. This is required for authentication to work.',
    );
  } else if (process.env.JWT_SECRET.length < MINIMUM_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET is too short (${process.env.JWT_SECRET.length} chars). Must be at least ${MINIMUM_SECRET_LENGTH} characters.`,
    );
  } else if (WEAK_SECRETS.includes(process.env.JWT_SECRET)) {
    errors.push(
      'JWT_SECRET is set to a default/weak value. Use a strong, unique secret in production.',
    );
  }

  // Critical: REFRESH_TOKEN_SECRET
  if (!process.env.REFRESH_TOKEN_SECRET) {
    errors.push(
      'REFRESH_TOKEN_SECRET is not set. This is required for refresh token functionality.',
    );
  } else if (process.env.REFRESH_TOKEN_SECRET.length < MINIMUM_SECRET_LENGTH) {
    errors.push(
      `REFRESH_TOKEN_SECRET is too short (${process.env.REFRESH_TOKEN_SECRET.length} chars). Must be at least ${MINIMUM_SECRET_LENGTH} characters.`,
    );
  } else if (WEAK_SECRETS.includes(process.env.REFRESH_TOKEN_SECRET)) {
    errors.push(
      'REFRESH_TOKEN_SECRET is set to a default/weak value. Use a strong, unique secret in production.',
    );
  }

  // Check if both secrets are the same (security risk)
  if (
    process.env.JWT_SECRET &&
    process.env.REFRESH_TOKEN_SECRET &&
    process.env.JWT_SECRET === process.env.REFRESH_TOKEN_SECRET
  ) {
    warnings.push(
      'JWT_SECRET and REFRESH_TOKEN_SECRET should be different for better security.',
    );
  }

  // Optional but recommended: DB_PATH
  if (!process.env.DB_PATH && process.env.NODE_ENV === 'production') {
    warnings.push(
      'DB_PATH is not set in production. Will use default: /app/data',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateAndLogEnvironment(): void {
  const result = validateEnvironment();

  if (result.warnings.length > 0) {
    logger.warn({
      message: 'Environment validation warnings',
      warnings: result.warnings,
    });
  }

  if (!result.valid) {
    logger.error({
      message: 'Environment validation failed',
      errors: result.errors,
    });

    console.error('\n' + '='.repeat(80));
    console.error('ENVIRONMENT VALIDATION FAILED');
    console.error('='.repeat(80) + '\n');

    result.errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error}`);
    });

    console.error('\n' + '='.repeat(80));
    console.error('Please fix the above errors and restart the application.');
    console.error(
      'See .env.example for required environment variables and examples.',
    );
    console.error('='.repeat(80) + '\n');

    // Exit with error code
    process.exit(1);
  }

  logger.info({
    message: 'Environment validation passed',
    nodeEnv: process.env.NODE_ENV,
  });
}
