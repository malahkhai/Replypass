import { AdminAction } from "@/components/admin-actions";
import { AdminHeading, AdminTable, Status } from "@/components/admin-ui";
import { adminUsers } from "@/lib/admin/repository";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q || "";
  const users = await adminUsers(q);
  return <>
    <AdminHeading eyebrow="ACCESS" title="Users" description="Find an account, review its status and control access without deleting financial history." />
    <form className="admin-search"><input name="q" defaultValue={q} placeholder="Username, email or user ID" aria-label="Search users" /><button>Search</button></form>
    <AdminTable head={["User", "Role", "Access", "Joined", "Action"]}>
      {users.map(user => <tr key={user.id}>
        <td><strong>{user.display_name}</strong><small>{user.email || user.id}</small></td>
        <td>{user.role}</td>
        <td><Status tone={user.account_status === "active" ? "good" : "bad"}>{user.account_status}</Status></td>
        <td>{new Date(user.created_at).toLocaleDateString("en-GB")}</td>
        <td>{user.account_status === "active" ? <AdminAction endpoint={`/api/admin/users/${user.id}`} action="suspend" label="Suspend" variant="danger" reason confirm={`Suspend ${user.display_name}? Paid activity will stop.`} /> : <AdminAction endpoint={`/api/admin/users/${user.id}`} action="unsuspend" label="Unsuspend" confirm={`Restore ${user.display_name}'s account?`} />}</td>
      </tr>)}
    </AdminTable>
  </>;
}
