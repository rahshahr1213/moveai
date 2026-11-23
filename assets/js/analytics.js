/* MoveAnalytics: pure calculation engine. No DOM, no storage. Every function takes a data snapshot
   ({participants,sessions,activities,movements,objects,reports,supervisors,attendance,audit}) so it is testable and reusable.
   Missing values are returned as null (never replaced by invented numbers). */
(function(root){
"use strict";
var AS=['Present','Absent','Late','Excused'];
function p2(n){return n<10?'0'+n:''+n}
function iso(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())}
function parse(s){var a=s.split('-');return new Date(+a[0],+a[1]-1,+a[2])}
function addDays(s,n){var d=parse(s);d.setDate(d.getDate()+n);return iso(d)}
function diffDays(a,b){return Math.round((parse(b)-parse(a))/864e5)}
function ratio(a,b){return b>0?a/b:null}
function pct(a,b){var r=ratio(a,b);return r===null?null:Math.round(r*1000)/10}
function round(v,n){return v===null||v===undefined?null:Math.round(v*Math.pow(10,n||1))/Math.pow(10,n||1)}
function range(key,custom,now){
  var to=iso(now||new Date()),from=to;
  if(key==='7d')from=addDays(to,-6);else if(key==='30d')from=addDays(to,-29);else if(key==='90d')from=addDays(to,-89);
  else if(key==='year')from=to.slice(0,4)+'-01-01';
  else if(key==='custom'&&custom&&custom.from&&custom.to){from=custom.from;to=custom.to}
  if(from>to){var t=from;from=to;to=t}
  var days=diffDays(from,to)+1;
  return{key:key,from:from,to:to,days:days,prev:{from:addDays(from,-days),to:addDays(from,-1)}}}
function inR(date,r){return !!date&&date>=r.from&&date<=r.to}
function sessionsIn(d,r,f){f=f||{};var acts={};d.activities.forEach(function(a){acts[a.id]=a});
  return d.sessions.filter(function(s){
    if(!inR(s.date,r))return false;
    if(f.supervisor&&s.supervisor!==f.supervisor)return false;
    if(f.status&&s.status!==f.status)return false;
    if(f.participantId&&s.participantId!==f.participantId)return false;
    var ids=s.activityIds||[];
    if(f.activityId&&ids.indexOf(f.activityId)<0)return false;
    if(f.category&&!ids.some(function(i){return acts[i]&&acts[i].category===f.category}))return false;
    if(f.difficulty&&!ids.some(function(i){return acts[i]&&acts[i].difficulty===f.difficulty}))return false;
    return true})}
/* attendance: one record per session+participant (latest wins); only valid statuses count */
function attendanceFor(d,ids){var m={};d.attendance.forEach(function(a){if(ids[a.sessionId]&&AS.indexOf(a.status)>-1){var k=a.sessionId+'|'+a.participantId;if(!m[k]||m[k].at<a.at)m[k]=a}});return Object.keys(m).map(function(k){return m[k]})}
function agg(d,sessions){
  var ids={},seen={};sessions.forEach(function(s){ids[s.id]=1});
  var att=attendanceFor(d,ids),c={Present:0,Absent:0,Late:0,Excused:0};att.forEach(function(a){c[a.status]++});
  var mv=d.movements.filter(function(m){if(!ids[m.sessionId]||seen[m.id])return false;seen[m.id]=1;return m.duration>0&&m.intensity>=1&&m.intensity<=5});
  var ob=d.objects.filter(function(o){return ids[o.sessionId]});
  var done=sessions.filter(function(s){return s.status==='Completed'}),can=sessions.filter(function(s){return s.status==='Cancelled'});
  var act=0,inten=0;mv.forEach(function(m){act+=m.duration;inten+=m.intensity});
  var dur=done.filter(function(s){return s.duration>0}),dsum=dur.reduce(function(t,s){return t+s.duration},0);
  var withMv={};mv.forEach(function(m){withMv[m.sessionId]=1});
  var sessTime=done.reduce(function(t,s){return t+(s.duration||0)*60},0),pids={};sessions.forEach(function(s){pids[s.participantId]=1});
  return{sessions:sessions.length,completed:done.length,cancelled:can.length,scheduled:sessions.filter(function(s){return s.status==='Pending'||s.status==='Active'}).length,
    participants:Object.keys(pids).length,attRecords:att.length,present:c.Present,absent:c.Absent,late:c.Late,excused:c.Excused,
    attRate:pct(c.Present+c.Late,att.length),presentRate:pct(c.Present,att.length),absentRate:pct(c.Absent,att.length),lateRate:pct(c.Late,att.length),excusedRate:pct(c.Excused,att.length),
    events:mv.length,activeSec:act,restSec:Math.max(0,sessTime-act),avgEventSec:round(ratio(act,mv.length)),avgIntensity:round(ratio(inten,mv.length)),
    sessionsWithMovement:Object.keys(withMv).length,objects:ob.length,objSec:ob.reduce(function(t,o){return t+(o.duration||0)},0),
    objPerSession:round(ratio(ob.length,sessions.length)),avgSessionMin:round(ratio(dsum,dur.length)),avgParticipantsPerSession:round(ratio(sessions.length?Object.keys(pids).length:0,sessions.length),2),
    completionRate:pct(done.length,done.length+can.length),
    activePerSessionMin:round(ratio(act/60,done.length)),
    /* DEMO-DERIVED ESTIMATE: distance = duration * (0.3 + 0.15*intensity) m/s. Not measured. */
    distanceEst:Math.round(mv.reduce(function(t,m){return t+m.duration*(.3+.15*m.intensity)},0))}}
function groupBy(d,sessions,type){var g={};
  sessions.forEach(function(s){var keys=type==='activity'?(s.activityIds||[]):type==='supervisor'?[s.supervisor]:type==='participant'?[s.participantId]:[s.id];
    keys.forEach(function(k){if(k){(g[k]=g[k]||[]).push(s)}})});return g}
function granularity(r){return r.days<=31?'day':r.days<=120?'week':'month'}
function bucketKey(date,g){if(g==='day')return date;if(g==='month')return date.slice(0,7);var dt=parse(date),w=(dt.getDay()+6)%7;return addDays(date,-w)}
function bucketKeys(r,g){var out=[],seen={},x=r.from;while(x<=r.to){var k=bucketKey(x,g);if(!seen[k]){seen[k]=1;out.push(k)}x=addDays(x,1)}return out}
function series(d,sessions,r,fn,g){g=g||granularity(r);var keys=bucketKeys(r,g),by={};keys.forEach(function(k){by[k]=[]});
  sessions.forEach(function(s){var k=bucketKey(s.date,g);if(by[k])by[k].push(s)});
  return{gran:g,keys:keys,labels:keys.map(function(k){return g==='month'?k:k.slice(5)}),values:keys.map(function(k){return by[k].length?fn(agg(d,by[k]),by[k]):null})}}
function change(cur,prev){if(cur===null||prev===null||prev===0||cur===undefined||prev===undefined)return null;return round((cur-prev)/prev*100,1)}
/* participant trend: needs >=4 completed sessions with movement; compares mean active time of 2nd vs 1st half */
function trend(d,sessions){
  var list=sessions.filter(function(s){return s.status==='Completed'}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0}),pts=[];
  list.forEach(function(s){var a=agg(d,[s]);if(a.events>0)pts.push({date:s.date,active:a.activeSec,inten:a.avgIntensity})});
  if(pts.length<4)return{state:'insufficient',n:pts.length,points:pts,change:null};
  var h=Math.floor(pts.length/2),m=function(a){return a.reduce(function(t,x){return t+x.active},0)/a.length},a=m(pts.slice(0,h)),b=m(pts.slice(pts.length-h)),ch=change(b,a);
  return{state:ch===null?'insufficient':ch>10?'improving':ch<-10?'declining':'stable',n:pts.length,points:pts,change:ch}}
function quality(d){
  var sid={},pid={},codes={},dup=0,invalid=0,missing=0;
  d.sessions.forEach(function(s){sid[s.id]=1;if(!s.date||!s.participantId||!s.supervisor)missing++;if(s.code){if(codes['s'+s.code])dup++;codes['s'+s.code]=1}});
  d.participants.forEach(function(p){pid[p.id]=1;if(!p.name||!p.code||!p.ageGroup)missing++;if(p.code){if(codes['p'+p.code])dup++;codes['p'+p.code]=1}});
  d.movements.forEach(function(m){if(!(m.duration>0)||!(m.intensity>=1&&m.intensity<=5))invalid++;if(!sid[m.sessionId])invalid++});
  d.objects.forEach(function(o){if(!sid[o.sessionId])invalid++});
  var att={};d.attendance.forEach(function(a){att[a.sessionId]=1});var mv={};d.movements.forEach(function(m){mv[m.sessionId]=1});
  var withS={};d.sessions.forEach(function(s){withS[s.participantId]=1});
  var done=d.sessions.filter(function(s){return s.status==='Completed'});
  var last=d.audit&&d.audit[0]?d.audit[0].at:null;
  return{total:d.participants.length+d.sessions.length+d.activities.length+d.movements.length+d.objects.length+d.reports.length+d.attendance.length,
    counts:{participants:d.participants.length,sessions:d.sessions.length,activities:d.activities.length,movements:d.movements.length,objects:d.objects.length,reports:d.reports.length,attendance:d.attendance.length},
    missing:missing,duplicates:dup,invalid:invalid,completedNoAttendance:done.filter(function(s){return !att[s.id]}).length,completedNoMovement:done.filter(function(s){return !mv[s.id]}).length,
    participantsNoSessions:d.participants.filter(function(p){return !withS[p.id]}).length,lastChange:last}}
function csv(headers,rows){function q(v){v=v===null||v===undefined?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}return[headers].concat(rows).map(function(r){return r.map(q).join(',')}).join('\r\n')}
root.MoveAnalytics={AS:AS,range:range,inR:inR,sessionsIn:sessionsIn,agg:agg,groupBy:groupBy,series:series,granularity:granularity,change:change,trend:trend,quality:quality,csv:csv,pct:pct,addDays:addDays,iso:iso};
if(typeof module!=='undefined')module.exports=root.MoveAnalytics;
})(typeof window!=='undefined'?window:globalThis);
