import React from "react";

export default async function StoreLayout({
    children,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    return (
        <div className="w-full min-h-screen bg-canvas text-text-primary flex flex-col antialiased">
            <main className="flex-1 w-full flex flex-col">
                {children}
            </main>
        </div>
    );
}
