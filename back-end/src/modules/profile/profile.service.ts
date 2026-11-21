import { db, pool } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";
import { HNIProfileData, SearchHNIProfilePayload } from "./profile.schema";
import { axiosClient, getRuntimeHsisAuth } from "@/config/axios";
import { storeService } from "../store/store.service";

export interface UpdateProfilePayload {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    avatarUrl?: string | null;
}

export const profileService = {
    async getProfile(userId: string, lang: SupportedLanguage = 'id') {
        try {
            const user = await db.orm.core_auth.User.where({ id: userId })
                .include('hniProfile')
                .include('addresses')
                .first();

            if (!user) {
                throw new AppError(t('profile.user_not_found', {}, lang), 404);
            }

            // Ambil data Kasbon B2B jika ada
            const creditProfile = await db.orm.b2b_credit.CreditProfile
                .where({ userId })
                .first();

            const { passwordHash, ...userWithoutPassword } = user;

            return {
                user: userWithoutPassword,
                hniProfile: user.hniProfile || null,
                addresses: user.addresses || [],
                creditProfile: creditProfile || null,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('profile.get_profile_failed', { message: error.message }, lang), 500);
        }
    },

    async updateProfile(userId: string, payload: UpdateProfilePayload, lang: SupportedLanguage = 'id') {
        try {
            const existingUser = await db.orm.core_auth.User.where({ id: userId }).first();
            if (!existingUser) {
                throw new AppError(t('profile.user_not_found', {}, lang), 404);
            }

            const updatedUser = await db.orm.core_auth.User
                .where({ id: userId })
                .update({
                    ...(payload.fullName ? { fullName: payload.fullName } : {}),
                    ...(payload.phoneNumber ? { phoneNumber: payload.phoneNumber } : {}),
                    ...(payload.email ? { email: payload.email } : {}),
                });

            if (!updatedUser) {
                throw new AppError(t('profile.user_not_found', {}, lang), 404);
            }

            if (payload.avatarUrl !== undefined) {
                await pool.query(
                    `UPDATE core_auth.users SET "avatarUrl" = $1 WHERE id = $2`,
                    [payload.avatarUrl, userId]
                );
            }

            const { passwordHash, ...userWithoutPassword } = updatedUser;
            return {
                ...userWithoutPassword,
                ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('profile.update_profile_failed', { message: error.message }, lang), 500);
        }
    },

    async saveHniProfile(userId: string, hniProfile: HNIProfileData, lang: SupportedLanguage = 'id') {
        try {
            const existingUser = await db.orm.core_auth.User.where({ id: userId }).first();
            if (!existingUser) {
                throw new AppError(t('profile.user_not_found', {}, lang), 404);
            }

            const isVerified = hniProfile.isVerified !== undefined ? hniProfile.isVerified : true;

            const existingHniProfile = await db.orm.core_auth.HNIProfile.where({ userId }).first();
            if (!existingHniProfile) {
                const createdHniProfile = await db.orm.core_auth.HNIProfile.create({
                    userId,
                    ...hniProfile,
                    isVerified,
                });
                if (isVerified) {
                    await db.orm.core_auth.User.where({ id: userId }).update({ userType: 'agen' });
                    if (hniProfile.hniMemberId) {
                        await pool.query(
                            `UPDATE store.agents
                             SET linked_user_id = $1, is_registered_user = true
                             WHERE hni_id = $2 OR LTRIM(hni_id, '0') = LTRIM($2, '0')`,
                            [userId, String(hniProfile.hniMemberId).trim()]
                        ).catch(() => {});
                    }
                }
                return createdHniProfile;
            } else {
                const updatedHniProfile = await db.orm.core_auth.HNIProfile
                    .where({ id: existingHniProfile.id })
                    .update({
                        ...hniProfile,
                        isVerified,
                        isDeleted: false,
                    });
                if (isVerified) {
                    await db.orm.core_auth.User.where({ id: userId }).update({ userType: 'agen' });
                    if (hniProfile.hniMemberId) {
                        await pool.query(
                            `UPDATE store.agents
                             SET linked_user_id = $1, is_registered_user = true
                             WHERE hni_id = $2 OR LTRIM(hni_id, '0') = LTRIM($2, '0')`,
                            [userId, String(hniProfile.hniMemberId).trim()]
                        ).catch(() => {});
                    }
                }
                return updatedHniProfile;
            }
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('profile.save_hni_profile_failed', { message: error.message }, lang), 500);
        }
    },

    /**
     * Mencari profil member HNI berdasarkan ID Agen:
     * 1. Cek database lokal (store.agents / core_auth.hni_profiles) terlebih dahulu.
     * 2. Jika belum ada di DB lokal (misal pertama kali belanja), baru hit API HSIS (/orderhm/customer)
     *    dan simpan hasilnya ke store.agents untuk pencarian berikutnya.
     */
    async searchHniMemberById(payload: { code: string; jual?: string }, lang: SupportedLanguage = 'id') {
        try {
            const code = (payload.code || '').trim();
            if (!code) {
                throw new AppError(t('profile.hni_member_id_required', {}, lang), 400);
            }

            // 1. Cek DB lokal store.agents terlebih dahulu
            const localAgentRes = await pool.query(
                `SELECT id, name, hni_id, phone, rank, tier, status
                 FROM store.agents
                 WHERE hni_id = $1 OR LTRIM(hni_id, '0') = LTRIM($1, '0')
                 LIMIT 1`,
                [code]
            );
            if (localAgentRes.rows.length > 0) {
                const a = localAgentRes.rows[0];
                return {
                    success: true,
                    source: 'LOCAL_DB',
                    message: 'Data member ditemukan di database lokal Tijarah',
                    data: {
                        ci: a.hni_id || code,
                        cn: a.name || '',
                        ds: a.tier || 'AB',
                        ts: a.rank || 'A',
                        dsts: [a.tier, a.rank].filter(Boolean).join(' - '),
                        t: a.phone && a.phone !== '-' ? a.phone : '',
                        status: a.status,
                    },
                };
            }

            // 1b. Cek core_auth.hni_profiles jika sudah pernah tersimpan di profil user
            const localHpRes = await pool.query(
                `SELECT hp."hniMemberId", hp."hniMemberName", hp.rank, u."phoneNumber"
                 FROM core_auth.hni_profiles hp
                 LEFT JOIN core_auth.users u ON u.id = hp."userId"
                 WHERE hp."hniMemberId" = $1 OR LTRIM(hp."hniMemberId", '0') = LTRIM($1, '0')
                 LIMIT 1`,
                [code]
            );
            if (localHpRes.rows.length > 0) {
                const hp = localHpRes.rows[0];
                return {
                    success: true,
                    source: 'LOCAL_DB',
                    message: 'Data member ditemukan di database profil Tijarah',
                    data: {
                        ci: hp.hniMemberId || code,
                        cn: hp.hniMemberName || '',
                        ds: 'AB',
                        ts: hp.rank || 'A',
                        dsts: `AB - ${hp.rank || 'A'}`,
                        t: hp.phoneNumber || '',
                    },
                };
            }

            // 2. Belum ditemukan di DB lokal -> hidrasi token aktif HSIS & hit endpoint HSIS
            await storeService.getHsisSession();
            const { token } = getRuntimeHsisAuth();
            const headers: Record<string, string> = {};
            if (token) {
                headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            }

            const res = await axiosClient.post('/orderhm/customer', {
                code,
                jual: payload.jual || 'MLM',
            }, { headers });

            const data = res.data?.data;
            if (!data) {
                throw new AppError(`Member HNI dengan ID '${code}' tidak ditemukan di database lokal maupun HSIS`, 404);
            }

            // Simpan ke store.agents agar pencarian berikutnya langsung dari DB lokal
            const resolvedHniId = String(data.ci || code).trim();
            const resolvedName = String(data.cn || `Mitra ${resolvedHniId}`).trim();
            const resolvedPhone = String(data.t || '-').trim() || '-';
            await pool.query(
                `INSERT INTO store.agents (id, name, hni_id, phone, rank, tier, status, role, source_channel, is_registered_user)
                 VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', 'AGEN_HNI', 'HSIS_SEARCH', false)
                 ON CONFLICT (id) DO UPDATE SET
                   name = EXCLUDED.name,
                   rank = EXCLUDED.rank,
                   tier = EXCLUDED.tier`,
                [
                    `AGT-HSIS-${resolvedHniId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
                    resolvedName,
                    resolvedHniId,
                    resolvedPhone,
                    String(data.ts || 'AB').trim(),
                    String(data.ds || 'AB').trim(),
                ]
            ).catch(() => {});

            return {
                success: true,
                source: 'HSIS_API',
                message: res.data?.message || 'Data member berhasil ditemukan dari HSIS',
                data,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            const status = error?.response?.status || 502;
            const msg = error?.response?.data?.message || error.message || '';
            throw new AppError(msg || `Gagal mencari member HNI ID '${payload.code}'`, status);
        }
    },

    /**
     * Mencari profil member HNI melalui API live HSIS (https://hsis.hni.net).
     * Payload dipetakan ke format HSIS:
     *   NM = pencarian by nama
     *   MP = pencarian by nomor HP
     *   IN = pencarian by NIK
     *   ID = pencarian by ID agen via customer endpoint
     */
    async searchHNIProfile(payload: SearchHNIProfilePayload, lang: SupportedLanguage = 'id') {
        try {
            const keyword = (payload.keyword || payload.noHandphone || '').trim();
            if (!keyword) {
                return { success: true, message: '', data: { total: 0, rows: [] } };
            }

            // Jika searchType adalah 'id' atau payload meminta pencarian ID
            if (payload.searchType === 'id' || payload.filterType === 'ID') {
                const idResult = await this.searchHniMemberById({ code: keyword }, lang);
                const item = idResult.data;
                const mappedRow = {
                    ci: item.ci ?? keyword,
                    cn: item.cn ?? '',
                    ui: item.ia ?? '',
                    un: item.np ?? item.un ?? '',
                    ds: item.ds ?? '',
                    ts: item.ts ?? '',
                    dsts: item.dsts ?? `${item.ds ?? ''} - ${item.ts ?? ''}`.trim(),
                    mp: item.t ?? '',
                    addr: item.addr ?? '',
                    raw: item,
                };
                return {
                    success: true,
                    message: idResult.message,
                    data: {
                        total: 1,
                        rows: [mappedRow],
                    },
                };
            }

            // Deteksi tipe input berdasarkan pilihan eksplisit atau format regex
            const numeric = keyword.replace(/\D/g, '');
            let filterType = 'NM';

            if (payload.searchType === 'nik' || payload.filterType === 'IN') {
                filterType = 'IN';
            } else if (payload.searchType === 'phone' || payload.filterType === 'MP') {
                filterType = 'MP';
            } else if (payload.searchType === 'name' || payload.filterType === 'NM') {
                filterType = 'NM';
            } else {
                // Auto-detect fallback
                if (/^\d{16}$/.test(numeric)) {
                    filterType = 'IN';
                } else if (/^\+?\d{8,15}$/.test(numeric)) {
                    filterType = 'MP';
                }
            }

            const hsPayload = {
                start: payload.start ?? 0,
                limit: payload.limit ?? 20,
                c: keyword,
                k: 'MLM',
                f: filterType,
                l: filterType === 'IN' ? 14 : filterType === 'MP' ? 6 : 3,
            };

            await storeService.getHsisSession();
            const { token } = getRuntimeHsisAuth();
            const headers: Record<string, string> = {};
            if (token) {
                headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            }

            const res = await axiosClient.post('/orderhm/customer-search', hsPayload, { headers });

            const rawRows = res.data?.data?.rows ?? [];
            const mappedRows = (Array.isArray(rawRows) ? rawRows : []).map((row: any) => ({
                ci: row.ci ?? '',
                cn: row.cn ?? '',
                ui: row.ui ?? '',
                un: row.un ?? '',
                ds: row.ds ?? '',
                ts: row.ts ?? '',
                mp: row.mp ?? '',
                ic: row.ic ?? '',
            }));

            return {
                success: true,
                message: res.data?.message || '',
                data: {
                    total: res.data?.data?.total ?? mappedRows.length,
                    rows: mappedRows,
                },
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            const msg = error?.response?.data?.message || error.message || '';
            throw new AppError(t('profile.search_hni_failed', { message: msg }, lang), 502);
        }
    }
};