import { getViewer } from "@/lib/auth/session";
import { fail, readJson } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
export async function GET() {
  const viewer=await getViewer(); if(!viewer||viewer.demo)return Response.json({notifications:[],unread:0});
  const db=await createClient(); if(!db)return Response.json({notifications:[],unread:0});
  const {data,error}=await db.from("notifications").select("id,kind,title,body,deep_link,read_at,created_at").eq("recipient_id",viewer.id).order("created_at",{ascending:false}).limit(50);
  if(error)return fail("Notifications unavailable.",503); return Response.json({notifications:data||[],unread:(data||[]).filter(n=>!n.read_at).length},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(request:Request){const viewer=await getViewer();if(!viewer||viewer.demo)return fail("Sign in required.",401);try{const body=await readJson(request);const db=await createClient();if(!db)return Response.json({ok:true});const query=db.from("notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",viewer.id);const{error}=body.all?await query.is("read_at",null):await query.eq("id",String(body.id));if(error)throw error;return Response.json({ok:true});}catch{return fail("Unable to update notifications.",409)}}
