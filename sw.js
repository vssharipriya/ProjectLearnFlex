const CACHE_NAME='learnflex-offline-2026-27-v10';
const CORE_FILES=['./','./index.html','./styles.css','./app.js','./app-enhancements.js','./quality-upgrades.js','./offline-manager.js','./curriculum.js','./ncert-curriculum.js','./adaptive-engine.js','./manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('learnflex-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('sync',event=>{
 if(event.tag==='learnflex-progress-sync')event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>Promise.all(clients.map(client=>client.postMessage({type:'LEARNFLEX_SYNC_REQUEST'})))));
});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 // Authenticated API responses are deliberately network-only and never cached.
 if(url.pathname.startsWith('/api/'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);const cached=await cache.match(request);
  // Cache-first avoids repeatedly downloading the same curriculum and application assets.
  if(cached)return cached;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch(request,{signal:controller.signal});
   if(response&&response.ok)await cache.put(request,response.clone());
   return response;
  }catch(error){
   if(request.mode==='navigate'){const shell=await cache.match('./index.html');if(shell)return shell;}
   return new Response('This app resource is not available offline yet. Connect once and open the app to save its offline files.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }finally{clearTimeout(timer);}
 })());
});
