import {LETTERS,STORAGE_KEY,escapeHTML as esc,shuffled,freshState,sanitizeState,recordAnswer,summarizeSession,studyStats,formatTime} from './core.js';

const main=document.querySelector('#main');
const labels={sequence:'顺序练习',random:'随机练习',wrong:'错题重练',favorites:'收藏练习',single:'单题练习',timed:'限时练习'};
let bank,state=freshState(),view='home',listQuery='',listCategory=0,listPage=0,toastTimer,storageOK=true,confirmBusy=false;
const pageSize=20;
const category=id=>bank.categories.find(c=>c.id===id);
const question=id=>bank.questions.find(q=>q.id===id);
const currentQuestion=()=>question(state.session.ids[state.session.index]);
const progress=s=>summarizeSession(s,bank.questions);
const wrongIds=()=>bank.questions.filter(q=>state.records[q.id]&&!state.records[q.id].correct).map(q=>q.id);
const button=(action,text,kind='primary',extra='')=>`<button class="button ${kind}" data-action="${action}" ${extra}>${text}</button>`;
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageOK=false;document.querySelector('#storage-warning').hidden=false;}}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3000);}
function footer(){return `<footer class="footer"><span>知航题库 · 原创模拟，非官方真题<br>题目资料核对：${esc(bank.reviewedAt)} · 共 ${bank.questions.length} 道单选题</span><span>无需登录 · 练习记录仅保存在当前浏览器<br>更换设备或清除浏览器数据后，记录不会同步</span></footer>`;}
function sources(){return `<details class="source-details"><summary>查看题库参考资料与内容说明</summary><p class="note" style="margin-top:14px">本题库面向事业单位自主招聘练习，不等同于公务员考试，也不代表本岗位官方考试范围。题目均为原创模拟；数量、判断等题依题设推导，政策与制度题在解析中标明参考资料。政策变化时应以有效官方文本为准。</p><ol>${bank.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${esc(s.note)}</small></li>`).join('')}</ol></details>`;}
function renderHome(){
  const stats=studyStats(state),s=state.session,p=s?progress(s):null;
  return `<div class="welcome"><p class="overline">YOUR DAILY PRACTICE · 每一次练习，都算数</p><h1>把知识，练成底气。</h1><p>事业单位自主招聘强化单选 · 社保、会计与综合能力</p></div>
  <div class="home-grid"><div class="home-left">
    ${s?`<div class="continue-card"><div><strong>${s.finished?'上一次练习已结束':'接着上次，继续向前'}</strong><p>${labels[s.mode]} · 已答 ${p.answered} / ${p.total} 题${s.finished?` · 正确 ${p.correct} 题`:''}</p></div>${button('resume',s.finished?'查看结果':'继续练习','secondary')}</div>`:''}
    <section class="hero"><div class="eyebrow"><span class="dot"></span> 原创强化 · 点选即判</div><h2>认真做一题，<br>真正懂一题。</h2><p>选择后立即判断对错，参考答案和解析<br>就在题目下方。不用翻页找答案。</p><div class="hero-bottom">${button('sequence','开始顺序练习 <span aria-hidden="true">→</span>')}<span>100 道精选单选 / 5 个专项</span></div><div class="hero-art" aria-hidden="true"><span class="hero-number">100</span><span>单 选 题</span></div></section>
    <section class="panel stats" aria-label="个人练习统计"><div class="stat"><strong>${stats.answered}<span> / 100</span></strong><small>已练题数</small></div><div class="stat"><strong>${stats.answered?stats.accuracy+'<span>%</span>':'—'}</strong><small>最近作答正确率</small></div><div class="stat"><strong>${stats.wrong}</strong><small>待巩固错题</small></div></section>
    <section class="panel"><div class="section-heading"><div><h2>分专项，逐个突破</h2><p>按模块练习，找准薄弱环节</p></div><button class="text-button" data-view="library">全部题目 ↗</button></div><div class="category-list">${bank.categories.map((c,i)=>{const qs=bank.questions.filter(q=>q.category===c.id),done=qs.filter(q=>state.records[q.id]).length;return `<button class="category-row" data-action="category" data-id="${c.id}"><span class="category-icon" aria-hidden="true">${['保','账','数','言','港'][i]}</span><span class="category-copy"><strong>${esc(c.name)}</strong><small>${qs.length} 道单选 · 已练 ${done} 题</small><span class="mini-track"><span style="width:${done/qs.length*100}%"></span></span></span><span class="category-arrow" aria-hidden="true">›</span></button>`;}).join('')}</div></section>
  </div><aside class="home-right"><section class="panel mode-panel"><div class="eyebrow">A LITTLE EVERY DAY</div><h2 style="margin-top:9px">随机练一组</h2><div class="feature-number">20<small>题 / 每组</small></div><p>打散题目顺序，交叉巩固考点。<br>答错自动记录，答对移出错题本。</p>${button('random','开始随机练习 <span aria-hidden="true">↗</span>','secondary','style="width:100%"')}</section>
    <section class="panel mode-panel"><div class="eyebrow">KEEP YOUR RHYTHM</div><h2 style="margin-top:9px">限时练习</h2><p>练节奏，也重理解。<br>限时模式同样点选后立即显示答案。</p><div class="timer-form"><div class="field"><label for="timed-count">练习题量</label><select id="timed-count"><option value="20">20 题</option><option value="50">50 题</option><option value="100">100 题</option></select></div><div class="field"><label for="timed-minutes">练习时长</label><select id="timed-minutes"><option value="30">30 分钟</option><option value="60">60 分钟</option><option value="120">120 分钟</option></select></div></div>${button('timed','开始计时 <span aria-hidden="true">→</span>','primary','style="width:100%"')}</section>
    <div class="note-card"><h3>一份题库，各自的进度</h3><p class="note">把链接发给朋友，对方直接打开就能做题。你们的答题记录、错题和收藏互不影响，不需要注册账号。</p></div>
  </aside></div>${sources()}${footer()}`;
}
function filteredQuestions(){let qs=bank.questions;if(view==='wrong')qs=qs.filter(q=>state.records[q.id]&&!state.records[q.id].correct);if(view==='favorites')qs=qs.filter(q=>state.favorites.includes(q.id));const query=listQuery.trim().toLocaleLowerCase();return qs.filter(q=>(!listCategory||q.category===listCategory)&&(!query||`${q.id} ${q.stem} ${q.options.join(' ')}`.toLocaleLowerCase().includes(query)));}
function renderList(){
  const titles={library:['全部题目','按专项筛选，或搜索题干与选项'],wrong:['错题本','答错自动收录；重练答对后自动移出'],favorites:['我的收藏','把值得反复琢磨的题，留在这里']};
  const [title,note]=titles[view],qs=filteredQuestions(),totalPages=Math.max(1,Math.ceil(qs.length/pageSize));listPage=Math.min(listPage,totalPages-1);
  const baseCount=view==='wrong'?wrongIds().length:view==='favorites'?state.favorites.length:bank.questions.length;
  const emptyTitle=listQuery||listCategory?'没有找到相关题目':view==='wrong'?'还没有待巩固的错题':'还没有收藏题目';
  const emptyText=listQuery||listCategory?'换个关键词，或选择其他专项试试。':view==='wrong'?'做题时选错的题会自动收进来，重练答对后会自动移出。':'做题时点击题目右上角的星标，即可加入收藏。';
  return `<div class="page-heading"><div><p class="overline">${String(baseCount).padStart(2,'0')} QUESTIONS · 随时回顾</p><h1>${title}</h1><p>${note}</p></div>${baseCount?button('list-practice',view==='wrong'?'重练错题':view==='favorites'?'练习收藏':'练习本组','secondary'):''}</div>
    <div class="list-toolbar"><div class="search-field"><label class="sr-only" for="question-search">搜索题干或选项</label><input type="search" id="question-search" placeholder="搜索题干、选项或题号" value="${esc(listQuery)}" autocomplete="off"></div><div class="filter-field"><label class="sr-only" for="category-filter">筛选专项</label><select id="category-filter"><option value="0">全部专项</option>${bank.categories.map(c=>`<option value="${c.id}" ${c.id===listCategory?'selected':''}>${esc(c.short)}</option>`).join('')}</select></div></div>
    <p class="note" style="margin-bottom:12px">共找到 ${qs.length} 题 · 点击题目开始练习</p>
    <section class="panel list-panel">${qs.length?qs.slice(listPage*pageSize,(listPage+1)*pageSize).map(q=>{const r=state.records[q.id];return `<button class="question-row" data-action="open" data-id="${q.id}"><span class="question-number">${String(q.id).padStart(2,'0')}</span><span><span class="question-preview">${esc(q.stem)}</span><span class="question-meta"><span>${esc(category(q.category).short)}</span><span>单选题</span>${r?`<span class="${r.correct?'status-good':'status-bad'}">${r.correct?'✓ 最近答对':'× 待巩固'}</span>`:'<span>未练习</span>'}${state.favorites.includes(q.id)?'<span style="color:#a47d2f">★ 已收藏</span>':''}</span></span><span class="category-arrow" aria-hidden="true">›</span></button>`;}).join(''):`<div class="empty"><div class="empty-mark" aria-hidden="true">${view==='wrong'?'↺':'☆'}</div><h2>${emptyTitle}</h2><p>${emptyText}</p>${button('home','去练习','secondary')}</div>`}</section>
    ${qs.length>pageSize?`<div class="pagination">${button('page-prev','上一页','quiet',listPage===0?'disabled':'')}<span>${listPage+1} / ${totalPages}</span>${button('page-next','下一页','quiet',listPage>=totalPages-1?'disabled':'')}</div>`:''}${footer()}`;
}
function referenceHTML(explanation){return esc(explanation).replace(/\[(\d+)\]/g,(match,n)=>{const s=bank.sources.find(s=>s.id===Number(n));return s?`<a class="citation" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="参考资料${n}：${esc(s.title)}">[${n}]</a>`:match;});}
function questionGrid(s){return s.ids.map((id,i)=>{const q=question(id),a=s.answers[id],answered=Object.hasOwn(s.answers,id),status=answered?(a===q.answer?'correct':'incorrect'):'';return `<button class="grid-number ${status} ${view==='practice'&&i===s.index?'current':''}" data-action="jump" data-index="${i}" aria-label="第${i+1}题，题库题号${id}，${answered?(a===q.answer?'已答正确':'已答错误'):'未作答'}" ${view==='practice'&&i===s.index?'aria-current="true"':''}>${i+1}</button>`;}).join('');}
const legend=()=>'<div class="grid-legend"><span><i class="legend-box correct"></i>答对</span><span><i class="legend-box incorrect"></i>答错</span><span><i class="legend-box"></i>未答</span></div>';
function renderPractice(){
  const s=state.session,q=currentQuestion(),p=progress(s),answered=Object.hasOwn(s.answers,q.id),a=s.answers[q.id],revealed=answered||s.finished,favorite=state.favorites.includes(q.id);
  const refIds=[...new Set([...q.explanation.matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1])))],refs=bank.sources.filter(r=>refIds.includes(r.id));
  return `<div class="practice-top"><div><button class="text-button" data-action="home">← 返回学习台${s.finished?'':'（进度自动保存）'}</button><div class="practice-heading"><h1>${s.finished?'答案回顾':labels[s.mode]}</h1><small>第 ${s.index+1} / ${s.ids.length} 题</small></div></div>${s.mode==='timed'&&!s.finished?`<span class="timer" id="countdown" role="timer" aria-label="剩余时间">${formatTime(s.deadline-Date.now())}</span>`:'<span class="pill">单选 · 点选即判</span>'}</div>
    ${s.finished?'<p class="review-note">练习已结束，当前为答案回顾。未答题也会展示参考答案，不计入作答记录。</p>':''}
    <div class="practice-layout"><div class="practice-content"><div class="quiz-progress"><span>已答 ${p.answered} / ${p.total}</span><div class="progress-track" role="progressbar" aria-label="已答题目" aria-valuenow="${p.answered}" aria-valuemin="0" aria-valuemax="${p.total}"><span style="width:${p.answered/p.total*100}%"></span></div><span>正确 ${p.correct} 题</span></div>
    <article class="panel question-card" aria-labelledby="question-stem"><div class="question-card-top"><span class="question-label">题库 ${String(q.id).padStart(3,'0')}</span><span class="pill">${esc(category(q.category).short)}</span><button class="favorite-button ${favorite?'active':''}" data-action="favorite" aria-pressed="${favorite}" aria-label="${favorite?'取消收藏':'收藏本题'}"><span class="star" aria-hidden="true">${favorite?'★':'☆'}</span>${favorite?'已收藏':'收藏'}</button></div>
    <h2 class="question-stem" id="question-stem">${esc(q.stem)}</h2><div class="options" role="group" aria-label="单选题选项">${q.options.map((option,i)=>{let cls='',tag='';if(revealed){if(i===q.answer){cls='correct';tag=a===i?'✓ 你的选择 · 正确':'✓ 正确答案';}else if(answered&&i===a){cls='incorrect';tag='× 你的选择';}else cls='dimmed';}return `<button class="option ${cls}" data-action="answer" data-value="${i}" ${revealed?'disabled':''} aria-label="${LETTERS[i]}，${esc(option)}${tag?'，'+esc(tag):''}"><span class="option-letter">${LETTERS[i]}</span><span class="option-text">${esc(option)}</span><span class="option-status">${tag}</span></button>`;}).join('')}</div>
    ${revealed?`<section class="answer-panel" id="answer-panel" aria-label="参考答案与解析"><div class="feedback-banner ${!answered?'unanswered':a===q.answer?'':'incorrect'}" id="feedback-banner" tabindex="-1"><span class="feedback-symbol" aria-hidden="true">${!answered?'–':a===q.answer?'✓':'×'}</span><strong>${!answered?'本题未作答':a===q.answer?'回答正确':'回答错误'}</strong><span>${answered?'你的选择：'+LETTERS[a]:'回顾模式'}</span></div><div class="reference-answer"><small>参考答案</small><strong>${LETTERS[q.answer]}．${esc(q.options[q.answer])}</strong></div><h3 class="explanation-title">答案解析</h3><p class="explanation">${referenceHTML(q.explanation)}</p>${refs.length?`<div class="reference-links">参考资料 · 点击在新页面打开${refs.map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">[${r.id}] ${esc(r.title)} ↗</a>`).join('')}</div>`:'<p class="note" style="margin-top:14px">原创模拟题 · 按题设条件推导</p>'}</section>`:'<p class="answer-hint">点选一个选项，即时判断对错并显示参考答案</p>'}</article>
    <div class="question-controls">${button('previous','← 上一题','quiet',s.index===0?'disabled':'')}<span class="muted tiny">${s.index+1} / ${s.ids.length}</span>${s.index===s.ids.length-1?button(s.finished?'results':'finish','查看结果 →'):button('next','下一题 →')}</div><div class="question-share"><button class="text-button" data-action="share-question">分享这道题 ↗</button></div></div>
    <aside class="panel navigator"><details id="question-navigator" ${matchMedia('(min-width:761px)').matches?'open':''}><summary>答题卡 <span>${p.answered} / ${p.total} 已答</span></summary><div class="question-grid">${questionGrid(s)}</div>${legend()}</details><div style="margin-top:18px">${button(s.finished?'results':'finish',s.finished?'返回练习结果':'结束本次练习','secondary','style="width:100%"')}</div><p class="note">${s.finished?'再次练习请从学习台重新开始。':'选项一经点选，本轮不再修改；可通过新一轮练习巩固。'}<br>记录仅保存在当前浏览器。</p></aside></div>${footer()}`;
}
function renderResults(){const s=state.session,p=progress(s);return `<section class="panel result-panel"><div class="eyebrow">PRACTICE COMPLETE · 练习回顾</div><div class="result-score">${p.score}<span>%</span></div><h1>完成一轮，向前一步。</h1><p>${labels[s.mode]} · 本轮 ${p.total} 题，已答 ${p.answered} 题<br>正确占比按整组题量计算，未作答不计正确。错题已自动收录。</p><div class="result-stats"><div><strong class="status-good">${p.correct}</strong><span>答对</span></div><div><strong class="status-bad">${p.wrong}</strong><span>答错</span></div><div><strong>${p.unanswered}</strong><span>未答</span></div></div><div class="result-actions">${button('review','查看答案解析')}${p.wrong?button('retry-session','重练本轮错题','secondary'):''}${button('home','返回学习台','quiet')}</div><div class="question-grid">${questionGrid(s)}</div>${legend()}<p class="note">点击题号，查看该题参考答案和解析</p></section>${footer()}`;}
function render(scroll=true){
  if((view==='practice'||view==='results')&&!state.session)view='home';
  main.innerHTML=view==='home'?renderHome():view==='practice'?renderPractice():view==='results'?renderResults():renderList();
  const navView=['practice','results'].includes(view)?'home':view;
  document.querySelectorAll('[data-view]').forEach(el=>{const active=el.dataset.view===navView&&el.closest('.bottom-nav');el.classList.toggle('active',!!active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  document.title=`${view==='practice'?labels[state.session.mode]:view==='results'?'练习结果':view==='wrong'?'错题本':view==='favorites'?'我的收藏':view==='library'?'全部题目':'事业单位单选练习'} · 知航题库`;
  if(scroll){window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
}
function go(next){view=next;listPage=0;listCategory=0;listQuery='';render();tick();}
async function confirmAction(title,text,confirmLabel='确定'){
  if(confirmBusy)return false;
  const dialog=document.querySelector('#confirm-dialog');document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-text').textContent=text;dialog.querySelector('[value="confirm"]').textContent=confirmLabel;dialog.returnValue='';confirmBusy=true;
  return new Promise(resolve=>{dialog.addEventListener('close',()=>{confirmBusy=false;resolve(dialog.returnValue==='confirm');},{once:true});dialog.showModal();});
}
async function startPractice(ids,mode='sequence',index=0,minutes=0){
  if(!ids.length){toast('当前没有可练习的题目');return;}
  const old=state.session;
  if(old&&!old.finished&&!(await confirmAction('开始新一轮练习？','本轮会替换尚未结束的练习进度；已答记录、错题和收藏仍然保留。','开始新练习')))return;
  const startedAt=Date.now();state.session={mode,ids:[...ids],index,answers:{},startedAt,deadline:mode==='timed'?startedAt+minutes*60000:0,finished:false};persist();view='practice';render();tick();
}
async function finish(automatic=false){const s=state.session;if(!s)return;if(s.finished){view='results';render();return;}const p=progress(s);if(!automatic&&p.unanswered&&!(await confirmAction('结束本次练习？',`还有 ${p.unanswered} 题未作答。结束后可查看所有题目的参考答案，未答题不计为正确。`,'结束并查看结果')))return;s.finished=true;persist();view='results';render();if(automatic)toast('练习时间已到，已自动结束');}
function tick(){const s=state.session;if(!bank||!s||s.finished||s.mode!=='timed')return;if(s.deadline<=Date.now()){finish(true);return;}const countdown=document.querySelector('#countdown');if(countdown){countdown.textContent=formatTime(s.deadline-Date.now());countdown.classList.toggle('urgent',s.deadline-Date.now()<60000);}}
async function share(single=false){
  const url=new URL(location.href);url.search='';url.hash='';if(single&&state.session)url.searchParams.set('question',currentQuestion().id);
  const title=single?`知航题库 · 第${currentQuestion().id}题`:'知航题库 · 事业单位单选练习';
  if(navigator.share){try{await navigator.share({title,url:url.href});return;}catch(e){if(e.name==='AbortError')return;}}
  try{await navigator.clipboard.writeText(url.href);toast('链接已复制，可以发给朋友');}catch{const dialog=document.querySelector('#confirm-dialog');if(confirmBusy)return;document.querySelector('#dialog-title').textContent='复制分享链接';document.querySelector('#dialog-text').textContent='当前浏览器不支持自动复制，请长按下方链接复制。';const el=document.createElement('div');el.className='share-url';el.textContent=url.href;dialog.querySelector('form').insertBefore(el,dialog.querySelector('.dialog-actions'));dialog.querySelector('[value="confirm"]').textContent='完成';confirmBusy=true;dialog.addEventListener('close',()=>{el.remove();confirmBusy=false;},{once:true});dialog.showModal();}
}
document.addEventListener('click',async event=>{
  const target=event.target.closest('button');if(!target||target.disabled||!bank)return;
  if(target.dataset.view){go(target.dataset.view);return;}
  const action=target.dataset.action,s=state.session;
  switch(action){
    case 'home':go('home');break;
    case 'sequence':await startPractice(bank.questions.map(q=>q.id));break;
    case 'category':await startPractice(bank.questions.filter(q=>q.category===Number(target.dataset.id)).map(q=>q.id));break;
    case 'random':await startPractice(shuffled(bank.questions.map(q=>q.id)).slice(0,20),'random');break;
    case 'timed':{const count=Number(document.querySelector('#timed-count').value),minutes=Number(document.querySelector('#timed-minutes').value);await startPractice(shuffled(bank.questions.map(q=>q.id)).slice(0,count),'timed',0,minutes);break;}
    case 'resume':if(s){view=s.finished?'results':'practice';render();tick();}break;
    case 'list-practice':await startPractice(filteredQuestions().map(q=>q.id),view==='wrong'?'wrong':view==='favorites'?'favorites':'sequence');break;
    case 'open':{const ids=filteredQuestions().map(q=>q.id);await startPractice(ids,view==='wrong'?'wrong':view==='favorites'?'favorites':'sequence',ids.indexOf(Number(target.dataset.id)));break;}
    case 'page-prev':listPage=Math.max(0,listPage-1);render();break;
    case 'page-next':listPage++;render();break;
    case 'answer':{if(!s||view!=='practice')break;if(s.mode==='timed'&&!s.finished&&s.deadline<=Date.now()){await finish(true);break;}const q=currentQuestion(),answer=Number(target.dataset.value);if(recordAnswer(state,q,answer)){persist();render(false);const banner=document.querySelector('#feedback-banner');banner.focus({preventScroll:true});banner.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});document.querySelector('#feedback-live').textContent=`${answer===q.answer?'回答正确':'回答错误'}。你的选择${LETTERS[answer]}，参考答案${LETTERS[q.answer]}。${q.options[q.answer]}`;}break;}
    case 'favorite':{if(!s)break;const id=currentQuestion().id,has=state.favorites.includes(id);state.favorites=has?state.favorites.filter(v=>v!==id):[...state.favorites,id];persist();render(false);toast(has?'已取消收藏':'已加入收藏');break;}
    case 'next':if(s){s.index=Math.min(s.ids.length-1,s.index+1);persist();render();tick();}break;
    case 'previous':if(s){s.index=Math.max(0,s.index-1);persist();render();tick();}break;
    case 'jump':if(s){s.index=Number(target.dataset.index);persist();view='practice';render();tick();}break;
    case 'finish':await finish();break;
    case 'results':view='results';render();break;
    case 'review':if(s){s.index=0;persist();view='practice';render();}break;
    case 'retry-session':if(s)await startPractice(s.ids.filter(id=>Object.hasOwn(s.answers,id)&&s.answers[id]!==question(id).answer),'wrong');break;
    case 'share':await share();break;
    case 'share-question':await share(true);break;
  }
});
document.addEventListener('input',event=>{if(event.target.id==='question-search'){listQuery=event.target.value;listPage=0;const caret=event.target.selectionStart;render(false);const search=document.querySelector('#question-search');search.focus({preventScroll:true});try{search.setSelectionRange(caret,caret);}catch{}}});
document.addEventListener('change',event=>{if(event.target.id==='category-filter'){listCategory=Number(event.target.value);listPage=0;render(false);}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
window.addEventListener('pageshow',()=>tick());
async function boot(){
  try{const response=await fetch('./questions.json');if(!response.ok)throw new Error('题库文件加载失败');bank=await response.json();if(!Array.isArray(bank.questions)||bank.questions.length!==100)throw new Error('题库数据不完整');
    try{state=sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'),bank.questions);localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageOK=false;document.querySelector('#storage-warning').hidden=false;}
    render();tick();setInterval(tick,1000);
    const deepId=Number(new URL(location.href).searchParams.get('question'));if(deepId&&question(deepId)){if(state.session?.ids.includes(deepId)){state.session.index=state.session.ids.indexOf(deepId);view='practice';render();tick();}else await startPractice([deepId],'single');}
  }catch(error){main.innerHTML=`<section class="panel empty"><h1>题库暂时没能打开</h1><p>请检查网络后刷新页面。如果仍无法打开，请稍后重试。</p><button class="button primary" id="retry-load">重新加载</button></section>`;document.querySelector('#retry-load').addEventListener('click',()=>location.reload());}
}
boot();
