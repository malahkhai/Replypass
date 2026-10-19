import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorProfile } from "@/components/creator-profile";
import { exampleProfiles, findExampleProfile } from "@/lib/creators/example-profiles";

export function generateStaticParams() {
  return exampleProfiles.map(({ slug }) => ({ type: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const example = findExampleProfile((await params).type);
  return {
    title: example ? `${example.label} profile example` : "Example not found",
    description: "Explore an illustrative ReplyPass creator page. This fictional profile does not accept payments or messages.",
    robots: { index: false, follow: false },
  };
}

export default async function ExamplePage({ params }: { params: Promise<{ type: string }> }) {
  const example = findExampleProfile((await params).type);
  if (!example) notFound();

  return <>
    <div className="example-profile-notice">
      <div>
        <strong>{example.label} page example</strong>
        <span>Fictional creator · Illustrative prices · No messages or payments</span>
      </div>
      <Link href="/signup?next=%2Fcreator%2Fapply">Create your page <span aria-hidden="true">→</span></Link>
    </div>
    <CreatorProfile
      creator={example.creator}
      preview
      vipPlan={{
        id: `example-${example.slug}`,
        creatorId: example.creator.id,
        name: example.slug === "musician" ? "Luna’s inner circle" : "Nico’s after-hours",
        description: "Private posts and behind-the-scenes updates from the creator.",
        benefits: ["Private posts", "Creator updates"],
        amountCents: example.creator.vip!.cents,
        currency: "eur",
        enabled: true,
      }}
    />
  </>;
}
