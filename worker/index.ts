/**
 * GlobalNews Today - Cloudflare Worker API
 * Public RSS/API aggregation only. No anti-bot bypassing or scraping of protected pages.
 * KV bindings: NEWS_KV (required for production), ADMIN_SECRET (required for manual collection).
 */
interface KVNamespace { get(key: string, type?: 'json'|'text'): Promise<any>; put(key: string, value: string, options?: any): Promise<void>; delete?(key: string): Promise<void>; }
interface ExecutionContext { waitUntil(promise: Promise<any>): void; }
interface ScheduledEvent { cron: string; scheduledTime: number; }
interface Env { NEWS_KV: KVNamespace; ADMIN_SECRET?: string; ADMIN_PASSWORD?: string; TURNSTILE_SECRET?: string; }

type Article = { id:string; title:string; slug:string; summary:string; content:string; image:string; source:string; sourceUrl:string; category:string; country:string; publishedAt:string; collectedAt:string; author?:string; tags:string[]; isBreaking?:boolean; isFeatured?:boolean; isPublished?:boolean; readingTimeMinutes?:number };
type Feed = {id:string; name:string; url:string; category:string; country:string};

const HEADERS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization'};
const FEEDS: Feed[] = [
  {id:'bbc-world',name:'BBC News World',url:'https://feeds.bbci.co.uk/news/world/rss.xml',category:'World',country:'World'},
  {id:'bbc-business',name:'BBC Business',url:'https://feeds.bbci.co.uk/news/business/rss.xml',category:'Business',country:'United Kingdom'},
  {id:'npr-news',name:'NPR News',url:'https://feeds.npr.org/1001/rss.xml',category:'US',country:'United States'},
  {id:'sky-tech',name:'Sky News Technology',url:'https://feeds.skynews.com/feeds/rss/technology.xml',category:'Technology',country:'United Kingdom'},
  {id:'cbc-canada',name:'CBC Canada',url:'https://www.cbc.ca/cmlink/rss-topstories',category:'Canada',country:'Canada'},
  {id:'abc-australia',name:'ABC News Australia',url:'https://www.abc.net.au/news/feed/45910/rss.xml',category:'Australia',country:'Australia'},
  {id:'ars-science',name:'Ars Technica Science',url:'https://feeds.arstechnica.com/arstechnica/science',category:'Science',country:'United States'},
];
const FALLBACK='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';
const strip=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const slugify=(s:string)=>strip(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
const norm=(s:string)=>strip(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));

function parseFeed(xml:string, feed:Feed): Article[] {
  const items = xml.match(/<(item|entry)\b[\s\S]*?<\/(item|entry)>/gi) || [];
  return items.map((block,i)=>{
    const text=(tag:string)=>{const m=block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?strip(m[1]):''};
    const attr=(tag:string, name:string)=>{const m=block.match(new RegExp(`<${tag}[^>]*${name}=["']([^"']+)["'][^>]*>`,'i'));return m?m[1]:''};
    const title=text('title'); const link=text('link') || attr('link','href'); const desc=text('description') || text('summary') || text('content');
    const date=text('pubDate') || text('published') || text('updated');
    const media=attr('media:content','url') || attr('media:thumbnail','url') || attr('enclosure','url') || FALLBACK;
    const published = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : new Date().toISOString();
    const summary=desc.slice(0,300) || title;
    return {id:`${feed.id}-${i}-${slugify(title)}`,title,slug:`${slugify(title)}-${feed.id}-${i}`,summary,content:desc || summary,image:media,source:feed.name,sourceUrl:link,category:feed.category,country:feed.country,publishedAt:published,collectedAt:new Date().toISOString(),author:'GlobalNews Today',tags:[feed.category,feed.country,'Aggregated News'],isBreaking:false,isFeatured:false,readingTimeMinutes:Math.max(1,Math.ceil((desc||summary).split(/\s+/).length/200))};
  }).filter(a=>a.title && a.sourceUrl);
}

function dedupeArticles(list:Article[]):Article[]{
  const seenId=new Set<string>(), seenTitle=new Set<string>(), seenUrl=new Set<string>();
  return list.filter(a=>{
    const id=String(a.id||''); const title=norm(a.title); const url=String(a.sourceUrl||'').trim().toLowerCase();
    if((id&&seenId.has(id))||(title&&seenTitle.has(title))||(url&&seenUrl.has(url))) return false;
    if(id) seenId.add(id); if(title) seenTitle.add(title); if(url) seenUrl.add(url); return true;
  });
}
async function getArticles(env:Env):Promise<Article[]> { return dedupeArticles((await env.NEWS_KV.get('articles','json')) || []); }
async function saveArticles(env:Env, articles:Article[]) { const clean=dedupeArticles(articles); await env.NEWS_KV.put('articles',JSON.stringify(clean.slice(0,5000))); }

const encoder=new TextEncoder();
const decoder=new TextDecoder();

function base64UrlEncode(value:string):string{
  const bytes=encoder.encode(value);
  let binary='';
  for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function base64UrlDecode(value:string):string{
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
  const binary=atob(normalized);
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return decoder.decode(bytes);
}

async function importAdminKey(secret:string,usage:KeyUsage[]):Promise<CryptoKey>{
  return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,usage);
}

async function signAdminToken(payload:string,secret:string):Promise<string>{
  const key=await importAdminKey(secret,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,encoder.encode(payload));
  let binary='';
  for(const byte of new Uint8Array(signature)) binary+=String.fromCharCode(byte);
  return `${payload}.${btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}`;
}

async function verifyAdminToken(token:string,env:Env):Promise<boolean>{
  try{
    if(!env.ADMIN_SECRET) return false;
    const parts=token.split('.');
    if(parts.length!==2) return false;
    const [payload,signature]=parts;
    const data=JSON.parse(base64UrlDecode(payload));
    if(data?.typ!=='admin' || typeof data.exp!=='number' || data.exp<=Date.now()) return false;
    const normalized=signature.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-signature.length%4)%4);
    const binary=atob(normalized);
    const sigBytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    const key=await importAdminKey(env.ADMIN_SECRET,['verify']);
    return await crypto.subtle.verify('HMAC',key,sigBytes,encoder.encode(payload));
  }catch{return false;}
}

async function adminTokenFromRequest(request:Request,env:Env):Promise<boolean>{
  const header=request.headers.get('Authorization')||'';
  if(!header.startsWith('Bearer ')) return false;
  const token=header.slice(7).trim();
  return Boolean(token)&&await verifyAdminToken(token,env);
}

async function readJsonBody(request:Request):Promise<any>{
  const text=await request.text();
  if(!text.trim()) return {};
  try{return JSON.parse(text);}catch{return null;}
}

async function safeSecretEqual(left:string,right:string):Promise<boolean>{
  const a=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(left)));
  const b=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(right)));
  if(a.length!==b.length) return false;
  let diff=0;
  for(let i=0;i<a.length;i++) diff|=a[i]^b[i];
  return diff===0;
}

async function adminLogin(request:Request,env:Env):Promise<Response>{
  if(!env.ADMIN_SECRET || !env.ADMIN_PASSWORD){
    return Response.json({success:false,message:'Admin secrets are not configured.'},{status:503,headers:HEADERS});
  }
  const body=await readJsonBody(request);
  if(body===null || typeof body!=='object' || Array.isArray(body)){
    return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
  }
  const password=typeof body.password==='string' ? body.password : '';
  if(!password || !(await safeSecretEqual(password,env.ADMIN_PASSWORD))){
    return Response.json({success:false,message:'Invalid admin password.'},{status:401,headers:HEADERS});
  }
  const expiresIn=12*60*60*1000;
  const now=Date.now();
  const payload=base64UrlEncode(JSON.stringify({typ:'admin',iat:now,exp:now+expiresIn}));
  const token=await signAdminToken(payload,env.ADMIN_SECRET);
  return Response.json({success:true,token,expiresIn},{headers:HEADERS});
}



type AdRequest = {
  id:string; status:string; title:string; description:string; content:string; image:string; category:string; country:string;
  author:string; email:string; phone:string; website:string; sourceUrl:string; tags:string[];
  verificationId:string; verificationStatus:string; verificationTimestamp?:string; paymentNetwork?:string; walletAddress?:string; txid?:string;
  paymentProofKey?:string; payer?:string; note?:string; createdAt:string; updatedAt:string; approvedAt?:string; publishedAt?:string; rejectionReason?:string;
};
const AD_VERIFY_TTL = 15 * 60 * 1000;
const AD_REQUEST_TTL = 7 * 24 * 60 * 60 * 1000;
const MAX_MAIN_IMAGE = 2 * 1024 * 1024;
const MAX_PROOF_IMAGE = 3 * 1024 * 1024;
const VERIFY_SMARTLINK = 'https://www.profitableratecpmnetwork.com/z70a7x8f?key=aacfc748e10d2795a81fc25f7aabc685';
const PAYMENT_SMARTLINK = 'https://www.profitableratecpmnetwork.com/d5f8n6fvm8?key=d80dba17f3d1abd7637214f3d54c01ac';
const WORKER_PUBLIC_URL = 'https://globalnews-news-collector.hafejnayem1743.workers.dev';
const BEP20_ADDRESS = '0xa6c1c397df155614cfe1b16d7b1efefe681fa5c2';
const TRC20_ADDRESS = 'TH9rhUmnZoCfv7wFB7aG8xt9J7rZrrT9EK';

function adKey(id:string){return `ad_request:${id}`;}
function adAssetKey(id:string,kind:'main'|'proof'){return `ad_asset:${id}:${kind}`;}
async function getAdRequest(env:Env,id:string):Promise<AdRequest|null>{return await env.NEWS_KV.get(adKey(id),'json');}
async function saveAdRequest(env:Env,item:AdRequest){await env.NEWS_KV.put(adKey(item.id),JSON.stringify(item));}
async function getAdIndex(env:Env):Promise<string[]>{return (await env.NEWS_KV.get('ad_requests:index','json'))||[];}
async function saveAdIndex(env:Env,ids:string[]){await env.NEWS_KV.put('ad_requests:index',JSON.stringify(ids.slice(0,5000)));}
function clientIp(request:Request){return request.headers.get('CF-Connecting-IP')||request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()||'unknown';}
async function rateLimit(env:Env,key:string,limit:number,windowMs:number):Promise<boolean>{
  const now=Date.now(); const k=`ad_rate:${key}`; const data=await env.NEWS_KV.get(k,'json')||{count:0,expiresAt:0};
  if(data.expiresAt<=now){await env.NEWS_KV.put(k,JSON.stringify({count:1,expiresAt:now+windowMs}),{expirationTtl:Math.ceil(windowMs/1000)});return true;}
  if(Number(data.count)>=limit)return false; data.count+=1; await env.NEWS_KV.put(k,JSON.stringify(data),{expirationTtl:Math.ceil((data.expiresAt-now)/1000)}); return true;
}
function validImageData(value:any,maxBytes:number,allowed=['image/jpeg','image/png','image/webp','image/gif']):boolean{
  if(typeof value!=='string')return false; const m=value.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/); if(!m||!allowed.includes(m[1]))return false;
  const bytes=Math.floor(m[2].length*3/4); return bytes>0&&bytes<=maxBytes;
}
function cleanText(value:any,max:number){return String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,max);}
function validUrl(value:string){if(!value)return '';try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.toString():''}catch{return ''}}
async function verifyTurnstile(token:string|undefined,request:Request,env:Env):Promise<boolean>{
  if(!env.TURNSTILE_SECRET)return true; if(!token)return false;
  try{const form=new FormData();form.append('secret',env.TURNSTILE_SECRET);form.append('response',token);form.append('remoteip',clientIp(request));const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});const data=await r.json() as any;return Boolean(data?.success);}catch{return false;}
}
async function startAdVerification(request:Request,env:Env){
  if(!(await rateLimit(env,`verify:${clientIp(request)}`,5,10*60*1000)))return Response.json({success:false,message:'Too many verification attempts. Please try again later.'},{status:429,headers:HEADERS});
  const body=await readJsonBody(request); if(body===null)return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
  if(String(body?.honeypot||'').trim())return Response.json({success:false,message:'Verification could not be started.'},{status:400,headers:HEADERS});
  if(!(await verifyTurnstile(body?.turnstileToken,request,env)))return Response.json({success:false,message:'Bot verification failed. Please try again.'},{status:403,headers:HEADERS});
  const id=crypto.randomUUID(); const now=Date.now();
  await env.NEWS_KV.put(`ad_verify:${id}`,JSON.stringify({id,status:'pending',createdAt:new Date(now).toISOString(),expiresAt:now+AD_VERIFY_TTL,ip:clientIp(request)}),{expirationTtl:Math.ceil(AD_VERIFY_TTL/1000)});
  return Response.json({success:true,verificationId:id,expiresIn:AD_VERIFY_TTL,externalStep:VERIFY_SMARTLINK},{headers:HEADERS});
}
async function confirmAdVerification(request:Request,env:Env){
  const body=await readJsonBody(request); if(body===null)return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
  const id=cleanText(body?.verificationId,80); if(!id)return Response.json({success:false,message:'Verification session is required.'},{status:400,headers:HEADERS});
  const record=await env.NEWS_KV.get(`ad_verify:${id}`,'json'); if(!record||record.expiresAt<=Date.now()||record.status==='used')return Response.json({success:false,message:'Verification session expired. Please verify again.'},{status:410,headers:HEADERS});
  record.status='verified'; record.verifiedAt=new Date().toISOString(); await env.NEWS_KV.put(`ad_verify:${id}`,JSON.stringify(record),{expirationTtl:Math.ceil((record.expiresAt-Date.now())/1000)});
  return Response.json({success:true,verified:true,verificationId:id,verifiedAt:record.verifiedAt},{headers:HEADERS});
}
async function createAdRequest(request:Request,env:Env){
  if(!(await rateLimit(env,`request:${clientIp(request)}`,3,60*60*1000)))return Response.json({success:false,message:'Too many advertisement requests from this connection. Please try again later.'},{status:429,headers:HEADERS});
  const body=await readJsonBody(request); if(body===null)return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
  const verificationId=cleanText(body?.verificationId,80); const verification=verificationId?await env.NEWS_KV.get(`ad_verify:${verificationId}`,'json'):null;
  if(!verification||verification.status!=='verified'||verification.expiresAt<=Date.now())return Response.json({success:false,message:'A valid verification session is required.'},{status:403,headers:HEADERS});
  const title=cleanText(body?.title,180), description=cleanText(body?.description,500), content=cleanText(body?.content,30000), email=cleanText(body?.email,160);
  if(!title||!description||!content||!email||!validImageData(body?.image,MAX_MAIN_IMAGE))return Response.json({success:false,message:'Title, description, content, email and a valid main image are required.'},{status:400,headers:HEADERS});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return Response.json({success:false,message:'Please provide a valid contact email.'},{status:400,headers:HEADERS});
  const id=crypto.randomUUID(), now=new Date().toISOString();
  await env.NEWS_KV.put(adAssetKey(id,'main'),String(body.image));
  const item:AdRequest={id,status:'payment_pending',title,description,content,image:`/api/ads/assets/${id}/main`,category:cleanText(body?.category,60)||'World',country:cleanText(body?.country,80)||'International',author:cleanText(body?.author,100),email,phone:cleanText(body?.phone,120),website:validUrl(cleanText(body?.website,500)),sourceUrl:validUrl(cleanText(body?.sourceUrl,500)),tags:Array.isArray(body?.tags)?body.tags.map((x:any)=>cleanText(x,40)).filter(Boolean).slice(0,20):[],verificationId,verificationStatus:'verified',verificationTimestamp:verification.verifiedAt||new Date().toISOString(),createdAt:now,updatedAt:now};
  await saveAdRequest(env,item); const ids=await getAdIndex(env); await saveAdIndex(env,[id,...ids.filter(x=>x!==id)]); verification.status='consumed'; await env.NEWS_KV.put(`ad_verify:${verificationId}`,JSON.stringify(verification),{expirationTtl:Math.max(1,Math.ceil((verification.expiresAt-Date.now())/1000))});
  return Response.json({success:true,requestId:id,status:item.status},{status:201,headers:HEADERS});
}
async function finalizeAdRequest(request:Request,env:Env,id:string){
  const item=await getAdRequest(env,id); if(!item)return Response.json({success:false,message:'Advertisement request not found.'},{status:404,headers:HEADERS});
  const body=await readJsonBody(request); if(body===null)return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
  if(body.verificationId!==item.verificationId)return Response.json({success:false,message:'Invalid request session.'},{status:403,headers:HEADERS});
  if(item.status!=='payment_submitted')return Response.json({success:false,message:'Payment submission is not ready for review.'},{status:409,headers:HEADERS});
  item.status='pending_admin_review'; item.updatedAt=new Date().toISOString(); await saveAdRequest(env,item);
  return Response.json({success:true,requestId:id,status:item.status},{headers:HEADERS});
}
async function submitAdPayment(request:Request,env:Env,id:string){
  const item=await getAdRequest(env,id); if(!item)return Response.json({success:false,message:'Advertisement request not found.'},{status:404,headers:HEADERS});
  if(!['payment_pending','payment_submitted'].includes(item.status))return Response.json({success:false,message:'This request is not accepting payment evidence.'},{status:409,headers:HEADERS});
  const body=await readJsonBody(request); if(body===null)return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
  if(body.verificationId!==item.verificationId)return Response.json({success:false,message:'Invalid request session.'},{status:403,headers:HEADERS});
  const network=body?.network==='TRC20'?'TRC20':body?.network==='BEP20'?'BEP20':''; const walletAddress=network==='TRC20'?TRC20_ADDRESS:network==='BEP20'?BEP20_ADDRESS:''; const txid=cleanText(body?.txid,180);
  if(!network||!txid||!validImageData(body?.proof,MAX_PROOF_IMAGE,['image/jpeg','image/png','image/webp']))return Response.json({success:false,message:'Network, TXID and valid payment proof are required.'},{status:400,headers:HEADERS});
  if(!/^[A-Za-z0-9:_-]{8,180}$/.test(txid))return Response.json({success:false,message:'Invalid transaction ID format.'},{status:400,headers:HEADERS});
  await env.NEWS_KV.put(adAssetKey(id,'proof'),String(body.proof)); item.paymentNetwork=network; item.walletAddress=walletAddress; item.txid=txid; item.payer=cleanText(body?.payer,100); item.note=cleanText(body?.note,1000); item.paymentProofKey=adAssetKey(id,'proof'); item.status='payment_submitted'; item.updatedAt=new Date().toISOString(); await saveAdRequest(env,item);
  return Response.json({success:true,requestId:id,status:item.status,externalStep:PAYMENT_SMARTLINK},{headers:HEADERS});
}
function publicAdRequest(item:AdRequest){const {email,phone,website,sourceUrl,verificationId,verificationTimestamp,paymentProofKey,payer,note,txid,paymentNetwork,walletAddress,...safe}=item;return safe;}
function adminAdRequest(item:AdRequest,proof?:string){return {...item,paymentProof:proof||undefined};}
function normalizePublishedAd(body:any,existing?:Article):Article{
  const now=new Date().toISOString(); const title=cleanText(body?.title||existing?.title,180); const content=cleanText(body?.content||existing?.content,30000); const slug=slugify(title)||`sponsored-${Date.now().toString(36)}`;
  return {id:existing?.id||crypto.randomUUID(),title,slug,summary:cleanText(body?.description||existing?.summary||content.slice(0,300),500),content,image:String(body?.image||existing?.image||FALLBACK),source:'GlobalNews Today',sourceUrl:'',category:cleanText(body?.category||existing?.category||'World',60),country:cleanText(body?.country||existing?.country||'International',80),publishedAt:existing?.publishedAt||now,collectedAt:existing?.collectedAt||now,author:cleanText(body?.author||existing?.author||'GlobalNews Today',100),tags:Array.isArray(body?.tags)?body.tags.map((x:any)=>cleanText(x,40)).filter(Boolean).slice(0,20):existing?.tags||['Sponsored'],isBreaking:Boolean(body?.isBreaking??existing?.isBreaking),isFeatured:Boolean(body?.isFeatured??existing?.isFeatured),isPublished:true,readingTimeMinutes:Math.max(1,Math.ceil(content.split(/\s+/).length/200))};
}

function publicArticle(a:Article){const {source:_source,sourceUrl:_sourceUrl,...publicFields}=a;return {...publicFields,source:'',sourceUrl:'',author:'GlobalNews Today'};}
function publicArticles(list:Article[]){return list.map(publicArticle);}

function normalizeAdminArticle(input:any,existing?:Article):Article{const now=new Date().toISOString();const title=String(input?.title||existing?.title||'').trim();const content=String(input?.content||existing?.content||'').trim();const summary=String(input?.summary||existing?.summary||content.slice(0,300)).trim();const slug=slugify(String(input?.slug||existing?.slug||title));return {id:String(input?.id||existing?.id||crypto.randomUUID()),title,slug,summary,content,image:String(input?.image||existing?.image||FALLBACK),source:String(input?.source||existing?.source||'GlobalNews Today'),sourceUrl:String(input?.sourceUrl||existing?.sourceUrl||''),category:String(input?.category||existing?.category||'World'),country:String(input?.country||existing?.country||'World'),publishedAt:String(input?.publishedAt||existing?.publishedAt||now),collectedAt:String(input?.collectedAt||existing?.collectedAt||now),author:String(input?.author||existing?.author||'GlobalNews Today'),tags:Array.isArray(input?.tags)?input.tags.map(String):(existing?.tags||[]),isBreaking:Boolean(input?.isBreaking??existing?.isBreaking),isFeatured:Boolean(input?.isFeatured??existing?.isFeatured),isPublished:Boolean(input?.isPublished??existing?.isPublished??true),readingTimeMinutes:Math.max(1,Math.ceil(content.split(/\s+/).filter(Boolean).length/200))};}

async function collect(env:Env) {
  const existing=await getArticles(env); const urls=new Set(existing.map(a=>a.sourceUrl?.trim().toLowerCase())); const titles=new Set(existing.map(a=>norm(a.title))); let fetched=0,newCount=0,dupes=0; const failed:string[]=[]; const additions:Article[]=[];
  for(const feed of FEEDS){
    try { const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),8000); const r=await fetch(feed.url,{signal:ctl.signal,headers:{'User-Agent':'GlobalNewsToday/2.0 RSS collector; contact newsroom via site'}}); clearTimeout(timer); if(!r.ok) throw new Error(`HTTP ${r.status}`); const xml=await r.text(); const parsed=parseFeed(xml,feed); fetched+=parsed.length;
      for(const a of parsed){const u=a.sourceUrl.toLowerCase().trim(),t=norm(a.title); if(urls.has(u)||titles.has(t)){dupes++;continue;} urls.add(u);titles.add(t);additions.push(a);newCount++;}
    } catch { failed.push(feed.name); }
  }
  const merged=dedupeArticles([...additions,...existing]).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,5000);
  const status={status:failed.length===FEEDS.length?'ERROR':'ONLINE',lastSync:new Date().toISOString(),totalArticles:merged.length,newArticlesLastSync:newCount,duplicateArticlesPrevented:dupes,sourcesCount:FEEDS.length,activeSources:FEEDS.length-failed.length,failedSources:failed.length,lastError:failed.length?`Failed feeds: ${failed.join(', ')}`:undefined};
  await env.NEWS_KV.put('articles',JSON.stringify(merged)); await env.NEWS_KV.put('collector_status',JSON.stringify(status));
  return {success:failed.length<FEEDS.length,message:`Collector completed: ${newCount} new items, ${dupes} duplicates prevented.`,fetchedCount:fetched,newCount,duplicateCount:dupes,failedSources:failed,timestamp:new Date().toISOString(),status};
}

export default {
  async fetch(request:Request,env:Env,ctx:ExecutionContext){
    try{
      if(request.method==='OPTIONS') return new Response(null,{status:204,headers:HEADERS});
      const url=new URL(request.url);
      const path=url.pathname;

      if(path==='/api/health'){
        return Response.json({status:'ok',service:'GlobalNews Today Cloudflare Worker API',timestamp:new Date().toISOString()},{headers:HEADERS});
      }

      if(path==='/api/collector/status'){
        const data=(await env.NEWS_KV.get('collector_status','json'))||{status:'STANDBY',totalArticles:0};
        return Response.json({success:true,data},{headers:HEADERS});
      }

      if(path==='/api/ads/verification/start'){
        if(request.method!=='POST') return Response.json({success:false,message:'Method not allowed.'},{status:405,headers:{...HEADERS,'Allow':'POST, OPTIONS'}});
        return await startAdVerification(request,env);
      }
      if(path==='/api/ads/verification/confirm'){
        if(request.method!=='POST') return Response.json({success:false,message:'Method not allowed.'},{status:405,headers:{...HEADERS,'Allow':'POST, OPTIONS'}});
        return await confirmAdVerification(request,env);
      }
      if(path==='/api/ads/requests'){
        if(request.method!=='POST') return Response.json({success:false,message:'Method not allowed.'},{status:405,headers:{...HEADERS,'Allow':'POST, OPTIONS'}});
        return await createAdRequest(request,env);
      }
      const adPaymentMatch=path.match(/^\/api\/ads\/requests\/([^/]+)\/payment$/);
      if(adPaymentMatch && request.method==='POST') return await submitAdPayment(request,env,decodeURIComponent(adPaymentMatch[1]));
      const adFinalizeMatch=path.match(/^\/api\/ads\/requests\/([^/]+)\/finalize$/);
      if(adFinalizeMatch && request.method==='POST') return await finalizeAdRequest(request,env,decodeURIComponent(adFinalizeMatch[1]));
      const assetMatch=path.match(/^\/api\/ads\/assets\/([^/]+)\/(main)$/);
      if(assetMatch && request.method==='GET'){
        const raw=await env.NEWS_KV.get(adAssetKey(decodeURIComponent(assetMatch[1]),'main'),'text');
        if(!raw||!raw.startsWith('data:image/')) return Response.json({success:false,message:'Asset not found.'},{status:404,headers:HEADERS});
        const m=raw.match(/^data:(image\/[^;]+);base64,(.+)$/); if(!m)return Response.json({success:false,message:'Asset unavailable.'},{status:404,headers:HEADERS});
        const bin=atob(m[2]); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
        return new Response(bytes,{headers:{'Content-Type':m[1],'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
      }

      if(path==='/api/admin/login'){
        if(request.method!=='POST') return Response.json({success:false,message:'Method not allowed.'},{status:405,headers:{...HEADERS,'Allow':'POST, OPTIONS'}});
        return await adminLogin(request,env);
      }

      if(path.startsWith('/api/admin/')){
        if(!(await adminTokenFromRequest(request,env))){
          return Response.json({success:false,message:'Unauthorized admin session.'},{status:401,headers:HEADERS});
        }

        if(path==='/api/admin/advertisements' && request.method==='GET'){
          const status=url.searchParams.get('status')||''; const ids=await getAdIndex(env); const list:AdRequest[]=[]; for(const id of ids){const item=await getAdRequest(env,id); if(item && (!status||item.status===status)) list.push(item);} return Response.json({success:true,data:list.map(item=>adminAdRequest(item)),total:list.length},{headers:HEADERS});
        }
        const adPathMatch=path.match(/^\/api\/admin\/advertisements\/([^/]+)$/);
        if(adPathMatch){
          const id=decodeURIComponent(adPathMatch[1]); const item=await getAdRequest(env,id); if(!item)return Response.json({success:false,message:'Advertisement request not found.'},{status:404,headers:HEADERS});
          if(request.method==='GET'){const proof=item.paymentProofKey?await env.NEWS_KV.get(item.paymentProofKey,'text'):undefined;return Response.json({success:true,data:adminAdRequest(item,proof)},{headers:HEADERS});}
          if(request.method==='PUT'){
            const body=await readJsonBody(request); if(body===null)return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
            const editable=['title','description','content','category','country','author','email','phone','website','sourceUrl','rejectionReason']; for(const key of editable) if(body[key]!==undefined) (item as any)[key]=key==='website'||key==='sourceUrl'?validUrl(cleanText(body[key],500)):cleanText(body[key],key==='content'?30000:500);
            if(Array.isArray(body.tags))item.tags=body.tags.map((x:any)=>cleanText(x,40)).filter(Boolean).slice(0,20);
            item.updatedAt=new Date().toISOString(); await saveAdRequest(env,item); return Response.json({success:true,data:publicAdRequest(item)},{headers:HEADERS});
          }
          if(request.method==='DELETE'){await env.NEWS_KV.delete?.(adKey(id)); await env.NEWS_KV.delete?.(adAssetKey(id,'main')); await env.NEWS_KV.delete?.(adAssetKey(id,'proof')); const ids=(await getAdIndex(env)).filter(x=>x!==id); await saveAdIndex(env,ids); return Response.json({success:true,message:'Advertisement request deleted.'},{headers:HEADERS});}
        }
        const adActionMatch=path.match(/^\/api\/admin\/advertisements\/([^/]+)\/(approve|reject|unpublish)$/);
        if(adActionMatch && request.method==='POST'){
          const id=decodeURIComponent(adActionMatch[1]); const action=adActionMatch[2]; const item=await getAdRequest(env,id); if(!item)return Response.json({success:false,message:'Advertisement request not found.'},{status:404,headers:HEADERS});
          const body=await readJsonBody(request); if(body===null)return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
          if(action==='reject'){item.status='rejected';item.rejectionReason=cleanText(body?.reason,1000);item.updatedAt=new Date().toISOString();await saveAdRequest(env,item);return Response.json({success:true,data:publicAdRequest(item)},{headers:HEADERS});}
          const all=await getArticles(env); const published=normalizePublishedAd({title:item.title,description:item.description,content:item.content,image:`${WORKER_PUBLIC_URL}${item.image}`,category:item.category,country:item.country,author:item.author,tags:[...item.tags,'Sponsored','Advertisement']});
          if(action==='unpublish'){
            const idx=all.findIndex(a=>a.id===item.id); if(idx>=0){all[idx].isPublished=false;await saveArticles(env,all);} item.status='approved';item.updatedAt=new Date().toISOString();await saveAdRequest(env,item);return Response.json({success:true,data:publicAdRequest(item)},{headers:HEADERS});
          }
          const uniqueSlug=all.some(a=>a.slug===published.slug)?`${published.slug}-${item.id.slice(0,8)}`:published.slug; published.slug=uniqueSlug; published.id=item.id; all.unshift(published); await saveArticles(env,all); item.status='published';item.approvedAt=new Date().toISOString();item.publishedAt=published.publishedAt;item.updatedAt=new Date().toISOString();await saveAdRequest(env,item); return Response.json({success:true,data:publicAdRequest(item),article:published},{headers:HEADERS});
        }

        if(path==='/api/admin/articles' && request.method==='GET'){
          const all=await getArticles(env);
          const requested=Number(url.searchParams.get('limit')||500);
          const limit=Number.isFinite(requested)?Math.min(Math.max(requested,1),1000):500;
          return Response.json({success:true,data:all.slice(0,limit),total:all.length},{headers:HEADERS});
        }

        if(path==='/api/admin/articles' && request.method==='POST'){
          const body=await readJsonBody(request);
          if(body===null) return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
          if(!String(body?.title||'').trim()) return Response.json({success:false,message:'Headline is required.'},{status:400,headers:HEADERS});
          const all=await getArticles(env);
          let article=normalizeAdminArticle(body);
          if(all.some(item=>item.slug===article.slug)) article.slug=`${article.slug}-${Date.now().toString(36)}`;
          const merged=[article,...all].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,5000);
          await saveArticles(env,merged);
          return Response.json({success:true,data:article},{status:201,headers:HEADERS});
        }

        const articlePathMatch=path.match(/^\/api\/admin\/articles\/(.+)$/);
        if(articlePathMatch){
          const id=decodeURIComponent(articlePathMatch[1]);
          const all=await getArticles(env);
          const index=all.findIndex(item=>item.id===id);

          if(request.method==='PUT'){
            if(index<0) return Response.json({success:false,message:'Article not found.'},{status:404,headers:HEADERS});
            const body=await readJsonBody(request);
            if(body===null) return Response.json({success:false,message:'Invalid JSON request body.'},{status:400,headers:HEADERS});
            let article=normalizeAdminArticle(body,all[index]);
            if(all.some((item,i)=>i!==index && item.slug===article.slug)) article.slug=`${article.slug}-${Date.now().toString(36)}`;
            all[index]=article;
            all.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
            await saveArticles(env,all);
            return Response.json({success:true,data:article},{headers:HEADERS});
          }

          if(request.method==='DELETE'){
            if(index<0) return Response.json({success:false,message:'Article not found.'},{status:404,headers:HEADERS});
            all.splice(index,1);
            await saveArticles(env,all);
            return Response.json({success:true,message:'Article deleted.'},{headers:HEADERS});
          }
        }

        return Response.json({success:false,message:'Method not allowed for this admin endpoint.'},{status:405,headers:{...HEADERS,'Allow':'GET, POST, PUT, DELETE, OPTIONS'}});
      }

      const articles=()=>getArticles(env);
      if(path==='/api/news' || path==='/api/news/latest'){
        const all=(await articles()).filter(a=>a.isPublished!==false);
        const rawLimit=Number(url.searchParams.get('limit')||50);
        const limit=Number.isFinite(rawLimit)?Math.min(Math.max(rawLimit,1),100):50;
        const rawOffset=Number(url.searchParams.get('offset')||0);
        const offset=Number.isFinite(rawOffset)?Math.max(rawOffset,0):0;
        return Response.json({success:true,data:publicArticles(all.slice(offset,offset+limit)),total:all.length,offset,limit,hasMore:offset+limit<all.length},{headers:HEADERS});
      }

      if(path.startsWith('/api/news/category/')){
        const c=decodeURIComponent(path.slice('/api/news/category/'.length)).toLowerCase();
        const all=(await articles()).filter(a=>a.isPublished!==false);
        return Response.json({success:true,data:publicArticles(all.filter(a=>a.category.toLowerCase()===c))},{headers:HEADERS});
      }

      if(path.startsWith('/api/news/country/')){
        const c=decodeURIComponent(path.slice('/api/news/country/'.length)).toLowerCase();
        const all=(await articles()).filter(a=>a.isPublished!==false);
        return Response.json({success:true,data:publicArticles(all.filter(a=>a.country.toLowerCase()===c))},{headers:HEADERS});
      }

      if(path==='/api/news/search'){
        const q=(url.searchParams.get('q')||'').toLowerCase().trim();
        const all=(await articles()).filter(a=>a.isPublished!==false);
        const data=q?all.filter(a=>`${a.title} ${a.summary} ${a.content} ${a.category} ${a.country} ${a.tags.join(' ')}`.toLowerCase().includes(q)):[];
        return Response.json({success:true,data:publicArticles(data.slice(0,100)),count:data.length},{headers:HEADERS});
      }

      if(path.startsWith('/api/news/article/')){
        const slug=decodeURIComponent(path.slice('/api/news/article/'.length));
        const article=(await articles()).filter(a=>a.isPublished!==false).find(a=>a.slug===slug);
        if(!article) return Response.json({success:false,message:'Article not found.'},{status:404,headers:HEADERS});
        return Response.json({success:true,data:publicArticle(article)},{headers:HEADERS});
      }

      if(path==='/api/feed/collect' && request.method==='POST'){
        if(!env.ADMIN_SECRET) return Response.json({success:false,message:'Collector secret is not configured.'},{status:503,headers:HEADERS});
        const auth=request.headers.get('Authorization')||'';
        if(auth!==`Bearer ${env.ADMIN_SECRET}`) return Response.json({success:false,message:'Unauthorized'},{status:401,headers:HEADERS});
        const result=await collect(env);
        return Response.json(result,{headers:HEADERS});
      }

      return Response.json({success:false,message:'Not Found'},{status:404,headers:HEADERS});
    }catch(error){
      console.error('Worker request error',error);
      return Response.json({success:false,message:'Internal server error.'},{status:500,headers:HEADERS});
    }
  },

  async scheduled(_event:ScheduledEvent,env:Env,ctx:ExecutionContext){
    ctx.waitUntil(collect(env));
  }
};
