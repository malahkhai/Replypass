"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminAction({endpoint,action,label,confirm,reason=false}:{endpoint:string;action:string;label:string;confirm?:string;reason?:boolean}){
 const router=useRouter();const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 async function run(){if(confirm&&!window.confirm(confirm))return;let note="";if(reason){note=window.prompt("Reason (required and recorded in the audit log)")?.trim()||"";if(note.length<3)return;}
 setBusy(true);setError("");try{const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,reason:note})});const body=await response.json();if(!response.ok)throw Error(body.error||"Action failed.");router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:"Action failed.");}finally{setBusy(false);}}
 return <span className="admin-action"><button type="button" disabled={busy} onClick={run}>{busy?"Working…":label}</button>{error&&<small role="alert">{error}</small>}</span>;
}
