import { SubscribersPage } from "@/components/creator-workspace";
import Link from "next/link";
export const metadata = { title: "Subscribers" };
export default function Page() {
  return <><SubscribersPage /><Link className="button button-secondary" href="/creator/vip">Manage VIP and private posts</Link></>;
}
