const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const OWNER = "RGoharimehr";
const REPO = "RGoharimehr.github.io";
const BRANCH = "main";
const GH = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || ADMIN_PASSWORD;

app.use(express.json({limit:"15mb"}));
app.use((req,res,next)=>{
  res.setHeader("Access-Control-Allow-Origin", process.env.ADMIN_ORIGIN || "https://rgoharimehr.github.io");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, X-Admin-Session");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,OPTIONS");
  if(req.method==="OPTIONS") return res.sendStatus(204);
  next();
});

function sign(value){
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}
function makeSession(){
  const exp = Date.now() + 1000*60*60*8;
  const value = String(exp);
  return value + "." + sign(value);
}
function validSession(token){
  if(!token || !SESSION_SECRET) return false;
  const [exp,sig] = token.split(".");
  if(!exp || !sig || Number(exp) < Date.now()) return false;
  const expected=sign(exp);
  return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected));
}
function auth(req,res,next){
  if(!validSession(req.get("X-Admin-Session"))) return res.status(401).json({error:"Unauthorized"});
  next();
}
function ghHeaders(){
  return {"Authorization":"Bearer "+GITHUB_TOKEN,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
}
async function gh(path, options={}){
  return fetch(GH+"/repos/"+OWNER+"/"+REPO+path,{...options,headers:{...ghHeaders(),...(options.headers||{})}});
}

app.get("/api/health",(req,res)=>res.json({ok:true}));
app.post("/api/login",(req,res)=>{
  if(!ADMIN_PASSWORD) return res.status(500).json({error:"ADMIN_PASSWORD is not configured"});
  const password=String(req.body?.password||"");
  const a=Buffer.from(password), b=Buffer.from(ADMIN_PASSWORD);
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(401).json({error:"Incorrect password"});
  res.json({session:makeSession(),expiresIn:28800});
});

app.get("/api/content",auth,async(req,res)=>{
  try{
    const r=await gh("/contents/content.json?ref="+BRANCH);
    const d=await r.json();
    if(!r.ok) return res.status(r.status).json({error:d.message||"GitHub error"});
    const content=Buffer.from(d.content.replace(/\n/g,""),"base64").toString("utf8");
    res.json({content:JSON.parse(content),sha:d.sha});
  }catch(e){res.status(500).json({error:e.message});}
});

app.put("/api/content",auth,async(req,res)=>{
  try{
    const content=req.body?.content;
    if(!content) return res.status(400).json({error:"Missing content"});
    const current=await gh("/contents/content.json?ref="+BRANCH);
    const cur=await current.json();
    if(!current.ok) return res.status(current.status).json({error:cur.message||"GitHub error"});
    const body={
      message:req.body.message||"Update content via admin",
      content:Buffer.from(JSON.stringify(content,null,2)+"\n").toString("base64"),
      sha:cur.sha,
      branch:BRANCH
    };
    const saved=await gh("/contents/content.json",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d=await saved.json();
    if(!saved.ok) return res.status(saved.status).json({error:d.message||"GitHub save failed"});
    res.json({ok:true,sha:d.content?.sha,commit:d.commit?.sha});
  }catch(e){res.status(500).json({error:e.message});}
});

app.put("/api/image",auth,async(req,res)=>{
  try{
    const path=String(req.body?.path||"");
    const base64=String(req.body?.base64||"");
    if(!/^images\/sections\/[\w.\-]+$/.test(path)) return res.status(400).json({error:"Invalid image path"});
    if(!base64) return res.status(400).json({error:"Missing image"});
    let existing=null;
    const er=await gh("/contents/"+path+"?ref="+BRANCH);
    if(er.ok) existing=await er.json();
    const body={message:req.body.message||"Add section image",content:base64,branch:BRANCH};
    if(existing?.sha) body.sha=existing.sha;
    const saved=await gh("/contents/"+path,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d=await saved.json();
    if(!saved.ok) return res.status(saved.status).json({error:d.message||"Image upload failed"});
    res.json({ok:true,path,commit:d.commit?.sha});
  }catch(e){res.status(500).json({error:e.message});}
});

app.listen(PORT,()=>console.log("Admin API listening on "+PORT));
