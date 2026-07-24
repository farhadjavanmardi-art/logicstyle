/* ══════════════════════════════════════════
   ls-app.js — Logic Style · Application Logic
   Requires: ls-data.js + ls-prompts.js loaded first
   window.LS_ADMIN_REFS = true  →  shows Pinterest/Google links (admin only)
══════════════════════════════════════════ */

/* ── CONFIG ── */
const SB_URL = 'https://owgfhhkmlkdpjqlwavsx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z2ZoaGttbGtkcGpxbHdhdnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTUyNDgsImV4cCI6MjA5MDA5MTI0OH0.arQzSmczsZX6re-mfC6EcvAs9p3Uf1LdG3AfjjgsZvM';
const IMAGE_FUNCTION_NAME = 'generate-image';

let _sb = null;
const getSB = () => { if(!_sb) _sb = window.supabase.createClient(SB_URL,SB_KEY); return _sb; };

/* ── STATE ── */
let currentUser=null, currentSessionId=null, heartbeatTimer=null;
let forcePasswordChange=false, renewUsed=false;
let capturedPhoto=null, currentPrompt='', currentMode='female', currentGender='female';
let currentStyleId='', currentStyleName='';
let _farbeMode=false, _selectedFarbeService='', _farbeSubMode='haare', _selectedColor='', _selectedTech='';
let currentResultBase64=null;
let simulationResults=[];
let _currentModelId='', _currentColorItem=null;
let _currentAngles=[], _selectedAngle=null, _selectedIntensity=null;
let _currentGalleryModelId='', _currentGalleryModelName='';
let _galleryCounts={};
let _galleryCountsByMode={};  // `${mode}|${model_id}` → Anzahl — Skip-Prüfung pro Bereich
let _galleryThumbs={};  // model_id → {before, after} آخرین جفت شبیه‌سازی
/* Galerie-Modus vereinheitlichen: Behandlung wird sowohl als 'treatment' (Batch)
   als auch als 'behandlung' (Einzelspeicherung) abgelegt → beide auf 'behandlung'. */
function galCanonMode(m){m=String(m||'').toLowerCase();return m==='treatment'?'behandlung':m;}
let _selectedAdvancedOptions={};
let _selectedMustache='natural'; /* Schnurrbart: eigener Bereich, überlebt resetGenState */

/* ── HELPERS ── */
function getDeviceInfo(){return[navigator.platform,navigator.userAgent].join(' | ').slice(0,250)}
function htmlSafe(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;').replace(/"/g,'&quot;');}
function escapeHtml(str){return String(str||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function serviceIdFromVal(val){return String(val||'service').slice(0,60).replace(/[^a-z0-9]/gi,'_').replace(/^_+|_+$/g,'').toLowerCase();}
function normColorId(v){return String(v||'').slice(0,50).toLowerCase().replace(/[^a-z0-9]/g,'_').replace(/^_+|_+$/g,'').replace(/_+/g,'_');}

/* ── SESSIONS ── */
async function cleanupSessions(){try{await getSB().from('sessions').delete().lt('expires_at',new Date().toISOString())}catch(e){}}
function startHeartbeat(){stopHeartbeat();if(!currentSessionId)return;heartbeatTimer=setInterval(async()=>{try{await getSB().from('sessions').update({last_ping:new Date().toISOString(),expires_at:new Date(Date.now()+30*60*1000).toISOString()}).eq('id',currentSessionId)}catch(e){}},60000)}
function stopHeartbeat(){if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null}}
/* Sitzung auffrischen (verlängert expires_at) — best effort, wie der Heartbeat.
   Kein SELECT (RLS erlaubt anon evtl. kein Lesen der sessions) → niemals abmelden. */
async function touchSession(){
  if(!currentSessionId)return;
  try{await getSB().from('sessions').update({last_ping:new Date().toISOString(),expires_at:new Date(Date.now()+30*60*1000).toISOString()}).eq('id',currentSessionId);}catch(e){}
}
/* Bei Rückkehr in den Tab die Sitzung sofort auffrischen — verhindert „abgelaufene
   Sitzung" nach Idle/Schlaf, wenn der 60s-Heartbeat vom Browser gedrosselt wurde. */
if(typeof window!=='undefined'&&!window._lsSessRevive){window._lsSessRevive=true;
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)touchSession();});
  window.addEventListener('focus',()=>touchSession());
}

/* ── TOPBAR ── */
function updateTopbarPad(){
  const tb=document.querySelector('.topbar');if(!tb)return;
  const h=tb.offsetHeight;
  const app=document.getElementById('mainApp');if(app)app.style.paddingTop=h+'px';
  document.documentElement.style.setProperty('--topbar-h',h+'px');
}

/* ── LOGIN ── */
async function doLogin(){
  const email=(document.getElementById('loginUser').value||'').trim().toLowerCase();
  const pass=(document.getElementById('loginPass').value||'');
  const btn=document.getElementById('loginBtn');
  const errEl=document.getElementById('loginError');
  errEl.classList.remove('show');
  if(!email||!pass){showLoginErr('Bitte E-Mail und Passwort eingeben.');return}
  btn.disabled=true;btn.textContent='⏳ Wird geprüft…';
  try{
    const _resp=await fetch(`${SB_URL}/functions/v1/login`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},body:JSON.stringify({identifier:email,password:pass,device_info:getDeviceInfo()})});
    const result=await _resp.json();
    if(!result.success){
      const _msgs={user_not_found:'Benutzername oder E-Mail nicht gefunden.',account_inactive:'Konto nicht aktiv.',wrong_password:'Falsches Passwort.',temp_password_expired:'Temporäres Passwort abgelaufen.',validation_error:'Bitte E-Mail und Passwort eingeben.'};
      showLoginErr(_msgs[result.error]||('Fehler: '+(result.message||result.error)));return resetBtn();
    }
    currentUser=result.user;currentSessionId=result.session.id;
    localStorage.setItem('ls_face_session_id',result.session.id);
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('mainApp').style.display='block';
    setTimeout(updateTopbarPad,50);
    updateCredits();if(window.LS_GENDER_LOCK){const _gr=document.getElementById('genderRow');if(_gr)_gr.style.display='none';}switchGender(window.LS_GENDER_LOCK||'female');startHeartbeat();loadGalleryCounts();loadDeletedModels();loadModelOverrides();
    forcePasswordChange=false;
    if(result.user.must_change_password){forcePasswordChange=true;setTimeout(()=>openChangePw(),500)}
  }catch(e){showLoginErr('Fehler: '+e.message)}finally{resetBtn()}
}
function showLoginErr(msg){const el=document.getElementById('loginError');el.style.color='';el.textContent='❌ '+msg;el.classList.add('show')}
function resetBtn(){const btn=document.getElementById('loginBtn');btn.disabled=false;btn.textContent='→ Anmelden'}
async function forgotPassword(){
  const id=(document.getElementById('loginUser').value||'').trim().toLowerCase();
  const el=document.getElementById('loginError');
  if(!id){showLoginErr('Bitte zuerst E-Mail oder Benutzername eingeben.');return}
  const link=document.getElementById('forgotPwLink');
  if(link){link.disabled=true;link.textContent='Wird gesendet…'}
  try{
    await fetch(`${SB_URL}/functions/v1/password-reset`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},body:JSON.stringify({identifier:id})});
  }catch(e){}
  el.textContent='✅ Falls ein Konto existiert, wurde eine E-Mail mit einem temporären Passwort gesendet. Bitte prüfe dein Postfach.';
  el.style.color='#12b76a';el.classList.add('show');
  if(link){link.disabled=false;link.textContent='Passwort vergessen?'}
}
async function doLogout(){
  stopHeartbeat();
  if(currentSessionId)try{await getSB().from('sessions').delete().eq('id',currentSessionId)}catch(e){}
  localStorage.removeItem('ls_face_session_id');
  currentUser=null;currentSessionId=null;capturedPhoto=null;_lowCreditAlarmShown=false;closeCreditOffer();
  document.getElementById('mainApp').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loginUser').value='';
  document.getElementById('loginPass').value='';
  document.getElementById('loginError').classList.remove('show');
  resetBtn();
}
window.addEventListener('beforeunload',()=>{if(!currentSessionId)return;navigator.sendBeacon(`${SB_URL}/rest/v1/sessions?id=eq.${currentSessionId}`,new Blob([],{type:'application/json'}))});

/* ── CREDITS ── */
function updateCredits(){
  if(!currentUser)return;
  if(currentUser.is_admin){
    document.getElementById('creditsNum').textContent='∞';
    document.getElementById('creditsDisplay').className='credits-pill';
    document.getElementById('usageBar').style.display='none';
    setTimeout(updateTopbarPad,10);return;
  }
  const master=currentUser._masterUser||currentUser;
  const limit=Number(master.simulations_limit||0);
  const used=Number(master.simulations_used||0);
  const rem=Math.max(0,limit-used);
  document.getElementById('creditsNum').textContent=rem;
  const el=document.getElementById('creditsDisplay');
  el.className='credits-pill'+(rem<=10?' low':'');
  const bar=document.getElementById('usageBar');
  const pct=limit>0?used/limit:0;
  if(pct>=1){bar.innerHTML='⛔ Simulations-Budget aufgebraucht. <u style="cursor:pointer" onclick="openCreditOffer()">Credits kaufen / Upgrade →</u>';bar.style.display='block'}
  else if(pct>=0.7){bar.innerHTML=`⚠️ ${Math.round(pct*100)}% verbraucht — noch ${rem} Simulationen`;bar.style.display='block'}
  else bar.style.display='none';
  maybeLowCreditAlarm(rem);
  setTimeout(updateTopbarPad,10);
}
async function deductCredit(){
  if(currentUser?.is_admin)return;
  const master=currentUser._masterUser||currentUser;
  master.simulations_used++;updateCredits();
  try{await getSB().from('users').update({simulations_used:master.simulations_used}).eq('id',master.id)}catch(e){master.simulations_used--;updateCredits()}
}
function getRemaining(){if(currentUser?.is_admin)return 999999;const master=currentUser._masterUser||currentUser;return Math.max(0,Number(master.simulations_limit||0)-Number(master.simulations_used||0))}

/* ── LOW-CREDIT ALARM & CREDIT-SHOP ── */
const LS_PLANS={probe:{label:'Probe / Test',limit:20,price:0,next:'pro'},starter:{label:'Starter',limit:20,price:0,next:'pro'},pro:{label:'Pro',limit:200,price:66,next:'elite'},elite:{label:'Elite',limit:400,price:122,next:'studio'},studio:{label:'Studio',limit:1000,price:290,next:null}};
const LS_PACK_FALLBACK=[{amount:50,price:28},{amount:100,price:48}];
let _creditPacks=null,_lowCreditAlarmShown=false;

async function loadCreditPacks(){
  if(_creditPacks)return _creditPacks;
  try{
    const{data}=await getSB().from('credit_packs').select('amount,price').eq('active',true).order('amount');
    _creditPacks=(data&&data.length)?data:LS_PACK_FALLBACK;
  }catch(e){_creditPacks=LS_PACK_FALLBACK}
  return _creditPacks;
}

function maybeLowCreditAlarm(rem){
  if(!currentUser||currentUser.is_admin)return;
  const el=document.getElementById('creditsDisplay');
  if(el){el.style.cursor=rem<10?'pointer':'';el.onclick=rem<10?()=>openCreditOffer():null;el.title=rem<10?'Credits kaufen oder Paket upgraden':''}
  if(rem<10&&!_lowCreditAlarmShown){_lowCreditAlarmShown=true;openCreditOffer()}
}

function ensureCreditOfferModal(){
  if(document.getElementById('creditOfferModal'))return;
  const st=document.createElement('style');
  st.textContent=`
  #creditOfferModal{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:9600;display:none;align-items:center;justify-content:center;padding:18px}
  #creditOfferModal.open{display:flex}
  .co-box{background:#16161c;border:1px solid rgba(232,121,160,.3);border-radius:18px;max-width:430px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;color:#fff;font-family:'DM Sans',sans-serif}
  .co-head{font-size:17px;font-weight:800;margin-bottom:6px}
  .co-sub{font-size:12px;color:#9a9aa5;line-height:1.6;margin-bottom:14px}
  .co-upgrade{background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.3);border-radius:12px;padding:12px 14px;margin-bottom:14px}
  .co-upgrade b{color:#60a5fa}
  .co-up-btn{margin-top:9px;width:100%;padding:11px;border:none;border-radius:10px;background:#60a5fa;color:#000;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}
  .co-or{text-align:center;font-size:10px;letter-spacing:2px;color:#9a9aa5;text-transform:uppercase;margin:10px 0}
  .co-pack{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:10px 13px;margin-bottom:8px}
  .co-pack-name{font-size:13px;font-weight:700}
  .co-pack-sub{font-size:10px;color:#9a9aa5;margin-top:2px}
  .co-pack-btn{padding:8px 14px;border:1px solid rgba(74,222,128,.35);border-radius:9px;background:rgba(74,222,128,.1);color:#4ade80;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap;font-family:inherit}
  .co-note{font-size:10.5px;color:#9a9aa5;line-height:1.6;margin-top:10px}
  .co-close{margin-top:12px;width:100%;padding:10px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:#9a9aa5;font-size:12px;cursor:pointer;font-family:inherit}
  .co-ok{text-align:center;padding:20px 6px}
  .co-ok-icon{font-size:40px;margin-bottom:10px}`;
  document.head.appendChild(st);
  const div=document.createElement('div');
  div.id='creditOfferModal';
  div.innerHTML='<div class="co-box" id="coBox"></div>';
  div.addEventListener('click',e=>{if(e.target.id==='creditOfferModal')closeCreditOffer()});
  document.body.appendChild(div);
}

async function openCreditOffer(){
  if(!currentUser)return;
  ensureCreditOfferModal();
  const packs=await loadCreditPacks();
  const master=currentUser._masterUser||currentUser;
  const rem=getRemaining();
  const planKey=master.plan||currentUser.plan||'probe';
  const plan=LS_PLANS[planKey]||LS_PLANS.probe;
  const next=plan.next?LS_PLANS[plan.next]:null;
  const perSim=p=>(Number(p.price)/Number(p.amount)).toFixed(2).replace('.',',');
  document.getElementById('coBox').innerHTML=`
    <div class="co-head">${rem<=0?'⛔ Simulations-Budget aufgebraucht':'⚠️ Nur noch '+rem+' Simulationen übrig'}</div>
    <div class="co-sub">Damit es nahtlos weitergeht: Jetzt auf ein größeres Paket upgraden — oder einmalig zusätzliche Simulationen kaufen.</div>
    ${next?`<div class="co-upgrade">💎 <b>Empfehlung: Upgrade auf ${next.label}</b><br>
      <span style="font-size:12px;color:#cfd3dc">${next.limit} Simulationen · €${next.price}/Monat — günstigster Preis pro Simulation</span>
      <button class="co-up-btn" onclick="sendCreditRequest('upgrade_request',{requested_plan:'${plan.next}'})">📈 Upgrade auf ${next.label} · €${next.price}/Monat mit Revolut</button>
    </div><div class="co-or">— oder einmalig Credits kaufen —</div>`:''}
    ${packs.map(p=>`<div class="co-pack">
      <div><div class="co-pack-name">+${Number(p.amount)} Simulationen</div><div class="co-pack-sub">€${perSim(p)} pro Simulation</div></div>
      <button class="co-pack-btn" onclick="sendCreditRequest('credit_purchase_request',{pack_amount:${Number(p.amount)},pack_price:${Number(p.price)}})">€${Number(p.price)} mit Revolut</button>
    </div>`).join('')}
    <div class="co-note">💳 Sofort mit Revolut bezahlen — die Credits werden umgehend nach Zahlungseingang freigeschaltet.</div>
    <button class="co-close" onclick="closeCreditOffer()">Später</button>`;
  document.getElementById('creditOfferModal').classList.add('open');
}
function closeCreditOffer(){const m=document.getElementById('creditOfferModal');if(m)m.classList.remove('open')}

function genCreditRef(){return 'LS-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,5).toUpperCase()}

async function sendCreditRequest(type,extra){
  const master=currentUser?._masterUser||currentUser;
  if(!master)return;
  const isUp=type==='upgrade_request';
  const upPlan=isUp?LS_PLANS[extra.requested_plan]:null;
  const amount=isUp?Number(upPlan?.price||0):Number(extra.pack_price||0);
  const amountLabel=isUp?('€'+amount+'/Monat'):('€'+amount);
  const label=isUp
    ?('Upgrade auf '+(upPlan?.label||extra.requested_plan)+' · '+(upPlan?.limit||'')+' Simulationen')
    :('+'+extra.pack_amount+' Simulationen');
  const ref=genCreditRef();
  try{
    const{error}=await getSB().from('admin_notifications').insert({
      event_type:type,user_id:master.id,
      title:isUp?'📈 Upgrade-Anfrage':'💳 Credit-Kauf-Anfrage',
      message:`${master.salon_name||master.full_name||master.email||''}: ${label} (${amountLabel}, Ref: ${ref}, Plan: ${master.plan||currentUser.plan||'?'}, Rest: ${getRemaining()})`,
      payload:{...extra,amount:amount,payment_ref:ref,current_plan:master.plan||currentUser.plan||null,remaining:getRemaining(),salon_name:master.salon_name||null,email:master.email||currentUser.email||null}
    });
    if(error)throw error;
    // Revolut zuerst: automatische Gutschrift/Freischaltung nach Zahlung
    const rev=isUp
      ? await createRevolutOrder('plan',master.id,{plan:extra.requested_plan})
      : await createRevolutOrder('credit',master.id,{pack_amount:extra.pack_amount});
    if(rev&&rev.checkout_url){showRevolutPayment(label,amountLabel,rev.checkout_url);return;}
    // Fallback: manueller QR (bis Revolut-Key gesetzt ist)
    showCreditPayment(label,amountLabel,ref);
  }catch(e){
    document.getElementById('coBox').insertAdjacentHTML('beforeend',`<div style="color:#f87171;font-size:11px;margin-top:8px">❌ Anfrage fehlgeschlagen: ${e.message||e}. Bitte kontaktieren Sie uns direkt.</div>`);
  }
}

/* Revolut-Order erstellen — gibt {checkout_url,...} oder null (nicht konfiguriert). */
async function createRevolutOrder(purpose,userId,extra){
  try{
    const r=await fetch(`${SB_URL}/functions/v1/revolut-create-order`,{method:'POST',headers:{'Content-Type':'application/json',apikey:SB_KEY,Authorization:'Bearer '+SB_KEY},body:JSON.stringify({purpose,user_id:userId,...(extra||{})})});
    const d=await r.json().catch(()=>({}));
    return (r.ok&&d.ok&&d.checkout_url)?d:null;
  }catch(e){return null;}
}
function showRevolutPayment(label,amountLabel,url){
  const box=document.getElementById('coBox');if(!box)return;
  box.innerHTML=`
    <div class="co-head">💳 Mit Revolut bezahlen</div>
    <div class="co-sub">${label} · <b style="color:#fff">${amountLabel}</b></div>
    <a href="${url}" target="_blank" rel="noopener" class="co-up-btn" style="display:block;text-align:center;text-decoration:none;margin:16px 0 6px">Jetzt bezahlen →</a>
    <div class="co-note">✅ Nach erfolgreicher Zahlung werden deine Credits <b>automatisch</b> freigeschaltet — meist innerhalb weniger Sekunden. Kein Warten auf manuelle Freischaltung.</div>
    <button class="co-close" onclick="closeCreditOffer()">Schließen</button>`;
}

function showCreditPayment(label,amountLabel,ref){
  // Fallback, solange Revolut noch nicht konfiguriert ist: Anfrage gespeichert,
  // Zahlungslink folgt per E-Mail. (Kein PayPal mehr.)
  const box=document.getElementById('coBox');if(!box)return;
  box.innerHTML=`
    <div class="co-head">✅ Anfrage gespeichert</div>
    <div class="co-sub">${label} · <b style="color:#fff">${amountLabel}</b><br>Referenz: <b style="font-family:'Space Mono',monospace;font-size:11px">${ref}</b></div>
    <div class="co-note" style="margin-top:12px">Die Online-Zahlung wird gerade eingerichtet. Wir senden dir in Kürze den <b>Revolut-Zahlungslink</b> per E-Mail — direkt nach der Zahlung werden deine Credits automatisch freigeschaltet.</div>
    <button class="co-close" onclick="closeCreditOffer()">Schließen</button>`;
}

/* ── MODE / CATALOG ── */
function modelMatchesGender(m){ return true; }

const MODE_TITLES={
  female:['Logic Style · Damen','Damenhaarschnitte · Styling · Trendlooks'],
  male:['Logic Style · Herren','Herrenhaarschnitte · Barber · Trendlooks'],
  beard:['Logic Style · Bart','Bartformen · Konturen · Grooming'],
  color:['Logic Style · Farbe','Farbe · Balayage · Highlights · Toning · Fashion Color'],
  treatment:['Logic Style · Behandlung','Keratin · Glätten · Dauerwelle · Pflege']
};

const CAT_NAV={
  male:[
    {cat:'Klassische Schnitte',icon:'✂️',label:'Klassisch'},
    {cat:'Business & Gentleman',icon:'👔',label:'Business'},
    {cat:'Fade & Taper',icon:'⚡',label:'Fade'},
    {cat:'Undercut & Defined',icon:'🎯',label:'Undercut'},
    {cat:'Crop & Fringe',icon:'💈',label:'Crop'},
    {cat:'Mullet & Shag',icon:'〰️',label:'Mullet'},
    {cat:'Trending Styles',icon:'🔥',label:'Trend'},
    {cat:'Medium Length',icon:'💈',label:'Mittel'},
    {cat:'Long Hair',icon:'〰️',label:'Lang'},
    {cat:'Curly & Wavy',icon:'🌊',label:'Lockig'},
    {cat:'Natural & Specialty',icon:'🍃',label:'Natural'}
  ],
  female:[
    {cat:'Bob Cuts',icon:'✂️',label:'Bob'},
    {cat:'Lob & Mid-Length',icon:'💈',label:'Lob'},
    {cat:'Short Hair',icon:'✂️',label:'Kurz'},
    {cat:'Shag & Wolf',icon:'〰️',label:'Shag'},
    {cat:'Layers & Movement',icon:'🌊',label:'Layer'},
    {cat:'Trending Styles',icon:'🔥',label:'Trend'},
    {cat:'Long Hair',icon:'〰️',label:'Lang'},
    {cat:'Curly & Wavy',icon:'🌀',label:'Lockig'},
    {cat:'Volume & Styling',icon:'💫',label:'Volumen'},
    {cat:'Bridal & Event',icon:'💍',label:'Braut'},
    {cat:'Elegant & Premium',icon:'👔',label:'Elegant'},
    {cat:'Soft & Natural',icon:'🍃',label:'Natürlich'}
  ],
  beard:[
    {cat:'Stoppelbart',icon:'✏️',label:'Stoppel'},
    {cat:'Kurzer Bart',icon:'✂️',label:'Kurz'},
    {cat:'Mittellanger Bart',icon:'🧔',label:'Mittel'},
    {cat:'Langer Bart',icon:'🧔‍♂️',label:'Lang'},
    {cat:'Kontur & Linien',icon:'🎯',label:'Kontur'},
    {cat:'Bart Fade & Übergang',icon:'⚡',label:'Fade'},
    {cat:'Schnurrbart',icon:'👨',label:'Schnurr'},
    {cat:'Goatee & Kinnbart',icon:'🔻',label:'Kinn'},
    {cat:'Klassische Bartformen',icon:'💼',label:'Classic'},
    {cat:'Trend 2026',icon:'🔥',label:'Trend'},
    {cat:'Bartfarbe',icon:'🎨',label:'Farbe'}
  ],
  color:[
    {cat:'Farbe Voll',label:'Vollfarbe'},
    {cat:'Balayage',label:'Balayage'},
    {cat:'Ombré & Sombré',label:'Ombré'},
    {cat:'Babylights / Highlights / Lowlights',label:'Highlights'},
    {cat:'Money Piece',label:'Money Piece'},
    {cat:'Root Shadow / Root Melt',label:'Root'},
    {cat:'Glossing & Toning',label:'Toning'},
    {cat:'Bleach & Blonde Refresh',label:'Bleach'},
    {cat:'Grey Blending & Coverage',label:'Grey'},
    {cat:'Fashion Color',label:'Fashion'},
    {cat:'Men\'s Color',label:'Herren'},
    {cat:'Bartfarbe',label:'Bart'}
  ],
  treatment:[
    {cat:'Keratin & Glätten',label:'Keratin'},
    {cat:'Dauerwelle Damen',label:'Perm Damen'},
    {cat:'Dauerwelle Herren',label:'Perm Herren'}
  ]
};

function makeCatId(cat){
  return 'cb_'+String(cat).toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}
function scrollToCat(catId,btn){
  document.querySelectorAll('.cat-nav-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  requestAnimationFrame(()=>{const block=document.getElementById(catId);if(!block)return;const topbarH=document.querySelector('.topbar')?.offsetHeight||150;const y=block.getBoundingClientRect().top+window.scrollY-topbarH-8;window.scrollTo({top:y,behavior:'smooth'});});
}
function buildCatNav(mode){
  const nav=document.getElementById('catNav');
  if(nav)nav.style.display='none';  // نوار ناوبری دسته‌ها حذف شد
  return;
  // eslint-disable-next-line no-unreachable
  const cfg=CAT_NAV[mode];
  if(!cfg||cfg.length===0){nav.style.display='none';return}
  nav.style.display='flex';
  nav.innerHTML=cfg.map((c,i)=>`<button class="cat-nav-btn${i===0?' active':''}" onclick="scrollToCat('${makeCatId(c.cat)}',this)"><span class="cnl">${c.label}</span></button>`).join('');
  setTimeout(updateTopbarPad,30);
}

/* ساختار دو سطحی: جنسیت → زیرمجموعه */
const SUBCATS={
  female:[
    {mode:'female',    label:'Haarschnitt'},
    {mode:'color',     label:'Farbe'},
    {mode:'treatment', label:'Behandlung'},
  ],
  male:[
    {mode:'male',      label:'Haarschnitt'},
    {mode:'beard',     label:'Bart'},
    {mode:'color',     label:'Farbe'},
    {mode:'treatment', label:'Behandlung'},
  ],
};

function switchGender(g){
  if(window.LS_GENDER_LOCK)g=window.LS_GENDER_LOCK;
  currentGender=g;
  ['female','male'].forEach(x=>{const t=document.getElementById('gender-'+x);if(t)t.className='tab'+(x===g?' active-tab':'');});
  buildSubRow(g);
  // اولین زیرمجموعه را فعال کن
  switchMode(SUBCATS[g][0].mode);
}

function buildSubRow(g){
  const row=document.getElementById('subRow');if(!row)return;
  row.innerHTML=SUBCATS[g].map(s=>
    `<button class="tab sub-tab" id="sub-${s.mode}" onclick="switchMode('${s.mode}')">${s.label}</button>`
  ).join('');
}

function switchMode(mode){
  currentMode=mode;
  // فعال کردن زیرمجموعهٔ درست
  (SUBCATS[currentGender]||[]).forEach(s=>{const t=document.getElementById('sub-'+s.mode);if(t)t.className='tab sub-tab'+(s.mode===mode?' active-tab':'');});
  const [title,sub]=MODE_TITLES[mode]||['Logic Style',''];
  document.getElementById('mainTitle').textContent=title;
  document.getElementById('mainSub').textContent=sub;
  document.getElementById('searchInput').value='';
  _farbeMode=false;_selectedFarbeService='';
  renderCurrent();if(mode==='color'||mode==='treatment')buildCatNav(mode);setTimeout(updateTopbarPad,10);
}

let _deletedModels=new Set(); // `${canonicalMode}|${id}` — vom Admin gelöschte Modelle, werden aus der Auswahl ausgeblendet
async function loadDeletedModels(){
  try{
    const{data}=await getSB().from('deleted_models').select('mode,id');
    _deletedModels=new Set((data||[]).map(r=>`${r.mode}|${String(r.id)}`));
    renderCurrent();
  }catch(e){}
}

/* ── MODELL-ÜBERSCHREIBUNGEN: Name + Prompt direkt in Admin_Software bearbeiten ──
   canonMode gleicht das Schema von deleted_models ab: male/female/beard/color bleiben,
   treatment → behandlung. Die statischen Kataloge (ls-data.js) bleiben unverändert. */
let _modelOverrides={}; // `${canonMode}|${id}` -> {name,prompt}
function canonKey(mode,id){return`${mode==='treatment'?'behandlung':mode}|${String(id)}`}
async function loadModelOverrides(){
  try{
    const{data}=await getSB().from('model_overrides').select('mode,id,name,prompt');
    _modelOverrides={};
    (data||[]).forEach(r=>{_modelOverrides[`${r.mode}|${String(r.id)}`]={name:r.name||'',prompt:r.prompt||''}});
    renderCurrent();
  }catch(e){}
}
function defaultModelName(mode,id){
  if(mode==='color'||mode==='treatment'){const it=findServiceById(id);return it?.name||String(id);}
  const m=data[mode]?.models?.find(x=>String(x.id)===String(id));
  return m?.name||String(id);
}
function defaultModelPrompt(mode,id){
  if(mode==='color'||mode==='treatment'){const it=findServiceById(id);return it?.val||'';}
  return englishSpecs[mode]?.[id]||englishSpecs[id]||'';
}
/* reine Lese-Referenz auf Farsi (aus ls-prompts-fa.js, falls geladen) — wird NIE als
   tatsächlicher KI-Prompt verwendet, nur im Editor angezeigt, damit man versteht was
   der englische Prompt bedeutet, bevor man ihn ändert */
function defaultModelPromptFa(mode,id){
  const key=String(id);
  if(mode==='color'||mode==='treatment'){
    return(typeof PROMPT_FA_COLOR!=='undefined'&&PROMPT_FA_COLOR[key])||'';
  }
  return(typeof PROMPT_FA_HAIR!=='undefined'&&PROMPT_FA_HAIR[key])||'';
}
function effectiveModelName(mode,id,fallback){
  const ov=_modelOverrides[canonKey(mode,id)];
  return(ov&&ov.name)?ov.name:fallback;
}
function effectiveModelPrompt(mode,id,fallback){
  const ov=_modelOverrides[canonKey(mode,id)];
  return(ov&&ov.prompt)?ov.prompt:fallback;
}
function buildEditIcon(mode,id){
  if(!window.LS_ADMIN_REFS)return'';
  return`<button class="btn-edit-model" onclick="event.stopPropagation();openModelEditor('${mode}','${String(id).replace(/'/g,"")}')" title="Name & Prompt bearbeiten">✏️</button>`;
}
function ensureModelEditModal(){
  if(document.getElementById('modelEditModal'))return;
  const st=document.createElement('style');
  st.textContent=`
  .btn-edit-model{border:none;background:rgba(96,165,250,.12);color:#60a5fa;border-radius:8px;width:26px;height:26px;font-size:12px;cursor:pointer;margin-left:4px}
  .btn-edit-model:hover{background:#60a5fa;color:#000}
  #modelEditModal{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:9700;display:none;align-items:center;justify-content:center;padding:18px}
  #modelEditModal.open{display:flex}
  .me-box{background:#16161c;border:1px solid rgba(96,165,250,.3);border-radius:18px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;color:#fff;font-family:'DM Sans',sans-serif}
  .me-head{font-size:16px;font-weight:800;margin-bottom:2px}
  .me-hint{font-size:11px;color:#9a9aa5;margin-bottom:14px}
  .me-field{display:block;font-size:11px;color:#9a9aa5;margin-bottom:14px}
  .me-field b{display:block;color:#fff;font-size:12px;margin-bottom:6px}
  .me-field input,.me-field textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:9px 11px;color:#fff;font-family:inherit;font-size:13px;box-sizing:border-box}
  .me-field textarea{resize:vertical;min-height:120px;font-family:'Space Mono',monospace;font-size:11.5px;line-height:1.5}
  .me-reset{font-size:10.5px;color:#60a5fa;cursor:pointer;text-decoration:underline;margin-top:4px;display:inline-block}
  .me-fa-ref{background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.15);border-radius:9px;padding:9px 11px;font-size:12px;line-height:1.7;color:#cfd3dc;direction:rtl;text-align:right;font-family:'DM Sans',sans-serif;margin-top:8px}
  .me-fa-ref b{display:block;color:#9a9aa5;font-size:10px;margin-bottom:4px;font-weight:700}
  .me-err{color:#f87171;font-size:11px;margin:6px 0}
  .me-actions{display:flex;gap:8px;margin-top:6px}
  .me-save{flex:1;padding:11px;border:none;border-radius:10px;background:#60a5fa;color:#000;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}
  .me-cancel{padding:11px 16px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:#9a9aa5;font-size:13px;cursor:pointer;font-family:inherit}`;
  document.head.appendChild(st);
  const div=document.createElement('div');
  div.id='modelEditModal';
  div.innerHTML=`<div class="me-box">
    <div class="me-head">✏️ Modell bearbeiten <span id="meIdLabel"></span></div>
    <div class="me-hint">Änderungen gelten sofort für Kunden & Simulation. Leer lassen = Standard verwenden.</div>
    <label class="me-field"><b>Name</b><input type="text" id="meName"></label>
    <label class="me-field"><b>Prompt (Englisch, für KI-Simulation)</b><textarea id="mePrompt"></textarea>
      <span class="me-reset" onclick="resetModelEditorField('prompt')">↺ Standard-Prompt einsetzen</span>
      <div class="me-fa-ref" id="meFaRef" style="display:none"><b>📖 فارسی (فقط برای خواندن — این متن به هوش مصنوعی داده نمی‌شود)</b><span id="meFaRefText"></span></div>
    </label>
    <div class="me-err" id="meErr" style="display:none"></div>
    <div class="me-actions">
      <button class="me-cancel" onclick="closeModelEditor()">Abbrechen</button>
      <button class="me-save" onclick="saveModelEditor()">💾 Speichern</button>
    </div>
  </div>`;
  div.addEventListener('click',e=>{if(e.target.id==='modelEditModal')closeModelEditor()});
  document.body.appendChild(div);
}
let _editingModel=null;
function openModelEditor(mode,id){
  if(!window.LS_ADMIN_REFS)return;
  ensureModelEditModal();
  const dName=defaultModelName(mode,id),dPrompt=defaultModelPrompt(mode,id);
  const ov=_modelOverrides[canonKey(mode,id)]||{};
  _editingModel={mode,id:String(id),dName,dPrompt};
  document.getElementById('meIdLabel').textContent=`#${id}`;
  document.getElementById('meName').value=ov.name||dName;
  document.getElementById('mePrompt').value=ov.prompt||dPrompt;
  document.getElementById('meErr').style.display='none';
  const faRef=defaultModelPromptFa(mode,id);
  const faBox=document.getElementById('meFaRef');
  if(faRef){document.getElementById('meFaRefText').textContent=faRef;faBox.style.display='block';}
  else{faBox.style.display='none';}
  document.getElementById('modelEditModal').classList.add('open');
}
function resetModelEditorField(field){
  if(!_editingModel)return;
  if(field==='prompt')document.getElementById('mePrompt').value=_editingModel.dPrompt;
}
function closeModelEditor(){
  const m=document.getElementById('modelEditModal');if(m)m.classList.remove('open');
  _editingModel=null;
}
async function saveModelEditor(){
  if(!_editingModel)return;
  const{mode,id,dName}=_editingModel;
  const name=document.getElementById('meName').value.trim();
  const prompt=document.getElementById('mePrompt').value.trim();
  const errEl=document.getElementById('meErr');errEl.style.display='none';
  if(!name){errEl.textContent='Name darf nicht leer sein.';errEl.style.display='block';return}
  try{
    const canonMode=mode==='treatment'?'behandlung':mode;
    await getSB().from('model_overrides').upsert({
      mode:canonMode,id:String(id),
      name:name===dName?null:name,
      prompt:prompt||null,
      updated_at:new Date().toISOString()
    });
    _modelOverrides[`${canonMode}|${String(id)}`]={name:name===dName?'':name,prompt};
    closeModelEditor();
    renderCurrent();
  }catch(e){errEl.textContent='❌ '+(e.message||e);errEl.style.display='block'}
}

async function loadGalleryCounts(){
  try{
    const{data}=await getSB().from('model_gallery').select('model_id,mode,pair_label,before_url,after_url,image_url,sort_order,customer_id');
    _galleryCounts={};
    _galleryCountsByMode={};
    _galleryThumbs={};
    const _nameToCode={};
    [[VOLLFARBEN],[BALAYAGE],[OMBRE],[HIGHLIGHTS],[MONEY_PIECE],
     [ROOT_SERVICES],[TONING],[BLONDE_SERVICES],[GREY_SERVICES],
     [FASHION_COLOR],[MENS_COLOR],[BART_FARBEN],[BEHANDLUNGEN]].forEach(([arr])=>{
      (arr||[]).forEach(item=>{
        if(!item.id)return;
        const nn=normColorId(item.name||'');
        _nameToCode[normColorId(item.val||'')]=item.id;  // match by val (old long-format)
        _nameToCode[nn]=item.id;                          // match by name
        _nameToCode['tech'+nn]=item.id;                   // match tech_NAME__... records
        _nameToCode['color'+nn]=item.id;                  // match color_NAME__... records
      });
    });
    (data||[]).forEach(r=>{
      if(String(r.customer_id||'')==='BASIS')return;  // Basis-Referenzbilder nie öffentlich zeigen
      const mid=r.model_id||'';
      const code=/^\d+$/.test(mid)?mid:(_nameToCode[normColorId(mid)]||mid);
      _galleryCounts[code]=(_galleryCounts[code]||0)+1;
      if(code!==mid)_galleryCounts[mid]=(_galleryCounts[mid]||0)+1;
      // mode-aware: gleiche id in einem anderen Bereich zählt NICHT als „hat bereits ein Bild“
      const gm=galCanonMode(r.mode);
      _galleryCountsByMode[`${gm}|${code}`]=(_galleryCountsByMode[`${gm}|${code}`]||0)+1;
      if(code!==mid)_galleryCountsByMode[`${gm}|${mid}`]=(_galleryCountsByMode[`${gm}|${mid}`]||0)+1;
      // ذخیره جفت before/after برای thumbnail — آخرین (بیشترین sort_order) نگه داشته می‌شود
      const bef=r.before_url||'', aft=r.after_url||r.image_url||'';
      if(aft){
        const so=r.sort_order||0;
        [code,mid].forEach(k=>{
          if(!k)return;
          const tk=`${gm}|${k}`;  // Thumbnail pro Bereich getrennt (gleiche id in Farbe ≠ Damen)
          if(!_galleryThumbs[tk] || so>=(_galleryThumbs[tk]._so||0)){
            _galleryThumbs[tk]={before:bef,after:aft,_so:so};
          }
        });
      }
    });
    renderCurrent();
  }catch(e){_galleryCounts={};_galleryCountsByMode={}}
}

function renderCurrent(){
  renderMustacheBar();
  renderBatchPanel();
  if(currentMode==='color'){
    // فیلتر جنسیت: Dauerwelle Damen فقط زنان، Herren فقط مردان
    const secs=STYLE_FARBE_SECTIONS.filter(s=>{
      if(s.title==='Dauerwelle Damen')return currentGender==='female';
      if(s.title==='Dauerwelle Herren')return currentGender==='male';
      return true;
    });
    return renderServiceMode(secs,'color');
  }
  if(currentMode==='treatment'){
    // فیلتر بر اساس جنسیت: Dauerwelle Damen فقط برای زنان، Herren فقط برای مردان
    const secs=STYLE_BEHANDLUNG_SECTIONS.filter(s=>{
      if(s.title==='Dauerwelle Damen')return currentGender==='female';
      if(s.title==='Dauerwelle Herren')return currentGender==='male';
      return true; // Keratin & Glätten برای هر دو
    });
    return renderServiceMode(secs,'treatment');
  }
  return render();
}

/* build Pinterest + Google ref links for admin — returns '' for customers */
function buildRefLinks(name){
  if(!window.LS_ADMIN_REFS)return'';
  const q=encodeURIComponent(name);
  const qFrisur=encodeURIComponent(name+' Frisur');
  return`<a class="btn-ref btn-pin" href="https://www.pinterest.com/search/pins/?q=${q}" target="_blank" rel="noopener" title="Pinterest">📌</a><a class="btn-ref btn-goo" href="https://www.google.com/search?q=${qFrisur}&tbm=isch" target="_blank" rel="noopener" title="Google Bilder">🔍</a>`;
}

/* Galerie-Verwaltung (Upload/Download) — nur Admin (LS_ADMIN_REFS). Öffnet das
   eingebettete Galerie-Panel in Admin_Software.html via window.openGalleryManage. */
function buildGalleryBtn(mode,id,name){
  if(!window.LS_ADMIN_REFS)return'';
  const n=String(name||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return`<button class="btn-ref btn-gal" style="color:#e879a0;border-color:rgba(232,121,160,.3)" title="Galerie verwalten (Upload / Download)" onclick="event.stopPropagation();window.openGalleryManage&&window.openGalleryManage('${mode}','${id}','${n}')">📁</button>`;
}

/* thumbnail کوچک عکس نمونه جلوی هر مدل (آخرین شبیه‌سازی) */
function buildThumb(id){
  const t=_galleryThumbs[`${galCanonMode(currentMode)}|${id}`];
  if(!t||!t.after)return'';
  const after=String(t.after).replace(/'/g,'&#39;').replace(/"/g,'&quot;');
  return`<img class="model-thumb" src="${after}" loading="lazy" onclick="toggleInlinePair('${id}',event)" title="Vorher/Nachher ansehen">`;
}

/* باز/بسته کردن قبل و بعد درجا زیر همان ردیف */
function toggleInlinePair(id,event){
  if(event&&event.stopPropagation)event.stopPropagation();
  const existing=document.getElementById('inlinePair_'+id);
  // اگر باز است، ببند
  if(existing){existing.remove();return;}
  // همه بازهای دیگر را ببند (فقط یکی همزمان)
  document.querySelectorAll('.inline-pair').forEach(el=>el.remove());
  const t=_galleryThumbs[`${galCanonMode(currentMode)}|${id}`];
  if(!t||!t.after)return;
  const row=event&&event.target?event.target.closest('.model-row'):null;
  if(!row)return;
  const bef=String(t.before||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;');
  const aft=String(t.after||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;');
  const box=document.createElement('div');
  box.className='inline-pair';box.id='inlinePair_'+id;
  if(bef){
    box.innerHTML=`<div class="inline-pair-cell" onclick="event.stopPropagation();openLightbox('${bef}')"><img src="${bef}" loading="lazy"><span class="ip-tag vor">VORHER</span></div><div class="inline-pair-cell" onclick="event.stopPropagation();openLightbox('${aft}')"><img src="${aft}" loading="lazy"><span class="ip-tag nach">NACHHER</span></div>`;
  }else{
    box.innerHTML=`<div class="inline-pair-cell single" onclick="event.stopPropagation();openLightbox('${aft}')"><img src="${aft}" loading="lazy"><span class="ip-tag nach">ERGEBNIS</span></div>`;
  }
  row.insertAdjacentElement('afterend',box);
}

function render(){
  const grid=document.getElementById('catalogGrid');
  const term=(document.getElementById('searchInput')?.value||'').toLowerCase();
  const d=data[currentMode];grid.innerHTML='';if(!d)return;
  const visibleModels=d.models.filter(m=>!_deletedModels.has(`${currentMode}|${String(m.id)}`)).map(m=>({...m,name:effectiveModelName(currentMode,m.id,m.name)}));
  const cats=[...new Set(visibleModels.map(m=>m.cat))];let total=0;
  cats.forEach(cat=>{
    const items=visibleModels.filter(m=>m.cat===cat&&(m.name.toLowerCase().includes(term)||String(m.id).includes(term)||cat.toLowerCase().includes(term)));
    if(!items.length)return;total+=items.length;
    const block=document.createElement('div');block.className='cat-block';block.id=makeCatId(cat);
    block.innerHTML=`<div class="cat-header"><span class="cat-label">${cat}</span><span class="cat-count">${items.length}</span></div>`;
    const list=document.createElement('div');list.className='model-list';
    items.forEach(m=>{
      const safeName=htmlSafe(m.name);const gc=_galleryCounts[m.id]||0;
      const row=document.createElement('div');row.className='model-row';
      row.innerHTML=`${buildThumb(m.id)||'<div class="model-dot"></div>'}<div class="model-info"><div class="model-name"><span class="model-num">#${m.id}</span>${m.name}</div></div><div class="model-row-right">${buildRefLinks(m.name)}${buildEditIcon(currentMode,m.id)}${buildGalleryBtn(currentMode,m.id,m.name)}<button class="btn-simulate" onclick="openSim('${m.id}',event)">Simulieren ▸</button></div>`;
      list.appendChild(row);
    });
    block.appendChild(list);grid.appendChild(block);
  });
  if(!total)grid.innerHTML=`<div class="empty-state"><div style="font-size:44px">🔍</div><p style="margin-top:10px">Kein Modell für "<b>${htmlSafe(term)}</b>" gefunden</p></div>`;
  if(!term)buildCatNav(currentMode);else document.getElementById('catNav').style.display='none';
}

function renderServiceMode(sections, mode){
  const grid=document.getElementById('catalogGrid');
  const term=(document.getElementById('searchInput')?.value||'').toLowerCase();
  grid.innerHTML='';document.getElementById('catNav').style.display='none';let total=0;
  const canonMode=mode==='treatment'?'behandlung':mode;
  sections.forEach(sec=>{
    const items=sec.items.filter(item=>!_deletedModels.has(`${canonMode}|${String(item.id||'')}`)&&(!term||item.name.toLowerCase().includes(term)||sec.title.toLowerCase().includes(term)||item.val.toLowerCase().includes(term)))
      .map(item=>({...item,name:effectiveModelName(mode,item.id||serviceIdFromVal(item.val),item.name)}));
    if(!items.length)return;total+=items.length;
    const block=document.createElement('div');block.className='cat-block';block.id=makeCatId(sec.title);
    block.innerHTML=`<div class="cat-header"><span class="cat-label">${sec.title}</span><span class="cat-count">${items.length}</span></div>`;
    const list=document.createElement('div');list.className='model-list';
    items.forEach(item=>{
      const id=item.id||serviceIdFromVal(item.val);const gc=(_galleryCounts[id]||0)+(_galleryCounts[serviceIdFromVal(item.val)]||0);const safeName=htmlSafe(item.name);const safeVal=htmlSafe(item.val);
      const row=document.createElement('div');row.className='model-row';
      row.innerHTML=`${buildThumb(id)||(item.icon?`<div class="model-icon-box">${item.icon}</div>`:'<div class="model-dot"></div>')}<div class="model-info"><div class="model-name"><span class="model-num">#${item.id||''}</span>${item.name}</div></div><div class="model-row-right">${buildRefLinks(item.name)}${buildEditIcon(mode,item.id||id)}${buildGalleryBtn(mode,item.id||id,item.name)}<button class="btn-simulate" onclick="openSim('${item.id||id}',event)">Simulieren ▸</button></div>`;
      list.appendChild(row);
    });
    block.appendChild(list);grid.appendChild(block);
  });
  if(!total)grid.innerHTML=`<div class="empty-state"><div style="font-size:44px">🔍</div><p style="margin-top:10px">Kein Service für "<b>${htmlSafe(term)}</b>" gefunden</p></div>`;
  if(mode==='color'||mode==='treatment') buildCatNav(mode);
}

function findServiceById(id){
  const all=[...STYLE_FARBE_SECTIONS,...STYLE_BEHANDLUNG_SECTIONS];
  for(const sec of all)for(const item of sec.items)if(String(item.id||'')===String(id)||serviceIdFromVal(item.val)===id)return item;
  return null;
}
function getAnglesForMode(mode, serviceVal=''){
  return [
    {v:'360°',label:'360°',icon:'🌀',hint:'Die KI erkennt den Winkel automatisch aus dem Foto'}
  ];
}
function openSim(modelId,event){
  if(event)event.stopPropagation();
  _currentModelId=modelId;resetGenState();_farbeMode=false;_selectedFarbeService='';
  const modeData=data[currentMode];let modelObj=modeData?.models?.find(m=>String(m.id)===String(modelId));
  const service=findServiceById(modelId);
  if(service){
    const smode=STYLE_FARBE_SECTIONS.some(s=>s.items.includes(service))?'color':'treatment';
    applyService(effectiveModelPrompt(smode,modelId,service.val),effectiveModelName(smode,modelId,service.name),smode,event);
    return;
  }
  if(!modelObj)modelObj={id:modelId,name:modelId};
  currentStyleId=modelId;currentStyleName=effectiveModelName(currentMode,modelId,modelObj.name||modelId);
  _currentAngles=getAnglesForMode(currentMode);
  _selectedAngle=null;_selectedAdvancedOptions={};
  document.getElementById('genModalTitle').textContent=currentStyleName;
  document.getElementById('genModalSub').textContent='Foto aus beliebigem Winkel hochladen';
  const intensityWrap=document.getElementById('intensityWrap');if(intensityWrap)intensityWrap.style.display='none';
  buildAngleGrid();renderAdvancedOptions();document.getElementById('genModal').classList.add('open');
}
function applyService(val,name,mode,event){
  if(event)event.stopPropagation();
  resetGenState();_farbeMode=true;_selectedFarbeService=String(val).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
  currentMode=mode||currentMode;
  // Set _currentColorItem by finding the item in all sections
  const _svcItem=(()=>{const all=[...STYLE_FARBE_SECTIONS,...STYLE_BEHANDLUNG_SECTIONS];for(const sec of all)for(const it of sec.items)if(it.val===_selectedFarbeService||it.id===name)return it;return null;})();
  _currentColorItem=_svcItem;
  _currentModelId=_svcItem?.id||serviceIdFromVal(_selectedFarbeService);currentStyleId=_currentModelId;currentStyleName=String(name||_selectedFarbeService.replace(/^(COLOR:|TECH:)/,'').split(',')[0].slice(0,50)).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
  _currentAngles=getAnglesForMode(currentMode,_selectedFarbeService);_selectedAngle=null;_selectedAdvancedOptions={};_selectedAdvancedOptions={};
  document.getElementById('genModalTitle').textContent=currentStyleName;
  document.getElementById('genModalSub').textContent='Foto aus beliebigem Winkel hochladen';
  const intensityWrap=document.getElementById('intensityWrap');if(intensityWrap)intensityWrap.style.display='none';
  buildAngleGrid();renderAdvancedOptions();document.getElementById('genModal').classList.add('open');
}

/* Einzige verbliebene Option: Schnurrbart — unabhängig vom Bartmodell frei kombinierbar. */
const MUSTACHE_STYLES=[
 {id:'natural',name:'Natural',prompt:'Keep the mustache natural — its own growth pattern and density, trimmed only enough to clear the lip line, fully blended with the selected beard style.'},
 {id:'chevron',name:'Chevron',prompt:'Style the mustache as a Chevron — thick, wide and full, covering the upper lip in a slight inverted V, trimmed bluntly at the lip edge, clearly fuller than the surrounding beard.'},
 {id:'pencil',name:'Pencil',prompt:'Style the mustache as a Pencil mustache — a very thin, narrow, precisely trimmed line just above the upper lip, with clean skin between the mustache and the nose.'},
 {id:'handlebar',name:'Handlebar',prompt:'Style the mustache as a Handlebar — grown longer with the ends styled and curled upward into visible handlebar tips, waxed and deliberate.'},
 {id:'walrus',name:'Walrus',prompt:'Style the mustache as a Walrus — very thick, long and bushy, drooping naturally over the upper lip and clearly dominating the mouth area.'},
 {id:'horseshoe',name:'Horseshoe',prompt:'Style the mustache as a Horseshoe — a full mustache with vertical bars growing straight down past the corners of the mouth toward the jawline.'}
];
const MUSTACHE_ICONS={natural:'🧔',chevron:'👨',pencil:'🙂',handlebar:'🤵',walrus:'🎅',horseshoe:'🤠'};
/* Schnurrbart als eigener Bereich OBERHALB der Bartmodelle — unabhängig vom gewählten Bartmodell. */
function ensureMustacheSection(){
 let sec=document.getElementById('mustacheSection');
 if(sec)return sec;
 const grid=document.getElementById('catalogGrid');
 if(!grid||!grid.parentNode)return null;
 sec=document.createElement('div');sec.id='mustacheSection';sec.style.display='none';
 grid.parentNode.insertBefore(sec,grid);
 return sec;
}
function selectMustache(id){
 _selectedMustache=id;
 renderMustacheBar();
 if(typeof _selectedAngle!=='undefined'&&_selectedAngle)rebuildCurrentPrompt();
}
function renderMustacheBar(){
 const sec=ensureMustacheSection();if(!sec)return;
 if(currentMode!=='beard'||_farbeMode){sec.style.display='none';sec.innerHTML='';return;}
 const cur=_selectedMustache||'natural';
 const chips=MUSTACHE_STYLES.map(m=>{
  const on=m.id===cur;
  const style=on
   ?'border:1.5px solid #ff1f6e;background:rgba(255,31,110,.16);color:#fff'
   :'border:1.5px solid #ffffff1f;background:#ffffff08;color:#cbd5e1';
  return `<button type="button" onclick="selectMustache('${m.id}')" style="display:flex;align-items:center;gap:7px;padding:9px 13px;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600;transition:.15s;${style}"><span style="font-size:16px">${MUSTACHE_ICONS[m.id]||'•'}</span>${htmlSafe(m.name)}</button>`;
 }).join('');
 sec.innerHTML=`<div style="margin:0 0 16px;padding:15px 16px;background:linear-gradient(180deg,#ffffff0a,#ffffff05);border:1px solid #ffffff1a;border-radius:18px">
   <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px">
     <span style="font-size:22px;line-height:1">👨</span>
     <div>
       <div style="font-size:13px;font-weight:800;letter-spacing:.13em;color:#fff">SCHNURRBART</div>
       <div style="font-size:11.5px;color:#9a9aa5;margin-top:1px">Separat wählbar — gilt für jedes Bartmodell · Standard: Natural</div>
     </div>
   </div>
   <div style="display:flex;flex-wrap:wrap;gap:8px">${chips}</div>
 </div>`;
 sec.style.display='block';
 if(window.LS_I18N&&typeof window.LS_I18N.translate==='function')window.LS_I18N.translate();
}
function getModelObjByCurrent(){return data[currentMode]?.models?.find(m=>String(m.id)===String(currentStyleId))||null;}
function isBobModel(){const m=getModelObjByCurrent();return currentMode==='female' && /bob|bixie|lob/i.test((m?.name||'')+' '+(m?.cat||''));}
function isMaleHair(){return currentMode==='male';}
function optionDef(key,label,items,def){return {key,label,items,def:def||items[0]?.id};}
function getAdvancedOptionDefs(){
 /* Schnurrbart wird jetzt als eigener Bereich oberhalb der Bartmodelle gewählt (renderMustacheBar),
    daher hier keine Optionen mehr im Simulations-Modal. */
 return [];
}
function ensureAdvancedWrap(){
 let wrap=document.getElementById('advancedOptionsWrap');
 if(wrap)return wrap;
 wrap=document.createElement('div');wrap.id='advancedOptionsWrap';wrap.className='advanced-options-wrap';wrap.style.display='none';
 const angleWrap=document.getElementById('angleSelectorWrap');
 if(angleWrap&&angleWrap.parentNode)angleWrap.parentNode.insertBefore(wrap,angleWrap.nextSibling);
 return wrap;
}
function renderAdvancedOptions(){
 const wrap=ensureAdvancedWrap();const defs=getAdvancedOptionDefs();
 if(!defs.length){wrap.style.display='none';wrap.innerHTML='';return;}
 defs.forEach(d=>{if(!_selectedAdvancedOptions[d.key])_selectedAdvancedOptions[d.key]=d.def;});
 wrap.innerHTML=`<div class="adv-title">SCHNURRBART</div><div class="adv-grid">${defs.map(d=>`<label class="adv-field"><span>${d.label}</span><select onchange="setAdvancedOption('${d.key}',this.value)">${d.items.map(it=>`<option value="${it.id}"${_selectedAdvancedOptions[d.key]===it.id?' selected':''}>${it.name}</option>`).join('')}</select></label>`).join('')}</div><div class="adv-note">Frei kombinierbar mit jedem Bartmodell — Standard: Natural.</div>`;
 wrap.style.display='block';
}
function setAdvancedOption(key,val){_selectedAdvancedOptions[key]=val;rebuildCurrentPrompt();}
function getAdvancedModifierText(){
 const lines=[];
 /* Schnurrbart-Auswahl (eigener Bereich) fließt unabhängig vom Bartmodell in den Prompt ein. */
 if(currentMode==='beard'&&!_farbeMode){
  const val=_selectedMustache||'natural';
  const item=MUSTACHE_STYLES.find(x=>x.id===val);
  if(item?.prompt)lines.push(`Schnurrbart / Mustache: ${item.name}. ${item.prompt}`);
 }
 /* eventuelle weitere Advanced-Optionen (aktuell keine) */
 getAdvancedOptionDefs().forEach(d=>{
  const val=_selectedAdvancedOptions[d.key]||d.def;
  const item=d.items.find(x=>x.id===val);
  if(item?.prompt)lines.push(`${d.label}: ${item.name}. ${item.prompt}`);
 });
 return lines.join('\n');
}
function rebuildCurrentPrompt(){
 if(!_selectedAngle)return;
 const modifierText=getAdvancedModifierText();
 if(_farbeMode){
  const hairType=/beard hair only|bartfarbe|beard color|salt-and-pepper beard/i.test(_selectedFarbeService)?'beard and facial hair':'hair on the head';
  currentPrompt=buildColorPrompt(_selectedFarbeService,hairType,_selectedAngle,modifierText);
 }else{
  const spec=effectiveModelPrompt(currentMode,currentStyleId,englishSpecs[currentMode]?.[currentStyleId]||englishSpecs[currentStyleId]||currentStyleName);
  const hairType=currentMode==='beard'?'beard and facial hair':'hair on the head';
  currentPrompt=buildHairPrompt(spec,hairType,_selectedAngle,modifierText);
 }
}

function isAdminApp(){const page=(location.pathname||'').split('/').pop().replace(/\.html$/i,'');return page==='Admin_Software'||page==='Admin_Gallery';}

function buildAngleGrid(){
  const a=_currentAngles[0]||{v:'360°',label:'360°',icon:'🌀'};
  document.getElementById('angleGrid').innerHTML=`<div class="angle-btn selected" style="cursor:default"><span class="angle-icon">${a.icon}</span><span class="angle-label">${a.label}</span></div><div style="grid-column:1/-1;font-size:12.5px;color:#9a9aa5;line-height:1.65;text-align:center;padding:6px 8px 0">📸 Machen Sie das Foto aus einem beliebigen Winkel — vorne, hinten, seitlich oder dazwischen — und klicken Sie einfach auf „Simulation starten". Die KI erkennt den Winkel automatisch und simuliert genau diesen Winkel.</div>`;
  selectAngle(a.v,null);
}
function selectAngle(val,btn){
  _selectedAngle=val;if(btn){document.querySelectorAll('.angle-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected')}
  const upload=document.getElementById('uploadWrap');upload.style.display='block';
  initDragDrop();
  rebuildCurrentPrompt();
  document.getElementById('genBtn').disabled=!capturedPhoto;
  setTimeout(()=>upload.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
}

/* ── GEN STATE ── */
function resetGenState(){
  capturedPhoto=null;currentResultBase64=null;currentPrompt='';_selectedColor='';_selectedTech='';renewUsed=false;simulationResults=[];
  const _bmGen=document.getElementById('genBtn');if(_bmGen)_bmGen.textContent='▸ Simulation starten';
  const prev=document.getElementById('uploadPreviewImg');if(prev){prev.src='';prev.style.display='none';}
  const ph=document.getElementById('beforePlaceholder');if(ph)ph.style.display='flex';
  const imgA=document.getElementById('imgAfter');if(imgA){imgA.src='';imgA.style.display='none';}
  const nachLbl=document.getElementById('resultNachLbl');if(nachLbl)nachLbl.style.display='none';
  const resP=document.getElementById('resultPlaceholder');if(resP)resP.style.display='block';
  const hist=document.getElementById('simulationHistory');if(hist)hist.innerHTML='';
  const gl=document.getElementById('genLoading');if(gl)gl.style.display='none';
  const sr=document.getElementById('shareRow');if(sr)sr.style.display='none';
  const bgal=document.getElementById('btnSaveModels');if(bgal){bgal.textContent='📁 In Galerie';bgal.className='btn-share models';bgal.disabled=false;}
  const _sms=document.getElementById('saveModelsStatus');if(_sms)_sms.style.display='none';
  const simSt=document.getElementById('simStatus');if(simSt)simSt.style.display='none';
  const ge=document.getElementById('genError');if(ge)ge.classList.remove('show');
  const gb=document.getElementById('genBtn');if(gb)gb.disabled=true;
  const qw=document.getElementById('qualityWarn');if(qw)qw.classList.remove('show');
  const aw=document.getElementById('advancedOptionsWrap');if(aw)aw.style.display='none';
}

function closeGenModal(){
  const imgAfterEl=document.getElementById('imgAfter');
  const hasResult=simulationResults.length>0||currentResultBase64||(imgAfterEl?.src&&imgAfterEl.src!==window.location.href&&imgAfterEl.src!=='');
  if(hasResult){
    const closeNow=confirm('⚠️ Haben Sie die Bilder gespeichert?\n\nNach dem Schließen werden alle Simulationen aus Datenschutzgründen gelöscht.\n\nOK: Schließen und löschen\nAbbrechen: Zurück und speichern');
    if(!closeNow)return;
  }
  document.getElementById('genModal').classList.remove('open');
  currentResultBase64=null;
  simulationResults=[];
}

/* ── UPLOAD ── */
function loadPhotoFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    capturedPhoto=ev.target.result;
    _custConsentOk=false; // neues Kundenfoto → Einwilligung erneut bestätigen (DSGVO)
    const prev=document.getElementById('uploadPreviewImg');
    prev.src=capturedPhoto;prev.style.display='block';
    const ph=document.getElementById('beforePlaceholder');if(ph)ph.style.display='none';
    document.getElementById('genBtn').disabled=!currentPrompt;
    const errEl=document.getElementById('genError');if(errEl)errEl.classList.remove('show');
  };
  reader.readAsDataURL(file);
}
function handleUpload(e){
  const file=e.target.files?.[0];if(!file)return;
  e.target.value='';
  loadPhotoFile(file);
}

/* ── DRAG & DROP (Laptop/Desktop) — gilt für Admin-Software und Kunden-App ── */
let _ddInit=false;
function initDragDrop(){
  if(_ddInit)return;
  const zone=document.getElementById('uploadWrap');
  if(!zone)return;
  _ddInit=true;
  const style=document.createElement('style');
  style.textContent=`#uploadWrap.dragover .sim-col-before{outline:2px dashed #e879a0;outline-offset:3px;border-radius:12px}
#uploadWrap.dragover{background:rgba(232,121,160,0.04)}
.dd-hint{font-size:10px;color:var(--muted,#64748b);text-align:center;margin-top:6px;font-family:'Space Mono',monospace;display:none}
@media(pointer:fine){.dd-hint{display:block}}`;
  document.head.appendChild(style);
  const before=zone.querySelector('.sim-col-before');
  if(before&&!zone.querySelector('.dd-hint')){
    const hint=document.createElement('div');
    hint.className='dd-hint';
    hint.textContent='⤓ oder Foto per Drag & Drop hier ablegen';
    before.appendChild(hint);
  }
  ['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();zone.classList.add('dragover')}));
  zone.addEventListener('dragleave',e=>{e.preventDefault();e.stopPropagation();if(e.relatedTarget&&zone.contains(e.relatedTarget))return;zone.classList.remove('dragover')});
  zone.addEventListener('drop',e=>{
    e.preventDefault();e.stopPropagation();zone.classList.remove('dragover');
    const file=[...(e.dataTransfer?.files||[])].find(f=>f.type&&f.type.startsWith('image/'));
    if(!file){showGenError('Bitte eine Bilddatei ablegen (JPG/PNG).');return}
    loadPhotoFile(file);
  });
}

/* ── QUALITY CHECK ── */
function checkImageQuality(base64){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const warnings=[];
      if(img.width<300||img.height<300)warnings.push('Auflösung zu niedrig');
      const ratio=img.width/img.height;
      if(ratio<0.3||ratio>3)warnings.push('Bildformat ungewöhnlich — bitte ein klares Salonfoto verwenden');
      resolve(warnings);
    };
    img.onerror=()=>resolve([]);
    img.src=base64;
  });
}

/* ── GENERATION ── */
/* ── DSGVO: Kunden-Einwilligung zur KI-Foto-Verarbeitung (einmal pro hochgeladenem Foto) ── */
let _custConsentOk=false;
function ensureCustomerConsent(){
  return new Promise(resolve=>{
    if(_custConsentOk){resolve(true);return;}
    let ov=document.getElementById('lsConsentGate');
    if(!ov){
      ov=document.createElement('div');
      ov.id='lsConsentGate';
      ov.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit';
      ov.innerHTML=`
        <div style="max-width:440px;width:100%;background:#0a0a0c;border:1px solid rgba(255,31,110,.35);border-radius:18px;padding:24px 22px;color:#fff">
          <div style="font-size:26px;margin-bottom:10px">🔒</div>
          <div style="font-size:17px;font-weight:800;margin-bottom:10px;line-height:1.35">Einwilligung des Kunden</div>
          <div style="font-size:13px;color:#cbd5e1;line-height:1.7;margin-bottom:14px">
            Für die Simulation wird das Foto des Kunden verarbeitet und zur KI-Bildgenerierung an einen Dienstleister (Google, Verarbeitung ggf. in den USA) übermittelt.
            Bitte bestätigen Sie, dass Ihr Kunde <strong>der KI-Verarbeitung seines Fotos zugestimmt</strong> hat.
          </div>
          <label style="display:flex;align-items:flex-start;gap:9px;font-size:12.5px;color:#e2e8f0;line-height:1.55;cursor:pointer;margin-bottom:16px">
            <input type="checkbox" id="lsConsentChk" style="margin-top:2px;width:17px;height:17px;flex-shrink:0;accent-color:#ff1f6e;cursor:pointer">
            <span>Der Kunde hat der Verarbeitung seines Fotos zur KI-Simulation zugestimmt. Details: <a href="Datenschutz.html" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:none">Datenschutz</a>.</span>
          </label>
          <div style="display:flex;gap:9px">
            <button id="lsConsentCancel" style="flex:1;padding:12px;background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,.14);border-radius:12px;font-weight:700;font-size:13px;cursor:pointer">Abbrechen</button>
            <button id="lsConsentOk" style="flex:1.4;padding:12px;background:#ff1f6e;color:#000;border:none;border-radius:12px;font-weight:800;font-size:13px;cursor:pointer;opacity:.5" disabled>Bestätigen &amp; starten</button>
          </div>
        </div>`;
      document.body.appendChild(ov);
    }
    const chk=ov.querySelector('#lsConsentChk');
    const okB=ov.querySelector('#lsConsentOk');
    const caB=ov.querySelector('#lsConsentCancel');
    chk.checked=false;okB.disabled=true;okB.style.opacity='.5';
    ov.style.display='flex';
    chk.onchange=()=>{okB.disabled=!chk.checked;okB.style.opacity=chk.checked?'1':'.5'};
    okB.onclick=()=>{if(!chk.checked)return;_custConsentOk=true;ov.style.display='none';resolve(true)};
    caB.onclick=()=>{ov.style.display='none';resolve(false)};
  });
}

async function startGeneration(isFreeRenew=false){
  if(!currentPrompt){showGenError('Bitte zuerst einen Winkel wählen.');return}
  if(!capturedPhoto){showGenError('Bitte zuerst ein Kundenfoto hochladen.');return}
  if(!(await ensureCustomerConsent())){return}
  if(!isFreeRenew&&getRemaining()<1){showGenError('Keine Simulationen mehr — jetzt Credits kaufen oder Paket upgraden.');openCreditOffer();return}

  const genBtn=document.getElementById('genBtn');
  const genError=document.getElementById('genError');
  const genLoading=document.getElementById('genLoading');
  const genLoadingText=document.getElementById('genLoadingText');
  const qualityWarn=document.getElementById('qualityWarn');

  genBtn.disabled=true;
  genError.classList.remove('show');
  const resPlaceholder=document.getElementById('resultPlaceholder');
  if(resPlaceholder)resPlaceholder.style.display='none';
  const imgAfterEl=document.getElementById('imgAfter');
  if(imgAfterEl){imgAfterEl.style.display='none';}
  const nachLbl=document.getElementById('resultNachLbl');if(nachLbl)nachLbl.style.display='none';
  genLoading.style.display='flex';
  document.getElementById('shareRow').style.display='none';
  genLoadingText.textContent='10 – 30 Sekunden…';
  if(qualityWarn)qualityWarn.classList.remove('show');

  try{
    const warnings=await checkImageQuality(capturedPhoto);
    if(warnings.length){
      qualityWarn.textContent='⚠️ '+warnings.join(' · ');
      qualityWarn.classList.add('show');
    }

    const photoParts=capturedPhoto.match(/^data:([^;]+);base64,(.+)$/);
    if(!photoParts){throw new Error('Ungültiges Bildformat. Bitte Foto erneut hochladen.')}

    const imageMime=photoParts[1];
    const imageData=photoParts[2];

    genLoadingText.textContent='Wird generiert… (10–30 Sek.)';

    // Sitzung frisch halten, sonst schlägt die Generierung nach Leerlauf mit 401 fehl.
    await touchSession();

    const { data:functionResponse, error:functionError } = await getSB().functions.invoke(IMAGE_FUNCTION_NAME, {
      body: {
        imageData,
        imageMime,
        prompt: currentPrompt,
        meta: {
          sessionId: currentSessionId || null,
          userId: currentUser?.id || null,
          styleId: currentStyleId || null,
          styleName: currentStyleName || null,
          mode: currentMode || null,
          angle: _selectedAngle || null,
          intensity: _selectedIntensity || null
        }
      }
    });

    if(functionError){
      // supabase-js liefert bei non-2xx nur eine generische message — echten Fehler aus dem Body lesen
      let _body='';
      try{ if(functionError.context&&typeof functionError.context.json==='function'){const _j=await functionError.context.json();_body=_j?.error||_j?.message||'';} }catch(_e){}
      const _combined=((functionError.message||'')+' '+_body);
      if(_combined.includes('credit_exhausted')){
        genLoading.style.display='none';
        showGenError('Keine Simulationen mehr — jetzt Credits kaufen oder Paket upgraden.');
        openCreditOffer();
        return;
      }
      if(_combined.includes('account_inactive')){
        genLoading.style.display='none';
        showGenError('Dieses Konto ist deaktiviert. Bitte Admin kontaktieren.');
        return;
      }
      if(/Sitzung|abgelaufen|session/i.test(_combined)){
        genLoading.style.display='none';
        showGenError('Deine Sitzung ist abgelaufen. Bitte melde dich neu an.');
        setTimeout(()=>doLogout(),1600);
        return;
      }
      throw new Error(_body?('Fehler: '+_body):('Supabase Function: '+(functionError.message||JSON.stringify(functionError))));
    }

    if(functionResponse?.success===false){
      throw new Error(functionResponse.error||functionResponse.message||'Supabase Function hat keinen Erfolg zurückgegeben.');
    }

    const geminiJson=functionResponse?.data||functionResponse;
    const parts=geminiJson?.candidates?.[0]?.content?.parts||[];
    const imgPart=parts.find(p=>{
      const inline=p.inlineData||p.inline_data;
      return inline?.mimeType?.startsWith('image/')||inline?.mime_type?.startsWith('image/');
    });

    if(!imgPart){
      const textPart=parts.find(p=>p.text)?.text;
      const apiError=geminiJson?.error?.message||functionResponse?.error||textPart||'Kein Bild zurückgegeben.';
      throw new Error(apiError);
    }

    const inline=imgPart.inlineData||imgPart.inline_data;
    const resultMime=inline.mimeType||inline.mime_type||'image/png';
    const resultData=inline.data;

    if(!resultData){throw new Error('Bilddaten fehlen in der Gemini-Antwort.')}

    if(functionResponse?.simulations_used!=null){const master=currentUser._masterUser||currentUser;master.simulations_used=functionResponse.simulations_used;updateCredits();}

    const resultBase64=`data:${resultMime};base64,${resultData}`;
    currentResultBase64=resultBase64;
    const imgAfterEl2=document.getElementById('imgAfter');
    imgAfterEl2.src=resultBase64;imgAfterEl2.style.display='block';
    const nachLbl2=document.getElementById('resultNachLbl');if(nachLbl2)nachLbl2.style.display='block';
    genLoading.style.display='none';
    document.getElementById('shareRow').style.display='flex';
    const bdv=document.getElementById('btnSaveDevice');if(bdv){bdv.textContent='⬇ Auf Gerät';bdv.className='btn-share download';bdv.disabled=false;}
    ensurePhotosBtn();
    const bgal=document.getElementById('btnSaveModels');if(bgal){bgal.textContent='📁 In Galerie';bgal.className='btn-share models';bgal.disabled=false;}
    const _sms2=document.getElementById('saveModelsStatus');if(_sms2)_sms2.style.display='none';
    appendSimulationResult(capturedPhoto,resultBase64,_selectedAngle||'Simulation');

  }catch(e){
    genLoading.style.display='none';
    showGenError('Verbindungsfehler: '+(e?.message||String(e)));
  }finally{
    genBtn.disabled=false;
  }
}

function getAngleLabel(angleValue){
  const found=(_currentAngles||[]).find(a=>a.v===angleValue);
  return found?.label||angleValue||'Simulation';
}
function appendSimulationResult(beforeSrc,afterSrc,angleValue){
  const idx=simulationResults.length+1;
  const item={id:'sim_'+Date.now()+'_'+idx,before:beforeSrc,after:afterSrc,angle:angleValue,label:getAngleLabel(angleValue),createdAt:new Date().toISOString()};
  simulationResults.push(item);
  const hist=document.getElementById('simulationHistory');
  if(hist){
    const card=document.createElement('div');
    card.className='sim-result-card';
    card.dataset.resultId=item.id;
    card.innerHTML=`
      <div class="sim-result-title">Simulation ${idx} · ${escapeHtml(item.label)}</div>
      <div class="ba-grid">
        <div class="ba-item" style="cursor:zoom-in"><img src="${item.before}" alt="Vorher"><span class="ba-label">Vorher</span></div>
        <div class="ba-item" style="cursor:zoom-in"><img src="${item.after}" alt="Nachher"><span class="ba-label after-lbl">Nachher</span></div>
      </div>
      <div class="share-row">
        <button class="btn-share download" type="button">⬇ Diese Simulation speichern</button>
      </div>`;
    const imgs=card.querySelectorAll('img');
    imgs[0].addEventListener('click',()=>openLightbox(item.before));
    imgs[1].addEventListener('click',()=>openLightbox(item.after));
    card.querySelector('button').addEventListener('click',()=>downloadSimulationResult(item));
    hist.appendChild(card);
  }
}
function downloadSimulationResult(item){
  if(!item?.after)return;
  const a=document.createElement('a');
  a.href=item.after;
  a.download=`logic-style-${(item.label||'simulation').replace(/\s+/g,'-').toLowerCase()}-${Date.now()}.png`;
  a.click();
}
function downloadAllSimulationResults(){
  if(!simulationResults.length)return;
  simulationResults.forEach((item,i)=>setTimeout(()=>downloadSimulationResult(item),i*250));
}

function showGenError(msg){const el=document.getElementById('genError');if(!el)return;el.textContent='❌ '+msg;el.classList.add('show');const gl=document.getElementById('genLoading');if(gl)gl.style.display='none'}

/* ── SAVE & SHARE ── */
function saveResult(){
  const src=currentResultBase64||simulationResults.at(-1)?.after||document.getElementById('imgAfter')?.src;
  if(!src||src===window.location.href||src==='')return;
  const a=document.createElement('a');a.href=src;a.download=`logic-style-${Date.now()}.png`;a.click();
  const btn=document.getElementById('btnSaveDevice');
  if(btn){btn.textContent='✅ Auf Gerät gespeichert';btn.className='btn-share download saved-ok';btn.disabled=true;}
}

/* ── IN PHOTOS SPEICHERN (Share Sheet → Fotos-App) — gilt für beide Apps ── */
function ensurePhotosBtn(){
  const row=document.getElementById('shareRow');
  if(!row)return null;
  let btn=document.getElementById('btnSavePhotos');
  if(!btn){
    btn=document.createElement('button');
    btn.id='btnSavePhotos';
    btn.type='button';
    btn.onclick=saveToPhotos;
    const dev=document.getElementById('btnSaveDevice');
    row.insertBefore(btn,dev?dev.nextSibling:row.firstChild);
  }
  btn.textContent='📸 In Photos speichern';
  btn.className='btn-share download';
  btn.disabled=false;
  return btn;
}
async function saveToPhotos(){
  const src=currentResultBase64||simulationResults.at(-1)?.after||document.getElementById('imgAfter')?.src;
  if(!src||src===window.location.href||src==='')return;
  const btn=document.getElementById('btnSavePhotos');
  try{
    const res=await fetch(src);
    const blob=await res.blob();
    const file=new File([blob],`logic-style-${Date.now()}.png`,{type:blob.type||'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({files:[file]});
      if(btn){btn.textContent='✅ In Photos gespeichert';btn.className='btn-share download saved-ok';}
    }else{
      // Kein Share-Sheet (z.B. Desktop-Browser) → normaler Download
      saveResult();
      if(btn){btn.textContent='✅ Als Download gespeichert';btn.className='btn-share download saved-ok';}
    }
  }catch(e){
    if(e&&e.name==='AbortError')return;
    saveResult();
  }
}

/* ── ADMIN GALLERY SAVE ── */
/* Datenschutz: In der Kunden-App (Logic_Haare_Farbe_Bart.html) werden generierte
   Bilder NIE gespeichert. Uploads sind hart auf die Admin-Seiten beschränkt. */
function isImageSaveAllowed(){
  const page=(location.pathname||'').split('/').pop().replace(/\.html$/i,'');
  return page==='Admin_Software'||page==='Admin_Gallery';
}
async function uploadBase64ToStorage(base64,path){
  if(!isImageSaveAllowed())throw new Error('Bild-Speicherung ist in der Kunden-App aus Datenschutzgründen deaktiviert.');
  const mime=base64.split(';')[0].split(':')[1]||'image/png';
  const byteStr=atob(base64.split(',')[1]);
  const arr=new Uint8Array(byteStr.length);
  for(let i=0;i<byteStr.length;i++)arr[i]=byteStr.charCodeAt(i);
  const blob=new Blob([arr],{type:mime});
  const ext=mime.includes('png')?'png':'jpg';
  const fullPath=`${path}.${ext}`;
  const{error}=await getSB().storage.from('simulations').upload(fullPath,blob,{contentType:mime,upsert:true});
  if(error)throw new Error(`Storage upload failed [${fullPath}]: ${error.message}`);
  const{data:urlData}=getSB().storage.from('simulations').getPublicUrl(fullPath);
  return urlData.publicUrl;
}

function getModeForSave(){
  if(currentMode==='female')    return 'female/hair_cut';
  if(currentMode==='male')      return 'male/hair_cut';
  if(currentMode==='beard')     return 'male/beard_color';
  if(currentMode==='treatment') return 'female/keratin';
  if(currentMode==='color'){
    const code=parseInt(_currentColorItem?.id||'0');
    if(code>=368&&code<=371) return 'male/hair_color';
    if(code>=372&&code<=377) return 'male/beard_color';
    return 'female/hair_color';
  }
  return 'female/hair_cut';
}

function getDbModeForSave(){
  if(currentMode==='female')    return 'female';
  if(currentMode==='male')      return 'male';
  if(currentMode==='beard')     return 'beard';
  if(currentMode==='treatment') return 'behandlung';
  if(currentMode==='color')     return 'color';
  return currentMode||'female';
}

function getModelIdForSave(){
  if(currentMode==='color'||currentMode==='treatment') return String(_currentColorItem?.id||'');
  return _currentModelId||currentStyleId||'';
}

async function saveToModels(){
  const btn=document.getElementById('btnSaveModels');
  const statusEl=document.getElementById('saveModelsStatus');
  const showErr=(msg)=>{
    if(statusEl){statusEl.style.display='block';statusEl.style.background='rgba(248,113,113,0.08)';statusEl.style.color='#f87171';statusEl.style.border='1px solid rgba(248,113,113,0.3)';statusEl.style.borderRadius='10px';statusEl.textContent='❌ '+msg;}
    if(btn){btn.disabled=false;btn.textContent='📁 In Galerie';}
  };
  const page=(location.pathname||'').split('/').pop().replace(/\.html$/i,'');
  const isAdminPage=page==='Admin_Software'||page==='Admin_Gallery';
  if(!isAdminPage){showErr('Nur auf Admin-Seite verfügbar (Seite: '+page+')');return;}
  if(!currentUser){showErr('Bitte zuerst als Admin einloggen');return;}
  if(!currentUser.is_admin){showErr('Nur Admins können in die Galerie speichern');return;}
  const beforeSrc=simulationResults.at(-1)?.before||capturedPhoto;
  const afterSrc=currentResultBase64||simulationResults.at(-1)?.after||document.getElementById('imgAfter')?.src;
  if(!beforeSrc||!afterSrc){showErr('Kein Bild vorhanden');return;}
  if(btn){btn.disabled=true;btn.textContent='⏳ Speichern…';}
  if(statusEl)statusEl.style.display='none';
  try{
    const ts=Date.now();
    const seg=getModeForSave();
    const dbMode=getDbModeForSave();
    const modelId=getModelIdForSave()||currentStyleId||'unknown';
    const beforeUrl=await uploadBase64ToStorage(beforeSrc,`gallery/${seg}/${modelId}/${ts}_before`);
    const afterUrl=await uploadBase64ToStorage(afterSrc,`gallery/${seg}/${modelId}/${ts}_after`);
    const{error}=await getSB().from('model_gallery').insert({
      model_id:modelId,mode:dbMode,image_url:afterUrl,
      before_url:beforeUrl,after_url:afterUrl,
      pair_label:currentStyleName||modelId,
      review_status:'approved',is_public:true,
      customer_id:null,
      sort_order:Math.floor(Date.now()/1000000)
    });
    if(error)throw new Error('model_gallery insert: '+error.message);
    if(btn){btn.textContent='✅ In Galerie';btn.className='btn-share models saved-ok';btn.disabled=true;}
    if(statusEl){statusEl.style.display='block';statusEl.style.background='rgba(74,222,128,0.08)';statusEl.style.color='#4ade80';statusEl.style.border='1px solid rgba(74,222,128,0.3)';statusEl.style.borderRadius='10px';statusEl.textContent='✅ Erfolgreich in Galerie gespeichert';}
    loadGalleryCounts();
  }catch(e){
    if(btn){btn.textContent='📁 In Galerie';btn.disabled=false;}
    if(statusEl){statusEl.style.display='block';statusEl.style.background='rgba(248,113,113,0.08)';statusEl.style.color='#f87171';statusEl.textContent='❌ Fehler: '+e.message;}
  }
}

/* ── BATCH-GENERIERUNG (nur Admin) — ein Foto durch alle Modelle eines Bereichs ── */
let _batchPhoto=null, _batchRunning=false, _batchStop=false;
function _batchSleep(ms){return new Promise(r=>setTimeout(r,ms));}
function _batchLog(msg,ok){
  const el=document.getElementById('batchLog');if(!el)return;
  const line=document.createElement('div');line.textContent=msg;line.style.color=ok?'#4ade80':(ok===false?'#f87171':'#cbd5e1');
  el.insertBefore(line,el.firstChild);
}
function _batchSetStatus(msg){const el=document.getElementById('batchStatus');if(el)el.textContent=msg;}
function _batchSetBar(pct){const el=document.getElementById('batchBar');if(el)el.style.width=Math.max(0,Math.min(100,pct))+'%';}
function onBatchPhoto(input){
  const f=input&&input.files&&input.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{_batchPhoto=e.target.result;const p=document.getElementById('batchPreview');if(p){p.src=_batchPhoto;p.style.display='block';}renderBatchPanel();};
  r.readAsDataURL(f);
}
const BATCH_LABELS={male:'Herren',beard:'Bart',female:'Damen',color:'Farbe',treatment:'Behandlung'};
/* Sammelt alle Modelle/Services des aktuellen Bereichs für den Batch — genau das,
   was renderCurrent für diesen Modus + Geschlecht anzeigt. withPrompts=true baut
   zusätzlich den KI-Prompt (identisch zum normalen Simulationspfad). */
function _batchCollect(withPrompts){
  const mode=currentMode;const out=[];
  if(mode==='female'||mode==='male'||mode==='beard'){
    const hairType=mode==='beard'?'beard and facial hair':'hair on the head';
    let modifier='';
    if(mode==='beard'){const it=MUSTACHE_STYLES.find(x=>x.id===(_selectedMustache||'natural'));if(it)modifier=`Schnurrbart / Mustache: ${it.name}. ${it.prompt}`;}
    (data[mode]?.models||[]).forEach(m=>{
      if(_deletedModels.has(canonKey(mode,m.id)))return;
      const name=effectiveModelName(mode,m.id,m.name);
      const o={id:m.id,name:name};
      if(withPrompts){const spec=effectiveModelPrompt(mode,m.id,englishSpecs[mode]?.[m.id]||englishSpecs[m.id]||name);o.prompt=buildHairPrompt(spec,hairType,'360°',modifier);}
      out.push(o);
    });
    return out;
  }
  if(mode==='color'||mode==='treatment'){
    const canonMode=mode==='treatment'?'behandlung':mode;
    const sections=(mode==='color'?STYLE_FARBE_SECTIONS:STYLE_BEHANDLUNG_SECTIONS).filter(s=>{
      if(s.title==='Dauerwelle Damen')return currentGender==='female';
      if(s.title==='Dauerwelle Herren')return currentGender==='male';
      return true;
    });
    sections.forEach(sec=>{(sec.items||[]).forEach(it=>{
      const id=it.id||serviceIdFromVal(it.val);
      if(_deletedModels.has(`${canonMode}|${String(id)}`))return;
      const name=effectiveModelName(mode,id,it.name);
      const o={id:id,name:name};
      if(withPrompts){const val=effectiveModelPrompt(mode,id,it.val);const hairType=/beard hair only|bartfarbe|beard color|salt-and-pepper beard/i.test(val)?'beard and facial hair':'hair on the head';o.prompt=buildColorPrompt(val,hairType,'360°','');}
      out.push(o);
    })});
    return out;
  }
  return out;
}
function renderBatchPanel(){
  const host=document.getElementById('batchPanel');if(!host)return;
  const supported=['female','male','beard','color','treatment'].includes(currentMode);
  if(!isImageSaveAllowed()||!supported){host.style.display='none';return;}
  host.style.display='block';
  const list=_batchCollect(false);
  const cnt=document.getElementById('batchCount');if(cnt)cnt.textContent=String(list.length);
  const lbl=document.getElementById('batchModeLbl');
  if(lbl)lbl.textContent=BATCH_LABELS[currentMode]||currentMode;
}
function stopBatch(){_batchStop=true;_batchSetStatus('⏹ Wird gestoppt…');}
async function _batchSaveGallery(mode,modelId,modelName,beforeB64,afterB64){
  const segMap={female:'female/hair_cut',male:'male/hair_cut',beard:'male/beard_color',color:'color/service',treatment:'behandlung/service'};
  const seg=segMap[mode]||'male/hair_cut';const ts=Date.now();
  const beforeUrl=await uploadBase64ToStorage(beforeB64,`gallery/${seg}/${modelId}/${ts}_before`);
  const afterUrl=await uploadBase64ToStorage(afterB64,`gallery/${seg}/${modelId}/${ts}_after`);
  const{error}=await getSB().from('model_gallery').insert({
    model_id:String(modelId),mode:mode,image_url:afterUrl,before_url:beforeUrl,after_url:afterUrl,
    pair_label:modelName||String(modelId),review_status:'approved',is_public:true,customer_id:null,
    sort_order:Math.floor(Date.now()/1000000)
  });
  if(error)throw new Error('model_gallery: '+error.message);
}
async function startBatch(){
  if(_batchRunning)return;
  if(!isImageSaveAllowed()){alert('Batch nur auf der Admin-Seite verfügbar.');return;}
  if(!currentUser||!currentUser.is_admin){alert('Nur Admins können die Batch-Generierung starten.');return;}
  await touchSession();
  if(!currentSessionId){alert('Sitzung abgelaufen. Bitte neu anmelden und Batch erneut starten.');return;}
  const mode=currentMode;
  const list=_batchCollect(true);
  if(!list.length){alert('Für diesen Bereich gibt es keine Modelle.');return;}
  if(!_batchPhoto){alert('Bitte zuerst ein Foto hochladen.');return;}
  const photoParts=_batchPhoto.match(/^data:([^;]+);base64,(.+)$/);
  if(!photoParts){alert('Ungültiges Bildformat.');return;}
  if(!confirm(`Batch startet für ${list.length} ${BATCH_LABELS[mode]||mode}-Modelle.\nJede Generierung verbraucht 1 Simulation/Credit. Fortfahren?`))return;
  const imageMime=photoParts[1], imageData=photoParts[2];
  const skipExisting=document.getElementById('batchSkip')?.checked;
  _batchRunning=true;_batchStop=false;
  const startBtn=document.getElementById('batchStart'),stopBtn=document.getElementById('batchStop');
  if(startBtn){startBtn.disabled=true;startBtn.textContent='⏳ Läuft…';}
  if(stopBtn)stopBtn.disabled=false;
  const progWrap=document.getElementById('batchProgWrap');if(progWrap)progWrap.style.display='block';
  const logEl=document.getElementById('batchLog');if(logEl)logEl.innerHTML='';
  const total=list.length;let done=0,ok=0,fail=0,skip=0;
  for(const m of list){
    if(_batchStop)break;
    const name=m.name;
    _batchSetStatus(`${done}/${total} · ${ok} ✓ · ${skip} übersprungen · ${fail} ✗ — aktuell: ${name}`);
    if(skipExisting&&(_galleryCountsByMode[`${galCanonMode(mode)}|${m.id}`]||0)>0){skip++;done++;_batchSetBar(done/total*100);_batchLog(`↷ ${name} (hat bereits ein Bild)`);continue;}
    const prompt=m.prompt;
    try{
      await touchSession();
      const{data:fr,error}=await getSB().functions.invoke(IMAGE_FUNCTION_NAME,{body:{imageData,imageMime,prompt,meta:{sessionId:currentSessionId||null,userId:currentUser?.id||null,styleId:m.id,styleName:name,mode:mode,angle:'360°',intensity:null,batch:true}}});
      if(error){
        let body='';try{if(error.context&&typeof error.context.json==='function'){const j=await error.context.json();body=j?.error||j?.message||'';}}catch(_e){}
        const comb=((error.message||'')+' '+body);
        if(comb.includes('credit_exhausted')){_batchLog('✗ Keine Credits mehr — Batch gestoppt.',false);_batchSetStatus('❌ Keine Credits mehr. Batch gestoppt.');break;}
        if(comb.includes('account_inactive')){_batchLog('✗ Konto deaktiviert — Batch gestoppt.',false);break;}
        fail++;done++;_batchSetBar(done/total*100);_batchLog(`✗ ${name}: ${body||error.message||'Fehler'}`,false);await _batchSleep(800);continue;
      }
      const gj=fr?.data||fr;const parts=gj?.candidates?.[0]?.content?.parts||[];
      const imgPart=parts.find(p=>{const inl=p.inlineData||p.inline_data;return (inl?.mimeType||inl?.mime_type||'').startsWith('image/');});
      if(fr?.simulations_used!=null){const master=currentUser._masterUser||currentUser;master.simulations_used=fr.simulations_used;updateCredits();}
      if(!imgPart){fail++;done++;_batchSetBar(done/total*100);_batchLog(`✗ ${name}: kein Bild zurückgegeben`,false);await _batchSleep(800);continue;}
      const inl=imgPart.inlineData||imgPart.inline_data;
      const after=`data:${inl.mimeType||inl.mime_type||'image/png'};base64,${inl.data}`;
      await _batchSaveGallery(mode,m.id,name,_batchPhoto,after);
      ok++;done++;_batchSetBar(done/total*100);_batchLog(`✓ ${name}`,true);
    }catch(e){fail++;done++;_batchSetBar(done/total*100);_batchLog(`✗ ${name}: ${e.message||e}`,false);}
    await _batchSleep(700);
  }
  _batchRunning=false;
  if(startBtn){startBtn.disabled=false;startBtn.textContent='▶ Starten';}
  if(stopBtn)stopBtn.disabled=true;
  try{await loadGalleryCounts();renderCurrent();}catch(_e){}
  _batchSetStatus(`Fertig: ${ok} erstellt · ${skip} übersprungen · ${fail} Fehler${_batchStop?' · (gestoppt)':''}`);
}

/* ── CAMERA GUIDE ── */
function openCamera(){document.getElementById('cameraModal').classList.add('open')}
function closeCamera(){document.getElementById('cameraModal').classList.remove('open')}

/* ── PW CHANGE ── */
function openChangePw(){document.getElementById('changePwModal').classList.add('open')}
function closeChangePw(){
  if(forcePasswordChange)return;
  document.getElementById('changePwModal').classList.remove('open');
  document.getElementById('pw-new').value='';document.getElementById('pw-confirm').value='';
  const m=document.getElementById('pwMsg');m.className='pw-msg';m.textContent='';
}
async function doChangePw(){
  const pw1=document.getElementById('pw-new').value,pw2=document.getElementById('pw-confirm').value;
  const msg=document.getElementById('pwMsg');msg.className='pw-msg';
  const _WEAK=new Set(['123456','12345678','123456789','password','passwort','qwerty','abc123','111111','admin123']);
  const _pwOk=pw1.length>=10&&/[a-z]/.test(pw1)&&/[A-Z]/.test(pw1)&&/[0-9]/.test(pw1)&&/[^a-zA-Z0-9]/.test(pw1)&&!_WEAK.has(pw1.toLowerCase());
  if(!pw1||!_pwOk){msg.textContent='Bitte verwenden Sie ein stärkeres Passwort: mindestens 10 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.';msg.classList.add('show','err');return}
  if(pw1!==pw2){msg.textContent='Passwörter stimmen nicht überein.';msg.classList.add('show','err');return}
  const _cpResp=await fetch(`${SB_URL}/functions/v1/change-password`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},body:JSON.stringify({session_id:currentSessionId,new_password:pw1,mode:'forced'})});
  const _cpResult=await _cpResp.json();
  if(!_cpResult.success){msg.textContent='Fehler: '+(_cpResult.message||_cpResult.error);msg.classList.add('show','err');return}
  currentUser.must_change_password=false;forcePasswordChange=false;
  msg.textContent='✅ Passwort geändert!';msg.classList.add('show','ok');
  setTimeout(()=>{document.getElementById('changePwModal').classList.remove('open');msg.className='pw-msg'},1800);
}

/* ── MISC ── */
function toggleLoginPw(){const inp=document.getElementById('loginPass');inp.type=inp.type==='password'?'text':'password';inp.nextElementSibling.textContent=inp.type==='password'?'👁':'🙈'}
function toggleCpPw(id,btnId){const inp=document.getElementById(id);const btn=document.getElementById(btnId);inp.type=inp.type==='password'?'text':'password';btn.textContent=inp.type==='password'?'👁':'🙈'}

/* ── GALLERY ── */
async function openGallery(modelId,modelName,event){
  if(event&&event.stopPropagation)event.stopPropagation();
  _currentGalleryModelId=modelId;_currentGalleryModelName=modelName;
  document.getElementById('galleryTitle').textContent=modelName;
  document.getElementById('gallerySubTitle').textContent='Echte Simulationen aus Logic Style';
  document.getElementById('galleryImgs').innerHTML='<div class="gallery-empty"><div class="gallery-empty-icon">⏳</div><p>Wird geladen…</p></div>';
  document.getElementById('galleryModal').classList.add('open');
  const imgs=document.getElementById('galleryImgs');
  try{
    // Nur Bilder aus dem aktuellen Bereich zeigen — gleiche id in Farbe/Damen/Bart nicht vermischen
    const _cm=galCanonMode(currentMode);
    const _modeIn=_cm==='behandlung'?['behandlung','treatment']:(_cm?[_cm]:null);
    let _q=getSB().from('model_gallery').select('*').eq('model_id',modelId);
    if(_modeIn)_q=_q.in('mode',_modeIn);
    let{data:rows,error}=await _q.order('sort_order');
    // Detect color/behandlung IDs across all ranges (not just 300-379)
    const _allColorIds=new Set([VOLLFARBEN,BALAYAGE,OMBRE,HIGHLIGHTS,MONEY_PIECE,ROOT_SERVICES,
      TONING,BLONDE_SERVICES,GREY_SERVICES,FASHION_COLOR,MENS_COLOR,BART_FARBEN].flat().map(x=>x.id));
    const _allBehIds=new Set(BEHANDLUNGEN.map(x=>x.id));
    const isColorCode=_allColorIds.has(modelId);
    const isBehCode=_allBehIds.has(modelId);
    if((!rows||!rows.length)&&(isColorCode||isBehCode)){
      // Fallback 1: match by pair_label containing the name
      const{data:rows2}=await getSB().from('model_gallery').select('*')
        .ilike('pair_label','%'+modelName+'%').order('sort_order').limit(20);
      if(rows2&&rows2.length)rows=rows2;
      if(!rows||!rows.length){
        // Fallback 2: match model_id by tech_ or color_ prefix + normalized name
        const nameNorm=normColorId(modelName).substring(0,20);
        const nameShort=nameNorm.substring(0,12);
        const{data:rows3}=await getSB().from('model_gallery').select('*')
          .or(`model_id.like.tech_${nameShort}%,model_id.like.color_${nameShort}%,model_id.like.%${nameShort}%`)
          .order('sort_order').limit(20);
        if(rows3&&rows3.length)rows=rows3;
      }
      if(!rows||!rows.length){
        // Fallback 3: match by numeric id inside style_code
        const{data:rows4}=await getSB().from('model_gallery').select('*')
          .or(`style_code.like.%:${modelId},%,style_code.eq.color:${modelId},style_code.like.%${modelId}%`)
          .order('sort_order').limit(20);
        if(rows4&&rows4.length)rows=rows4;
      }
    }
    rows=(rows||[]).filter(r=>String(r.customer_id||'')!=='BASIS');  // Basis-Referenzbilder nie öffentlich zeigen
    if(!rows||!rows.length){
      imgs.innerHTML=`<div class="gallery-empty"><div class="gallery-empty-icon">🖼</div><p>Noch keine Beispielbilder</p><p style="font-size:11px;color:#475569;margin-top:6px">Bilder werden laufend hinzugefügt</p></div>`;
      return;
    }
    imgs.innerHTML=rows.map(r=>{
      const hasPair=r.before_url&&r.after_url;
      if(hasPair){
        const beforeUrl=String(r.before_url||'').replace(/'/g,'&#39;');
        const afterUrl=String(r.after_url||'').replace(/'/g,'&#39;');
        return`<div class="gallery-pair-row"><div class="gallery-pair-cell" onclick="event.stopPropagation();openLightbox('${beforeUrl}')"><img src="${beforeUrl}" loading="lazy"><span class="gallery-pair-cell-tag vor">VORHER</span></div><div class="gallery-pair-cell" onclick="event.stopPropagation();openLightbox('${afterUrl}')"><img src="${afterUrl}" loading="lazy"><span class="gallery-pair-cell-tag nach">NACHHER</span></div></div>`;
      }
      const singleUrl=String(r.image_url||r.after_url||'').replace(/'/g,'&#39;');
      return`<div class="gallery-pair-single" onclick="openLightbox('${singleUrl}')"><img src="${singleUrl}" loading="lazy"></div>`;
    }).join('');
  }catch(e){
    imgs.innerHTML=`<div class="gallery-empty"><div class="gallery-empty-icon">❌</div><p>${e.message||'Fehler beim Laden'}</p></div>`;
  }
}

function closeGallery(){document.getElementById('galleryModal').classList.remove('open')}
function startSimFromGallery(){closeGallery();openSim(_currentGalleryModelId,null)}
function openLightbox(url){document.getElementById('lightboxImg').src=url;document.getElementById('lightbox').classList.add('open')}
function closeLightbox(){document.getElementById('lightbox').classList.remove('open');document.getElementById('lightboxImg').src=''}

/* ── EVENT LISTENERS ── */
['cameraModal'].forEach(id=>{document.getElementById(id).addEventListener('click',e=>{if(e.target.id===id)closeCamera()})});
document.getElementById('changePwModal').addEventListener('click',e=>{if(e.target.id==='changePwModal')closeChangePw()});
document.getElementById('galleryModal').addEventListener('click',e=>{if(e.target.id==='galleryModal')closeGallery()});
document.getElementById('genModal').addEventListener('click',e=>{if(e.target.id==='genModal')closeGenModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLightbox();closeGallery();closeGenModal();closeCamera();closeCreditOffer()}});
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
document.getElementById('loginUser').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('loginPass').focus()});
window.addEventListener('resize',updateTopbarPad);
