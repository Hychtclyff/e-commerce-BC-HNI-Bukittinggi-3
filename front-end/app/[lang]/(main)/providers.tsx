"use client";

import * as React from "react";
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// Jika HeroUIProvider merah, ganti baris ini:
import { I18nProvider, ToastProvider } from "@heroui/react";
import { HeroUIProvider } from "@heroui/system";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalLoginModal } from "@/components/molecules/states/GlobalLoginModal";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: Omit<ThemeProviderProps, "children">;
  lang: string;
  messages?: AbstractIntlMessages;
}

export function Providers({ children, themeProps, lang, messages }: ProvidersProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={lang} messages={messages} timeZone="Asia/Jakarta">
        <NextThemesProvider {...themeProps}>
          <HeroUIProvider>
            <I18nProvider locale={lang}>
              <ToastProvider placement="top end" />
              <GlobalLoginModal />
              {children}
            </I18nProvider>
          </HeroUIProvider>
        </NextThemesProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
} 