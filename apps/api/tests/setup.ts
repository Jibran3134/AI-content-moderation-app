// Global Jest setup — configure environment variables for tests
import { config } from 'dotenv';

config({ path: '.env.test' });

// Set test env vars if not already set
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/moderation_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test_jwt_secret_minimum_32_characters_long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret_minimum_32_chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.PORT = '4001';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.ADMIN_PASSWORD = 'Admin@Test123';

export default async function globalSetup() {
  console.warn('Test environment configured');
}
