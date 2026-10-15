export const LETTERS=['A','B','C','D'];
export const STORAGE_KEY='zhihang-practice-v1';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const answerIndices=answer=>Array.isArray(answer)?[...answer].sort((a,b)=>a-b):Number.isInteger(answer)?[answer]:[];
export const correctIndices=q=>q.answers||[q.answer];
export const answerLetters=answer=>answerIndices(answer).map(i=>LETTERS[i]).join('、');
export function validAnswer(q,answer){const a=answerIndices(answer);return a.length>0&&a.every(i=>Number.isInteger(i)&&i>=0&&i<4)&&new Set(a).size===a.length&&(q.mode==='multi'||a.length===1);}
export function isCorrect(q,answer){return validAnswer(q,answer)&&JSON.stringify(answerIndices(answer))===JSON.stringify([...correctIndices(q)].sort((a,b)=>a-b));}
export function shuffled(items,random=Math.random){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
export function freshState(){return {schema:1,records:{},favorites:[],session:null};}
export function sanitizeState(input,questions){
 const clean=freshState(),map=new Map(questions.map(q=>[q.id,q]));if(!input||input.schema!==1)return clean;
 for(const [key,r] of Object.entries(input.records||{})){const q=map.get(Number(key));if(q&&validAnswer(q,r?.answer))clean.records[key]={answer:q.mode==='multi'?answerIndices(r.answer):answerIndices(r.answer)[0],correct:isCorrect(q,r.answer),attempts:Math.max(1,Number.isFinite(Number(r.attempts))?Math.floor(Number(r.attempts)):1),at:Number.isFinite(Number(r.at))?Number(r.at):0};}
 clean.favorites=[...new Set(Array.isArray(input.favorites)?input.favorites.filter(id=>map.has(id)):[])];const s=input.session;
 if(s&&['sequence','random','wrong','favorites','single','timed'].includes(s.mode)&&Array.isArray(s.ids)&&s.ids.length&&s.ids.length<=questions.length&&s.ids.every(id=>map.has(id))&&new Set(s.ids).size===s.ids.length){
  const answers={},drafts={};for(const [key,a] of Object.entries(s.answers||{})){const q=map.get(Number(key));if(q&&s.ids.includes(q.id)&&validAnswer(q,a))answers[key]=q.mode==='multi'?answerIndices(a):answerIndices(a)[0];}
  for(const [key,a] of Object.entries(s.drafts||{})){const q=map.get(Number(key));if(q?.mode==='multi'&&s.ids.includes(q.id)&&Array.isArray(a)&&a.length<=4&&a.every(i=>Number.isInteger(i)&&i>=0&&i<4))drafts[key]=[...new Set(a)].sort();}
  const rawStart=Number(s.startedAt),startedAt=Number.isFinite(rawStart)&&rawStart>0?rawStart:Date.now(),deadline=Number(s.deadline);
  clean.session={mode:s.mode,ids:s.ids,index:Math.min(Math.max(0,Math.floor(Number(s.index)||0)),s.ids.length-1),answers,drafts,startedAt,deadline:s.mode==='timed'&&Number.isFinite(deadline)&&deadline>startedAt?deadline:0,finished:!!s.finished};
 }return clean;
}
export function recordAnswer(state,q,answer,at=Date.now()){const s=state.session;if(!s||s.finished||!s.ids.includes(q.id)||Object.hasOwn(s.answers,q.id)||!validAnswer(q,answer))return false;const stored=q.mode==='multi'?answerIndices(answer):answerIndices(answer)[0];s.answers[q.id]=stored;if(s.drafts)delete s.drafts[q.id];state.records[q.id]={answer:stored,correct:isCorrect(q,stored),attempts:(state.records[q.id]?.attempts||0)+1,at};return true;}
export function summarizeSession(session,questions){const map=new Map(questions.map(q=>[q.id,q]));let answered=0,correct=0;for(const id of session.ids)if(Object.hasOwn(session.answers,id)){answered++;if(isCorrect(map.get(id),session.answers[id]))correct++;}return {total:session.ids.length,answered,correct,wrong:answered-correct,unanswered:session.ids.length-answered,score:Math.round(correct/session.ids.length*100)};}
export function studyStats(state){const records=Object.values(state.records),correct=records.filter(r=>r.correct).length;return {answered:records.length,correct,wrong:records.length-correct,accuracy:records.length?Math.round(correct/records.length*100):0};}
export function formatTime(ms){const seconds=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
