/* KidsCore: pure logic for MOVE AI Kids Zone. No DOM. Derives everything from existing records (participants, sessions, activities, movements, objects, attendance). */
(function(root){
"use strict";
const STARS={Easy:1,Medium:2,Hard:3},r1=n=>Math.round(n*10)/10;
const RULES=[
 {id:'first',title:'First Adventure',desc:'Finish your very first session.',rule:'sessions',threshold:1,badge:'star',color:'#f7b955'},
 {id:'explorer',title:'Little Explorer',desc:'Try 3 different activities.',rule:'activities',threshold:3,badge:'compass',color:'#6fb7f2'},
 {id:'mstar',title:'Movement Star',desc:'Spend 20 minutes moving.',rule:'moveMin',threshold:20,badge:'bolt',color:'#ff8f7a'},
 {id:'balance',title:'Balance Master',desc:'Finish 2 balance adventures.',rule:'balance',threshold:2,badge:'scale',color:'#9b8cf0'},
 {id:'discoverer',title:'Cube Discoverer',desc:'Visit 3 different Cube zones.',rule:'zones',threshold:3,badge:'cube',color:'#5fd0b0'},
 {id:'objects',title:'Object Explorer',desc:'Play with 3 kinds of objects.',rule:'objects',threshold:3,badge:'blocks',color:'#f58fb6'},
 {id:'champion',title:'Activity Champion',desc:'Complete 8 activities.',rule:'completions',threshold:8,badge:'cup',color:'#f7b955'},
 {id:'consistency',title:'Consistency Star',desc:'Come back for 4 sessions.',rule:'sessions',threshold:4,badge:'cal',color:'#6fb7f2'},
 {id:'team',title:'Team Player',desc:'Enjoy 2 sessions with 2 or more activities.',rule:'multi',threshold:2,badge:'team',color:'#ff8f7a'},
 {id:'collector',title:'Adventure Collector',desc:'Collect 20 stars.',rule:'stars',threshold:20,badge:'bag',color:'#9b8cf0'}];
const ZONES=[['ZK-1','Adventure Zone','adventure','Jumping, crossing and moving through the Cube.'],['ZK-2','Balance Zone','balance','Beams, lines and steady steps.'],['ZK-3','Interactive Floor','floor','Floor games that light up.'],['ZK-4','Object Play Zone','object','Balls, blocks and soft play objects.'],['ZK-5','Exploration Zone','explore','Free play and discovery.']];
const CATZONE={Locomotion:'adventure',Coordination:'adventure','Obstacle Navigation':'adventure',Movement:'adventure',Strength:'adventure',Balance:'balance','Object play':'object','Object Interaction':'object',Exploration:'explore',Flexibility:'floor',Cognitive:'floor'};
const OBJNAME={Balls:'Bouncy Balls','Elastic Elements':'Stretchy Bands',Walls:'Climb Walls','Floor Areas':'Floor Spots','Interactive Objects':'Magic Blocks',Other:'Surprise Items'};
const first=n=>String(n||'').split(' ')[0];
function adventureTitle(a){const n=(a.name+' '+a.category).toLowerCase();return /balanc/.test(n)?'Balance Explorer':/jump|reach/.test(n)?'Jumping Adventure':/ball|push|object/.test(n)?'Object Explorer':/obstacle|cross/.test(n)?'Color Chase':/puzzle|floor/.test(n)?'Shape Hunt':/free|explor/.test(n)?'Cube Discovery':/team/.test(n)?'Team Play':'Movement Challenge'}
function artKey(a){const t=adventureTitle(a);return{'Balance Explorer':'balance','Jumping Adventure':'jump','Object Explorer':'object','Color Chase':'chase','Shape Hunt':'shapes','Cube Discovery':'cube','Team Play':'team'}[t]||'move'}
function meta(kz,a){const m=(kz.activityMeta||{})[a.id]||{};return{title:m.title||adventureTitle(a),text:m.text||a.description||'A fun Cube activity.',minutes:m.minutes||({Easy:10,Medium:15,Hard:20}[a.difficulty]||12),zoneId:m.zoneId||(kz.zones.filter(z=>z.kind===(CATZONE[a.category]||'floor'))[0]||kz.zones[0]||{}).id,objects:m.objects||'Soft play objects',art:artKey(a)}}
const starsFor=(kz,a)=>(kz.settings.stars||STARS)[a.difficulty]||1;
function childSessions(D,pid){return D.sessions.filter(s=>s.participantId===pid&&s.status==='Completed').sort((a,b)=>(a.date+a.start)<(b.date+b.start)?-1:1)}
function sessionStat(D,kz,s){const mv=D.movements.filter(m=>m.sessionId===s.id),play=s.duration||0,acts=(s.activityIds||[]).map(id=>D.activities.filter(a=>a.id===id)[0]).filter(Boolean);
  return{id:s.id,date:s.date,play,move:r1(Math.min(mv.reduce((t,m)=>t+m.duration,0)/60,play)),acts,objs:D.objects.filter(o=>o.sessionId===s.id),events:mv.length}}
function metrics(D,kz,sessions){const m={sessions:0,play:0,move:0,acts:{},completions:0,stars:0,zones:{},objs:{},balance:0,multi:0,byAct:{}};
  sessions.forEach(s=>{const st=sessionStat(D,kz,s);m.sessions++;m.play+=st.play;m.move+=st.move;if(st.acts.length>1)m.multi++;
    st.acts.forEach(a=>{m.acts[a.id]=1;m.byAct[a.id]=(m.byAct[a.id]||0)+1;m.completions++;m.stars+=starsFor(kz,a);const z=meta(kz,a).zoneId;if(z)m.zones[z]=1;if(a.category==='Balance')m.balance++});
    st.objs.forEach(o=>{m.objs[o.object]=1})});
  m.move=r1(m.move);m.moveMin=Math.floor(m.move);m.rest=r1(Math.max(0,m.play-m.move));m.activities=Object.keys(m.acts).length;m.zoneCount=Object.keys(m.zones).length;m.objectCount=Object.keys(m.objs).length;return m}
const value=(d,m)=>({sessions:m.sessions,activities:m.activities,moveMin:m.moveMin,balance:m.balance,zones:m.zoneCount,objects:m.objectCount,completions:m.completions,multi:m.multi,stars:m.stars})[d.rule]||0;
function achievements(D,kz,pid){const ss=childSessions(D,pid),out=kz.ach.filter(d=>d.enabled!==false).map(d=>({def:d,date:null,sessionId:null}));
  for(let i=1;i<=ss.length;i++){const m=metrics(D,kz,ss.slice(0,i));out.forEach(o=>{if(!o.date&&value(o.def,m)>=o.def.threshold){o.date=ss[i-1].date;o.sessionId=ss[i-1].id}})}
  const mf=metrics(D,kz,ss);out.forEach(o=>{o.value=value(o.def,mf);o.done=!!o.date});return out}
function stateOf(D,pid,a){if(a.status!=='Active')return'Locked';if(D.sessions.some(s=>s.participantId===pid&&s.status==='Completed'&&(s.activityIds||[]).includes(a.id)))return'Completed';if(D.sessions.some(s=>s.participantId===pid&&s.status==='Active'&&(s.activityIds||[]).includes(a.id)))return'In Progress';return'Available'}
function addDays(iso,n){const d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function period(D,kz,pid,days,today){const all=childSessions(D,pid),from=addDays(today,-(days-1)),pf=addDays(from,-days),inR=(s,a,b)=>s.date>=a&&s.date<=b;
  return{from,to:today,cur:metrics(D,kz,all.filter(s=>inR(s,from,today))),prev:metrics(D,kz,all.filter(s=>inR(s,pf,addDays(from,-1))))}}
function insights(D,kz,pid,today){const ss=childSessions(D,pid);if(!ss.length)return{items:[],empty:true};
  const L=sessionStat(D,kz,ss[ss.length-1]),items=[],n=L.acts.length;
  if(n)items.push(`You completed ${n} ${n===1?'activity':'activities'} in your latest adventure.`);
  if(ss.length>1&&L.move>sessionStat(D,kz,ss[ss.length-2]).move)items.push('You spent more time moving during your last session.');
  if(period(D,kz,pid,7,today).cur.activities>=2)items.push('You enjoyed several different activities this week.');
  const z=L.acts.map(a=>meta(kz,a).zoneId).filter((x,i,a)=>x&&a.indexOf(x)===i).map(id=>(kz.zones.filter(q=>q.id===id)[0]||{}).name).filter(Boolean)[0];
  if(z)items.push(`You explored the ${z} in your latest adventure.`);
  const ko=new Set(L.objs.map(o=>o.object)).size;if(ko)items.push(`You played with ${ko} kinds of objects in your latest adventure.`);
  return{items,empty:!items.length}}
function staffInsights(D,kz,pid,today){const ss=childSessions(D,pid);if(!ss.length)return[];const m=metrics(D,kz,ss),at=D.attendance.filter(a=>a.participantId===pid),pres=at.filter(a=>a.status==='Present'||a.status==='Late').length;
  return[`${m.sessions} completed sessions; average recorded play time ${r1(m.play/m.sessions)} min.`,`Recorded movement is ${m.play?Math.round(m.move/m.play*100):0}% of recorded play time (manual entries, not AI measurements).`,at.length?`Attendance: ${pres} of ${at.length} sessions attended or late.`:'No attendance records.',`${m.activities} different activities and ${m.objectCount} object types recorded.`]}
const api={RULES,ZONES,CATZONE,OBJNAME,STARS,first,adventureTitle,meta,starsFor,childSessions,sessionStat,metrics,value,achievements,stateOf,addDays,period,insights,staffInsights};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KidsCore=api;
})(typeof window!=='undefined'?window:this);
