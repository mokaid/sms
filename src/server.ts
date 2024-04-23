import App from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { HistoryRoute } from './routes/history.route';
import { PriceRoute } from './routes/prices.route';
import { ProfileRoute } from './routes/profiles.route';
import { UploadRoute } from './routes/uploads.routes';
import { UserRoute } from '@routes/users.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([new AuthRoute(), new UserRoute(), new ProfileRoute(), new PriceRoute(), new UploadRoute(), new HistoryRoute()]);

app.listen();
