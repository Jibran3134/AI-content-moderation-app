
import { logger } from '../utils/logger';

export const cache = {
  get: async (key: string): Promise<string | null> => {
    logger.debug(`[redis:get] ${key}`);
    return null;
  },
  set: async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
    logger.debug(`[redis:set] ${key} ttl=${ttlSeconds ?? '∞'} value=${value.slice(0, 80)}`);
  },
  del: async (key: string): Promise<void> => {
    logger.debug(`[redis:del] ${key}`);
  },
  flush: async (): Promise<void> => {
    logger.debug('[redis:flush] cache cleared');
  },
};

export default cache;
