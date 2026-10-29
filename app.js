const $=s=>document.querySelector(s);
const fresh=()=>({p:[],c:[],q:[],m:[]});
let d;try{d=JSON.parse(localStorage.agentos)||fresh()}catch{d=fresh()}
for(const k of ["p","c","q","m"])if(!Array.isArray(d[k]))d[k]=[];
let cloudClient=null,cloudUser=null,cloudReady=false,syncTimer=null;
function save(){
 localStorage.agentos=JSON.stringify(d);render();
 if(cloudClient&&cloudUser){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(async()=>{
   const status=$("#syncStatus");
   try{
    if(status)status.textContent="Menyinkronkan ke cloud…";
    const {error}=await cloudClient.from("agent_workspaces").upsert({user_id:cloudUser.id,workspace:d,updated_at:new Date().toISOString()},{onConflict:"user_id"});
    if(error)throw error;
    cloudReady=true;if(status)status.textContent="☁ Tersinkron ke Supabase";
   }catch(err){if(status)status.textContent="Sinkronisasi gagal: "+(err.message||"cek konfigurasi Supabase");}
  },500);
 }
}
function esc(x=""){return String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function rupiah(n){return "Rp"+Number(n||0).toLocaleString("id-ID")}
function show(id){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));$("#title").textContent=({home:"Dashboard",products:"Riset Produk",studio:"Studio Konten",queue:"Antrean & Jadwal",stats:"Analitik"})[id]||id}
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>show(b.dataset.page));
function render(){
 $("#np").textContent=d.p.length;$("#nc").textContent=d.c.length;$("#nq").textContent=d.q.length;
 $("#nm").textContent=rupiah(d.m.reduce((a,x)=>a+Number(x.money||0),0));
 $("#plist").innerHTML=d.p.map((x,i)=>{const price=Number(x.price||0),rate=Number(x.rate||0),commission=Math.round(price*rate/100);return '<article><b>'+esc(x.name)+'</b><p>'+esc(x.angle||"Belum ada angle")+'<br>Harga '+rupiah(price)+' · Komisi '+rate+'% ('+rupiah(commission)+' per penjualan perkiraan)</p><p><a href="'+esc(x.link||"#")+'" target="_blank" rel="noopener">'+esc(x.link||"Link produk belum diisi")+'</a></p><button onclick="removeItem(\'p\','+i+')">Hapus</button></article>'}).join("")||"<p>Belum ada produk. Simpan produk pertama untuk mulai membandingkan potensi komisinya.</p>";
 $("#clist").innerHTML=d.c.map((x,i)=>'<article><b>'+esc(x.name)+' · '+esc(x.platform)+'</b><p style="white-space:pre-wrap">'+esc(x.text)+'</p><button onclick="copyDraft('+i+')">Salin draft</button> <button onclick="removeItem(\'c\','+i+')">Hapus</button></article>').join("")||"<p>Belum ada draft.</p>";
 $("#qlist").innerHTML=d.q.map((x,i)=>'<article><b>'+esc(x.title)+'</b><p>'+esc(x.date)+' '+esc(x.time)+' · '+esc(x.platform)+'</p><button onclick="removeItem(\'q\','+i+')">Hapus jadwal</button></article>').join("")||"<p>Antrean kosong.</p>";
 $("#mlist").innerHTML=d.m.map((x,i)=>{const views=Number(x.views||0),clicks=Number(x.clicks||0),ctr=views?((clicks/views)*100).toFixed(2):"0.00";return '<article><b>'+esc(x.name)+'</b><p>Views '+views.toLocaleString("id-ID")+' · Klik '+clicks.toLocaleString("id-ID")+' · CTR '+ctr+'% · Komisi '+rupiah(x.money)+'</p><button onclick="removeItem(\'m\','+i+')">Hapus data</button></article>'}).join("")||"<p>Belum ada data performa.</p>";
}
window.removeItem=(key,i)=>{if(confirm("Hapus data ini?")){d[key].splice(i,1);save()}};
$("#pf").onsubmit=e=>{e.preventDefault();d.p.push({name:$("#pn").value.trim(),link:$("#pl").value.trim(),price:$("#pp").value,rate:$("#pr").value,angle:$("#pa").value.trim()});e.target.reset();save()};
$("#cf").onsubmit=e=>{e.preventDefault();const name=$("#cn").value.trim(),platform=$("#cp").value,style=$("#cs").value,audience=$("#ca").value.trim()||"penonton yang punya masalah terkait produk ini";const hooks={"Problem → solusi":"HOOK: Masih mengalami masalah ini?","Review jujur":"HOOK: Aku cek produk ini—ini yang perlu kamu tahu.","3 alasan":"HOOK: 3 hal yang perlu dipertimbangkan sebelum membeli.","Storytelling":"HOOK: Awalnya aku kira masalah ini sepele…"};const text=[hooks[style]||"HOOK: Kenali produk ini.", "ISI: Buat demonstrasi nyata untuk "+audience+". Tunjukkan detail, cara pakai, kelebihan, dan kekurangan yang benar-benar kamu temukan.", "ALUR: 1) Tarik perhatian dalam 2 detik. 2) Tunjukkan masalah. 3) Demo produk. 4) Sebutkan siapa yang cocok dan batasannya.", "GAYA: "+style+". Gunakan bahasa natural dan rekaman orisinal.", "CTA: Cek detail serta harga terbaru lewat tautan affiliate. Ungkapkan bahwa tautan merupakan tautan affiliate."].join("\n\n");d.c.push({name,platform,text});e.target.reset();save()};
$("#qf").onsubmit=e=>{e.preventDefault();d.q.push({title:$("#qt").value.trim(),date:$("#qd").value,time:$("#qh").value,platform:$("#qp").value});e.target.reset();save()};
$("#mf").onsubmit=e=>{e.preventDefault();const views=Math.max(0,Number($("#mv").value||0)),clicks=Math.max(0,Number($("#mk").value||0));d.m.push({name:$("#mn").value.trim(),views,clicks,money:Math.max(0,Number($("#mm").value||0))});e.target.reset();$("#mv").value=0;$("#mk").value=0;$("#mm").value=0;save()};
window.copyDraft=i=>{const t=d.c[i]?.text;if(!t)return;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>alert("Draft disalin")).catch(()=>prompt("Salin draft ini",t));else prompt("Salin draft ini",t)};
$("#backup").onclick=()=>{const a=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:"application/json"}));a.href=url;a.download="affiliate-agent-os-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
render();

// AI Agent UI: calls the deployed Supabase Edge Function; endpoint is saved only on this device.
const endpointInput=$("#endpoint"), anonInput=$("#anonKey"), agentForm=$("#af");
if(endpointInput&&agentForm){
 try{endpointInput.value=localStorage.agentos_endpoint||"https://zcwiuvawmovkfbalgyyx.supabase.co/functions/v1/agent-run";anonInput.value=localStorage.agentos_anon_key||"sb_publishable_t0EIetmfeeU_ZjlMVVv-Kg_dDYjFubn"}catch{}
 endpointInput.addEventListener("change",()=>{try{localStorage.agentos_endpoint=endpointInput.value.trim()}catch{}});
 anonInput.addEventListener("change",()=>{try{localStorage.agentos_anon_key=anonInput.value.trim()}catch{}});
 agentForm.onsubmit=async e=>{
  e.preventDefault();
  const endpoint=endpointInput.value.trim(),anonKey=anonInput.value.trim(),status=$("#agentStatus"),output=$("#agentOutput"),button=$("#runAgent");
  if(!/^https:\/\/[^\s]+\/functions\/v1\/agent-run(?:\?.*)?$/.test(endpoint)){
   status.textContent="Masukkan URL lengkap Supabase Edge Function yang berakhir dengan /functions/v1/agent-run.";return;
  }
  try{localStorage.agentos_endpoint=endpoint;localStorage.agentos_anon_key=anonKey}catch{}
  button.disabled=true;status.textContent="AI sedang bekerja…";output.innerHTML="";
  try{
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","apikey":anonKey,"Authorization":"Bearer "+anonKey},body:JSON.stringify({mode:$("#amode").value,niche:$("#niche").value.trim(),audience:$("#audience").value.trim()||"pembeli Indonesia",platform:$("#aplatform").value,product:$("#product").value.trim(),language:"Bahasa Indonesia"})});
   const data=await response.json();
   if(!response.ok||!data.ok)throw new Error(data.error||"Permintaan AI gagal.");
   const card=document.createElement("article");card.style.cssText="white-space:pre-wrap;background:#14182d;border:1px solid #2c3150;border-radius:13px;padding:16px;margin:12px 0";
   card.textContent=data.text;output.appendChild(card);
   if(data.sources?.length){const h=document.createElement("h3");h.textContent="Sumber untuk diverifikasi";output.appendChild(h);const list=document.createElement("ul");data.sources.forEach(s=>{const li=document.createElement("li"),a=document.createElement("a");a.href=s.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=s.title||s.url;li.appendChild(a);list.appendChild(li)});output.appendChild(list)}
   const note=document.createElement("p");note.className="notice";note.textContent=data.notice||"Periksa hasil sebelum dipakai.";output.appendChild(note);
   const actions=document.createElement("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0";
   const saveButton=document.createElement("button");saveButton.type="button";saveButton.textContent="Simpan hasil ke Studio Konten";
   saveButton.onclick=()=>{d.c.push({name:$("#product").value.trim()||$("#niche").value.trim()||"Hasil AI Agent",platform:$("#aplatform").value,text:data.text+"\\n\\nSumber: "+(data.sources||[]).map(s=>s.url).join("\\n")});save();saveButton.textContent="Tersimpan di Studio Konten";saveButton.disabled=true;};
   const copyButton=document.createElement("button");copyButton.type="button";copyButton.textContent="Salin hasil AI";
   copyButton.onclick=()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(data.text).then(()=>{copyButton.textContent="Tersalin"}).catch(()=>prompt("Salin hasil AI",data.text));else prompt("Salin hasil AI",data.text)};
   actions.append(saveButton,copyButton);output.appendChild(actions);
   status.textContent="Selesai. Hasil AI dibuat. Simpan ke Studio Konten agar tidak hilang saat halaman ditutup.";
  }catch(err){status.textContent="Belum berhasil: "+(err?.message||"periksa koneksi dan konfigurasi Supabase.");}
  finally{button.disabled=false}
 };
}

// Cloud sync: Supabase Auth anonymous user + row-level security workspace.
(async function initCloudSync(){
 const status=$("#syncStatus");
 const endpoint="https://zcwiuvawmovkfbalgyyx.supabase.co";
 const publishableKey=localStorage.agentos_anon_key||"sb_publishable_t0EIetmfeeU_ZjlMVVv-Kg_dDYjFubn";
 if(!window.supabase?.createClient){if(status)status.textContent="Cloud sync belum tersedia (library Supabase gagal dimuat). Data masih lokal.";return;}
 try{
  cloudClient=window.supabase.createClient(endpoint,publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  let {data:sessionData,error:sessionError}=await cloudClient.auth.getSession();
  if(sessionError)throw sessionError;
  let user=sessionData.session?.user;
  if(!user){const signed=await cloudClient.auth.signInAnonymously();if(signed.error)throw signed.error;user=signed.data.user;}
  if(!user)throw new Error("Sesi pengguna tidak tersedia.");
  cloudUser=user;
  const {data:row,error:readError}=await cloudClient.from("agent_workspaces").select("workspace").eq("user_id",user.id).maybeSingle();
  if(readError)throw readError;
  if(row?.workspace&&typeof row.workspace==="object"){
   const cloud=row.workspace;for(const k of ["p","c","q","m"])if(!Array.isArray(cloud[k]))cloud[k]=[];
   d=cloud;localStorage.agentos=JSON.stringify(d);render();if(status)status.textContent="☁ Data dimuat dari Supabase";
  }else{
   const {error:writeError}=await cloudClient.from("agent_workspaces").upsert({user_id:user.id,workspace:d,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(writeError)throw writeError;if(status)status.textContent="☁ Data lokal pertama kali disalin ke Supabase";
  }
  cloudReady=true;
 }catch(err){cloudClient=null;cloudUser=null;if(status)status.textContent="Cloud belum tersambung: "+(err?.message||"Aktifkan Anonymous Sign-ins di Supabase Auth. Data lokal tetap aman.");}
})();
