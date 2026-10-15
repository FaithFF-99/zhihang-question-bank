export const LETTERS = ['A','B','C','D'];
export const STORAGE_KEY = 'zhihang-practice-v1';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function shuffled(items, random=Math.random) {
  const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;
}
export function freshState(){return {schema:1,records:{},favorites:[],session:null};}
export function sanitizeState(input, questions) {
  const clean=freshState(), allowed=new Set(questions.map(q=>q.id));
  if(!input||input.schema!==1)return clean;
  for(const [key,r] of Object.entries(input.records||{}))if(allowed.has(Number(key))&&Number.isInteger(r?.answer)&&r.answer>=0&&r.answer<4){
    const q=questions.find(q=>q.id===Number(key));clean.records[key]={answer:r.answer,correct:r.answer===q.answer,attempts:Math.max(1,Number.isFinite(Number(r.attempts))?Math.floor(Number(r.attempts)):1),at:Number.isFinite(Number(r.at))?Number(r.at):0};
  }
  clean.favorites=[...new Set(Array.isArray(input.favorites)?input.favorites.filter(id=>allowed.has(id)):[])];
  const s=input.session;
  if(s&&['sequence','random','wrong','favorites','single','timed'].includes(s.mode)&&Array.isArray(s.ids)&&s.ids.length&&s.ids.length<=questions.length&&s.ids.every(id=>allowed.has(id))&&new Set(s.ids).size===s.ids.length){
    const answers={};for(const [key,a] of Object.entries(s.answers||{}))if(s.ids.includes(Number(key))&&Number.isInteger(a)&&a>=0&&a<4)answers[key]=a;
    const startedAt=Number(s.startedAt)||Date.now(), deadline=Number(s.deadline);
    clean.session={mode:s.mode,ids:s.ids,index:Math.min(Math.max(0,Math.floor(Number(s.index)||0)),s.ids.length-1),answers,startedAt,deadline:s.mode==='timed'&&Number.isFinite(deadline)&&deadline>startedAt?deadline:0,finished:!!s.finished};
  }
  return clean;
}
export function recordAnswer(state,q,answer,at=Date.now()) {
  const s=state.session;
  if(!s||s.finished||!s.ids.includes(q.id)||Object.hasOwn(s.answers,q.id)||!Number.isInteger(answer)||answer<0||answer>3)return false;
  s.answers[q.id]=answer;const prev=state.records[q.id];state.records[q.id]={answer,correct:answer===q.answer,attempts:(prev?.attempts||0)+1,at};return true;
}
export function summarizeSession(session,questions){
  const map=new Map(questions.map(q=>[q.id,q]));let answered=0,correct=0;
  for(const id of session.ids)if(Object.hasOwn(session.answers,id)){answered++;if(session.answers[id]===map.get(id).answer)correct++;}
  return {total:session.ids.length,answered,correct,wrong:answered-correct,unanswered:session.ids.length-answered,score:Math.round(correct/session.ids.length*100)};
}
export function studyStats(state) {
  const records=Object.values(state.records),correct=records.filter(r=>r.correct).length;
  return {answered:records.length,correct,wrong:records.length-correct,accuracy:records.length?Math.round(correct/records.length*100):0};
}
export function formatTime(ms){const seconds=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
