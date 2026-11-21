import { Suspense } from "react";
import { VerifyEmailForm } from "./VerifyEmailForm";

export const VerifyEmailPage = () => {
    return (
        <Suspense fallback={null}>
            <VerifyEmailForm />
        </Suspense>
    );
};

export const VerifyEmail = VerifyEmailPage;
export default VerifyEmailPage;
