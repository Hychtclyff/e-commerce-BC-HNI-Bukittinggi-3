import { z } from "zod";
import {
    getProfileParamsSchema,
    getProfileQuerySchema,
    updateProfileBodySchema,
    updateHniProfileBodySchema,
    searchHNIProfileQuerySchema,
} from "./profile.schema";

export type GetProfileParams = z.infer<typeof getProfileParamsSchema>;
export type GetProfileQuery = z.infer<typeof getProfileQuerySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
export type UpdateHniProfileBody = z.infer<typeof updateHniProfileBodySchema>;
export type HNIProfileData = Omit<UpdateHniProfileBody, "userId">;
export type SearchHNIProfileQuery = z.infer<typeof searchHNIProfileQuerySchema>;

export interface UserProfileResponse {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    hniProfile?: {
        hniMemberId: string;
        hniMemberName: string;
        uplineName?: string;
        rank?: string;
        rankMarketing?: string;
        isVerified?: boolean;
    } | null;
}
