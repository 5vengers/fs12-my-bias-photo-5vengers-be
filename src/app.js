import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import authController from './controllers/authController.js';
import { authenticate, errorHandler } from './middlewares/errorHandler.js';
import { validate } from './middlewares/validate.js';
import { loginSchema, registerSchema } from './schemas/authSchema.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.post(
  '/api/auth/register',
  validate(registerSchema),
  authController.register,
);
app.post('/api/auth/login', validate(loginSchema), authController.login);
app.post('/api/auth/logout', authenticate, authController.logout);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
