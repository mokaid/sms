import { DB_HOST, DB_PASSWORD, DB_USER, NODE_ENV } from '@config';
import { connect, set } from 'mongoose';

console.log(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}`);
export const dbConnection = async () => {
  const dbConfig = {
    url: `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}`,
  };

  if (NODE_ENV !== 'production') {
    set('debug', true);
  }

  await connect(dbConfig.url);
};
