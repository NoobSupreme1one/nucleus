interface AppConfig {
  nodeEnv: string;
  pocketbase: {
    url: string;
    adminEmail?: string;
    adminPassword?: string;
  };
  perplexity: {
    apiKey?: string;
    model: string;
  };
  app: {
    timezone: string;
    rateLimitDaily: number;
  };
  logging: {
    level: string;
  };
}


function getConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    pocketbase: {
      url: process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090',
      adminEmail: process.env.POCKETBASE_ADMIN_EMAIL,
      adminPassword: process.env.POCKETBASE_ADMIN_PASSWORD,
    },
    perplexity: {
      apiKey: process.env.PERPLEXITY_API_KEY,
      model: process.env.PERPLEXITY_MODEL || 'sonar-pro',
    },
    app: {
      timezone: process.env.APP_TIMEZONE || 'America/Los_Angeles',
      rateLimitDaily: parseInt(process.env.RATE_LIMIT_DAILY || '3', 10),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
    },
  };
}

export const config = getConfig();

export function validateConfig() {
  const errors: string[] = [];

  if (!config.pocketbase.url) {
    errors.push('NEXT_PUBLIC_POCKETBASE_URL is required');
  }

  if (config.nodeEnv === 'production') {
    if (!config.perplexity.apiKey) {
      errors.push('PERPLEXITY_API_KEY is required in production');
    }
    
    if (!config.pocketbase.adminEmail || !config.pocketbase.adminPassword) {
      errors.push('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are required in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}