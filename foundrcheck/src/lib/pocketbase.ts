import PocketBase from 'pocketbase';
import { config } from './config';
import { logger } from './logger';

const pb = new PocketBase(config.pocketbase.url);

// Server-side admin instance
export const pbAdmin = new PocketBase(config.pocketbase.url);

// Initialize admin auth if credentials are provided
if (config.pocketbase.adminEmail && config.pocketbase.adminPassword) {
  pbAdmin.admins.authWithPassword(
    config.pocketbase.adminEmail,
    config.pocketbase.adminPassword
  ).catch((error) => {
    logger.error('PocketBase admin authentication failed', { error: error.message });
  });
}

export default pb;