import { AccountRoute } from './routes/accounts.route';
import App from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { ProfileRoute } from './routes/profiles.route';
import { UserRoute } from '@routes/users.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([new AuthRoute(), new UserRoute(), new ProfileRoute(), new AccountRoute()]);

app.listen();
