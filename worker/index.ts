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

function publicArticle(a:Article){const {source:_source,sourceUrl:_sourceUrl,...publicFields}=a;return {...publicFields,source:'',sourceUrl:'',author:'GlobalNews Today'};}
function publicArticles(list:Article[]){return list.map(publicArticle);}

function normalizeAdminArticle(input:any,existing?:Article):Article{const now=new Date().toISOString();const title=String(input?.title||existing?.title||'').trim();const content=String(input?.content||existing?.content||'').trim();const summary=String(input?.summary||existing?.summary||content.slice(0,300)).trim();const slug=slugify(String(input?.slug||existing?.slug||title));return {id:String(input?.id||existing?.id||crypto.randomUUID()),title,slug,summary,content,image:String(input?.image||existing?.image||FALLBACK),source:String(input?.source||existing?.source||'GlobalNews Today'),sourceUrl:String(input?.sourceUrl||existing?.sourceUrl||''),category:String(input?.category||existing?.category||'World'),country:String(input?.country||existing?.country||'World'),publishedAt:String(input?.publishedAt||existing?.publishedAt||now),collectedAt:String(input?.collectedAt||existing?.collectedAt||now),author:String(input?.author||existing?.author||'GlobalNews Today'),tags:Array.isArray(input?.tags)?input.tags.map(String):(existing?.tags||[]),isBreaking:Boolean(input?.isBreaking??existing?.isBreaking),isFeatured:Boolean(input?.isFeatured??existing?.isFeatured),isPublished:Boolean(input?.isPublished??existing?.isPublished??true),readingTimeMinutes:Math.max(1,Math.ceil(content.split(/\s+/).filter(Boolean).length/200))};}

async function collect(env:Env) {
  const existing=await getArticles(env); const urls=new Set(existing.map(a=>a.sourceUrl?.trim().toLowerCase())); const titles=new Set(existing.map(a=>norm(a.title))); let fetched=0,newCount=0,dupes=0; const failed:string[]=[]; const additions:Article[]=[];
  for(const feed of FEEDS){
    try { const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),8000); const r=await fetch(feed.url,{signal:ctl.signal,headers:{'User-Agent':'GlobalNewsToday/1.8 RSS collector; contact newsroom via site'}}); clearTimeout(timer); if(!r.ok) throw new Error(`HTTP ${r.status}`); const xml=await r.text(); const parsed=parseFeed(xml,feed); fetched+=parsed.length;
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

      if(path==='/api/admin/login'){
        if(request.method!=='POST') return Response.json({success:false,message:'Method not allowed.'},{status:405,headers:{...HEADERS,'Allow':'POST, OPTIONS'}});
        return await adminLogin(request,env);
      }

      if(path.startsWith('/api/admin/')){
        if(!(await adminTokenFromRequest(request,env))){
          return Response.json({success:false,message:'Unauthorized admin session.'},{status:401,headers:HEADERS});
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
