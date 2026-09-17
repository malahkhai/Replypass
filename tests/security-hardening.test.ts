import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
test("admin route authorization is server-side and role-bound",()=>{
  const layout=read("app/admin/layout.tsx");
  assert.match(layout,/requireAdmin/);
  assert.match(read("lib/auth/session.ts"),/roles\.includes\(viewer\.role\)/);
  assert.match(read("app/api/admin/payments/[id]/refund/route.ts"),/viewer\.role !== "admin"/);
});
test("suspension and deletion stop new financial activity",()=>{
  assert.match(read("lib/stripe/service.ts"),/account_status/);
  assert.match(read("lib/vip/server.ts"),/account_status/);
  assert.match(read("app/api/account/delete/route.ts"),/deletion_requested/);
  assert.match(read("supabase/migrations/202609150001_launch_hardening.sql"),/profiles_account_status_idx/);
});
test("private delivery routes check authenticated ownership and no-store responses",()=>{
  for(const path of ["app/api/vip/media/[id]/route.ts","app/api/account/media/[id]/route.ts"]){const source=read(path);assert.match(source,/getViewer/);assert.match(source,/Cache-Control/);}
  assert.match(read("supabase/migrations/202609140002_vip_memberships.sql"),/public=false/);
});
test("refund and transfer paths use durable idempotency",()=>{
  assert.match(read("app/api/admin/payments/[id]/refund/route.ts"),/idempotency_key/);
  assert.match(read("lib/stripe/service.ts"),/replypass:transfer/);
  assert.match(read("lib/stripe/service.ts"),/replypass:refund/);
});
