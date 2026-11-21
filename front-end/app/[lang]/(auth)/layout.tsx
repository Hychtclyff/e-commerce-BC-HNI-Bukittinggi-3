import React from "react";
import { AuthLayout as LayoutAuth } from "@/modules/auth";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <LayoutAuth>{children}</LayoutAuth>;
}