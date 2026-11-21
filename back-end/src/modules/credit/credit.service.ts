import { db } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";
import { ApplyCreditBody, ApproveCreditApplicationBody, RejectCreditApplicationBody } from "./credit.schema";

export const creditService = {
    async getCreditAccount(userId: string, lang: SupportedLanguage = 'id') {
        try {
            const creditAccount = await db.orm.b2b_credit.CreditProfile
                .where({ userId })
                .first();

            // Jika belum ada akun kasbon di DB, kembalikan objek status UNREGISTERED
            if (!creditAccount) {
                return {
                    id: "",
                    userId,
                    status: "UNREGISTERED",
                    creditLimit: 2000000,
                    currentBalance: 2000000,
                    usedBalance: 0,
                    isLocked: false,
                    dueDate: null,
                    postingMode: "STRICT_HOLD",
                    appliedAt: null,
                    approvedAt: null,
                    rejectedAt: null,
                    rejectionReason: null,
                };
            }

            return creditAccount;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('credit.get_account_failed', { message: error.message }, lang), 500);
        }
    },

    async applyCredit(userId: string, payload: ApplyCreditBody, lang: SupportedLanguage = 'id') {
        try {
            if (!payload.agreementAccepted) {
                throw new AppError(t('credit.agreement_required', {}, lang), 400);
            }

            const user = await db.orm.core_auth.User
                .where({ id: userId })
                .include('hniProfile')
                .first();

            if (!user) {
                throw new AppError(t('profile.user_not_found', {}, lang), 404);
            }

            const requestedLimit = payload.requestedLimit || 2000000;
            const nowIso = new Date().toISOString();

            let creditAccount = await db.orm.b2b_credit.CreditProfile
                .where({ userId })
                .first();

            if (!creditAccount) {
                creditAccount = await db.orm.b2b_credit.CreditProfile.create({
                    userId,
                    status: "PENDING_APPROVAL",
                    creditLimit: requestedLimit,
                    currentBalance: requestedLimit,
                    usedBalance: 0,
                    isLocked: true,
                    postingMode: "STRICT_HOLD",
                    appliedAt: nowIso,
                });
            } else {
                creditAccount = await db.orm.b2b_credit.CreditProfile
                    .where({ id: creditAccount.id })
                    .update({
                        status: "PENDING_APPROVAL",
                        creditLimit: requestedLimit,
                        currentBalance: requestedLimit,
                        isLocked: true,
                        appliedAt: nowIso,
                        rejectionReason: null,
                    });
            }

            if (!creditAccount) {
                throw new AppError(t('credit.apply_failed', { message: 'Database update error' }, lang), 500);
            }

            // Simpan log histori pengajuan di b2b_credit_applications
            await db.orm.b2b_credit.CreditApplication.create({
                creditProfileId: creditAccount.id,
                userId,
                requestedLimit,
                purpose: payload.purpose || "Restock Rutin Produk HNI",
                alternativePhone: payload.alternativePhone || user.phoneNumber || undefined,
                agreementAccepted: true,
                status: "PENDING_APPROVAL",
            });

            return creditAccount;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('credit.apply_failed', { message: error.message }, lang), 500);
        }
    },

    async getCreditLedger(userId: string, lang: SupportedLanguage = 'id') {
        try {
            const creditAccount = await db.orm.b2b_credit.CreditProfile
                .where({ userId })
                .first();

            if (!creditAccount) {
                return [];
            }

            const entries = await db.orm.b2b_credit.CreditLedgerEntry
                .where({ creditProfileId: creditAccount.id })
                .orderBy((e) => e.createdAt.desc())
                .all();

            return entries.map(entry => ({
                ...entry,
                items: entry.itemsJson ? JSON.parse(entry.itemsJson) : [],
            }));
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('credit.get_ledger_failed', { message: error.message }, lang), 500);
        }
    },

    // --- ADMIN METHODS ---

    async getApplications(query: { status?: string; page?: number; limit?: number } = {}, lang: SupportedLanguage = 'id') {
        try {
            const targetStatus = query.status || "PENDING_APPROVAL";

            const applications = await db.orm.b2b_credit.CreditApplication
                .where({ status: targetStatus })
                .orderBy((a) => a.createdAt.desc())
                .all();

            // Enrich dengan data user dan profile HNI
            const enrichedList = await Promise.all(
                applications.map(async (app) => {
                    const user = await db.orm.core_auth.User
                        .where({ id: app.userId })
                        .include('hniProfile')
                        .first();

                    return {
                        ...app,
                        user: user ? {
                            id: user.id,
                            fullName: user.fullName,
                            phoneNumber: user.phoneNumber,
                            email: user.email,
                            hniProfile: user.hniProfile || null,
                        } : null,
                    };
                })
            );

            return enrichedList;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('credit.get_applications_failed', { message: error.message }, lang), 500);
        }
    },

    async approveApplication(targetId: string, payload: ApproveCreditApplicationBody, adminUserId: string = "ADMIN", lang: SupportedLanguage = 'id') {
        try {
            const nowIso = new Date().toISOString();
            const approvedLimit = payload.approvedLimit || 2000000;

            // Cari via application ID atau userId / creditProfileId
            let application = await db.orm.b2b_credit.CreditApplication
                .where({ id: targetId })
                .first();

            let profileId = application?.creditProfileId;

            if (!application) {
                const profile = await db.orm.b2b_credit.CreditProfile
                    .where({ id: targetId })
                    .first();
                if (profile) {
                    profileId = profile.id;
                }
            }

            if (!profileId) {
                throw new AppError(t('credit.application_not_found', {}, lang), 404);
            }

            // Update credit profile menjadi ACTIVE & unlock
            const updatedProfile = await db.orm.b2b_credit.CreditProfile
                .where({ id: profileId })
                .update({
                    status: "ACTIVE",
                    isLocked: false,
                    creditLimit: approvedLimit,
                    currentBalance: approvedLimit,
                    approvedAt: nowIso,
                    approvedBy: adminUserId,
                    rejectionReason: null,
                });

            // Update status di histori aplikasi jika ada
            if (application) {
                await db.orm.b2b_credit.CreditApplication
                    .where({ id: application.id })
                    .update({
                        status: "APPROVED",
                        reviewedBy: adminUserId,
                        reviewedAt: nowIso,
                        adminNotes: payload.notes || "Disetujui oleh admin",
                    });
            }

            return updatedProfile;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('credit.approve_failed', { message: error.message }, lang), 500);
        }
    },

    async rejectApplication(targetId: string, payload: RejectCreditApplicationBody, adminUserId: string = "ADMIN", lang: SupportedLanguage = 'id') {
        try {
            const nowIso = new Date().toISOString();

            let application = await db.orm.b2b_credit.CreditApplication
                .where({ id: targetId })
                .first();

            let profileId = application?.creditProfileId;

            if (!application) {
                const profile = await db.orm.b2b_credit.CreditProfile
                    .where({ id: targetId })
                    .first();
                if (profile) {
                    profileId = profile.id;
                }
            }

            if (!profileId) {
                throw new AppError(t('credit.application_not_found', {}, lang), 404);
            }

            const updatedProfile = await db.orm.b2b_credit.CreditProfile
                .where({ id: profileId })
                .update({
                    status: "REJECTED",
                    isLocked: true,
                    rejectedAt: nowIso,
                    rejectionReason: payload.rejectionReason,
                });

            if (application) {
                await db.orm.b2b_credit.CreditApplication
                    .where({ id: application.id })
                    .update({
                        status: "REJECTED",
                        reviewedBy: adminUserId,
                        reviewedAt: nowIso,
                        adminNotes: payload.rejectionReason,
                    });
            }

            return updatedProfile;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('credit.reject_failed', { message: error.message }, lang), 500);
        }
    }
};
