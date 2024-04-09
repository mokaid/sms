import { EMAIL_HOST, EMAIL_PASSWORD, EMAIL_PORT, EMAIL_TLS, EMAIL_USER } from '.';

export const imapConfig = {
  user: EMAIL_USER,
  password: EMAIL_PASSWORD,
  host: EMAIL_HOST,
  port: parseInt(EMAIL_PORT),
  tls: Boolean(EMAIL_TLS),
  tlsOptions: { rejectUnauthorized: false },
};
