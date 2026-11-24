import { db, pool } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { typePayloadLog, typePayloadReg } from "./auth.type";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { supabase } from "@/plugins/supabase";
import { SupportedLanguage, t, translateSupabaseError } from "@/i18n";
import { EmailService } from "@/services/email.service";

function checkUserVerification(supabaseUser: any, _existingDbUser?: any): { isVerified: boolean; isNewUser: boolean } {
    // 1. Cek metadata is_verified dari Supabase Auth user_metadata (diset setelah verifikasi OTP 6-digit)
    const isVerified = supabaseUser.user_metadata?.is_verified === true;

    return {
        isVerified,
        isNewUser: !isVerified,
    };
}

export const authService = {
    async register(payload: typePayloadReg, lang: SupportedLanguage = 'id') {
        // Cek jika email atau nomor HP sudah terdaftar di DB lokal
        const existingEmail = await db.orm.core_auth.User.where({ email: payload.email }).first();
        if (existingEmail) {
            throw new AppError(t('auth.email_already_exists', {}, lang), 400);
        }

        if (payload.phoneNumber) {
            const existingPhone = await db.orm.core_auth.User.where({ phoneNumber: payload.phoneNumber }).first();
            if (existingPhone) {
                throw new AppError(t('auth.phone_already_exists', {}, lang), 400);
            }
        }

        let userId: string | null = null;

        // 1. Daftarkan pengguna ke Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: payload.email,
            password: payload.password,
            options: {
                data: {
                    full_name: payload.fullName,
                    phone_number: payload.phoneNumber,
                },
            },
        });

        if (authError) {
            const rawMsg = authError?.message;
            const translatedMsg = translateSupabaseError(rawMsg, lang) || 'Gagal membuat akun';

            throw new AppError(
                t('auth.register_supabase_failed', { message: translatedMsg }, lang),
                400,
                {
                    supabaseError: authError,
                    code: authError?.code,
                    status: authError?.status,
                    hint: t('auth.register_supabase_hint', {}, lang)
                }
            );
        }

        userId = authData.user?.id || null;
        const hashedPassword = await bcrypt.hash(payload.password, 10);

        // 2. Simpan / Sync profil pengguna ke core_auth.User (menggunakan upsert jika DB trigger sudah membuatkan row)
        const user = await db.orm.core_auth.User.upsert({
            create: {
                ...(userId ? { id: userId } : {}),
                fullName: payload.fullName,
                phoneNumber: payload.phoneNumber,
                passwordHash: hashedPassword,
                email: payload.email,
            },
            update: {
                fullName: payload.fullName,
                phoneNumber: payload.phoneNumber,
                passwordHash: hashedPassword,
            },
            conflictOn: { email: payload.email },
        });

        const { passwordHash, ...userWithoutPassword } = user;
        return {
            ...userWithoutPassword,
            requireOtp: true,
            email: payload.email,
            cooldownSeconds: 60,
            cooldown: 60,
        };
    },

    async login(payload: typePayloadLog, lang: SupportedLanguage = 'id') {
        // 1. Autentikasi melalui Supabase Auth
        let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: payload.email,
            password: payload.password,
        });

        // Fallback sinkronisasi jika password lokal di core_auth.users sudah diubah namun Supabase Auth tertinggal
        if ((authError || !authData.user) && /invalid login credentials/i.test(authError?.message || '')) {
            const localUser = await db.orm.core_auth.User.where({ email: payload.email }).first();
            if (localUser?.passwordHash) {
                const localMatch = await bcrypt.compare(payload.password, localUser.passwordHash);
                if (localMatch) {
                    const { error: syncErr } = await supabase.auth.admin.updateUserById(localUser.id, {
                        password: payload.password,
                    });
                    if (syncErr) {
                        const listRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
                        const supaUser = listRes.data?.users?.find(
                            (u: any) => u.email?.toLowerCase() === payload.email.toLowerCase()
                        );
                        if (supaUser) {
                            await supabase.auth.admin.updateUserById(supaUser.id, { password: payload.password });
                        }
                    }
                    const retryRes = await supabase.auth.signInWithPassword({
                        email: payload.email,
                        password: payload.password,
                    });
                    authData = retryRes.data;
                    authError = retryRes.error;
                }
            }
        }

        if (authError || !authData.user) {
            const rawMsg = authError?.message;
            const translatedMsg = translateSupabaseError(rawMsg, lang);

            const message = t('auth.login_failed', {
                message: translatedMsg || t('auth.login_failed_default', {}, lang)
            }, lang);

            const isEmailNotConfirmed = authError?.code === 'email_not_confirmed' || rawMsg === 'Email not confirmed';

            const hint = rawMsg === 'Invalid login credentials'
                ? t('auth.invalid_credentials_hint', {}, lang)
                : undefined;

            const supabaseError = authError ? {
                name: authError.name || "AuthApiError",
                message: authError.message || "Email not confirmed",
                status: authError.status || 400,
                code: authError.code || (isEmailNotConfirmed ? "email_not_confirmed" : undefined),
            } : (isEmailNotConfirmed ? {
                name: "AuthApiError",
                message: "Email not confirmed",
                status: 400,
                code: "email_not_confirmed",
            } : undefined);

            throw new AppError(
                message,
                400,
                {
                    supabaseError: supabaseError || authError,
                    code: isEmailNotConfirmed ? 'email_not_confirmed' : (authError?.code || authError?.status?.toString()),
                    status: authError?.status || 400,
                    email: payload.email,
                    requireOtp: isEmailNotConfirmed ? true : undefined,
                    cooldownSeconds: isEmailNotConfirmed ? 60 : undefined,
                    hint,
                }
            );
        }

        // 2. Pengecekan verifikasi email dari Supabase Auth (dapat di-bypass di dev via REQUIRE_EMAIL_VERIFICATION=false)
        if (env.REQUIRE_EMAIL_VERIFICATION && !authData.user.email_confirmed_at) {
            const rawMsg = "Email not confirmed";
            const translatedMsg = translateSupabaseError(rawMsg, lang);
            const message = t('auth.login_failed', {
                message: translatedMsg || rawMsg
            }, lang);

            throw new AppError(
                message,
                400,
                {
                    supabaseError: {
                        name: "AuthApiError",
                        message: "Email not confirmed",
                        status: 400,
                        code: "email_not_confirmed"
                    },
                    code: "email_not_confirmed",
                    status: 400,
                    email: payload.email,
                    requireOtp: true,
                    cooldownSeconds: 60
                }
            );
        }
        // 2. Ambil profil user dari core_auth.User berdasarkan ID Supabase
        let existingUser = await db.orm.core_auth.User.where({ id: authData.user.id }).first();

        // Sync fallback jika profil belum ada di core_auth.User
        if (!existingUser) {
            const fullName = authData.user.user_metadata.full_name || authData.user.user_metadata.name || "User";
            const phoneNumber = authData.user.user_metadata.phone_number || authData.user.phone || `u_${authData.user.id.replace(/-/g, '').slice(0, 12)}`;
            const hashedPassword = await bcrypt.hash(payload.password, 10);

            existingUser = await db.orm.core_auth.User.create({
                id: authData.user.id,
                email: authData.user.email!,
                fullName: fullName,
                passwordHash: hashedPassword,
                phoneNumber: phoneNumber,
            });
        }

        if (existingUser.isDeleted) {
            throw new AppError(t('auth.account_disabled', {}, lang), 400);
        }

        // 3. Setup JWT token internal backend
        const appToken = jwt.sign(
            {
                userId: existingUser.id,
                email: existingUser.email,
                phoneNumber: existingUser.phoneNumber,
            },
            env.JWT_SECRET,
            { expiresIn: (env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'] }
        );

        const { passwordHash, ...userWithoutPassword } = existingUser;

        // Ambil role staf toko aktif (jika ada) untuk otorisasi modul ERP
        let staffRole: string | null = null;
        try {
            const staffRes = await pool.query(
                `SELECT role FROM store.agents
                 WHERE (linked_user_id = $1 OR LOWER(email) = LOWER($2))
                   AND status = 'ACTIVE'
                   AND COALESCE(source_channel, 'TIJARAH') <> 'HSIS_SYNC'
                 LIMIT 1`,
                [existingUser.id, existingUser.email || '']
            );
            staffRole = staffRes.rows[0]?.role ? String(staffRes.rows[0].role).toUpperCase() : null;
        } catch {
            staffRole = null;
        }

        const refreshToken =
            authData.session?.refresh_token ||
            jwt.sign(
                { userId: existingUser.id, email: existingUser.email, type: 'refresh' },
                env.JWT_SECRET,
                { expiresIn: '7d' }
            );

        return {
            user: {
                ...userWithoutPassword,
                staffRole,
            },
            token: authData.session?.access_token || appToken,
            appToken,
            refreshToken,
        };
    },

    async getGoogleOAuthUrl(redirectTo?: string, lang: SupportedLanguage = 'id') {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo || 'http://localhost:3000/auth/callback',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error || !data.url) {
                throw new AppError(
                    t('auth.google_login_failed', { message: error?.message || 'Gagal mendapatkan URL Google OAuth' }, lang),
                    400
                );
            }

            return { url: data.url };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('auth.google_login_failed', { message: error.message }, lang), 500);
        }
    },

    async exchangeCode(code: string, lang: SupportedLanguage = 'id') {
        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error || !data.user) {
                const rawMsg = error?.message;
                const translatedErr = translateSupabaseError(rawMsg, lang);
                throw new AppError(
                    t('auth.google_login_failed', { message: translatedErr || rawMsg || 'Kode OAuth tidak valid' }, lang),
                    400
                );
            }

            const user = data.user;
            const fullName = user.user_metadata.full_name || user.user_metadata.name || "Google User";
            const phoneNumber = user.user_metadata.phone_number || user.phone || null;

            const existingUser = await db.orm.core_auth.User.where({ email: user.email! }).first();

            const updatedUser = await db.orm.core_auth.User.upsert({
                create: {
                    id: user.id,
                    email: user.email!,
                    fullName: fullName,
                    passwordHash: "",
                    phoneNumber: phoneNumber ?? undefined,
                },
                update: {
                    fullName: fullName,
                },
                conflictOn: { email: user.email! },
            });

            const { isVerified } = checkUserVerification(user, existingUser);

            if (!isVerified) {
                // Gunakan signInWithOtp karena akun Google di Supabase Auth otomatis berstatus email_confirmed_at.
                // resend({ type: 'signup' }) akan di-abaikan oleh Supabase untuk email yang sudah terkonfirmasi.
                const { error: otpErr } = await supabase.auth.signInWithOtp({
                    email: user.email!,
                    options: {
                        shouldCreateUser: false,
                    }
                });

                if (otpErr) {
                    console.error("❌ Gagal mengirimkan email OTP untuk user Google baru:", otpErr.message);
                }

                const { passwordHash, ...userWithoutPassword } = updatedUser;

                return {
                    isNewUser: true,
                    requireOtp: true,
                    email: user.email!,
                    user: userWithoutPassword,
                    message: t('auth.register_otp_sent', {}, lang),
                };
            }

            const appToken = jwt.sign(
                {
                    userId: updatedUser.id,
                    email: updatedUser.email,
                    phoneNumber: updatedUser.phoneNumber,
                },
                env.JWT_SECRET,
                { expiresIn: (env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'] }
            );

            const { passwordHash, ...userWithoutPassword } = updatedUser;

            return {
                isNewUser: false,
                requireOtp: false,
                user: userWithoutPassword,
                token: appToken,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('auth.google_login_failed', { message: error.message || 'Unknown error' }, lang), 500);
        }
    },

    async signWithGoogle(payload: any, lang: SupportedLanguage = 'id') {
        try {
            const tokenStr = typeof payload === 'string'
                ? payload
                : (payload?.token || payload?.access_token || payload?.idToken);

            if (!tokenStr) {
                throw new AppError(
                    t('auth.google_login_failed', { message: 'Token OAuth tidak ditemukan' }, lang),
                    400
                );
            }

            const {
                data: { user },
                error,
            } = await supabase.auth.getUser(tokenStr);

            if (error || !user) {
                const translatedErr = translateSupabaseError(error?.message, lang);
                throw new AppError(
                    t('auth.google_login_failed', { message: translatedErr || error?.message || "Invalid Token" }, lang),
                    401,
                );
            }

            const fullName = user.user_metadata.full_name || user.user_metadata.name || "Google User";
            const phoneNumber = user.user_metadata.phone_number || user.phone || null;

            // Cek apakah pengguna sudah pernah terdaftar sebelumnya
            const existingUser = await db.orm.core_auth.User.where({ email: user.email! }).first();

            const updatedUser = await db.orm.core_auth.User.upsert({
                create: {
                    id: user.id,
                    email: user.email!,
                    fullName: fullName,
                    passwordHash: "",
                    phoneNumber: phoneNumber ?? undefined,
                },
                update: {
                    fullName: fullName,
                },
                conflictOn: { email: user.email! },
            });

            const { isVerified } = checkUserVerification(user, existingUser);

            // Jika user belum terverifikasi via OTP, kirim OTP verifikasi dan minta verifikasi OTP
            if (!isVerified) {
                const { error: otpErr } = await supabase.auth.signInWithOtp({
                    email: user.email!,
                    options: {
                        shouldCreateUser: false,
                    }
                });

                if (otpErr) {
                    console.error("❌ Gagal mengirimkan email OTP untuk user Google baru:", otpErr.message);
                }

                const { passwordHash, ...userWithoutPassword } = updatedUser;

                return {
                    isNewUser: true,
                    requireOtp: true,
                    email: user.email!,
                    user: userWithoutPassword,
                    message: t('auth.register_otp_sent', {}, lang),
                };
            }

            // Jika user lama (login biasa via Google)
            const appToken = jwt.sign(
                {
                    userId: updatedUser.id,
                    email: updatedUser.email,
                    phoneNumber: updatedUser.phoneNumber,
                },
                env.JWT_SECRET,
                { expiresIn: (env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'] }
            );

            const { passwordHash, ...userWithoutPassword } = updatedUser;

            return {
                isNewUser: false,
                requireOtp: false,
                user: userWithoutPassword,
                token: appToken,
            };
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(t('auth.google_login_failed', { message: error.message || 'Unknown error' }, lang), 500);
        }
    },

    async sendVerificationEmail(email: string, lang: SupportedLanguage = 'id') {
        try {
            const { data, error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) {
                throw new AppError(t('auth.resend_verification_failed', { message: error.message }, lang), 500);
            }

            return {
                success: true,
                message: t('auth.resend_verification_success', {}, lang),
                cooldownSeconds: 60,
                cooldown: 60,
            };
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(t('auth.resend_verification_failed', { message: error.message }, lang), 500);
        }
    },
    async requestEmailChangeOTP(currentUserId: string, newEmail: string, lang: SupportedLanguage = 'id') {

        // 1. Supabase otomatis mengirimkan OTP 6-digit ke newEmail
        const { data, error } = await supabase.auth.admin.updateUserById(
            currentUserId,
            { email: newEmail }
        );

        if (error) {
            throw new AppError(t('auth.request_email_change_otp_failed', { message: error.message }, lang), 500);
        }

        return {
            success: true,
            message: t('auth.request_email_change_otp_success', {}, lang),
            cooldownSeconds: 60,
            cooldown: 60,
        };
    },
    async handleVerifyOTP(
        params: { email: string; token: string; type?: 'signup' | 'email_change' | 'email' },
        lang: SupportedLanguage = 'id'
    ) {
        const otpType = params.type || 'signup';

        // 1. Verifikasi OTP ke Supabase Auth
        let { data: authData, error } = await supabase.auth.verifyOtp({
            email: params.email,
            token: params.token,
            type: otpType as any,
        });

        // Fallback: jika type 'signup' gagal, coba type 'email' (atau sebaliknya) untuk OTP Google signInWithOtp
        if (error && (otpType === 'signup' || otpType === 'email')) {
            const fallbackType = otpType === 'signup' ? 'email' : 'signup';
            const fallbackResult = await supabase.auth.verifyOtp({
                email: params.email,
                token: params.token,
                type: fallbackType as any,
            });

            if (!fallbackResult.error && fallbackResult.data?.user) {
                authData = fallbackResult.data;
                error = null;
            }
        }

        if (error || !authData?.user) {
            const rawMsg = error?.message || '';
            if (rawMsg.includes("security purposes") || rawMsg.includes("rate limit")) {
                throw new AppError(t('auth.rate_limit_exceeded', {}, lang), 429);
            }
            const translatedMsg = translateSupabaseError(rawMsg, lang) || rawMsg || 'OTP tidak valid';
            throw new AppError(t('auth.verify_otp_failed', { message: translatedMsg }, lang), 400, { supabaseError: error });
        }

        // Tandai user terverifikasi di user_metadata Supabase
        try {
            await supabase.auth.admin.updateUserById(authData.user.id, {
                user_metadata: {
                    ...authData.user.user_metadata,
                    is_verified: true,
                },
            });
        } catch (metaErr: any) {
            console.warn("⚠️ Gagal update status is_verified di user_metadata:", metaErr.message);
        }

        // 2. Ambil profil user dari core_auth.User
        let user = await db.orm.core_auth.User.where({ id: authData.user.id }).first();
        if (!user && authData.user.email) {
            user = await db.orm.core_auth.User.where({ email: authData.user.email }).first();
        }

        if (!user) {
            const fullName = authData.user.user_metadata.full_name || authData.user.user_metadata.name || "User";
            const phoneNumber = authData.user.user_metadata.phone_number || authData.user.phone || null;

            user = await db.orm.core_auth.User.create({
                id: authData.user.id,
                email: authData.user.email!,
                fullName: fullName,
                passwordHash: "",
                phoneNumber: phoneNumber ?? undefined,
            });
        }

        // 3. Setup JWT token internal backend agar user otomatis login setelah verifikasi OTP
        const appToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                phoneNumber: user.phoneNumber,
            },
            env.JWT_SECRET,
            { expiresIn: (env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'] }
        );

        const { passwordHash, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token: authData.session?.access_token || appToken,
            appToken,
            message: t('auth.verify_otp_success', {}, lang),
        };
    },
    async resendOTP(email: string, type: 'signup' | 'email_change' = 'signup', lang: SupportedLanguage = 'id') {
        const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Kirim ulang email verifikasi / OTP menggunakan supabase.auth.resend
        const { error } = await supabase.auth.resend({
            type: type,
            email: email,
            options: {
                emailRedirectTo: `${siteUrl}/${lang}/auth/callback`,
            },
        });

        if (error) {
            const rawMsg = error.message || '';
            if (rawMsg.includes("security purposes") || rawMsg.includes("rate limit") || rawMsg.includes("60 seconds")) {
                throw new AppError(t('auth.rate_limit_exceeded', {}, lang), 429, {
                    cooldownSeconds: 60,
                    cooldown: 60,
                    rateLimitExceeded: true,
                });
            }

            const translatedMsg = translateSupabaseError(rawMsg, lang) || rawMsg;
            throw new AppError(t('auth.resend_verification_failed', { message: translatedMsg }, lang), 400);
        }

        return {
            success: true,
            message: t('auth.resend_verification_success', {}, lang),
        };
    },
    async callbackVerifiedEmail(params: { token: string; email?: string }, lang: SupportedLanguage = 'id') {
        try {
            // 1. Verifikasi OTP/token dengan Supabase Auth
            let authResult = await supabase.auth.verifyOtp({
                type: 'email',
                token_hash: params.token,
            });

            // 2. Fallback: jika verifikasi menggunakan OTP 6-digit dan email
            if (authResult.error && params.email) {
                authResult = await supabase.auth.verifyOtp({
                    type: 'signup',
                    email: params.email,
                    token: params.token,
                });
            }

            if (authResult.error || !authResult.data.user) {
                throw new AppError(t('auth.verify_email_failed', { message: authResult.error?.message || 'Token tidak valid' }, lang), 400);
            }

            // Status verifikasi email (email_confirmed_at) otomatis di-update oleh Supabase Auth!

            return { success: true, message: t('auth.verify_email_success', {}, lang) };
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(t('auth.verify_email_failed', { message: error.message }, lang), 500);
        }
    },
    async authHashHandler(accessToken: string, refreshToken: string, lang: SupportedLanguage = 'id') {
        try {
            const { data: authData, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (error || !authData.user) {
                const rawMsg = error?.message;
                const translatedMsg = translateSupabaseError(rawMsg, lang) || rawMsg || 'Sesi tidak valid';
                throw new AppError(t('auth.verify_otp_failed', { message: translatedMsg }, lang), 400);
            }

            const user = authData.user;
            const fullName = user.user_metadata.full_name || user.user_metadata.name || "User";
            const phoneNumber = user.user_metadata.phone_number || user.phone || null;

            // 1. Cek apakah user sudah terdaftar di database lokal sebelumnya
            const existingUser = await db.orm.core_auth.User.where({ email: user.email! }).first();

            // 2. Sync/Upsert user ke database lokal core_auth.User
            const updatedUser = await db.orm.core_auth.User.upsert({
                create: {
                    id: user.id,
                    email: user.email!,
                    fullName: fullName,
                    passwordHash: "",
                    phoneNumber: phoneNumber ?? undefined,
                },
                update: {
                    fullName: fullName,
                },
                conflictOn: { email: user.email! },
            });

            const { isVerified } = checkUserVerification(user, existingUser);

            if (updatedUser.isDeleted) {
                throw new AppError(t('auth.account_disabled', {}, lang), 400);
            }

            // Langsung terbitkan JWT appToken untuk Google OAuth (Tanpa perlu langkah OTP tambahan)
            const appToken = jwt.sign(
                {
                    userId: updatedUser.id,
                    email: updatedUser.email,
                    phoneNumber: updatedUser.phoneNumber,
                },
                env.JWT_SECRET,
                { expiresIn: (env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'] }
            );

            const { passwordHash, ...userWithoutPassword } = updatedUser;

            return {
                isNewUser: !existingUser,
                requireOtp: false,
                user: userWithoutPassword,
                token: authData.session?.access_token || appToken,
                appToken,
                message: t('auth.login_success', {}, lang),
            };
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(t('auth.verify_otp_failed', { message: error.message || 'Unknown error' }, lang), 500);
        }
    },

    async forgotPassword(email: string, lang: SupportedLanguage = 'id') {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await db.orm.core_auth.User.where({ email: normalizedEmail }).first();

        if (user && !user.isDeleted) {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            const id = `PWD-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await pool.query(
                `INSERT INTO core_auth.password_resets (id, user_id, email, token_hash, expires_at)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id, user.id, normalizedEmail, tokenHash, expiresAt]
            );

            const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/${lang}/reset-password?token=${rawToken}`;
            await EmailService.sendPasswordResetEmail(normalizedEmail, resetUrl, user.fullName);
        }

        return {
            message:
                lang === 'en'
                    ? 'If the email is registered, a password reset link has been sent.'
                    : 'Jika email terdaftar, tautan reset password telah dikirim ke kotak masuk Anda.',
        };
    },

    async resetPassword(token: string, newPassword: string, lang: SupportedLanguage = 'id') {
        const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
        const resetRes = await pool.query(
            `SELECT id, user_id, email, expires_at, used_at
             FROM core_auth.password_resets
             WHERE token_hash = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [tokenHash]
        );

        if (resetRes.rows.length === 0) {
            throw new AppError(
                lang === 'en' ? 'Invalid or expired reset token.' : 'Token reset password tidak valid atau sudah kedaluwarsa.',
                400
            );
        }

        const record = resetRes.rows[0];
        if (record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
            throw new AppError(
                lang === 'en' ? 'Reset token has expired or already been used.' : 'Token reset password sudah digunakan atau kedaluwarsa.',
                400
            );
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            `UPDATE core_auth.users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE id = $2`,
            [passwordHash, record.user_id]
        );
        await pool.query(
            `UPDATE core_auth.password_resets SET used_at = NOW() WHERE id = $1`,
            [record.id]
        );

        const { error: resetSupaErr } = await supabase.auth.admin.updateUserById(record.user_id, { password: newPassword });
        if (resetSupaErr) {
            const listRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const matched = listRes.data?.users?.find(
                (u: any) => u.email?.toLowerCase() === String(record.email || '').toLowerCase()
            );
            if (matched) {
                await supabase.auth.admin.updateUserById(matched.id, { password: newPassword });
            }
        }

        return {
            message: lang === 'en' ? 'Password has been reset successfully.' : 'Password berhasil diperbarui. Silakan login kembali.',
        };
    },

    async changePassword(userId: string, currentPassword: string, newPassword: string, lang: SupportedLanguage = 'id') {
        const userRes = await pool.query(
            `SELECT id, email, "passwordHash" FROM core_auth.users WHERE id = $1 LIMIT 1`,
            [userId]
        );
        if (userRes.rows.length === 0) {
            throw new AppError(t('profile.user_not_found', {}, lang), 404);
        }

        const user = userRes.rows[0];
        if (user.passwordHash) {
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                throw new AppError(
                    lang === 'en' ? 'Current password is incorrect.' : 'Password saat ini tidak sesuai.',
                    400
                );
            }
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            `UPDATE core_auth.users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE id = $2`,
            [passwordHash, userId]
        );

        const { error: adminErr } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
        if (adminErr) {
            const listRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const matched = listRes.data?.users?.find(
                (u: any) => u.email?.toLowerCase() === String(user.email || '').toLowerCase()
            );
            if (matched) {
                const { error: retryErr } = await supabase.auth.admin.updateUserById(matched.id, { password: newPassword });
                if (retryErr) {
                    throw new AppError(
                        lang === 'en' ? 'Failed to sync password with auth provider.' : 'Gagal menyinkronkan password ke layanan autentikasi.',
                        500
                    );
                }
            }
        }

        return {
            message: lang === 'en' ? 'Password updated successfully.' : 'Password berhasil diubah.',
        };
    },

    async refreshSession(refreshToken: string, lang: SupportedLanguage = 'id') {
        if (!refreshToken || !refreshToken.trim()) {
            throw new AppError(
                lang === 'en' ? 'Refresh token is required.' : 'Sesi berakhir. Silakan login kembali.',
                401
            );
        }

        const tokenStr = refreshToken.trim();

        // 1. Coba verifikasi sebagai internal refresh JWT
        try {
            const decoded = jwt.verify(tokenStr, env.JWT_SECRET) as {
                userId?: string;
                email?: string;
                type?: string;
            };
            if (decoded?.userId) {
                const userRes = await pool.query(
                    `SELECT id, email, "fullName", "phoneNumber", "userType", "isActive", "isDeleted"
                     FROM core_auth.users WHERE id = $1 LIMIT 1`,
                    [decoded.userId]
                );
                if (userRes.rows.length > 0 && !userRes.rows[0].isDeleted && userRes.rows[0].isActive !== false) {
                    const user = userRes.rows[0];
                    const appToken = jwt.sign(
                        { userId: user.id, email: user.email, phoneNumber: user.phoneNumber },
                        env.JWT_SECRET,
                        { expiresIn: (env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'] }
                    );
                    const nextRefreshToken = jwt.sign(
                        { userId: user.id, email: user.email, type: 'refresh' },
                        env.JWT_SECRET,
                        { expiresIn: '7d' }
                    );
                    return {
                        user,
                        token: appToken,
                        appToken,
                        refreshToken: nextRefreshToken,
                    };
                }
            }
        } catch {
            // Lanjut ke Supabase refreshSession
        }

        // 2. Fallback: Refresh via Supabase Auth
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: tokenStr });
        if (error || !data?.session || !data?.user) {
            throw new AppError(
                lang === 'en' ? 'Session expired. Please sign in again.' : 'Sesi Anda telah berakhir. Silakan login kembali.',
                401
            );
        }

        const supaUser = data.user;
        const dbRes = await pool.query(
            `SELECT id, email, "fullName", "phoneNumber", "userType", "isActive", "isDeleted"
             FROM core_auth.users
             WHERE id = $1 OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))
             LIMIT 1`,
            [supaUser.id, supaUser.email || null]
        );
        const dbUser = dbRes.rows[0];
        if (!dbUser || dbUser.isDeleted || dbUser.isActive === false) {
            throw new AppError(
                lang === 'en' ? 'Account is inactive or not found.' : 'Akun tidak aktif atau tidak ditemukan.',
                401
            );
        }

        const appToken = jwt.sign(
            { userId: dbUser.id, email: dbUser.email, phoneNumber: dbUser.phoneNumber },
            env.JWT_SECRET,
            { expiresIn: (env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'] }
        );

        return {
            user: dbUser,
            token: data.session.access_token,
            appToken,
            refreshToken: data.session.refresh_token,
        };
    },
}


