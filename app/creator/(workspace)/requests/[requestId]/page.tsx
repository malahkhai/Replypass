import { RequestDetailPage } from "@/components/creator-workspace";
export const metadata = { title: "Request details", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  return <RequestDetailPage requestId={(await params).requestId}/>;
}
