import { db } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";

export interface CreateAddressPayload {
    userId: string;
    recipientName: string;
    phoneNumber: string;
    fullAddress: string;
    district: string;
    city: string;
    province?: string;
    postalCode?: string;
    isPrimary?: boolean;
}

export interface UpdateAddressPayload extends Partial<CreateAddressPayload> {}

export const addressService = {
    async getAddresses(userId: string, lang: SupportedLanguage = 'id') {
        try {
            return await db.orm.core_auth.Address
                .where({ userId })
                .all();
        } catch (error: any) {
            throw new AppError(t('addresses.get_addresses_failed', { message: error.message }, lang), 500);
        }
    },

    async createAddress(payload: CreateAddressPayload, lang: SupportedLanguage = 'id') {
        try {
            if (payload.isPrimary) {
                const userAddresses = await db.orm.core_auth.Address.where({ userId: payload.userId }).all();
                for (const addr of userAddresses) {
                    if (addr.isPrimary) {
                        await db.orm.core_auth.Address.where({ id: addr.id }).update({ isPrimary: false });
                    }
                }
            }

            return await db.orm.core_auth.Address.create({
                userId: payload.userId,
                recipientName: payload.recipientName,
                phoneNumber: payload.phoneNumber,
                fullAddress: payload.fullAddress,
                district: payload.district,
                city: payload.city,
                province: payload.province || "Sumatera Barat",
                postalCode: payload.postalCode,
                isPrimary: payload.isPrimary ?? false,
            });
        } catch (error: any) {
            throw new AppError(t('addresses.create_address_failed', { message: error.message }, lang), 500);
        }
    },

    async updateAddress(addressId: string, payload: UpdateAddressPayload, lang: SupportedLanguage = 'id') {
        try {
            const existing = await db.orm.core_auth.Address.where({ id: addressId }).first();
            if (!existing) {
                throw new AppError(t('addresses.address_not_found', {}, lang), 404);
            }

            if (payload.isPrimary && existing.userId) {
                const userAddresses = await db.orm.core_auth.Address.where({ userId: existing.userId }).all();
                for (const addr of userAddresses) {
                    if (addr.isPrimary && addr.id !== addressId) {
                        await db.orm.core_auth.Address.where({ id: addr.id }).update({ isPrimary: false });
                    }
                }
            }

            return await db.orm.core_auth.Address.where({ id: addressId }).update(payload);
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('addresses.update_address_failed', { message: error.message }, lang), 500);
        }
    },

    async deleteAddress(addressId: string, lang: SupportedLanguage = 'id') {
        try {
            const existing = await db.orm.core_auth.Address.where({ id: addressId }).first();
            if (!existing) {
                throw new AppError(t('addresses.address_not_found', {}, lang), 404);
            }

            await db.orm.core_auth.Address.where({ id: addressId }).delete();
            return { id: addressId };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('addresses.delete_address_failed', { message: error.message }, lang), 500);
        }
    },

    async setPrimaryAddress(addressId: string, lang: SupportedLanguage = 'id') {
        try {
            const existing = await db.orm.core_auth.Address.where({ id: addressId }).first();
            if (!existing) {
                throw new AppError(t('addresses.address_not_found', {}, lang), 404);
            }

            const userAddresses = await db.orm.core_auth.Address.where({ userId: existing.userId }).all();
            for (const addr of userAddresses) {
                await db.orm.core_auth.Address.where({ id: addr.id }).update({ isPrimary: addr.id === addressId });
            }

            return await db.orm.core_auth.Address.where({ id: addressId }).first();
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(t('addresses.set_primary_failed', { message: error.message }, lang), 500);
        }
    }
};
