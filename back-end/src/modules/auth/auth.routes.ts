import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  verifyOtpSchema,
  resendOtpSchema,
  exchangeCodeSchema,
  authHashSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema';
import { authController } from './auth.controller';
import { requireAuth } from '@/utils/authGuard';

export async function authRoutes(route: FastifyInstance) {
  // Tambahkan type provider khusus Zod di rute ini agar TypeScript mengenali tipe data dari request.body
  const server = route.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/register',
    registerSchema,
    authController.register
  );

  server.post(
    '/login',
    loginSchema,
    authController.login
  );

  server.post(
    '/verify-otp',
    verifyOtpSchema,
    authController.verifyOTP
  );

  server.post(
    '/resend-otp',
    resendOtpSchema,
    authController.resendOTP
  );

  server.post(
    '/exchange-code',
    exchangeCodeSchema,
    authController.exchangeCode
  );

  server.post(
    '/auth-code',
    authHashSchema,
    authController.authHashCode
  );

  server.get('/google/url', authController.getGoogleOAuthUrl);
  server.post('/sign-in-with-google', googleAuthSchema, authController.signWithGoogle);

  server.get('/profile', authController.getProfile);
  server.put('/profile', authController.updateProfile);

  server.post('/forgot-password', forgotPasswordSchema, authController.forgotPassword);
  server.post('/reset-password', resetPasswordSchema, authController.resetPassword);
  server.post('/refresh', authController.refresh);
  server.register(async (authed) => {
    authed.addHook('preHandler', requireAuth);
    authed.post('/change-password', changePasswordSchema, authController.changePassword);
  });
}