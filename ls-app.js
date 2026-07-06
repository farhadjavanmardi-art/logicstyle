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
let _galleryThumbs={};  // model_id → {before, after} آخرین جفت شبیه‌سازی
let _selectedAdvancedOptions={};

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
    updateCredits();switchGender('female');startHeartbeat();loadGalleryCounts();
    forcePasswordChange=false;
    if(result.user.must_change_password){forcePasswordChange=true;setTimeout(()=>openChangePw(),500)}
  }catch(e){showLoginErr('Fehler: '+e.message)}finally{resetBtn()}
}
function showLoginErr(msg){const el=document.getElementById('loginError');el.textContent='❌ '+msg;el.classList.add('show')}
function resetBtn(){const btn=document.getElementById('loginBtn');btn.disabled=false;btn.textContent='→ Anmelden'}
async function doLogout(){
  stopHeartbeat();
  if(currentSessionId)try{await getSB().from('sessions').delete().eq('id',currentSessionId)}catch(e){}
  localStorage.removeItem('ls_face_session_id');
  currentUser=null;currentSessionId=null;capturedPhoto=null;
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
  if(pct>=1){bar.innerHTML='⛔ Klinik-Limit erreicht.';bar.style.display='block'}
  else if(pct>=0.7){bar.innerHTML=`⚠️ ${Math.round(pct*100)}% verbraucht — noch ${rem} Simulationen`;bar.style.display='block'}
  else bar.style.display='none';
  setTimeout(updateTopbarPad,10);
}
async function deductCredit(){
  if(currentUser?.is_admin)return;
  const master=currentUser._masterUser||currentUser;
  master.simulations_used++;updateCredits();
  try{await getSB().from('users').update({simulations_used:master.simulations_used}).eq('id',master.id)}catch(e){master.simulations_used--;updateCredits()}
}
function getRemaining(){if(currentUser?.is_admin)return 999999;const master=currentUser._masterUser||currentUser;return Math.max(0,Number(master.simulations_limit||0)-Number(master.simulations_used||0))}

/* ── MODE / CATALOG ── */
function modelMatchesGender(m){ return true; }

const MODE_TITLES={
  female:['Logic Style · Damen','Damenhaarschnitte · Styling · Trendlooks'],
  male:['Logic Style · Herren','Herrenhaarschnitte · Barber · Trendlooks'],
  beard:['Logic Style · Bart','Bartformen · Konturen · Grooming'],
  color:['Logic Style · Farbe','Balayage · Blond · Highlights · Money Piece · Toning · Grey'],
  treatment:['Logic Style · Behandlung','Keratin · Pflege · Repair · Extensions · Perm']
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
  const cfg=CAT_NAV[mode];
  if(!cfg||cfg.length===0){nav.style.display='none';return}
  nav.style.display='flex';
  nav.innerHTML=cfg.map((c,i)=>`<button class="cat-nav-btn${i===0?' active':''}" onclick="scrollToCat('${makeCatId(c.cat)}',this)"><span class="cnl">${c.label}</span></button>`).join('');
  setTimeout(updateTopbarPad,30);
}

/* ساختار دو سطحی: جنسیت → زیرمجموعه */
const SUBCATS={
  female:[
    {mode:'female',   label:'Haarschnitt'},
    {mode:'color',    label:'Farbe'},
    {mode:'treatment',label:'Keratin & Perm'},
  ],
  male:[
    {mode:'male',     label:'Haarschnitt'},
    {mode:'beard',    label:'Bart'},
    {mode:'treatment',label:'Keratin & Perm'},
  ],
};

function switchGender(g){
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

async function loadGalleryCounts(){
  try{
    const{data}=await getSB().from('model_gallery').select('model_id,mode,pair_label,before_url,after_url,image_url,sort_order');
    _galleryCounts={};
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
      const mid=r.model_id||'';
      const code=/^\d+$/.test(mid)?mid:(_nameToCode[normColorId(mid)]||mid);
      _galleryCounts[code]=(_galleryCounts[code]||0)+1;
      if(code!==mid)_galleryCounts[mid]=(_galleryCounts[mid]||0)+1;
      // ذخیره جفت before/after برای thumbnail — آخرین (بیشترین sort_order) نگه داشته می‌شود
      const bef=r.before_url||'', aft=r.after_url||r.image_url||'';
      if(aft){
        const so=r.sort_order||0;
        [code,mid].forEach(k=>{
          if(!k)return;
          if(!_galleryThumbs[k] || so>=(_galleryThumbs[k]._so||0)){
            _galleryThumbs[k]={before:bef,after:aft,_so:so};
          }
        });
      }
    });
    renderCurrent();
  }catch(e){_galleryCounts={}}
}

function renderCurrent(){
  if(currentMode==='color')return renderServiceMode(STYLE_FARBE_SECTIONS,'color');
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

/* thumbnail کوچک عکس نمونه جلوی هر مدل (آخرین شبیه‌سازی) */
function buildThumb(id){
  const t=_galleryThumbs[id];
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
  const t=_galleryThumbs[id];
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
  const cats=[...new Set(d.models.map(m=>m.cat))];let total=0;
  cats.forEach(cat=>{
    const items=d.models.filter(m=>m.cat===cat&&(m.name.toLowerCase().includes(term)||String(m.id).includes(term)||cat.toLowerCase().includes(term)));
    if(!items.length)return;total+=items.length;
    const block=document.createElement('div');block.className='cat-block';block.id=makeCatId(cat);
    block.innerHTML=`<div class="cat-header"><span class="cat-label">${cat}</span><span class="cat-count">${items.length}</span></div>`;
    const list=document.createElement('div');list.className='model-list';
    items.forEach(m=>{
      const safeName=htmlSafe(m.name);const gc=_galleryCounts[m.id]||0;
      const row=document.createElement('div');row.className='model-row';
      row.innerHTML=`${buildThumb(m.id)||'<div class="model-dot"></div>'}<div class="model-info"><div class="model-name"><span class="model-num">#${m.id}</span>${m.name}</div></div><div class="model-row-right">${buildRefLinks(m.name)}<button class="btn-simulate" onclick="openSim('${m.id}',event)">Simulieren ▸</button></div>`;
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
  sections.forEach(sec=>{
    const items=sec.items.filter(item=>!term||item.name.toLowerCase().includes(term)||sec.title.toLowerCase().includes(term)||item.val.toLowerCase().includes(term));
    if(!items.length)return;total+=items.length;
    const block=document.createElement('div');block.className='cat-block';block.id=makeCatId(sec.title);
    block.innerHTML=`<div class="cat-header"><span class="cat-label">${sec.title}</span><span class="cat-count">${items.length}</span></div>`;
    const list=document.createElement('div');list.className='model-list';
    items.forEach(item=>{
      const id=item.id||serviceIdFromVal(item.val);const gc=(_galleryCounts[id]||0)+(_galleryCounts[serviceIdFromVal(item.val)]||0);const safeName=htmlSafe(item.name);const safeVal=htmlSafe(item.val);
      const row=document.createElement('div');row.className='model-row';
      row.innerHTML=`${buildThumb(id)||(item.icon?`<div class="model-icon-box">${item.icon}</div>`:'<div class="model-dot"></div>')}<div class="model-info"><div class="model-name"><span class="model-num">#${item.id||''}</span>${item.name}</div></div><div class="model-row-right">${buildRefLinks(item.name)}<button class="btn-simulate" onclick="openSim('${item.id||id}',event)">Simulieren ▸</button></div>`;
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
  const isBeard = mode==='beard' || /beard hair only|bartfarbe|beard color|salt-and-pepper beard/i.test(serviceVal||'');
  if(isBeard)return [
    {v:'FRONT VIEW',label:'Vorne',icon:'👤',hint:'Direkt zur Kamera, Bart vollständig sichtbar'},
    {v:'45 DEGREE LEFT VIEW',label:'45° links',icon:'↖️',hint:'45 Grad links, Wange und Kontur sichtbar'},
    {v:'45 DEGREE RIGHT VIEW',label:'45° rechts',icon:'↗️',hint:'45 Grad rechts, Wange und Kontur sichtbar'}
  ];
  return [
    {v:'FRONT VIEW',label:'Vorne',icon:'👤',hint:'Direkt zur Kamera, Haaransatz sichtbar'},
    {v:'BACK VIEW',label:'Hinten',icon:'🔙',hint:'Kopfhöhe, Nacken und Längen sichtbar'},
    {v:'LEFT SIDE PROFILE',label:'Links',icon:'⬅️',hint:'Linke Seite, Profil und Kontur sichtbar'}
  ];
}
function openSim(modelId,event){
  if(event)event.stopPropagation();
  _currentModelId=modelId;resetGenState();_farbeMode=false;_selectedFarbeService='';
  const modeData=data[currentMode];let modelObj=modeData?.models?.find(m=>String(m.id)===String(modelId));
  const service=findServiceById(modelId);
  if(service){const smode=STYLE_FARBE_SECTIONS.some(s=>s.items.includes(service))?'color':'treatment';applyService(service.val,service.name,smode,event);return;}
  if(!modelObj)modelObj={id:modelId,name:modelId};
  currentStyleId=modelId;currentStyleName=modelObj.name||modelId;
  _currentAngles=getAnglesForMode(currentMode);
  _selectedAngle=null;_selectedAdvancedOptions={};
  document.getElementById('genModalTitle').textContent=currentStyleName;
  document.getElementById('genModalSub').textContent='Winkel wählen und Foto hochladen';
  const intensityWrap=document.getElementById('intensityWrap');if(intensityWrap)intensityWrap.style.display='none';
  buildAngleGrid();renderAdvancedOptions();document.getElementById('uploadWrap').style.display='none';document.getElementById('genModal').classList.add('open');
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
  document.getElementById('genModalSub').textContent='Winkel wählen und Foto hochladen';
  const intensityWrap=document.getElementById('intensityWrap');if(intensityWrap)intensityWrap.style.display='none';
  buildAngleGrid();renderAdvancedOptions();document.getElementById('uploadWrap').style.display='none';document.getElementById('genModal').classList.add('open');
}

const ADVANCED_OPTION_GROUPS={
 hairDensity:[
  {id:'preserve_original',name:'Originaldichte behalten',prompt:'Strictly preserve the client’s original visible hair density, scalp visibility, hairline, temples, crown coverage, and natural volume. Do not add new hair.'},
  {id:'slightly_styled_fuller',name:'Leicht voller gestylt',prompt:'Use styling direction and texture to make existing hair look slightly more organized and fuller, but do not create new density, lower the hairline, or hide bald/thinning areas.'},
  {id:'no_density_change',name:'Keine Dichteänderung',prompt:'Do not change density, hairline, temple fullness, crown coverage, scalp visibility, or natural volume at all.'}
 ],
 bangs:[
  {id:'auto',name:'Modell-Vorgabe',prompt:'Use only the fringe/bangs behavior specified by the selected style.'},
  {id:'no_bangs',name:'Ohne Pony',prompt:'No bangs. Keep the forehead open. Do not create fringe.'},
  {id:'micro_fringe',name:'Micro Pony',prompt:'Create a very short micro fringe clearly above the eyebrows; the fringe must not touch the eyebrows.'},
  {id:'eyebrow_grazing',name:'Bis Augenbraue',prompt:'Create soft bangs that lightly touch or graze the eyebrows without covering the eyes.'},
  {id:'curtain_bangs',name:'Curtain Bangs',prompt:'Create parted curtain bangs that open around the face and blend into side layers.'},
  {id:'wispy_bangs',name:'Wispy Pony',prompt:'Create thin, airy, soft wispy bangs with visible separation and natural transparency.'},
  {id:'side_swept',name:'Seitlicher Pony',prompt:'Create a side-swept fringe that follows the parting and blends into the side face-frame.'}
 ],
 haircutTexture:[
  {id:'model_default',name:'Modell-Vorgabe',prompt:'Follow the exact texture and finish specified by the selected haircut.'},
  {id:'natural',name:'Natürlich',prompt:'Keep the finish natural, wearable, and close to the client’s original texture.'},
  {id:'matte_textured',name:'Matt texturiert',prompt:'Use matte piece-separated texture with visible individual strands and no wet shine.'},
  {id:'polished',name:'Polished',prompt:'Use a polished salon blow-dry finish with controlled shine and clean silhouette.'},
  {id:'soft_wavy',name:'Soft Wavy',prompt:'Add soft natural wave movement only where compatible with the selected haircut and original hair length.'}
 ],
 hairFade:[
  {id:'model_default',name:'Modell-Vorgabe',prompt:'Use only the fade/taper behavior specified by the selected style.'},
  {id:'no_fade',name:'Kein Fade',prompt:'Do not create a skin fade. Use a natural scissor taper or keep sides proportional.'},
  {id:'low_fade',name:'Low Fade',prompt:'Apply a low fade beginning 1–1.5 fingers above the ear, with a soft low transition zone. Do not push it into a mid fade.'},
  {id:'mid_fade',name:'Mid Fade',prompt:'Apply a mid fade beginning around the mid-parietal area, 2–2.5 fingers above the ear, clearly visible but smoothly blended.'},
  {id:'high_fade',name:'High Fade',prompt:'Apply a high fade beginning around the upper parietal ridge with strong contrast. Do not soften it into a low fade.'},
  {id:'skin_fade',name:'Skin Fade',prompt:'Use a skin fade at the base with realistic clipper graduation into full density; keep it technically clean and not patchy.'},
  {id:'drop_fade',name:'Drop Fade',prompt:'Use a drop fade that curves downward behind the ear and follows the head shape naturally.'},
  {id:'burst_fade',name:'Burst Fade',prompt:'Use a burst fade around the ear with a radial transition, suitable only where it matches the selected style.'}
 ],
 colorIntensity:[
  {id:'soft',name:'Soft / Natürlich',prompt:'Apply the color subtly with low contrast, soft reflect, and natural salon realism.'},
  {id:'medium',name:'Medium / Sichtbar',prompt:'Apply the color with clearly visible but wearable salon dimension.'},
  {id:'bold',name:'Bold / Auffällig',prompt:'Apply the color with stronger visible impact while staying realistic and salon-achievable.'}
 ],
 highlightDensity:[
  {id:'few',name:'Wenige Highlights',prompt:'Use only a few fine highlights, mostly around movement areas and face frame.'},
  {id:'medium',name:'Mittlere Highlights',prompt:'Use a balanced amount of fine highlights throughout the visible hair.'},
  {id:'full',name:'Viele Highlights',prompt:'Use dense but still fine highlights across the visible hair, avoiding chunky stripes.'}
 ],
 brightnessLevel:[
  {id:'slightly_lighter',name:'Etwas heller',prompt:'Lift the result only slightly, around 1 level brighter, keeping natural depth.'},
  {id:'medium_lighter',name:'Deutlich heller',prompt:'Lift the result moderately, around 2–3 levels brighter where technically believable.'},
  {id:'maximum_realistic',name:'Max. realistisch hell',prompt:'Create the brightest believable salon result without fake white, damaged-looking hair, or impossible lift.'}
 ],
 toneDirection:[
  {id:'cool',name:'Kühl',prompt:'Keep the tone cool, muted, ash/beige based, avoiding orange or yellow warmth.'},
  {id:'neutral',name:'Neutral',prompt:'Keep the tone balanced, neither too warm nor too cool.'},
  {id:'warm',name:'Warm',prompt:'Keep the tone warm, golden, caramel, honey, copper, or soft beige depending on the selected color.'}
 ],
 colorPlacement:[
  {id:'service_default',name:'Service-Vorgabe',prompt:'Follow the exact placement described by the selected color service.'},
  {id:'face_frame',name:'Face Frame',prompt:'Concentrate visible brightness around the face frame while keeping the rest softer.'},
  {id:'mid_ends',name:'Mitte & Spitzen',prompt:'Place most brightness through mid-lengths and ends, preserving natural root depth.'},
  {id:'full_head',name:'Full Head',prompt:'Distribute the selected color or highlights throughout the visible hair in a balanced salon pattern.'},
  {id:'root_melt',name:'Root Melt',prompt:'Create a soft root melt with natural root depth blending smoothly into the selected tone.'}
 ],
 beardAction:[
  {id:'shape_existing',name:'Vorhandenen Bart formen',prompt:'Shape the client’s existing beard only. Respect current beard length and mass; do not remove long beard or add unrealistic beard.'},
  {id:'add_beard',name:'Bart hinzufügen',prompt:'Add the selected beard as a style preview only if the client is clean-shaven or has low beard growth; keep density believable.'},
  {id:'trim_down',name:'Bart kürzen',prompt:'Explicitly trim down or shorten the current beard into the selected shorter style. Keep hidden jaw/chin structure conservative and realistic.'},
  {id:'beard_color',name:'Bartfarbe ändern',prompt:'Change beard color only. Do not change beard length, beard outline, cheek line, or density.'}
 ],
 beardLength:[
  {id:'style_default',name:'Modell-Länge',prompt:'Use the exact beard length specified by the selected model.'},
  {id:'shadow_0_1',name:'0.5–1mm Shadow',prompt:'Render 0.5–1mm 5 o’clock shadow: visible skin through very short growth, not a full beard.'},
  {id:'light_1_2',name:'1–2mm Light Stubble',prompt:'Render 1–2mm light stubble with individual follicle texture and clear skin visibility.'},
  {id:'designer_2_3',name:'2–3mm Designer Stubble',prompt:'Render 2–3mm designer stubble with clean cheek/neck control and still-visible skin texture.'},
  {id:'heavy_4_6',name:'4–6mm Heavy Stubble',prompt:'Render 4–6mm heavy stubble, reading as the boundary between stubble and short beard.'},
  {id:'short_8_12',name:'8–12mm Kurz',prompt:'Render an 8–12mm short beard with clipper-uniform length and realistic density variation.'},
  {id:'medium_20_35',name:'20–35mm Mittel',prompt:'Render a 20–35mm medium beard with visible mass and controlled silhouette.'},
  {id:'long_35_60',name:'35–60mm Lang',prompt:'Render a 35–60mm long beard with visible length below the jaw and clear bottom shape.'},
  {id:'statement_60_plus',name:'60mm+ Statement',prompt:'Render a 60mm+ statement beard with substantial length and realistic weight.'}
 ],
 beardShape:[
  {id:'style_default',name:'Modell-Form',prompt:'Use the exact beard shape specified by the selected model.'},
  {id:'natural',name:'Natürlich',prompt:'Keep the beard shape natural with minimal geometry and natural growth arc.'},
  {id:'rounded',name:'Rund',prompt:'Create a rounded lower beard silhouette; do not taper into a point or square the bottom.'},
  {id:'square',name:'Eckig',prompt:'Create a broad squared lower beard line with strong jaw corners; do not round or point the chin.'},
  {id:'angular',name:'Winklig',prompt:'Create angular cheek/jaw/chin geometry with deliberate barber precision.'},
  {id:'pointed',name:'Spitz / Kegelform',prompt:'Taper the lower beard toward a clear central chin point; do not make the bottom round.'},
  {id:'ducktail',name:'Ducktail',prompt:'Keep sides controlled and make the chin area longer, tapering downward into a ducktail point.'}
 ],
 cheekLine:[
  {id:'natural',name:'Wange natürlich',prompt:'Use a natural cheek line following the client’s growth boundary.'},
  {id:'clean',name:'Wange sauber',prompt:'Clean the cheek line softly and professionally without harsh geometry.'},
  {id:'sharp',name:'Razor Sharp',prompt:'Create a razor-sharp cheek line with crisp intentional edges.'},
  {id:'high',name:'Hohe Wangenlinie',prompt:'Use a higher cheek line where growth allows, without painting hair onto empty skin.'},
  {id:'low',name:'Tiefe Wangenlinie',prompt:'Use a lower cheek line, keeping the upper cheek cleaner.'}
 ],
 neckline:[
  {id:'natural',name:'Hals natürlich',prompt:'Keep the neckline natural and softly tidied.'},
  {id:'clean',name:'Hals sauber',prompt:'Define a clean neckline approximately 1–2cm above the Adam’s apple.'},
  {id:'sharp',name:'Hals scharf',prompt:'Create a sharp razor-defined neckline with clean skin below.'},
  {id:'faded',name:'Hals Fade',prompt:'Fade the neckline gradually from skin or near-skin into beard density.'}
 ],
 beardFade:[
  {id:'none',name:'Kein Bart-Fade',prompt:'Do not create a beard fade. Keep sideburn and beard connection natural or as specified.'},
  {id:'natural_taper',name:'Natural Sideburn Taper',prompt:'Blend the sideburn into beard gradually without a skin gap or harsh disconnect.'},
  {id:'low',name:'Low Beard Fade',prompt:'Fade begins low around upper neckline or just below the jaw; cheeks and jaw remain full.'},
  {id:'mid',name:'Mid Beard Fade',prompt:'Fade rises from neckline toward mid-jaw height with clear but controlled graduation.'},
  {id:'high',name:'High Beard Fade',prompt:'Fade rises high toward cheekbone area with dramatic contrast; use only where the selected style supports it.'},
  {id:'skin_into_beard',name:'Skin Fade into Beard',prompt:'Connect haircut skin fade continuously into beard density without gaps or broken patches.'},
  {id:'temple_blend',name:'Temple Beard Blend',prompt:'Blend temple/sideburn area smoothly into the cheek beard with barber precision.'},
  {id:'drop_connection',name:'Drop Fade Connection',prompt:'Use a drop-shaped transition around the ear into beard density.'},
  {id:'burst_connection',name:'Burst Fade Connection',prompt:'Use a radial burst transition around the ear into the beard, without disconnecting the cheek beard.'},
  {id:'italian_taper',name:'Soft Italian Taper',prompt:'Use a soft elegant taper connection, refined and natural, with no harsh skin gap.'}
 ],
 beardDensity:[
  {id:'realistic',name:'Realistische Bartdichte',prompt:'Preserve real beard density, patchiness, grey distribution, and skin visibility. Do not fill gaps completely.'},
  {id:'style_preview',name:'Style Preview',prompt:'Show how the style could look with enough beard growth, but keep density believable and not perfect or painted-on.'}
 ],
 mustache:[
  {id:'model_default',name:'Modell-Vorgabe',prompt:'Use the mustache behavior specified by the selected model.'},
  {id:'trimmed_lip',name:'Kurz bis Lippe',prompt:'Trim the mustache cleanly to the upper lip edge.'},
  {id:'full',name:'Voller Schnurrbart',prompt:'Make the mustache fuller and more prominent while keeping natural density.'},
  {id:'beardstache',name:'Beardstache',prompt:'Make the mustache the primary visual feature with shorter supporting beard growth.'},
  {id:'no_mustache',name:'Ohne Schnurrbart',prompt:'Remove or minimize mustache growth only if compatible with selected beard style; do not change the mouth or lips.'}
 ]
};

function getModelObjByCurrent(){return data[currentMode]?.models?.find(m=>String(m.id)===String(currentStyleId))||null;}
function isBobModel(){const m=getModelObjByCurrent();return currentMode==='female' && /bob|bixie|lob/i.test((m?.name||'')+' '+(m?.cat||''));}
function isMaleHair(){return currentMode==='male';}
function optionDef(key,label,items,def){return {key,label,items,def:def||items[0]?.id};}
function getAdvancedOptionDefs(){
 const defs=[];
 if(currentMode==='female'){
  if(isBobModel()) defs.push(optionDef('bangs','Pony / Bangs',ADVANCED_OPTION_GROUPS.bangs,'auto'));
 }
 if(currentMode==='male'){
  /* Fade/Taper-Auswahl entfernt — jedes Modell definiert sein eigenes Fade-Verhalten (Referenzbild + Spec) */
 }
 if(currentMode==='beard'){
  defs.push(optionDef('beardAction','Bart-Aktion',ADVANCED_OPTION_GROUPS.beardAction,'shape_existing'));
  defs.push(optionDef('beardLength','Länge',ADVANCED_OPTION_GROUPS.beardLength,'style_default'));
  defs.push(optionDef('beardShape','Form',ADVANCED_OPTION_GROUPS.beardShape,'style_default'));
  defs.push(optionDef('cheekLine','Wangenlinie',ADVANCED_OPTION_GROUPS.cheekLine,'natural'));
  defs.push(optionDef('neckline','Halslinie',ADVANCED_OPTION_GROUPS.neckline,'clean'));
  defs.push(optionDef('beardFade','Bart-Fade',ADVANCED_OPTION_GROUPS.beardFade,'none'));
  defs.push(optionDef('beardDensity','Bartdichte',ADVANCED_OPTION_GROUPS.beardDensity,'realistic'));
  defs.push(optionDef('mustache','Schnurrbart',ADVANCED_OPTION_GROUPS.mustache,'model_default'));
 }
 if(currentMode==='color'){
  const isBeardColor=/beard hair only|bartfarbe|beard color|salt-and-pepper beard/i.test(_selectedFarbeService||'');
  defs.push(optionDef('colorIntensity','Farbintensität',ADVANCED_OPTION_GROUPS.colorIntensity,'medium'));
  defs.push(optionDef('toneDirection','Tonrichtung',ADVANCED_OPTION_GROUPS.toneDirection,'neutral'));
  if(!isBeardColor){
   defs.push(optionDef('highlightDensity','Highlight-Dichte',ADVANCED_OPTION_GROUPS.highlightDensity,'medium'));
   defs.push(optionDef('brightnessLevel','Aufhellung',ADVANCED_OPTION_GROUPS.brightnessLevel,'slightly_lighter'));
   defs.push(optionDef('colorPlacement','Platzierung',ADVANCED_OPTION_GROUPS.colorPlacement,'service_default'));
  }else{
   defs.push(optionDef('beardDensity','Bartdichte',ADVANCED_OPTION_GROUPS.beardDensity,'realistic'));
  }
 }
 return defs;
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
 wrap.innerHTML=`<div class="adv-title">PROFI-EINSTELLUNGEN</div><div class="adv-grid">${defs.map(d=>`<label class="adv-field"><span>${d.label}</span><select onchange="setAdvancedOption('${d.key}',this.value)">${d.items.map(it=>`<option value="${it.id}"${_selectedAdvancedOptions[d.key]===it.id?' selected':''}>${it.name}</option>`).join('')}</select></label>`).join('')}</div><div class="adv-note">Standard: ehrlich, realistisch, dichte- und identitätstreu. Ja, ausnahmsweise sinnvoll.</div>`;
 wrap.style.display='block';
}
function setAdvancedOption(key,val){_selectedAdvancedOptions[key]=val;rebuildCurrentPrompt();}
function getAdvancedModifierText(){
 const defs=getAdvancedOptionDefs();const lines=[];
 defs.forEach(d=>{
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
  const spec=englishSpecs[currentMode]?.[currentStyleId]||currentStyleName;
  const hairType=currentMode==='beard'?'beard and facial hair':'hair on the head';
  currentPrompt=buildHairPrompt(spec,hairType,_selectedAngle,modifierText);
 }
}

function buildAngleGrid(){
  document.getElementById('angleGrid').innerHTML=_currentAngles.map(a=>`<div class="angle-btn${_selectedAngle===a.v?' selected':''}" onclick="selectAngle('${a.v}',this)"><span class="angle-icon">${a.icon}</span><span class="angle-label">${a.label}</span><span class="angle-hint">${a.hint}</span></div>`).join('');
}
function selectAngle(val,btn){
  _selectedAngle=val;if(btn){document.querySelectorAll('.angle-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected')}
  const upload=document.getElementById('uploadWrap');upload.style.display='block';
  rebuildCurrentPrompt();
  document.getElementById('genBtn').disabled=!capturedPhoto;
  setTimeout(()=>upload.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
}

/* ── GEN STATE ── */
function resetGenState(){
  capturedPhoto=null;currentResultBase64=null;currentPrompt='';_selectedColor='';_selectedTech='';renewUsed=false;simulationResults=[];
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
function handleUpload(e){
  const file=e.target.files?.[0];if(!file)return;
  e.target.value='';
  const reader=new FileReader();
  reader.onload=ev=>{
    capturedPhoto=ev.target.result;
    const prev=document.getElementById('uploadPreviewImg');
    prev.src=capturedPhoto;prev.style.display='block';
    const ph=document.getElementById('beforePlaceholder');if(ph)ph.style.display='none';
    document.getElementById('genBtn').disabled=!currentPrompt;
    const errEl=document.getElementById('genError');if(errEl)errEl.classList.remove('show');
  };
  reader.readAsDataURL(file);
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
async function startGeneration(isFreeRenew=false){
  if(!currentPrompt){showGenError('Bitte zuerst einen Winkel wählen.');return}
  if(!capturedPhoto){showGenError('Bitte zuerst ein Kundenfoto hochladen.');return}
  if(!isFreeRenew&&getRemaining()<1){showGenError('Keine Simulationen mehr. Bitte Admin kontaktieren.');return}

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
      if(String(functionError?.message||'').includes('credit_exhausted')){
        genLoading.style.display='none';
        showGenError('Keine Simulationen mehr. Bitte Admin kontaktieren.');
        return;
      }
      if(String(functionError?.message||'').includes('account_inactive')){
        genLoading.style.display='none';
        showGenError('Dieses Konto ist deaktiviert. Bitte Admin kontaktieren.');
        return;
      }
      throw new Error('Supabase Function: '+(functionError.message||JSON.stringify(functionError)));
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

/* ── ADMIN GALLERY SAVE ── */
async function uploadBase64ToStorage(base64,path){
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
    let{data:rows,error}=await getSB().from('model_gallery').select('*').eq('model_id',modelId).order('sort_order');
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
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLightbox();closeGallery();closeGenModal();closeCamera()}});
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
document.getElementById('loginUser').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('loginPass').focus()});
window.addEventListener('resize',updateTopbarPad);