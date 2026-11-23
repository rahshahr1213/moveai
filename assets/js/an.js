/* MoveAN: Advanced Analytics pages (Admin). All numbers come from MoveAnalytics over MoveStore records. */
(function(){
"use strict";
var S=window.MoveStore,A=window.MoveAnalytics,H=window.MovePages._h,esc=H.esc,V={},ST={};
var R=JSON.parse(sessionStorage.getItem('an.range')||'null')||{key:'90d',from:'',to:''};
var PAL=['#2a78d6','#0d9488','#eda100','#6250d6','#e5484d','#8b95a7'];
var TABS=[['an-overview','Overview'],['an-participants','Participants'],['an-movement','Movement'],['an-activities','Activities'],['an-sessions','Sessions'],['an-attendance','Attendance'],['an-objects','Objects'],['an-supervisors','Supervisors'],['an-compare','Comparisons'],['an-quality','Data quality']];
function snap(){return{participants:S.get('participants'),sessions:S.get('sessions'),activities:S.get('activities'),movements:S.get('movements'),objects:S.get('objects'),reports:S.get('reports'),supervisors:S.get('supervisors'),attendance:S.get('attendance'),audit:S.get('audit')}}
function rng(){return A.range(R.key,R,new Date())}
function nd(v,suf,dec){return v===null||v===undefined?'<span class="muted">—</span>':(dec?v:Math.round(v*10)/10)+(suf||'')}
function tx(v,suf){return v===null||v===undefined?'—':v+(suf||'')}
function mins(sec){return sec?Math.floor(sec/60)+'m '+Math.round(sec%60)+'s':'0m'}
function nm(map,id){return map[id]||id}
function spark(vals){var v=vals.map(function(x,i){return x===null?null:[i,x]}).filter(Boolean);if(v.length<2)return'';var mx=Math.max.apply(0,v.map(function(p){return p[1]})),mn=Math.min.apply(0,v.map(function(p){return p[1]})),W=90,Hh=24,n=vals.length-1||1;
  return'<svg viewBox="0 0 '+W+' '+Hh+'" width="90" height="24" aria-hidden="true"><polyline fill="none" stroke="#2a78d6" stroke-width="1.8" points="'+v.map(function(p){return(p[0]/n*W).toFixed(1)+','+(Hh-2-(mx===mn?.5:(p[1]-mn)/(mx-mn))*(Hh-4)).toFixed(1)}).join(' ')+'"/></svg>'}
function kc(label,val,sub,ch,sp){var d=ch===undefined?'':ch===null?'<div class="muted">Not enough data to compare</div>':'<div style="color:var('+(ch>=0?'--teal':'--amber')+',#0d9488);font-weight:600;font-size:12.5px">'+(ch>=0?'▲ ':'▼ ')+Math.abs(ch)+'% vs previous period</div>';
  return'<div class="kpi"><div class="top"><span class="label">'+label+'</span></div><div class="value">'+val+'</div>'+d+'<div class="muted" style="font-size:12px">'+sub+'</div>'+(sp||'')+'</div>'}
function cbox(id,t,has,note){return'<div class="panel"><h3>'+t+'</h3>'+(has?'<div style="position:relative;height:220px"><canvas id="'+id+'" role="img" aria-label="'+esc(t)+'"></canvas></div>':'<p class="muted">No data in this selection.</p>')+(note?'<p class="muted" style="font-size:12px">'+note+'</p>':'')+'</div>'}
function chart(el,id,type,labels,sets,o){var cv=el.querySelector('#'+id);if(!window.Chart||!cv)return;
  sets.forEach(function(s,i){var c=s.color||PAL[i%6];s.borderColor=type==='doughnut'?'#fff':c;if(type==='doughnut')s.backgroundColor=s.data.map(function(_,j){return PAL[j%6]});else s.backgroundColor=s.fill?c+'33':c;s.spanGaps=false;s.tension=.3;s.borderWidth=type==='bar'?0:2;s.pointRadius=2});
  try{new Chart(cv,{type:type==='area'?'line':type,data:{labels:labels,datasets:sets},options:Object.assign({maintainAspectRatio:false,plugins:{legend:{display:sets.length>1||type==='doughnut',position:'bottom'}}},o||{})})}catch(e){}}
function anyV(a){return a.some(function(x){return x!==null&&x>0})}
function dl(name,mime,text){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime}));a.download=name;a.click()}
function tabs(key){return'<div class="no-print" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px">'+TABS.map(function(t){return'<button class="btn sm'+(t[0]===key?' primary':'')+'" data-page="'+t[0]+'" style="white-space:nowrap">'+t[1]+'</button>'}).join('')+'</div>'}
function bar(r,extra){var o=[['today','Today'],['7d','Last 7 days'],['30d','Last 30 days'],['90d','Last 90 days'],['year','This year'],['custom','Custom range']].map(function(x){return{v:x[0],l:x[1]}});
  return'<div class="panel no-print"><div class="filters"><select data-an="range" aria-label="Period">'+H.opts(o,R.key)+'</select><input type="date" data-an="from" value="'+esc(r.from)+'" aria-label="From"><input type="date" data-an="to" value="'+esc(r.to)+'" aria-label="To">'+(extra||'')+'</div><p class="muted" style="margin:6px 0 0;font-size:12px">Period: '+r.from+' to '+r.to+' · compared with '+r.prev.from+' to '+r.prev.to+'. Calculated from data stored in this browser (demo data).</p></div>'}
function sel(name,a,val,all){return'<select data-an="'+name+'">'+H.opts(a,val||'',all)+'</select>'}
function page(key,title,sub,build){V[key]=function(el){el=H.fresh(el);var st=ST[key]=ST[key]||{},cur={};
  function draw(){var d=snap(),r=rng();cur=build(d,r,st)||{html:''};
    el.innerHTML=tabs(key)+'<div class="print-head"><b>MOVE AI</b> · '+esc(title)+' · '+r.from+' to '+r.to+' · generated '+new Date().toLocaleString()+' · local demo data</div>'+H.head(title,sub+' '+H.demoNote(),'<span class="no-print">'+(cur.table?'<button class="btn" data-act="csv">Export CSV</button><button class="btn" data-act="json">Export JSON</button>':'')+'<button class="btn" data-act="print">Print / Save as PDF</button></span>')+bar(r,cur.filters)+'<div id="anBody">'+cur.html+'</div>';
    if(cur.after)cur.after(el,d,r,st)}
  el.addEventListener('change',function(e){var n=e.target.getAttribute('data-an');if(!n)return;var v=e.target.type==='checkbox'?e.target.checked:e.target.value;
    if(n==='range'){R.key=v;if(v==='custom'&&!R.from){var t=A.range('30d');R.from=t.from;R.to=t.to}}else if(n==='from'||n==='to'){R[n]=v;R.key='custom'}else{st[n]=v;if(n==='sort')st.view=st.view}
    sessionStorage.setItem('an.range',JSON.stringify(R));draw()});
  el.addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act,r=rng();
    if(a==='print')window.print();
    else if(a==='csv'&&cur.table)dl('moveai-'+key+'-'+r.from+'_'+r.to+'.csv','text/csv',A.csv(cur.table.headers,cur.table.rows));
    else if(a==='json'&&cur.table)dl('moveai-'+key+'-'+r.from+'_'+r.to+'.json','application/json',JSON.stringify({app:'MOVE AI',page:title,generatedAt:new Date().toISOString(),dataBasis:'Locally stored demo data (not AI-generated)',range:{key:r.key,from:r.from,to:r.to},metrics:cur.json||{},table:cur.table},null,2));
    else if(cur.acts&&cur.acts[a]){cur.acts[a](b.dataset.id);draw()}});
  draw()}}
function basis(d,ss){var a=A.agg(d,ss),done=ss.filter(function(s){return s.status==='Completed'}).length;
  var w=[];if(done>a.sessionsWithMovement)w.push((done-a.sessionsWithMovement)+' of '+done+' completed sessions have no movement records');
  var ids={};d.attendance.forEach(function(x){ids[x.sessionId]=1});var na=ss.filter(function(s){return s.status==='Completed'&&!ids[s.id]}).length;if(na)w.push(na+' completed sessions have no attendance record');
  return w.length?'<div class="panel" style="border-left:3px solid #eda100"><b>Incomplete data:</b> '+w.join('; ')+'. Affected metrics only use the records that exist. <span class="muted">See Data quality.</span></div>':''}
function partMap(d){var m={};d.participants.forEach(function(p){m[p.id]=p.name});return m}
function actMap(d){var m={};d.activities.forEach(function(a){m[a.id]=a.name});return m}

/* ---- Overview ---- */
page('an-overview','Analytics overview','Key indicators for the selected period.',function(d,r){
  var ss=A.sessionsIn(d,r),ps=A.sessionsIn(d,r.prev?{from:r.prev.from,to:r.prev.to}:r),c=A.agg(d,ss),p=A.agg(d,ps),hasPrev=ps.length>0;
  var K=[['Total participants',d.participants.length,c.participants+' with sessions in period',hasPrev?A.change(c.participants,p.participants):null,function(a){return a.participants}],
   ['Total sessions',c.sessions,'Sessions dated in period',hasPrev?A.change(c.sessions,p.sessions):null,function(a){return a.sessions}],
   ['Completed sessions',c.completed,'Status Completed',hasPrev?A.change(c.completed,p.completed):null,function(a){return a.completed}],
   ['Avg attendance rate',nd(c.attRate,'%'),'(Present+Late) / valid records · '+c.attRecords+' records',hasPrev?A.change(c.attRate,p.attRate):null,function(a){return a.attRate}],
   ['Active movement time',mins(c.activeSec),'Sum of recorded movement events',hasPrev?A.change(c.activeSec,p.activeSec):null,function(a){return a.activeSec}],
   ['Avg movement duration',nd(c.avgEventSec,' s'),'Mean per movement event · '+c.events+' events',hasPrev?A.change(c.avgEventSec,p.avgEventSec):null,function(a){return a.avgEventSec}],
   ['Session completion rate',nd(c.completionRate,'%'),'Completed / (Completed + Cancelled)',hasPrev?A.change(c.completionRate,p.completionRate):null,function(a){return a.completionRate}],
   ['Object interactions',c.objects,c.objPerSession===null?'':c.objPerSession+' per session',hasPrev?A.change(c.objects,p.objects):null,function(a){return a.objects}]];
  var se=A.series(d,ss,r,function(a){return a.sessions});
  var html=basis(d,ss)+'<section class="kpi-grid">'+K.map(function(k){return kc(k[0],k[1],k[2],k[3],spark(A.series(d,ss,r,k[4]).values))}).join('')+'</section>'+
   '<div class="charts-row">'+cbox('o1','Sessions over time ('+se.gran+')',anyV(se.values))+cbox('o2','Session status',c.sessions>0)+'</div><div class="charts-row">'+cbox('o3','Attendance records',c.attRecords>0,'Valid records only (Present, Late, Absent, Excused).')+cbox('o4','Active vs rest time (min)',c.activeSec>0,'Rest = completed session time minus recorded movement.')+'</div>';
  return{html:html,json:{kpis:c,previous:hasPrev?p:null},table:{headers:['Metric','Value'],rows:K.map(function(k){return[k[0],String(k[1]).replace(/<[^>]+>/g,'')]})},
   after:function(el){chart(el,'o1','area',se.labels,[{label:'Sessions',data:se.values,fill:true}]);chart(el,'o2','doughnut',['Completed','Cancelled','Scheduled/Active'],[{data:[c.completed,c.cancelled,c.scheduled]}]);chart(el,'o3','doughnut',['Present','Late','Absent','Excused'],[{data:[c.present,c.late,c.absent,c.excused]}]);chart(el,'o4','bar',['Active','Rest'],[{label:'Minutes',data:[Math.round(c.activeSec/60),Math.round(c.restSec/60)]}])}}});

/* ---- Participants ---- */
page('an-participants','Participant analytics','Activity and movement performance indicators (not medical or developmental assessments).',function(d,r,st){
  var ss=A.sessionsIn(d,r),g=A.groupBy(d,ss,'participant'),pm=partMap(d);
  var rows=Object.keys(g).map(function(id){var a=A.agg(d,g[id]),t=A.trend(d,g[id]);return{id:id,name:pm[id]||id,a:a,t:t}});
  var M={attRate:['Attendance rate',function(x){return x.a.attRate}],activeSec:['Active movement time',function(x){return x.a.activeSec||null}],avgIntensity:['Avg intensity',function(x){return x.a.avgIntensity}],completionRate:['Session completion',function(x){return x.a.completionRate}],objects:['Object interactions',function(x){return x.a.objects||null}]};
  var m=st.sort||'activeSec';
  if(st.view){var x=rows.filter(function(y){return y.id===st.view})[0];if(x){var se=A.series(d,g[x.id],r,function(a){return round1(a.activeSec/60)},'week'),si=A.series(d,g[x.id],r,function(a){return a.avgIntensity},'week');
    return{html:'<div class="no-print"><button class="btn" data-act="back">← All participants</button></div><section class="kpi-grid">'+kc('Sessions attended',x.a.present+x.a.late,x.a.sessions+' sessions in period')+kc('Attendance rate',nd(x.a.attRate,'%'),x.a.attRecords+' valid records')+kc('Active movement',mins(x.a.activeSec),x.a.events+' events')+kc('Avg movement duration',nd(x.a.avgEventSec,' s'),'per event')+kc('Avg intensity',nd(x.a.avgIntensity,' / 5'),'scale 1-5')+kc('Session completion',nd(x.a.completionRate,'%'),'completed / (completed + cancelled)')+kc('Object interactions',x.a.objects,'')+kc('Trend',x.t.state,x.t.state==='insufficient'?'Needs 4+ completed sessions with movement ('+x.t.n+' found)':(x.t.change===null?'':x.t.change+'% active time, later vs earlier half'))+'</section><div class="charts-row">'+cbox('p1','Active movement per week (min)',anyV(se.values))+cbox('p2','Avg intensity per week',anyV(si.values))+'</div>',
      acts:{back:function(){st.view=null}},table:{headers:['Week','Active min','Avg intensity'],rows:se.keys.map(function(k,i){return[k,tx(se.values[i]),tx(si.values[i])]})},json:{participant:x.name,metrics:x.a,trend:{state:x.t.state,change:x.t.change}},
      after:function(el){chart(el,'p1','area',se.labels,[{label:'Active min',data:se.values,fill:true}]);chart(el,'p2','line',si.labels,[{label:'Intensity',data:si.values,color:'#0d9488'}])}}}st.view=null}
  var ranked=rows.filter(function(x){return M[m][1](x)!==null&&x.a.sessions>=3}).sort(function(a,b){return M[m][1](b)-M[m][1](a)}).slice(0,5);
  function chips(s){var l=rows.filter(function(x){return x.t.state===s});return l.length?l.map(function(x){return'<span class="chip">'+esc(x.name)+(x.t.change!==null?' ('+x.t.change+'%)':'')+'</span> '}).join(''):'<span class="muted">None</span>'}
  var html=basis(d,ss)+'<div class="panel"><h3>Top participants by '+M[m][0].toLowerCase()+'</h3><p class="muted" style="font-size:12px">Only participants with 3+ sessions in the period are ranked. Rankings compare one metric, not overall quality.</p>'+H.table(['#','Participant','Value','Sessions'],ranked.map(function(x,i){return[i+1,esc(x.name),tx(M[m][1](x)),x.a.sessions]}),'Not enough data to rank.')+'</div>'+
   '<div class="panel"><h3>Trends</h3><p><b>Improving</b> (active time up more than 10%): '+chips('improving')+'</p><p><b>Declining</b> (down more than 10%): '+chips('declining')+'</p><p><b>Stable</b>: '+chips('stable')+'</p><p><b>Insufficient data</b> (fewer than 4 completed sessions with movement): '+chips('insufficient')+'</p></div>'+
   '<div class="panel"><h3>All participants</h3>'+H.table(['Participant','Sessions','Attended','Attendance','Active time','Avg event','Intensity','Completion','Objects','Trend',''],rows.sort(function(a,b){return a.name<b.name?-1:1}).map(function(x){return[esc(x.name),x.a.sessions,x.a.present+x.a.late,nd(x.a.attRate,'%'),mins(x.a.activeSec),nd(x.a.avgEventSec,'s'),nd(x.a.avgIntensity),nd(x.a.completionRate,'%'),x.a.objects,x.t.state,H.btn('open',x.id,'Details')]}),'No sessions in this period.')+'</div>';
  return{html:html,filters:sel('sort',Object.keys(M).map(function(k){return{v:k,l:'Rank by '+M[k][0]}}),m),acts:{open:function(id){st.view=id}},json:{participants:rows.map(function(x){return{name:x.name,metrics:x.a,trend:x.t.state}})},
   table:{headers:['Participant','Sessions','Attended','Attendance %','Active sec','Avg event sec','Avg intensity','Completion %','Objects','Trend'],rows:rows.map(function(x){return[x.name,x.a.sessions,x.a.present+x.a.late,tx(x.a.attRate),x.a.activeSec,tx(x.a.avgEventSec),tx(x.a.avgIntensity),tx(x.a.completionRate),x.a.objects,x.t.state]})}}});
function round1(v){return Math.round(v*10)/10}

/* ---- Movement ---- */
page('an-movement','Movement analytics','Recorded movement events (manual demo entries; no camera or AI tracking connected).',function(d,r,st){
  var f={activityId:st.act||''},ss=A.sessionsIn(d,r,f),c=A.agg(d,ss),pr=A.sessionsIn(d,r.prev,f),pc=A.agg(d,pr),am=actMap(d);
  var se=A.series(d,ss,r,function(a){return round1(a.activeSec/60)}),sp=A.series(d,pr,{from:r.prev.from,to:r.prev.to,days:r.days},function(a){return round1(a.activeSec/60)}),sr=A.series(d,ss,r,function(a){return round1(a.restSec/60)}),si=A.series(d,ss,r,function(a){return a.avgIntensity});
  var ga=A.groupBy(d,ss,'activity'),gp=A.groupBy(d,ss,'participant'),pm=partMap(d);
  var byA=Object.keys(ga).map(function(k){var a=A.agg(d,ga[k]);return[am[k]||k,a.activePerSessionMin]}).filter(function(x){return x[1]!==null});
  var byP=Object.keys(gp).map(function(k){var a=A.agg(d,gp[k]);return[pm[k]||k,a.activePerSessionMin]}).filter(function(x){return x[1]!==null}).sort(function(a,b){return b[1]-a[1]}).slice(0,8);
  var done=ss.filter(function(s){return s.status==='Completed'&&A.agg(d,[s]).events>0}).sort(function(a,b){return a.date<b.date?1:-1}).slice(0,15),tot=c.activeSec+c.restSec;
  var html=basis(d,ss)+'<p class="muted">Distance and speed are <b>demo-derived estimates</b> (duration × a fixed factor by intensity), not measured values.</p><section class="kpi-grid">'+kc('Movement duration',mins(c.activeSec),c.events+' events',hasP(pr)?A.change(c.activeSec,pc.activeSec):null)+kc('Active time',mins(c.activeSec),'recorded movement')+kc('Rest time',mins(c.restSec),'completed session time − active')+kc('Distance (estimate)',c.distanceEst+' m','demo-derived')+kc('Avg speed (estimate)',c.activeSec?(c.distanceEst/c.activeSec).toFixed(2)+' m/s':'—','demo-derived')+kc('Avg intensity',nd(c.avgIntensity,' / 5'),'scale 1-5',hasP(pr)?A.change(c.avgIntensity,pc.avgIntensity):null)+kc('Frequency',tot?(c.events/(tot/60)).toFixed(1)+' /min':'—','events per session minute')+kc('Session completion',nd(c.completionRate,'%'),'')+'</section>'+
   '<div class="charts-row">'+cbox('m1','Movement duration over time (min'+(st.cmp?', with previous period':'')+')',anyV(se.values))+cbox('m2','Active vs rest time (min)',anyV(se.values))+'</div><div class="charts-row">'+cbox('m3','Average intensity (1-5)',anyV(si.values))+cbox('m4','Avg active min per session, by activity',byA.length>0,'Multi-activity sessions count toward each of their activities.')+'</div>'+cbox('m5','Avg active min per session, by participant (top 8)',byP.length>0)+
   '<div class="panel"><h3>By session (latest 15 with movement)</h3>'+H.table(['Session','Participant','Date','Events','Active','Intensity'],done.map(function(s){var a=A.agg(d,[s]);return[esc(s.code),esc(pm[s.participantId]||'—'),s.date,a.events,mins(a.activeSec),nd(a.avgIntensity)]}),'No sessions with movement data.')+'</div>';
  function hasP(x){return x.length>0&&st.cmp!==false}
  return{html:html,filters:sel('act',d.activities.map(function(a){return{v:a.id,l:a.name}}),st.act,'All activities')+'<label class="muted"><input type="checkbox" data-an="cmp"'+(st.cmp?' checked':'')+'> Overlay previous period</label>',json:{kpis:c,previous:pc},
   table:{headers:['Session','Participant','Date','Events','Active sec','Avg intensity'],rows:done.map(function(s){var a=A.agg(d,[s]);return[s.code,pm[s.participantId]||'',s.date,a.events,a.activeSec,tx(a.avgIntensity)]})},
   after:function(el){var ds=[{label:'This period',data:se.values}];if(st.cmp)ds.push({label:'Previous period',data:sp.values,color:'#8b95a7'});chart(el,'m1','line',se.labels,ds);
    chart(el,'m2','bar',se.labels,[{label:'Active',data:se.values},{label:'Rest',data:sr.values,color:'#8b95a7'}],{scales:{x:{stacked:true},y:{stacked:true}}});chart(el,'m3','line',si.labels,[{label:'Intensity',data:si.values,color:'#6250d6'}],{scales:{y:{min:0,max:5}}});
    chart(el,'m4','bar',byA.map(function(x){return x[0]}),[{label:'Min / session',data:byA.map(function(x){return x[1]})}],{indexAxis:'y'});chart(el,'m5','bar',byP.map(function(x){return x[0]}),[{label:'Min / session',data:byP.map(function(x){return x[1]}),color:'#0d9488'}],{indexAxis:'y'})}}});

/* ---- Activities ---- */
page('an-activities','Activity analytics','How each activity is used and what was recorded during its sessions.',function(d,r,st){
  var ss=A.sessionsIn(d,r,{category:st.cat,difficulty:st.diff}),g=A.groupBy(d,ss,'activity'),am=actMap(d),cm={};d.activities.forEach(function(a){cm[a.id]=a});
  var rows=Object.keys(g).filter(function(k){return !st.cat||(cm[k]&&cm[k].category===st.cat)}).filter(function(k){return !st.diff||(cm[k]&&cm[k].difficulty===st.diff)}).map(function(k){var a=A.agg(d,g[k]);return{id:k,name:am[k]||k,a:a,cat:cm[k]?cm[k].category:'—',diff:cm[k]?cm[k].difficulty:'—'}}).sort(function(a,b){return b.a.sessions-a.a.sessions});
  var top=rows.slice(0,8),stack=A.series(d,ss,r,function(a,l){return l.length},granularityOf(r)),keys=top.slice(0,4);
  var ser=keys.map(function(x){return{label:x.name,data:A.series(d,g[x.id],r,function(a){return a.sessions}).values.map(function(v){return v||0})}}),sl=A.series(d,ss,r,function(a){return a.sessions}).labels;
  var html=basis(d,ss)+'<p class="muted">Sessions with several activities count toward each one. Movement and objects are recorded per session, so they are shared across the activities of that session.</p>'+
   '<div class="charts-row">'+cbox('a1','Most used activities (sessions)',top.length>0)+cbox('a2','Completion rate (%)',rows.some(function(x){return x.a.completionRate!==null}))+'</div><div class="charts-row">'+cbox('a3','Avg movement event duration (s)',rows.some(function(x){return x.a.avgEventSec!==null}))+cbox('a4','Usage over time (top 4)',ser.length>0)+'</div>'+
   '<div class="panel"><h3>Activity comparison</h3>'+H.table(['Activity','Category','Difficulty','Sessions','Participants','Attendance','Completion','Avg event (s)','Intensity','Objects'],rows.map(function(x){return[esc(x.name),esc(x.cat),x.diff,x.a.sessions,x.a.participants,nd(x.a.attRate,'%'),nd(x.a.completionRate,'%'),nd(x.a.avgEventSec),nd(x.a.avgIntensity),x.a.objects]}),'No activity usage in this selection.')+'</div>';
  function granularityOf(r){return A.granularity(r)}
  return{html:html,filters:sel('cat',S.settings().categories,st.cat,'All categories')+sel('diff',['Easy','Medium','Hard'],st.diff,'All difficulty'),json:{activities:rows.map(function(x){return{name:x.name,metrics:x.a}})},
   table:{headers:['Activity','Category','Difficulty','Sessions','Participants','Attendance %','Completion %','Avg event sec','Avg intensity','Objects'],rows:rows.map(function(x){return[x.name,x.cat,x.diff,x.a.sessions,x.a.participants,tx(x.a.attRate),tx(x.a.completionRate),tx(x.a.avgEventSec),tx(x.a.avgIntensity),x.a.objects]})},
   after:function(el){chart(el,'a1','bar',top.map(function(x){return x.name}),[{label:'Sessions',data:top.map(function(x){return x.a.sessions})}],{indexAxis:'y'});var c=rows.filter(function(x){return x.a.completionRate!==null}).slice(0,8);chart(el,'a2','bar',c.map(function(x){return x.name}),[{label:'%',data:c.map(function(x){return x.a.completionRate}),color:'#0d9488'}],{indexAxis:'y',scales:{x:{max:100}}});
    var m=rows.filter(function(x){return x.a.avgEventSec!==null}).slice(0,8);chart(el,'a3','bar',m.map(function(x){return x.name}),[{label:'Seconds',data:m.map(function(x){return x.a.avgEventSec}),color:'#eda100'}],{indexAxis:'y'});chart(el,'a4','line',sl,ser)}}});

/* ---- Sessions ---- */
page('an-sessions','Session analytics','Volume, outcomes and attendance of sessions.',function(d,r,st){
  var ss=A.sessionsIn(d,r,{supervisor:st.sup,activityId:st.act,status:st.status}),c=A.agg(d,ss),gr=st.gran||A.granularity(r);
  var se=A.series(d,ss,r,function(a){return a.sessions},gr),sa=A.series(d,ss,r,function(a){return a.attRate},gr),bins=[0,0,0,0],dd=ss.filter(function(s){return s.status==='Completed'&&s.duration>0});
  dd.forEach(function(s){bins[s.duration<10?0:s.duration<20?1:s.duration<30?2:3]++});var pm=partMap(d);
  var last=ss.slice().sort(function(a,b){return a.date<b.date?1:-1}).slice(0,12);
  var html=basis(d,ss)+'<section class="kpi-grid">'+kc('Total sessions',c.sessions,'')+kc('Completed',c.completed,'')+kc('Cancelled',c.cancelled,'')+kc('Scheduled / active',c.scheduled,'')+kc('Avg duration',nd(c.avgSessionMin,' min'),'completed sessions with a duration')+kc('Avg attendance',nd(c.attRate,'%'),c.attRecords+' valid records')+kc('Participants / session',nd(c.avgParticipantsPerSession,'',1),'each session has one participant')+kc('Completion rate',nd(c.completionRate,'%'),'completed / (completed + cancelled)')+'</section>'+
   '<div class="charts-row">'+cbox('s1','Sessions per '+gr,anyV(se.values))+cbox('s2','Status distribution',c.sessions>0)+'</div><div class="charts-row">'+cbox('s3','Session duration distribution',dd.length>0,'Completed sessions with a recorded duration.')+cbox('s4','Attendance rate per '+gr+' (%)',anyV(sa.values))+'</div>'+
   '<div class="panel"><h3>Latest sessions in selection</h3>'+H.table(['Session','Participant','Date','Supervisor','Status','Attendance','Active'],last.map(function(s){var a=A.agg(d,[s]);return[esc(s.code),esc(pm[s.participantId]||'—'),s.date,esc(s.supervisor),s.status,a.attRecords?(a.present?'Present':a.late?'Late':a.absent?'Absent':'Excused'):'—',mins(a.activeSec)]}),'No sessions.')+'</div>';
  return{html:html,filters:sel('sup',S.get('supervisors').map(function(v){return v.name}),st.sup,'All supervisors')+sel('act',d.activities.map(function(a){return{v:a.id,l:a.name}}),st.act,'All activities')+sel('status',['Completed','Cancelled','Pending','Active'],st.status,'All statuses')+sel('gran',[{v:'day',l:'Per day'},{v:'week',l:'Per week'},{v:'month',l:'Per month'}],gr),json:{kpis:c},
   table:{headers:['Session','Participant','Date','Supervisor','Status','Duration min'],rows:ss.map(function(s){return[s.code,pm[s.participantId]||'',s.date,s.supervisor,s.status,s.duration||'']})},
   after:function(el){chart(el,'s1','bar',se.labels,[{label:'Sessions',data:se.values}]);chart(el,'s2','doughnut',['Completed','Cancelled','Scheduled/Active'],[{data:[c.completed,c.cancelled,c.scheduled]}]);chart(el,'s3','bar',['<10 min','10-19','20-29','30+'],[{label:'Sessions',data:bins,color:'#6250d6'}]);chart(el,'s4','line',sa.labels,[{label:'%',data:sa.values,color:'#0d9488'}],{scales:{y:{min:0,max:100}}})}}});

/* ---- Attendance ---- */
page('an-attendance','Attendance analytics','Based on valid attendance records only.',function(d,r,st){
  var ss=A.sessionsIn(d,r,{supervisor:st.sup,activityId:st.act,participantId:st.pid}),c=A.agg(d,ss),pm=partMap(d),ids={};ss.forEach(function(s){ids[s.id]=1});
  var noRec=ss.filter(function(s){var has=d.attendance.some(function(a){return a.sessionId===s.id});return !has&&s.status!=='Cancelled'&&s.status!=='Pending'}).length;
  var mo=A.series(d,ss,r,function(a){return a.attRate},'month'),gs=A.groupBy(d,ss,'supervisor'),ga=A.groupBy(d,ss,'activity'),gp=A.groupBy(d,ss,'participant'),am=actMap(d);
  var bs=Object.keys(gs).map(function(k){return[k,A.agg(d,gs[k]).attRate]}).filter(function(x){return x[1]!==null}),ba=Object.keys(ga).map(function(k){return[am[k]||k,A.agg(d,ga[k]).attRate]}).filter(function(x){return x[1]!==null});
  var rows=Object.keys(gp).map(function(k){return{id:k,name:pm[k]||k,a:A.agg(d,gp[k])}}).filter(function(x){return x.a.attRecords>0});
  var html='<div class="panel"><b>How this is calculated.</b> <span class="muted">Included: one latest record per session and participant, with status Present, Late, Absent or Excused, for sessions dated in the period'+(st.sup||st.act||st.pid?' and matching your filters':'')+'. Attendance rate = (Present + Late) / included records. '+noRec+' non-cancelled past sessions have no record and are excluded, not counted as absent.</span></div><section class="kpi-grid">'+kc('Attendance rate',nd(c.attRate,'%'),c.attRecords+' records')+kc('Present',nd(c.presentRate,'%'),c.present+' records')+kc('Late',nd(c.lateRate,'%'),c.late+' records')+kc('Absent',nd(c.absentRate,'%'),c.absent+' records')+kc('Excused',nd(c.excusedRate,'%'),c.excused+' records')+'</section>'+
   '<div class="charts-row">'+cbox('t1','Status mix',c.attRecords>0)+cbox('t2','Monthly attendance rate (%)',anyV(mo.values))+'</div><div class="charts-row">'+cbox('t3','By supervisor (%)',bs.length>0)+cbox('t4','By activity (%)',ba.length>0)+'</div>'+
   '<div class="panel"><h3>By participant</h3>'+H.table(['Participant','Records','Present','Late','Absent','Excused','Rate',''],rows.map(function(x){return[esc(x.name),x.a.attRecords,x.a.present,x.a.late,x.a.absent,x.a.excused,nd(x.a.attRate,'%'),H.btn('drill',x.id,'Records')]}),'No attendance records in this selection.')+'</div>';
  return{html:html,filters:sel('sup',S.get('supervisors').map(function(v){return v.name}),st.sup,'All supervisors')+sel('act',d.activities.map(function(a){return{v:a.id,l:a.name}}),st.act,'All activities')+sel('pid',d.participants.map(function(p){return{v:p.id,l:p.name}}),st.pid,'All participants'),json:{kpis:c,sessionsWithoutRecord:noRec},
   table:{headers:['Participant','Records','Present','Late','Absent','Excused','Rate %'],rows:rows.map(function(x){return[x.name,x.a.attRecords,x.a.present,x.a.late,x.a.absent,x.a.excused,tx(x.a.attRate)]})},
   acts:{drill:function(id){var l=d.attendance.filter(function(a){return ids[a.sessionId]&&a.participantId===id}).map(function(a){var s=d.sessions.filter(function(x){return x.id===a.sessionId})[0]||{};return[esc(s.code||a.sessionId),s.date||'—',a.status,esc(a.note||'')]});H.modal('Attendance · '+esc(pm[id]||id),H.table(['Session','Date','Status','Note'],l,'No records.'),'<button class="btn" data-close>Close</button>')}},
   after:function(el){chart(el,'t1','doughnut',['Present','Late','Absent','Excused'],[{data:[c.present,c.late,c.absent,c.excused]}]);chart(el,'t2','line',mo.labels,[{label:'%',data:mo.values}],{scales:{y:{min:0,max:100}}});chart(el,'t3','bar',bs.map(function(x){return x[0]}),[{label:'%',data:bs.map(function(x){return x[1]}),color:'#0d9488'}],{scales:{y:{min:0,max:100}}});chart(el,'t4','bar',ba.map(function(x){return x[0]}),[{label:'%',data:ba.map(function(x){return x[1]}),color:'#6250d6'}],{indexAxis:'y',scales:{x:{min:0,max:100}}})}}});

/* ---- Objects ---- */
page('an-objects','Object interaction analytics','Recorded object interactions (manual demo entries; no sensors connected).',function(d,r,st){
  var ss=A.sessionsIn(d,r,{activityId:st.act}),ids={},sm={};ss.forEach(function(s){ids[s.id]=1;sm[s.id]=s});var ob=d.objects.filter(function(o){return ids[o.sessionId]}),pm=partMap(d),am=actMap(d);
  var by={};ob.forEach(function(o){var b=by[o.object]=by[o.object]||{n:0,sec:0};b.n++;b.sec+=o.duration||0});var ks=Object.keys(by).sort(function(a,b){return by[b].n-by[a].n});
  var tr=A.series(d,ss,r,function(a){return a.objects}),ga=A.groupBy(d,ss,'activity'),gp=A.groupBy(d,ss,'participant');
  var html=basis(d,ss)+'<section class="kpi-grid">'+kc('Total interactions',ob.length,'')+kc('Unique objects',ks.length,'')+kc('Total duration',mins(ob.reduce(function(t,o){return t+(o.duration||0)},0)),'')+kc('Per session',ss.length?(Math.round(ob.length/ss.length*10)/10):'—','interactions / session in period')+'</section>'+
   '<div class="charts-row">'+cbox('b1','Usage ranking (interactions)',ks.length>0)+cbox('b2','Total duration by object (s)',ks.length>0)+'</div>'+cbox('b3','Interactions over time',anyV(tr.values))+
   '<div class="charts-row"><div class="panel"><h3>By activity</h3>'+H.table(['Activity','Interactions','Per session'],Object.keys(ga).map(function(k){var a=A.agg(d,ga[k]);return[esc(am[k]||k),a.objects,nd(a.objPerSession)]}),'No data.')+'</div><div class="panel"><h3>By participant (top 10)</h3>'+H.table(['Participant','Interactions'],Object.keys(gp).map(function(k){return[pm[k]||k,A.agg(d,gp[k]).objects]}).sort(function(a,b){return b[1]-a[1]}).slice(0,10).map(function(x){return[esc(x[0]),x[1]]}),'No data.')+'</div></div>';
  return{html:html,filters:sel('act',d.activities.map(function(a){return{v:a.id,l:a.name}}),st.act,'All activities'),json:{byObject:by},table:{headers:['Object','Interactions','Total seconds','Avg seconds'],rows:ks.map(function(k){return[k,by[k].n,by[k].sec,Math.round(by[k].sec/by[k].n*10)/10]})},
   after:function(el){chart(el,'b1','bar',ks,[{label:'Interactions',data:ks.map(function(k){return by[k].n})}],{indexAxis:'y'});chart(el,'b2','bar',ks,[{label:'Seconds',data:ks.map(function(k){return by[k].sec}),color:'#eda100'}],{indexAxis:'y'});chart(el,'b3','area',tr.labels,[{label:'Interactions',data:tr.values,fill:true,color:'#6250d6'}])}}});

/* ---- Supervisors ---- */
page('an-supervisors','Supervisor analytics','Consistent metrics per supervisor. Volume is context, not a quality score.',function(d,r){
  var ss=A.sessionsIn(d,r),g=A.groupBy(d,ss,'supervisor'),rows=d.supervisors.map(function(v){var l=g[v.name]||[],a=A.agg(d,l),ids={};l.forEach(function(s){ids[s.id]=1});var rp=d.reports.filter(function(x){return ids[x.sessionId]&&x.status!=='Draft'}),ap=rp.filter(function(x){return x.status==='Approved'}).length,rj=rp.filter(function(x){return x.status==='Rejected'}).length;
    return{v:v,a:a,sub:rp.length,ap:ap,rj:rj,out:A.pct(ap,ap+rj)}});
  var html=basis(d,ss)+'<div class="panel"><p class="muted" style="margin:0">Reports are counted for sessions dated in the period. "Review outcome" = approved / (approved + rejected) and is shown only when at least one report was decided.</p></div><div class="panel">'+H.table(['Supervisor','Status','Assigned participants','Sessions','Completed','Completion','Attendance','Reports submitted','Approved','Rejected','Review outcome'],rows.map(function(x){return[esc(x.v.name),x.v.status,x.v.participantIds.length,x.a.sessions,x.a.completed,nd(x.a.completionRate,'%'),nd(x.a.attRate,'%'),x.sub,x.ap,x.rj,nd(x.out,'%')]}),'No supervisors.')+'</div>'+cbox('v1','Attendance rate by supervisor (%)',rows.some(function(x){return x.a.attRate!==null}));
  return{html:html,json:{supervisors:rows.map(function(x){return{name:x.v.name,metrics:x.a,reports:{submitted:x.sub,approved:x.ap,rejected:x.rj}}})},table:{headers:['Supervisor','Assigned participants','Sessions','Completed','Completion %','Attendance %','Reports submitted','Approved','Rejected','Review outcome %'],rows:rows.map(function(x){return[x.v.name,x.v.participantIds.length,x.a.sessions,x.a.completed,tx(x.a.completionRate),tx(x.a.attRate),x.sub,x.ap,x.rj,tx(x.out)]})},
   after:function(el){var k=rows.filter(function(x){return x.a.attRate!==null});chart(el,'v1','bar',k.map(function(x){return x.v.name}),[{label:'%',data:k.map(function(x){return x.a.attRate}),color:'#0d9488'}],{scales:{y:{min:0,max:100}}})}}});

/* ---- Comparisons ---- */
page('an-compare','Comparisons','Side-by-side comparison of two items with identical metric definitions.',function(d,r,st){
  var type=st.type||'participants',pm=partMap(d),am=actMap(d),opts,fa,fb,la,lb;
  function pr(x){return'<div class="muted">'+x+'</div>'}
  if(type==='participants'){opts=d.participants.map(function(p){return{v:p.id,l:p.name}})}else if(type==='activities'){opts=d.activities.map(function(a){return{v:a.id,l:a.name}})}else if(type==='supervisors'){opts=d.supervisors.map(function(v){return{v:v.name,l:v.name}})}else if(type==='sessions'){opts=d.sessions.map(function(s){return{v:s.id,l:s.code+' · '+(pm[s.participantId]||'')}})}else opts=[];
  var a,b,ra=r,rb=r;
  function forSel(v){if(!v)return null;var base=type==='periods'?null:A.sessionsIn(d,r);
    if(type==='participants')return base.filter(function(s){return s.participantId===v});if(type==='activities')return base.filter(function(s){return(s.activityIds||[]).indexOf(v)>-1});if(type==='supervisors')return base.filter(function(s){return s.supervisor===v});if(type==='sessions')return d.sessions.filter(function(s){return s.id===v});return null}
  var A1,B1;
  if(type==='periods'){var pa={from:st.af||r.prev.from,to:st.at||r.prev.to},pb={from:st.bf||r.from,to:st.bt||r.to};A1=A.sessionsIn(d,pa);B1=A.sessionsIn(d,pb);la=pa.from+' to '+pa.to;lb=pb.from+' to '+pb.to}
  else{A1=forSel(st.a);B1=forSel(st.b);function lab(v){var o=opts.filter(function(x){return x.v===v})[0];return o?o.l:'—'}la=lab(st.a);lb=lab(st.b)}
  var ok=A1&&B1&&A1.length>0&&B1.length>0,x=ok?A.agg(d,A1):null,y=ok?A.agg(d,B1):null;
  var M=[['Sessions','sessions','',0],['Completion rate','completionRate','%',1],['Attendance rate','attRate','%',1],['Avg intensity (1-5)','avgIntensity','',1],['Active min per completed session','activePerSessionMin',' min',0],['Avg movement event','avgEventSec',' s',0],['Object interactions per session','objPerSession','',0]];
  var html='<div class="panel"><b>Comparison criteria:</b> <span class="muted">type = '+type+'; '+(type==='periods'?'two date ranges':'selected period '+r.from+' to '+r.to)+'. Totals that depend on the number of sessions are shown as per-session values so the two sides stay comparable. A rate is shown only if its records exist on both sides.</span></div>';
  if(!opts&&type!=='periods'){html+=''}
  if(!ok)html+='<div class="panel"><h3>Insufficient data</h3><p class="muted">Pick two items that each have at least one session in the period.</p></div>';
  else{html+='<div class="charts-row"><div class="panel"><h3>'+esc(la)+'</h3>'+side(x)+'</div><div class="panel"><h3>'+esc(lb)+'</h3>'+side(y)+'</div></div><div class="panel"><h3>Side by side</h3>'+H.table(['Metric',esc(la),esc(lb),'Difference'],M.map(function(m){var u=x[m[1]],v=y[m[1]];return[m[0],tx(u,m[2]),tx(v,m[2]),u===null||v===null?'Insufficient data':(Math.round((v-u)*10)/10)+(m[2]==='%'?' pts':m[2])]}),'')+'</div>'+cbox('c1','Rates (%)',true)}
  function side(z){return'<section class="kpi-grid">'+kc('Sessions',z.sessions,'')+kc('Completion',nd(z.completionRate,'%'),'')+kc('Attendance',nd(z.attRate,'%'),z.attRecords+' records')+kc('Intensity',nd(z.avgIntensity),'1-5')+'</section>'}
  var f=sel('type',[{v:'participants',l:'Two participants'},{v:'activities',l:'Two activities'},{v:'supervisors',l:'Two supervisors'},{v:'periods',l:'Two time periods'},{v:'sessions',l:'Two sessions'}],type);
  if(type==='periods')f+='<span class="muted">A</span><input type="date" data-an="af" value="'+esc(st.af||r.prev.from)+'"><input type="date" data-an="at" value="'+esc(st.at||r.prev.to)+'"><span class="muted">B</span><input type="date" data-an="bf" value="'+esc(st.bf||r.from)+'"><input type="date" data-an="bt" value="'+esc(st.bt||r.to)+'">';
  else f+=sel('a',opts,st.a,'Select A…')+sel('b',opts,st.b,'Select B…');
  return{html:html,filters:f,json:ok?{a:{label:la,metrics:x},b:{label:lb,metrics:y}}:{},table:ok?{headers:['Metric',la,lb],rows:M.map(function(m){return[m[0],tx(x[m[1]]),tx(y[m[1]])]})}:null,
   after:function(el){if(ok)chart(el,'c1','bar',['Completion','Attendance'],[{label:la,data:[x.completionRate,x.attRate]},{label:lb,data:[y.completionRate,y.attRate]}],{scales:{y:{min:0,max:100}}})}}});

/* ---- Data quality ---- */
page('an-quality','Data quality','Checks on the records stored in this browser.',function(d){
  var q=A.quality(d),L=function(a){return a?'<span class="badge pending">Review</span>':'<span class="badge completed">OK</span>'};
  var rows=[['Records with missing required values',q.missing],['Duplicate codes',q.duplicates],['Invalid or orphaned records',q.invalid],['Completed sessions without attendance',q.completedNoAttendance],['Completed sessions without movement data',q.completedNoMovement],['Participants without sessions',q.participantsNoSessions]];
  var warn=rows.filter(function(x){return x[1]>0}).length;
  var html='<section class="kpi-grid">'+kc('Total records',q.total,'all collections')+Object.keys(q.counts).map(function(k){return kc(k,q.counts[k],'')}).join('')+'</section>'+(warn?'<div class="panel" style="border-left:3px solid #eda100"><b>'+warn+' check(s) need review.</b> Analytics use only existing records; nothing is filled in with estimated values.</div>':'<div class="panel">All checks passed.</div>')+
   '<div class="panel">'+H.table(['Check','Count','Status'],rows.map(function(x){return[x[0],x[1],L(x[1])]}),'')+'<p class="muted">Last recorded change: '+(q.lastChange?new Date(q.lastChange).toLocaleString():'none recorded')+' (from the audit log). All data is local demo data stored in this browser.</p></div>';
  return{html:html,json:q,table:{headers:['Check','Count'],rows:rows}}});

window.MoveAN={pages:V,tabs:TABS};
})();
