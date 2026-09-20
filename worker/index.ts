/**
 * GlobalNews Today - Cloudflare Worker API
 * Public RSS/API aggregation only. No anti-bot bypassing or scraping of protected pages.
 * KV bindings: NEWS_KV (required for production), ADMIN_SECRET (required for manual collection).
 */
interface KVNamespace { get(key: string, type?: 'json'|'text'): Promise<any>; put(key: string, value: string, options?: any): Promise<void>; }
interface ExecutionContext { waitUntil(promise: Promise<any>): void; }
interface ScheduledEvent { cron: string; scheduledTime: number; }
interface Env { NEWS_KV: KVNamespace; ADMIN_SECRET?: string; ADMIN_PASSWORD?: string; }

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
async function saveArticles(env:Env, articles:Article[]) { const clean=dedupeArticles(articles); await env.NEWS_KV.put('articles',JSON.stringify(clean.slice(0,5000))); await env.NEWS_KV.put('collector_status',JSON.stringify({status:'ONLINE',lastSync:new Date().toISOString(),totalArticles:Math.min(articles.length,5000),newArticlesLastSync:0,duplicateArticlesPrevented:0,sourcesCount:FEEDS.length,activeSources:FEEDS.length,failedSources:0})); }

const encoder=new TextEncoder();
const bytesToHex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
async function signAdminToken(payload:string,secret:string){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,encoder.encode(payload));return `${payload}.${bytesToHex(sig)}`;}
async function verifyAdminToken(token:string,env:Env){try{if(!env.ADMIN_SECRET||!env.ADMIN_PASSWORD)return false;const [payload,sig]=token.split('.');if(!payload||!sig)return false;const expected=await signAdminToken(payload,env.ADMIN_SECRET);if(expected.split('.')[1]!==sig)return false;const data=JSON.parse(atob(payload));return data.exp>Date.now();}catch{return false;}}
async function adminTokenFromRequest(request:Request,env:Env){const h=request.headers.get('Authorization')||'';const token=h.startsWith('Bearer ')?h.slice(7).trim():'';return token&&await verifyAdminToken(token,env);}
async function adminLogin(request:Request,env:Env){if(!env.ADMIN_SECRET||!env.ADMIN_PASSWORD)return Response.json({success:false,message:'Admin secrets are not configured.'},{status:503,headers:HEADERS});const body=await request.json().catch(()=>({}));const password=String(body?.password||'');if(password!==env.ADMIN_PASSWORD)return Response.json({success:false,message:'Invalid admin password.'},{status:401,headers:HEADERS});const payload=btoa(JSON.stringify({exp:Date.now()+12*60*60*1000}));const token=await signAdminToken(payload,env.ADMIN_SECRET);return Response.json({success:true,token,expiresIn:12*60*60*1000},{headers:HEADERS});}

function publicArticle(a:Article){const {source:_source,sourceUrl:_sourceUrl,...publicFields}=a;return {...publicFields,source:'',sourceUrl:'',author:'GlobalNews Today'};}
function publicArticles(list:Article[]){return list.map(publicArticle);}

function normalizeAdminArticle(input:any,existing?:Article):Article{const now=new Date().toISOString();const title=String(input?.title||existing?.title||'').trim();const content=String(input?.content||existing?.content||'').trim();const summary=String(input?.summary||existing?.summary||content.slice(0,300)).trim();const slug=slugify(String(input?.slug||existing?.slug||title));return {id:String(input?.id||existing?.id||crypto.randomUUID()),title,slug,summary,content,image:String(input?.image||existing?.image||FALLBACK),source:String(input?.source||existing?.source||'GlobalNews Today'),sourceUrl:String(input?.sourceUrl||existing?.sourceUrl||''),category:String(input?.category||existing?.category||'World'),country:String(input?.country||existing?.country||'World'),publishedAt:String(input?.publishedAt||existing?.publishedAt||now),collectedAt:String(input?.collectedAt||existing?.collectedAt||now),author:String(input?.author||existing?.author||'GlobalNews Today'),tags:Array.isArray(input?.tags)?input.tags.map(String):(existing?.tags||[]),isBreaking:Boolean(input?.isBreaking??existing?.isBreaking),isFeatured:Boolean(input?.isFeatured??existing?.isFeatured),isPublished:Boolean(input?.isPublished??existing?.isPublished??true),readingTimeMinutes:Math.max(1,Math.ceil(content.split(/\s+/).filter(Boolean).length/200))};}

async function collect(env:Env) {
  const existing=await getArticles(env); const urls=new Set(existing.map(a=>a.sourceUrl?.trim().toLowerCase())); const titles=new Set(existing.map(a=>norm(a.title))); let fetched=0,newCount=0,dupes=0; const failed:string[]=[]; const additions:Article[]=[];
  for(const feed of FEEDS){
    try { const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),8000); const r=await fetch(feed.url,{signal:ctl.signal,headers:{'User-Agent':'GlobalNewsToday/1.5 RSS collector; contact newsroom via site'}}); clearTimeout(timer); if(!r.ok) throw new Error(`HTTP ${r.status}`); const xml=await r.text(); const parsed=parseFeed(xml,feed); fetched+=parsed.length;
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
    if(request.method==='OPTIONS') return new Response(null,{headers:HEADERS});
    const url=new URL(request.url), path=url.pathname;
    if(path==='/api/health') return Response.json({status:'ok',service:'GlobalNews Today Cloudflare Worker API',timestamp:new Date().toISOString()},{headers:HEADERS});
    if(path==='/api/collector/status') return Response.json({success:true,data:(await env.NEWS_KV.get('collector_status','json'))||{status:'STANDBY',totalArticles:0}},{headers:HEADERS});
    if(path==='/api/admin/login' && request.method==='POST') return adminLogin(request,env);
    if(path.startsWith('/api/admin/')){
      if(!(await adminTokenFromRequest(request,env))) return Response.json({success:false,message:'Unauthorized admin session.'},{status:401,headers:HEADERS});
      if(path==='/api/admin/articles' && request.method==='GET'){const all=await getArticles(env);const limit=Math.min(Number(url.searchParams.get('limit')||1000),1000);return Response.json({success:true,data:all.slice(0,limit),total:all.length},{headers:HEADERS});}
      if(path==='/api/admin/articles' && request.method==='POST'){const body=await request.json().catch(()=>({}));if(!String(body?.title||'').trim())return Response.json({success:false,message:'Headline is required.'},{status:400,headers:HEADERS});const all=await getArticles(env);let a=normalizeAdminArticle(body);if(all.some(x=>x.slug===a.slug))a.slug=`${a.slug}-${Date.now().toString(36)}`;const merged=[a,...all].sort((x,y)=>Date.parse(y.publishedAt)-Date.parse(x.publishedAt)).slice(0,5000);await saveArticles(env,merged);return Response.json({success:true,data:a},{status:201,headers:HEADERS});}
      if(path.startsWith('/api/admin/articles/') && request.method==='PUT'){const id=decodeURIComponent(path.split('/').pop()||'');const all=await getArticles(env);const i=all.findIndex(x=>x.id===id);if(i<0)return Response.json({success:false,message:'Article not found.'},{status:404,headers:HEADERS});const body=await request.json().catch(()=>({}));let a=normalizeAdminArticle(body,all[i]);if(all.some((x,idx)=>idx!==i&&x.slug===a.slug))a.slug=`${a.slug}-${Date.now().toString(36)}`;all[i]=a;all.sort((x,y)=>Date.parse(y.publishedAt)-Date.parse(x.publishedAt));await saveArticles(env,all);return Response.json({success:true,data:publicArticle(a)},{headers:HEADERS});}
      if(path.startsWith('/api/admin/articles/') && request.method==='DELETE'){const id=decodeURIComponent(path.split('/').pop()||'');const all=await getArticles(env);const next=all.filter(x=>x.id!==id);if(next.length===all.length)return Response.json({success:false,message:'Article not found.'},{status:404,headers:HEADERS});await saveArticles(env,next);return Response.json({success:true,message:'Article deleted.'},{headers:HEADERS});}
    }
    const articles=()=>getArticles(env);
    if(path==='/api/news' || path==='/api/news/latest') { const all=(await articles()).filter(a=>a.isPublished!==false); const limit=Math.min(Number(url.searchParams.get('limit')||50),100); const offset=Math.max(Number(url.searchParams.get('offset')||0),0); return Response.json({success:true,data:publicArticles(all.slice(offset,offset+limit)),total:all.length,offset,limit,hasMore:offset+limit<all.length},{headers:HEADERS}); }
    if(path.startsWith('/api/news/category/')) { const c=decodeURIComponent(path.split('/').pop()||'').toLowerCase(); const all=(await articles()).filter(a=>a.isPublished!==false); return Response.json({success:true,data:publicArticles(all.filter(a=>a.category.toLowerCase()===c))},{headers:HEADERS}); }
    if(path.startsWith('/api/news/country/')) { const c=decodeURIComponent(path.split('/').pop()||'').toLowerCase(); const all=(await articles()).filter(a=>a.isPublished!==false); return Response.json({success:true,data:publicArticles(all.filter(a=>a.country.toLowerCase()===c))},{headers:HEADERS}); }
    if(path==='/api/news/search') { const q=(url.searchParams.get('q')||'').toLowerCase().trim(); const all=(await articles()).filter(a=>a.isPublished!==false); const data=q?all.filter(a=>`${a.title} ${a.summary} ${a.content} ${a.category} ${a.country} ${a.tags.join(' ')} ${a.source}`.toLowerCase().includes(q)):[]; return Response.json({success:true,data:publicArticles(data.slice(0,100)),count:data.length},{headers:HEADERS}); }
    if(path.startsWith('/api/news/article/')) { const slug=decodeURIComponent(path.slice('/api/news/article/'.length)); const a=(await articles()).filter(x=>x.isPublished!==false).find(x=>x.slug===slug); if(!a)return Response.json({success:false,message:'Article not found'},{status:404,headers:HEADERS}); return Response.json({success:true,data:publicArticle(a)},{headers:HEADERS}); }
    if(path==='/api/feed/collect' && request.method==='POST') { if(!env.ADMIN_SECRET) return Response.json({success:false,message:'Collector secret is not configured.'},{status:503,headers:HEADERS}); const auth=request.headers.get('Authorization')||''; if(auth!==`Bearer ${env.ADMIN_SECRET}`) return Response.json({success:false,message:'Unauthorized'},{status:401,headers:HEADERS}); const result=await collect(env); return Response.json(result,{headers:HEADERS}); }
    return Response.json({error:'Not Found'},{status:404,headers:HEADERS});
  },
  async scheduled(_event:ScheduledEvent,env:Env,ctx:ExecutionContext){ ctx.waitUntil(collect(env)); }
};
