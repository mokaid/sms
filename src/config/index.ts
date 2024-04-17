import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN } = process.env;
export const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;
export const { EMAIL_USER, EMAIL_PASSWORD, EMAIL_HOST, EMAIL_PORT, EMAIL_TLS, EMAIL_CHECK_INTERVAL } = process.env;
