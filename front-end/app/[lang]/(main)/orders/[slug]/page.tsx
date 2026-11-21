import React from "react";
import { notFound } from "next/navigation";
import { OrderDetailView } from "./OrderDetailView";

interface OrderDetailPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { lang, slug } = await params;

  if (!slug) {
    notFound();
  }

  return <OrderDetailView slug={slug} lang={lang} />;
}
