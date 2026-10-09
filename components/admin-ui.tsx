import { Children } from "react";

export function AdminHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="admin-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}

export function AdminEmpty({ children }: { children: React.ReactNode }) {
  return <div className="admin-empty"><strong>Nothing needs attention.</strong><p>{children}</p></div>;
}

export function AdminTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  const rows = Children.toArray(children);
  return <div className="admin-table-wrap" role="region" aria-label="Recent records" tabIndex={0}>
    <div className="admin-table-toolbar"><strong>Recent records</strong><span>{rows.length} shown · Scroll sideways to see all columns</span></div>
    <table className="admin-table"><thead><tr>{head.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.length ? rows : <tr><td className="admin-table-empty" colSpan={head.length}>No records to show.</td></tr>}</tbody></table>
  </div>;
}

export function Status({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return <span className={`admin-status ${tone}`}>{children}</span>;
}
