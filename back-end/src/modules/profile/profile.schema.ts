import { z } from "zod";
import { zUUID, zIndonesianPhone, validateSchema } from "@/schemas/common.schema";
import { enumSupportedLanguage } from "@/i18n";

export const getProfileParamsSchema = z.object({
    id: zUUID,
});

export const getProfileQuerySchema = z.object({
    lang: z.enum(enumSupportedLanguage).optional(),
});

export const getProfileSchema = validateSchema({
    params: getProfileParamsSchema,
    querystring: getProfileQuerySchema,
});

export const updateProfileBodySchema = z.object({
    fullName: z.string().min(3, "auth.validation.full_name_min").optional(),
    phoneNumber: zIndonesianPhone.optional(),
    email: z.string().email("auth.validation.email_invalid").optional(),
    avatarUrl: z.string().url().optional().nullable(),
});

export const updateProfileSchema = validateSchema({
    params: getProfileParamsSchema,
    body: updateProfileBodySchema,
});

export const updateHniProfileBodySchema = z.preprocess((val: any) => {
    if (typeof val === 'object' && val !== null) {
        return {
            ...val,
            hniMemberId: val.hniMemberId || val.memberId,
            hniMemberName: val.hniMemberName || val.memberName,
        };
    }
    return val;
}, z.object({
    hniMemberId: z.string().min(1, "auth.validation.hni_member_id_min"),
    hniMemberName: z.string().min(3, "auth.validation.hni_member_name_min"),
    memberId: z.string().optional(),
    memberName: z.string().optional(),
    uplineName: z.string().optional(),
    rank: z.string().optional(),
    rankMarketing: z.string().optional(),
    isVerified: z.boolean().optional(),
}));

export const updateHniProfileSchema = validateSchema({
    params: getProfileParamsSchema,
    body: updateHniProfileBodySchema,
});

export const searchHNIProfileQuerySchema = z.object({
    noHandphone: z.string().optional(),
    keyword: z.string().optional(),
    searchType: z.enum(['name', 'nik', 'phone', 'id']).optional(),
    filterType: z.string().optional(),
    start: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
});

export const searchHNIProfileSchema = validateSchema({
    querystring: searchHNIProfileQuerySchema,
});

export const searchHniByIdBodySchema = z.object({
    code: z.string().min(1, "auth.validation.hni_member_id_min"),
    jual: z.string().optional().default("MLM"),
});

export const searchHniByIdSchema = validateSchema({
    body: searchHniByIdBodySchema,
});

export type GetProfileParams = z.infer<typeof getProfileParamsSchema>;
export type GetProfileQuery = z.infer<typeof getProfileQuerySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
export type UpdateHniProfileBody = z.infer<typeof updateHniProfileBodySchema>;

export type HNIProfileData = Omit<UpdateHniProfileBody, 'userId'>;
export type SearchHNIProfileQuery = z.infer<typeof searchHNIProfileQuerySchema>;
export type SearchHNIProfilePayload = SearchHNIProfileQuery;
export type SearchHniByIdBody = z.infer<typeof searchHniByIdBodySchema>;