import { redirect } from "next/navigation";

export default async function ShopProductRedirect({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  redirect(`/${lang}/products/${id}`);
}
