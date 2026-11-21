import { z } from 'zod';

import { validateSchema } from '../../schemas/common.schema';

// Skema untuk body, kita pisahkan agar TypeScript bisa membaca tipe aslinya (infer)
export const registerBodySchema = z.object({
  fullName: z.string().min(3, "auth.validation.full_name_min"),
  phoneNumber: z.string().min(10, "auth.validation.phone_min").max(14, "auth.validation.phone_max"),
  password: z.string().min(8, "auth.validation.password_min"),
  email: z.string().email("auth.validation.email_invalid"),
});

export const registerSchema = validateSchema({
  body: registerBodySchema,
});


export const loginBodySchema = z.object({
  email: z.string().email("auth.validation.email_invalid"),
  password: z.string().min(8, "auth.validation.password_min"),
});

export const loginSchema = validateSchema({
  body: loginBodySchema,
});

export const googleAuthBodySchema = z.object({
  token: z.string().optional(),
  access_token: z.string().optional(),
  idToken: z.string().optional(),
});

export const googleAuthSchema = validateSchema({
  body: googleAuthBodySchema,
});

export const verifyOtpBodySchema = z.object({
  email: z.string().email("auth.validation.email_invalid"),
  token: z.string().min(6, "auth.validation.otp_min"),
  type: z.enum(['signup', 'email_change', 'email']).optional().default('signup'),
});

export const authHashBodySchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const authHashSchema = validateSchema({
  body: authHashBodySchema,
});

export const verifyOtpSchema = validateSchema({
  body: verifyOtpBodySchema,
});

export const resendOtpBodySchema = z.object({
  email: z.string().email("auth.validation.email_invalid"),
  type: z.enum(['signup', 'email_change']).optional().default('signup'),
});

export const resendOtpSchema = validateSchema({
  body: resendOtpBodySchema,
});

export const exchangeCodeBodySchema = z.object({
  code: z.string().min(1, "auth.validation.code_required"),
});

export const exchangeCodeSchema = validateSchema({
  body: exchangeCodeBodySchema,
});

