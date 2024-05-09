import { AccountRoute } from './routes/accounts.route';
import App from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { ConfigurationRoute } from './routes/configurations.route';
import { HistoryRoute } from './routes/history.route';
import { OperatorsRoute } from './routes/operators.route';
import { PriceRoute } from './routes/prices.route';
import { ProfileRoute } from './routes/profiles.route';
import { UploadRoute } from './routes/uploads.routes';
import { UserRoute } from '@routes/users.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([
  new AuthRoute(),
  new UserRoute(),
  new ProfileRoute(),
  new PriceRoute(),
  new UploadRoute(),
  new HistoryRoute(),
  new OperatorsRoute(),
  new ConfigurationRoute(),
  new AccountRoute(),
]);

app.listen();
