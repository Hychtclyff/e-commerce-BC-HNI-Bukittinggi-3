import { responseUtil } from "@/utils/response";
import { AppError } from "@/utils/AppError";
import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service";
import { typePayloadLog, typePayloadReg } from "./auth.type";
import { env } from "@/config/env";
import { getLanguageFromRequest, t } from "@/i18n";
import jwt from "jsonwebtoken";
import { supabase } from "@/plugins/supabase";
import { profileService } from "../profile/profile.service";

export const authController = {
    async register(request: FastifyRequest, reply: FastifyReply) {
        const payload = request.body as typePayloadReg;
        const lang = getLanguageFromRequest(request);

        try {
            // Memanggil layer service
            const data = await authService.register(payload, lang);

            // Response 201 Created
            return responseUtil.created({
                reply,
                message: t('auth.register_success', {}, lang),
                data: {
                    id: data.id,
                    fullName: data.fullName,
                    phoneNumber: data.phoneNumber,
                    email: data.email,
                },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    async login(request: FastifyRequest, reply: FastifyReply) {
        const payload = request.body as typePayloadLog;
        const lang = getLanguageFromRequest(request);

        try {
            const data = await authService.login(payload, lang);

            return responseUtil.success({
                reply,
                message: t('auth.login_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    // sign with google
    async signWithGoogle(request: FastifyRequest, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);

        try {
            const data = await authService.signWithGoogle(request.body, lang);

            return responseUtil.success({
                reply,
                message: t('auth.login_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    // get google oauth url
    async getGoogleOAuthUrl(request: FastifyRequest, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const query = request.query as any;

        try {
            const data = await authService.getGoogleOAuthUrl(query?.redirectTo, lang);

            return responseUtil.success({
                reply,
                message: 'OAuth URL Google berhasil dibuat.',
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    async verifyOTP(request: FastifyRequest, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const body = request.body as { email: string; token: string; type?: 'signup' | 'email_change' | 'email' };

        try {
            const data = await authService.handleVerifyOTP(body, lang);

            return responseUtil.success({
                reply,
                message: data.message || t('auth.verify_otp_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    async resendOTP(request: FastifyRequest, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const body = request.body as { email: string; type?: 'signup' | 'email_change' };

        try {
            const data = await authService.resendOTP(body.email, body.type || 'signup', lang);

            return responseUtil.success({
                reply,
                message: data.message,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    async exchangeCode(request: FastifyRequest, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const body = request.body as { code: string };

        try {
            const data = await authService.exchangeCode(body.code, lang);

            return responseUtil.success({
                reply,
                message: data.message || t('auth.login_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    async authHashCode(request: FastifyRequest, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const body = request.body as { accessToken: string; refreshToken: string };

        try {
            const data = await authService.authHashHandler(body.accessToken, body.refreshToken, lang);

            return responseUtil.success({
                reply,
                message: data.message,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    async getProfile(request: FastifyRequest, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return responseUtil.unauthorized(reply, t('common.unauthorized', {}, lang));
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        let userId: string | null = null;

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as any;
            userId = decoded.userId || decoded.sub || decoded.id;
        } catch {
            try {
                const { data: supaUser } = await supabase.auth.getUser(token);
                userId = supaUser?.user?.id || null;
            } catch {
                userId = null;
            }
        }

        if (!userId) {
            return responseUtil.unauthorized(reply, t('common.unauthorized', {}, lang));
        }

        try {
            const data = await profileService.getProfile(userId, lang);

            return responseUtil.success({
                reply,
                message: t('profile.get_profile_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    async updateProfile(request: FastifyRequest, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return responseUtil.unauthorized(reply, t('common.unauthorized', {}, lang));
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        let userId: string | null = null;

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as any;
            userId = decoded.userId || decoded.sub || decoded.id;
        } catch {
            try {
                const { data: supaUser } = await supabase.auth.getUser(token);
                userId = supaUser?.user?.id || null;
            } catch {
                userId = null;
            }
        }

        if (!userId) {
            return responseUtil.unauthorized(reply, t('common.unauthorized', {}, lang));
        }

        try {
            const data = await profileService.updateProfile(userId, request.body as any, lang);

            return responseUtil.success({
                reply,
                message: t('profile.update_profile_success', {}, lang),
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                return responseUtil.appError(reply, error);
            }
            throw error;
        }
    },

    async forgotPassword(request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        try {
            const data = await authService.forgotPassword(request.body.email, lang);
            return responseUtil.success({ reply, message: data.message, data });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(reply, error);
            throw error;
        }
    },

    async resetPassword(request: FastifyRequest<{ Body: { token: string; newPassword: string } }>, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        try {
            const data = await authService.resetPassword(request.body.token, request.body.newPassword, lang);
            return responseUtil.success({ reply, message: data.message, data });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(reply, error);
            throw error;
        }
    },

    async changePassword(request: FastifyRequest<{ Body: { currentPassword: string; newPassword: string } }>, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const userId = (request as any).user?.id;
        if (!userId) {
            return responseUtil.unauthorized(reply, t('common.unauthorized', {}, lang));
        }
        try {
            const data = await authService.changePassword(
                userId,
                request.body.currentPassword,
                request.body.newPassword,
                lang
            );
            return responseUtil.success({ reply, message: data.message, data });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(reply, error);
            throw error;
        }
    },

    async refresh(request: FastifyRequest<{ Body: { refreshToken?: string } }>, reply: FastifyReply) {
        const lang = getLanguageFromRequest(request);
        const refreshToken =
            request.body?.refreshToken ||
            (request.headers['x-refresh-token'] as string) ||
            '';
        try {
            const data = await authService.refreshSession(refreshToken, lang);
            return responseUtil.success({
                reply,
                message: lang === 'en' ? 'Session refreshed.' : 'Sesi berhasil diperbarui.',
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) return responseUtil.appError(reply, error);
            throw error;
        }
    },
};





