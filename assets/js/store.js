/* MoveStore: local demo data service (localStorage). Swap the internals for fetch() calls to use a real API later. */
(function(){
"use strict";
var KEY='moveai.data.v1', BKEY='moveai.backup.v1', COLS=['participants','sessions','activities','movements','objects','reports'];
var PFX={participants:'PT',sessions:'S',activities:'A',movements:'EV',objects:'OI',reports:'R',supervisors:'SV',audit:'AU',notifications:'N',attendance:'AT',notes:'NT'};
var MT=['Walking','Running','Jumping','Crawling','Balancing','Reaching','Climbing','Turning','Stretching','Other'];
var OB=['Balls','Elastic Elements','Walls','Floor Areas','Interactive Objects','Other'];
var IT=['Touch','Push','Pull','Throw','Step on','Climb on','Other'];
var SUP=['Sarah Miller','Reza Farhadi','Elaheh Moini','Omid Karimi'];
var STAT=['Completed','Active','Pending','Cancelled'];
var db=null;
function p2(n){return n<10?'0'+n:''+n}
function iso(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())}
function dAgo(n){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-n);return d}
function mins(s,e){if(!s||!e)return 0;var a=s.split(':'),b=e.split(':'),m=(+b[0]*60+ +b[1])-(+a[0]*60+ +a[1]);return m>0?m:0}
function seed(){
  var s=7;function R(){s=(s*1664525+1013904223)%4294967296;return s/4294967296}
  function pick(a){return a[Math.floor(R()*a.length)]}
  function ri(a,b){return a+Math.floor(R()*(b-a+1))}
  var d={participants:[],sessions:[],activities:[],movements:[],objects:[],reports:[]};
  var names='Aria Kaviani,Dorsa Moradi,Kian Tabrizi,Sara Zand,Mehdi Rostami,Lina Pakzad,Nima Hashemi,Roya Ahmadi,Bardia Nouri,Yasmin Rezaei,Arman Jafari,Hana Shirazi,Parsa Entezari,Mina Sadeghi,Tara Nikoo,Ario Mansouri,Neda Farzin,Sina Bagheri,Kimia Azadi,Darius Vaziri,Elnaz Hosseini,Omid Tahmasbi,Shirin Ghaffari,Pouya Amini,Negar Salehi'.split(',');
  var ages=['3-5','6-8','9-12','13-17','18+'],cons=['Granted','Granted','Granted','Pending','Withdrawn'];
  names.forEach(function(n,i){var ag=ages[i%5];d.participants.push({id:'PT-'+(1001+i),code:'P-'+('00'+(i+1)).slice(-3),name:n,ageGroup:ag,type:ag==='18+'?'Adult':'Child',consent:cons[i%5===4?(i%2?3:4):(i%7===3?3:0)],regDate:iso(dAgo(60+ri(0,120))),notes:i%4===0?'Prefers morning sessions.':''})});
  var ac=[['Obstacle crossing','Locomotion','Cross a course of soft obstacles','Medium'],['Ball push','Object play','Push balls toward projected targets','Easy'],['Balance course','Balance','Walk and balance along floor lines','Medium'],['Free play','Exploration','Unstructured movement in the Cube','Easy'],['Crawl pattern','Locomotion','Follow projected crawl paths','Easy'],['Jump & reach','Coordination','Jump to reach light panels','Hard'],['Wall climb','Strength','Climb on low padded wall holds','Hard'],['Elastic stretch','Flexibility','Stretch and pull elastic elements','Medium'],['Turn & track','Coordination','Turn to follow moving projections','Medium'],['Floor puzzle','Cognitive','Step on floor areas to solve a puzzle','Easy']];
  ac.forEach(function(a,i){d.activities.push({id:'A-'+(101+i),name:a[0],category:a[1],description:a[2],difficulty:a[3],status:i===9?'Draft':'Active'})});
  var ev=1,oi=1,rp=1;
  for(var i=0;i<40;i++){
    var off=i<2?0:ri(0,59),st=off===0?(i===0?'Active':'Pending'):R()<.1?'Cancelled':R()<.06?'Pending':'Completed';
    var sh=ri(9,16),sm=pick([0,15,30,45]),dur=ri(12,35),en=sh*60+sm+dur;
    var se={id:'S-'+(1001+i),code:'MV-'+dAgo(off).getFullYear()+'-'+('00'+(i+1)).slice(-3),participantId:pick(d.participants).id,supervisor:pick(SUP),date:iso(dAgo(off)),start:p2(sh)+':'+p2(sm),end:st==='Pending'||st==='Active'?'':p2(Math.floor(en/60))+':'+p2(en%60),duration:st==='Pending'||st==='Active'?0:dur,status:st,room:pick(['Cube A','Cube B','Cube C']),activityIds:[pick(d.activities).id],notes:i%5===0?'Participant engaged well.':''};
    if(R()<.4)se.activityIds.push(pick(d.activities).id);
    d.sessions.push(se);
    if(st==='Completed'||st==='Active'){for(var k=ri(3,6);k>0;k--)d.movements.push({id:'EV-'+(1000+ev++),sessionId:se.id,type:pick(MT.slice(0,9)),duration:ri(10,180),intensity:ri(1,5),attempts:ri(1,8),timestamp:se.date+'T'+se.start,notes:'',source:'Manual entry'});
      for(var j=ri(2,4);j>0;j--)d.objects.push({id:'OI-'+(1000+oi++),sessionId:se.id,object:pick(OB.slice(0,5)),interaction:pick(IT),duration:ri(5,120),timestamp:se.date+'T'+se.start,notes:''})}
    if(st==='Completed'&&R()<.65)d.reports.push({id:'R-'+(100+rp++),sessionId:se.id,summary:'Session summary for '+se.code+': movement and object data recorded.',status:pick(['Draft','Pending review','Pending review','Approved']),comments:'',created:se.date});
  }
  return d;
}
var CATS=['Movement','Balance','Coordination','Obstacle Navigation','Object Interaction','Exploration'];
var LABEL={participants:'Participant',sessions:'Session',activities:'Activity',movements:'Movement event',objects:'Object interaction',reports:'Report',supervisors:'Supervisor'};
function ensure(){
  if(!Array.isArray(db.supervisors)){
    var names=SUP.slice();db.sessions.forEach(function(x){if(x.supervisor&&names.indexOf(x.supervisor)<0)names.push(x.supervisor)});
    db.supervisors=names.map(function(n,i){var pid={};db.sessions.forEach(function(x){if(x.supervisor===n)pid[x.participantId]=1});
      return{id:'SV-'+(101+i),name:n,email:n.toLowerCase().replace(/[^a-z]+/g,'.')+'@example.org',status:'Active',participantIds:Object.keys(pid),createdAt:iso(dAgo(90))}});
  }
  if(!Array.isArray(db.audit))db.audit=[];
  if(!Array.isArray(db.notes))db.notes=[];
  if(!Array.isArray(db.attendance)){var ST=['Present','Present','Present','Late','Present','Absent','Excused'];
    db.attendance=db.sessions.filter(function(x){return x.status==='Completed'}).map(function(x,i){return{id:'AT-'+(1001+i),sessionId:x.id,participantId:x.participantId,status:ST[i%ST.length],note:'',at:x.date+'T'+(x.start||'09:00')}})}
  if(!Array.isArray(db.notifications)){db.notifications=[];db.supervisors.forEach(function(v,i){db.notifications.push({id:'N-'+(100+i*2),supervisorId:v.id,text:'Welcome to the Supervisor Panel (demo notifications).',read:false,at:iso(dAgo(2))+'T09:00'},{id:'N-'+(101+i*2),supervisorId:v.id,text:'You have '+v.participantIds.length+' participants assigned.',read:i%2===0,at:iso(dAgo(1))+'T10:00'})})}
  if(!db.settings||typeof db.settings!=='object')db.settings={org:'MOVE AI Demo Lab',platform:'MOVE AI',actor:'Admin (demo)',sessionMinutes:20,sessionStatus:'Pending',pageSize:10,categories:CATS.slice(),role:'Admin',svId:null,svUpcomingDays:14};
  var cf=db.settings;if(cf.role===undefined)cf.role='Admin';if(cf.svUpcomingDays===undefined)cf.svUpcomingDays=14;if(!cf.svId||!db.supervisors.some(function(v){return v.id===cf.svId}))cf.svId=db.supervisors[0]?db.supervisors[0].id:null;
}
function log(action,type,id,detail){
  db.audit.unshift({id:nextId('audit'),actor:db.settings.actor||'Admin (demo)',action:action,type:type,recordId:id||'—',detail:detail||'',at:new Date().toISOString()});
  if(db.audit.length>500)db.audit.length=500;
}
function notifyReport(r){var se=S.byId('sessions',r.sessionId),v=se&&db.supervisors.filter(function(x){return x.name===se.supervisor})[0];
  if(v&&(r.status==='Approved'||r.status==='Rejected'))db.notifications.unshift({id:nextId('notifications'),supervisorId:v.id,text:'Report '+r.id+' was '+r.status.toLowerCase()+'.'+(r.feedback?' Admin feedback: '+r.feedback:''),read:false,at:new Date().toISOString()});return true}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){return false}return true}
function valid(o){return o&&typeof o==='object'&&COLS.every(function(c){return Array.isArray(o[c])})}
function load(){try{var r=JSON.parse(localStorage.getItem(KEY));if(valid(r)){db=r;ensure();return}}catch(e){}db=seed();ensure();save()}
function nextId(c){var n=0;db[c].forEach(function(r){var m=/(\d+)$/.exec(r.id);if(m&&+m[1]>n)n=+m[1]});return PFX[c]+'-'+(n+1)}
var S=window.MoveStore={CATEGORIES:CATS,MOVEMENT_TYPES:MT,OBJECTS:OB,INTERACTIONS:IT,STATUSES:STAT,minutes:mins,
  get:function(c){return db[c].slice()},
  byId:function(c,id){return db[c].filter(function(r){return r.id===id})[0]||null},
  add:function(c,rec){rec.id=rec.id||nextId(c);db[c].push(rec);if(LABEL[c])log(LABEL[c]+' created',LABEL[c],rec.id,rec.name||rec.code||'');save();return rec},
  update:function(c,id,patch){var r=S.byId(c,id);if(!r)return null;var oldSt=r.status,oldSup=r.supervisor;Object.keys(patch).forEach(function(k){r[k]=patch[k]});
    if(LABEL[c]){if(c==='sessions'&&patch.status==='Completed'&&oldSt!=='Completed')log('Session completed','Session',id,r.code);else if(c==='sessions'&&patch.supervisor&&patch.supervisor!==oldSup)log('Supervisor assigned','Session',id,patch.supervisor);else if(c==='reports'&&patch.status&&patch.status!==oldSt&&notifyReport(r))log('Report '+patch.status.toLowerCase(),'Report',id,r.status);else log(LABEL[c]+' updated',LABEL[c],id,r.name||r.code||'')}
    save();return r},
  log:function(a,t,id,d){log(a,t,id,d);save()},
  remove:function(c,id){
    var sess=c==='participants'?db.sessions.filter(function(s){return s.participantId===id}).map(function(s){return s.id}):c==='sessions'?[id]:[];
    sess.forEach(function(sid){['movements','objects','reports'].forEach(function(x){db[x]=db[x].filter(function(r){return r.sessionId!==sid})});db.sessions=db.sessions.filter(function(s){return s.id!==sid})});
    if(LABEL[c])log(LABEL[c]+' deleted',LABEL[c],id);db[c]=db[c].filter(function(r){return r.id!==id});if(c==='participants')db.supervisors.forEach(function(v){v.participantIds=v.participantIds.filter(function(x){return x!==id})});save()},
  exportJSON:function(){log('Data exported','System','—');save();return JSON.stringify({app:'MOVE AI',version:1,exported:new Date().toISOString(),data:db},null,2)},
  importJSON:function(txt){var o=JSON.parse(txt),d=o&&o.data?o.data:o;if(!valid(d))throw new Error('Invalid backup file: missing collections.');try{localStorage.setItem(BKEY,JSON.stringify(db))}catch(e){}db=d;ensure();log('Data imported','System','—');save()},
  reset:function(){try{localStorage.setItem(BKEY,JSON.stringify(db))}catch(e){}db=seed();ensure();log('Demo data restored','System','—');save()},
  hasBackup:function(){return !!localStorage.getItem(BKEY)},
  restoreBackup:function(){var b=JSON.parse(localStorage.getItem(BKEY));if(valid(b)){db=b;ensure();log('Previous data restored','System','—');save();return true}return false},
  name:function(pid){var p=S.byId('participants',pid);return p?p.name:'(deleted)'},
  dash:function(){
    var P=db.participants,SS=db.sessions,out={range:{}};
    function inR(s,a,b){var t=new Date(s.date+'T00:00:00'),x=(dAgo(0)-t)/864e5;return x>=a&&x<b}
    [7,14,30,90].forEach(function(r){
      var labels=[],vals=[];for(var i=r-1;i>=0;i--){var dd=dAgo(i),k=iso(dd);labels.push(dd.toLocaleDateString('en',{month:'short',day:'numeric'}));vals.push(SS.filter(function(s){return s.date===k&&s.status!=='Cancelled'}).length)}
      var cur=SS.filter(function(s){return inR(s,0,r)}),prev=SS.filter(function(s){return inR(s,r,2*r)});
      var done=cur.filter(function(s){return s.status==='Completed'}),pd=prev.filter(function(s){return s.status==='Completed'});
      function avg(a){return a.length?a.reduce(function(t,s){return t+s.duration},0)/a.length:0}
      function pct(a,b){return b?Math.round((a-b)/b*1000)/10:0}
      var newP=P.filter(function(p){var x=(dAgo(0)-new Date(p.regDate+'T00:00:00'))/864e5;return x<r}).length;
      out.range[r]={sessions:vals,labels:labels,kpi:{participants:P.length,sessions:cur.length,completed:done.length,active:SS.filter(function(s){return s.status==='Active'}).length,duration:Math.round(avg(done))+'m',pending:db.reports.filter(function(x){return x.status!=='Approved'}).length},
        kpiDelta:{participants:pct(newP,P.length-newP),sessions:pct(cur.length,prev.length),completed:cur.length?Math.round(done.length/cur.length*1000)/10:0,duration:pct(avg(done),avg(pd))}};
    });
    var cnt={};db.movements.forEach(function(m){cnt[m.type]=(cnt[m.type]||0)+1});
    var mv=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]}).slice(0,5),tot=db.movements.length||1;
    out.mv={labels:mv,data:mv.map(function(k){return Math.round(cnt[k]/tot*100)})};
    var oc={};db.objects.forEach(function(o){oc[o.object]=(oc[o.object]||0)+1});var ok=Object.keys(oc).sort(function(a,b){return oc[b]-oc[a]}).slice(0,5);
    out.ob={labels:ok,data:ok.map(function(k){return oc[k]})};
    var ac={};SS.forEach(function(s){s.activityIds.forEach(function(a){ac[a]=(ac[a]||0)+1})});
    var ak=Object.keys(ac).sort(function(a,b){return ac[b]-ac[a]}).slice(0,5);
    out.top=ak.map(function(id){var a=S.byId('activities',id);return{name:a?a.name:id,count:ac[id],max:ac[ak[0]]}});
    var cols=['#2a78d6','#0d9488','#eda100','#6250d6'];
    out.act={labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],datasets:ak.slice(0,4).map(function(id,i){var a=S.byId('activities',id),arr=[0,0,0,0,0,0,0];SS.forEach(function(s){if(s.activityIds.indexOf(id)>-1){var w=(new Date(s.date+'T00:00:00').getDay()+6)%7;arr[w]+=s.duration}});return{label:a?a.name:id,data:arr,backgroundColor:cols[i],borderRadius:4}})};
    out.sessions=SS.slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0}).map(function(s){
      var p=S.byId('participants',s.participantId),a=S.byId('activities',s.activityIds[0]),mc={},best='—';
      db.movements.forEach(function(m){if(m.sessionId===s.id)mc[m.type]=(mc[m.type]||0)+1});Object.keys(mc).forEach(function(k){if(best==='—'||mc[k]>mc[best])best=k});
      var nm=p?p.name:'(deleted)';
      return{id:s.code,p:p?p.code:'—',name:nm,init:nm.split(' ').map(function(w){return w[0]}).join('').slice(0,2).toUpperCase(),activity:a?a.name:'—',movement:best,room:s.room||'—',duration:s.duration?s.duration+'m':'—',status:s.status,date:new Date(s.date+'T00:00:00').toLocaleDateString('en',{month:'short',day:'numeric'})}});
    return out;
  }
};
Object.defineProperty(S,'SUPERVISORS',{get:function(){return db.supervisors.filter(function(v){return v.status==='Active'}).map(function(v){return v.name})}});
S.role=function(){return db.settings.role};
S.svId=function(){return db.settings.svId};
S.setRole=function(role,svId){db.settings.role=role;if(svId)db.settings.svId=svId;save()};
S.me=function(){return S.byId('supervisors',db.settings.svId)};
S.mySessions=function(){var m=S.me();return m?db.sessions.filter(function(x){return x.supervisor===m.name}):[]};
S.myParticipants=function(){var m=S.me(),ids={};if(!m)return[];m.participantIds.forEach(function(i){ids[i]=1});S.mySessions().forEach(function(x){ids[x.participantId]=1});return db.participants.filter(function(p){return ids[p.id]})};
S.attendanceOf=function(sid){return db.attendance.filter(function(a){return a.sessionId===sid})[0]||null};
S.setAttendance=function(sid,status,note){var se=S.byId('sessions',sid),a=S.attendanceOf(sid),at=new Date().toISOString();if(!se)return null;
  if(a){a.status=status;a.note=note||'';a.at=at}else db.attendance.push({id:nextId('attendance'),sessionId:sid,participantId:se.participantId,status:status,note:note||'',at:at});
  log('Attendance updated','Session',sid,status);save();return true};
S.addNote=function(pid,text){var m=S.me();db.notes.unshift({id:nextId('notes'),participantId:pid,supervisorId:m?m.id:null,author:m?m.name:'Admin',text:text,at:new Date().toISOString()});log('Participant note added','Participant',pid);save()};
S.markRead=function(id,v){var n=db.notifications.filter(function(x){return x.id===id})[0];if(n){n.read=v;save()}};
S.markAllRead=function(svId){db.notifications.forEach(function(n){if(n.supervisorId===svId)n.read=true});save()};
S.settings=function(){return db.settings};
S.saveSettings=function(p){Object.keys(p).forEach(function(k){db.settings[k]=p[k]});log('Settings updated','System','—');save()};
S.renameSupervisor=function(o,n){db.sessions.forEach(function(x){if(x.supervisor===o)x.supervisor=n});save()};
load();
})();
