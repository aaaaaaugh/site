/* ================================================================
   SoundProject — app.js
   Единый скрипт для всех 4 страниц
   ================================================================ */

/* ---------- Демо-треки ---------- */
const SRC = n => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
const BASE_TRACKS = [
  { id:1,  title:'Ночной маршрут',   artist:'Lume',       genre:'Electronic', hue:18,  plays:4812, src:SRC(1)  },
  { id:2,  title:'Тёплый бетон',     artist:'Кора',       genre:'Lo-Fi',       hue:200, plays:3204, src:SRC(2)  },
  { id:3,  title:'Сто вторая',       artist:'Дым и Ко',   genre:'Hip-Hop',     hue:280, plays:5631, src:SRC(3)  },
  { id:4,  title:'Стекло',           artist:'Anya Vale',  genre:'Pop',         hue:340, plays:2988, src:SRC(4)  },
  { id:5,  title:'Перегон',          artist:'Trans-Sib',  genre:'Rock',        hue:8,   plays:1760, src:SRC(5)  },
  { id:6,  title:'Тихий лифт',       artist:'Lume',       genre:'Ambient',     hue:170, plays:3321, src:SRC(6)  },
  { id:7,  title:'Фонари',           artist:'Кора',       genre:'Lo-Fi',       hue:45,  plays:2104, src:SRC(7)  },
  { id:8,  title:'Низкая вода',      artist:'Ostrov',     genre:'Electronic',  hue:230, plays:4457, src:SRC(8)  },
  { id:9,  title:'Лето в метро',     artist:'Anya Vale',  genre:'Pop',         hue:320, plays:3879, src:SRC(9)  },
  { id:10, title:'Гул',              artist:'Trans-Sib',  genre:'Rock',        hue:24,  plays:1234, src:SRC(10) },
  { id:11, title:'Серый кофе',       artist:'Дым и Ко',   genre:'Hip-Hop',     hue:260, plays:2890, src:SRC(11) },
  { id:12, title:'Долгий вдох',      artist:'Ostrov',     genre:'Ambient',     hue:150, plays:3100, src:SRC(12) }
];

/* ---------- Утилиты ---------- */
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = s => isFinite(s) ? `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` : '0:00';
const ge  = id => document.getElementById(id);
const qs  = s  => document.querySelector(s);
const qsa = s  => [...document.querySelectorAll(s)];

const store = {
  get:(k,d)=>{ try{ return JSON.parse(localStorage.getItem(k))??d; }catch{ return d; } },
  set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} }
};

function allTracks(){ return BASE_TRACKS.concat(store.get('sp_uploads',[])); }
function fmt3(n){ return n>=1000 ? (n/1000).toFixed(1)+'K' : String(n); }

/* ---------- Тема ---------- */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  store.set('sp_theme', t);
  qsa('.theme-toggle').forEach(b => {
    b.innerHTML = t==='light'
      ? '<i class="bi bi-moon-fill"></i>'
      : '<i class="bi bi-sun-fill"></i>';
    b.setAttribute('aria-label', t==='light' ? 'Тёмная тема' : 'Светлая тема');
  });
}
function toggleTheme(){
  applyTheme(document.documentElement.getAttribute('data-theme')==='light' ? 'dark' : 'light');
}

/* ---------- Плеер ---------- */
const audio = new Audio();
audio.preload = 'none';
let currentId = null;

function playTrack(id){
  id = Number(id);
  const t = allTracks().find(x=>x.id===id);
  if(!t) return;
  if(currentId===id){ audio.paused ? audio.play() : audio.pause(); return; }
  currentId = id;
  audio.src = t.src || SRC(1);
  audio.play().catch(()=>showToast('Не удалось запустить аудио — проверьте соединение.'));
  const el = ge('playerTitle'), ea = ge('playerArtist');
  if(el) el.textContent = t.title;
  if(ea) ea.textContent = t.artist;
  store.set('sp_last', id);
}
function step(d){
  const list = allTracks();
  const i = list.findIndex(t=>t.id===currentId);
  if(i<0) return;
  playTrack(list[(i+d+list.length)%list.length].id);
}

function refreshUI(){
  const playing = !audio.paused;
  document.body.classList.toggle('is-playing', playing);

  /* Кнопки play на карточках */
  qsa('[data-play]').forEach(b=>{
    const on = playing && Number(b.dataset.play)===currentId;
    const icon = b.querySelector('i');
    if(icon) icon.className = `bi ${on?'bi-pause-fill':'bi-play-fill'}`;
  });

  /* Главная кнопка плеера */
  const pt = ge('pToggle');
  if(pt){ const ic = pt.querySelector('i'); if(ic) ic.className = `bi ${playing?'bi-pause-fill':'bi-play-fill'}`; }

  /* Лайки */
  const likes = store.get('sp_likes',[]);
  qsa('[data-like]').forEach(b=>{
    const liked = likes.includes(Number(b.dataset.like));
    b.classList.toggle('liked', liked);
    b.setAttribute('aria-pressed', liked);
    const ic = b.querySelector('i');
    if(ic) ic.className = `bi ${liked?'bi-heart-fill':'bi-heart'}`;
  });
}

function toggleLike(id){
  id = Number(id);
  const likes = store.get('sp_likes',[]);
  const i = likes.indexOf(id);
  i>-1 ? likes.splice(i,1) : likes.push(id);
  store.set('sp_likes', likes);
  refreshUI();
  document.dispatchEvent(new CustomEvent('likes:changed'));
}

function showToast(msg){
  const el = ge('appToast');
  if(!el) return;
  qs('.toast-body',el).textContent = msg;
  bootstrap.Toast.getOrCreateInstance(el,{delay:3500}).show();
}

/* ---------- HTML карточки ---------- */
function cardHTML(t, col='col-12 col-sm-6 col-lg-4', badge=''){
  const labels = ['','ТРЕНД','НОВИНКА','ПОПУЛЯРНЫЙ','ХАЙП'];
  const lbl = badge || (t.id<=3 ? labels[t.id] : '');
  return `
<div class="${col}">
  <a href="product.html?id=${t.id}" class="track-card d-block">
    <div class="track-cover" style="--h:${t.hue}">
      ${lbl ? `<span class="track-cover-badge">${esc(lbl)}</span>` : ''}
      <div class="track-cover-overlay">
        <button class="btn-play-cover" data-play="${t.id}" aria-label="Играть ${esc(t.title)}" onclick="event.preventDefault();event.stopPropagation();SP.playTrack(${t.id})">
          <i class="bi bi-play-fill"></i>
        </button>
      </div>
    </div>
    <div class="track-body">
      <div class="track-genre">${esc(t.genre)}</div>
      <div class="track-title">${esc(t.title)}</div>
      <div class="track-artist">${esc(t.artist)}</div>
      <div class="track-meta">
        <span class="track-likes"><i class="bi bi-headphones"></i> ${fmt3(t.plays||0)}</span>
        <button class="btn-like" data-like="${t.id}" aria-pressed="false" aria-label="Лайк" onclick="event.preventDefault();event.stopPropagation();SP.toggleLike(${t.id})">
          <i class="bi bi-heart"></i>
        </button>
      </div>
    </div>
  </a>
</div>`;
}

function renderCards(sel, list, col){
  const box = qs(sel);
  if(box){ box.innerHTML = list.map(t=>cardHTML(t,col)).join(''); refreshUI(); }
}

/* ---------- Scroll-reveal ---------- */
function initReveal(){
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
  },{threshold:.12});
  qsa('.reveal').forEach(el=>obs.observe(el));
}

/* ---------- DOMContentLoaded ---------- */
document.addEventListener('DOMContentLoaded', ()=>{

  /* Тема */
  applyTheme(store.get('sp_theme','dark'));
  qsa('.theme-toggle').forEach(b=>b.addEventListener('click',toggleTheme));

  /* Scroll-to-top */
  const bt = ge('backTop');
  if(bt){
    window.addEventListener('scroll',()=>bt.classList.toggle('visible', window.scrollY>400));
    bt.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  /* Нижний плеер — прогресс (кликабельная полоска) */
  const barTrack = ge('pBarTrack');
  if(barTrack){
    barTrack.addEventListener('click',e=>{
      if(!audio.duration) return;
      const r = barTrack.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
  }

  /* Плеер — кнопки управления */
  ge('pToggle')?.addEventListener('click',()=>{
    if(currentId===null) playTrack(store.get('sp_last',1));
    else audio.paused ? audio.play() : audio.pause();
  });
  ge('pPrev')?.addEventListener('click',()=>step(-1));
  ge('pNext')?.addEventListener('click',()=>step(1));

  /* Громкость */
  const vol = ge('pVolume');
  vol?.addEventListener('input',()=>{ audio.volume = vol.value/100; });

  /* Обновление полоски прогресса плеера */
  audio.addEventListener('timeupdate',()=>{
    const fill = ge('pBarFill'), tm = ge('pTime');
    if(fill && audio.duration) fill.style.width = (audio.currentTime/audio.duration*100)+'%';
    if(tm) tm.textContent = fmt(audio.currentTime)+' / '+fmt(audio.duration);
  });

  ['play','pause','ended'].forEach(ev=>audio.addEventListener(ev,refreshUI));
  audio.addEventListener('ended',()=>step(1));

  /* Волна в hero */
  const wave = ge('wave');
  if(wave){
    wave.innerHTML = Array.from({length:52},(_,i)=>{
      const h = 18 + Math.abs(Math.sin(i*.5)*55 + Math.sin(i*1.3)*25);
      return `<span style="--h:${h}%;--d:${(i%9)*.08}s"></span>`;
    }).join('');
  }

  /* Форма загрузки трека */
  const uploadForm = ge('uploadForm');
  uploadForm?.addEventListener('submit', e=>{
    e.preventDefault();
    uploadForm.classList.add('was-validated');
    if(!uploadForm.checkValidity()) return;
    const uploads = store.get('sp_uploads',[]);
    uploads.push({
      id: Date.now(),
      title:  ge('upTitle').value.trim(),
      artist: ge('upArtist').value.trim(),
      genre:  ge('upGenre').value,
      hue:    Math.floor(Math.random()*360),
      plays:  0,
      src:    SRC(1),
      mine:   true
    });
    store.set('sp_uploads', uploads);
    bootstrap.Modal.getInstance(ge('uploadModal'))?.hide();
    uploadForm.reset();
    uploadForm.classList.remove('was-validated');
    showToast('Трек загружен и появится в каталоге.');
    document.dispatchEvent(new CustomEvent('tracks:changed'));
  });

  /* Scroll-reveal */
  initReveal();

  /* Готово */
  document.dispatchEvent(new CustomEvent('sp:ready'));
  refreshUI();
});

/* ---------- Клики по data-атрибутам ---------- */
document.addEventListener('click', e=>{
  const p = e.target.closest('[data-play]');
  if(p){ playTrack(p.dataset.play); return; }
  const l = e.target.closest('[data-like]');
  if(l) toggleLike(l.dataset.like);
});

/* ---------- Экспорт ---------- */
window.SP = { audio, esc, fmt, allTracks, renderCards, playTrack, toggleLike, showToast, refreshUI, store, cardHTML };
