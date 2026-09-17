import { getViewer } from "@/lib/auth/session";
import { readJson,fail } from "@/lib/http";
import { createVipCheckout } from "@/lib/vip/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
export const runtime="nodejs";
export async function POST(request:Request){try{const viewer=await getViewer();if(!viewer||viewer.demo)return fail("Sign in to join VIP.",401);const limited=await enforceRateLimit(request,"payment",viewer.id);if(limited)return limited;const body=await readJson(request);if(typeof body.creatorId!=="string")return fail("Invalid creator.");const result=await createVipCheckout(viewer.id,body.creatorId);if(result.existing)return Response.json({existing:true,url:"/account/subscriptions"});return Response.json(result);}catch(e){return fail(e instanceof Error?e.message:"VIP checkout unavailable.",409)}}
