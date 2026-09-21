import { siteConfig } from "@/lib/site";

export type LegalSection = { title: string; paragraphs?: string[]; bullets?: string[] };

export function LegalPage({ title, summary, sections }: { title: string; summary: string; sections: LegalSection[] }) {
  return (
    <main id="main" className="draft-policy legal-policy">
      <p className="eyebrow">{siteConfig.name} · Trust & community</p>
      <h1>{title}</h1>
      <p className="legal-updated">Last updated: 21 September 2026</p>
      <p className="legal-summary">{summary}</p>
      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
        </section>
      ))}
      <p className="legal-contact">Questions or notices: <a href="mailto:info@getreplypass.com">info@getreplypass.com</a>.</p>
    </main>
  );
}
