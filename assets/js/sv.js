/* MoveSV: Supervisor Panel (frontend role simulation only, NOT real security). Uses MoveStore only. */
(function(){
"use strict";
var S=window.MoveStore,H=window.MovePages._h,esc=H.esc,V={};
var SL={Pending:'Scheduled',Active:'In Progress',Completed:'Completed',Cancelled:'Cancelled'};
var SO=Object.keys(SL).map(function(k){return{v:k,l:SL[k]}});
var AS=['Present','Absent','Late','Excused'];
function sb(st){return'<span class="badge '+({Completed:'completed',Active:'active',Pending:'pending',Cancelled:'cancelled'}[st]||'pending')+'">'+(SL[st]||st)+'</span>'}
function ab(st){return'<span class="badge '+({Present:'completed',Late:'pending',Absent:'cancelled',Excused:'active'}[st]||'cancelled')+'">'+(st||'Not marked')+'</span>'}
function fmt(t){var d=new Date(t);return isNaN(d)?'—':d.toLocaleDateString('en',{month:'short',day:'numeric'})+' '+d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}
function today(){var d=new Date();d.setHours(0,0,0,0);return d}
function kpi(l,v,sub){return'<div class="kpi"><div class="top"><span class="label">'+l+'</span></div><div class="value">'+v+'</div>'+(sub?'<div class="muted">'+sub+'</div>':'')+'</div>'}
function ch(el,id,cfg){if(window.Chart&&el.querySelector('#'+id))try{new Chart(el.querySelector('#'+id),cfg)}catch(e){}}
function cbox(id,t){return'<div class="panel"><h3>'+t+'</h3><div style="position:relative;height:210px"><canvas id="'+id+'"></canvas></div></div>'}
function me(){return S.me()}
function noMe(el){el.innerHTML=H.head('No supervisor','Add an active supervisor in the Admin panel first.','');}
function mySess(){return S.mySessions()}
function myIds(){return mySess().map(function(s){return s.id})}
function shell(el,title,sub,right,filters){el.innerHTML=H.head(title,sub+' '+H.demoNote(),right||'')+'<div class="panel"><div class="filters">'+filters+'<span class="muted" id="cnt"></span></div><div id="tbl"></div></div>'}
function bindF(el,st,draw){el.querySelectorAll('[data-f]').forEach(function(i){i.addEventListener('input',function(){st[i.dataset.f]=i.value;draw()})})}
function attPct(list){var t=list.length;if(!t)return null;return Math.round(list.filter(function(a){return a.status==='Present'||a.status==='Late'}).length/t*100)}
function pct(v){return v===null?'—':v+'%'}
function mm(ids){var ev=S.get('movements').filter(function(m){return ids.indexOf(m.sessionId)>-1}),ss=S.get('sessions').filter(function(s){return ids.indexOf(s.id)>-1});
  var act=ev.reduce(function(t,m){return t+m.duration},0),dist=ev.reduce(function(t,m){return t+m.duration*(.3+.15*m.intensity)},0),tm=ss.reduce(function(t,s){return t+(s.duration||0)*60},0),done=ss.filter(function(s){return s.status==='Completed'}).length;
  return{events:ev.length,active:act,dist:Math.round(dist),speed:act?(dist/act).toFixed(2):'0.00',inten:ev.length?(ev.reduce(function(t,m){return t+m.intensity},0)/ev.length).toFixed(1):'0.0',rest:Math.max(0,tm-act),freq:tm?(ev.length/(tm/60)).toFixed(1):'0.0',comp:ss.length?Math.round(done/ss.length*100):0,ev:ev}}
function mcards(m){var mn=function(x){return Math.floor(x/60)+'m '+x%60+'s'};return'<section class="kpi-grid">'+kpi('Movement duration',mn(m.active))+kpi('Distance (demo)',m.dist+' m')+kpi('Avg speed',m.speed+' m/s')+kpi('Intensity',m.inten+' / 5')+kpi('Active time',mn(m.active))+kpi('Rest time',mn(m.rest))+kpi('Frequency',m.freq+' /min')+kpi('Completion',m.comp+'%')+'</section>'}
var DEMO='<p class="muted">Demo metrics derived from manually recorded events. No camera, pose estimation or AI tracking is connected yet; this structure is ready for it.</p>';
function typeChart(m){var c={};m.ev.forEach(function(e){c[e.type]=(c[e.type]||0)+1});return{labels:Object.keys(c),data:Object.keys(c).map(function(k){return c[k]})}}

/* ---------- Overview ---------- */
V.overview=function(el){el=H.fresh(el);var m=me();if(!m)return noMe(el);
  var ss=mySess(),ps=S.myParticipants(),ids=myIds(),days=S.settings().svUpcomingDays||14,t=today(),lim=new Date(t.getTime()+days*864e5);
  var up=ss.filter(function(s){var d=new Date(s.date+'T00:00:00');return s.status==='Pending'&&d>=t&&d<=lim}).length;
  var active=ps.filter(function(p){return ss.some(function(s){return s.participantId===p.id&&s.status!=='Cancelled'&&(t-new Date(s.date+'T00:00:00'))/864e5<=30})}).length;
  var rep=S.get('reports').filter(function(r){return ids.indexOf(r.sessionId)>-1}),pend=rep.filter(function(r){return r.status==='Draft'||r.status==='Rejected'||r.status==='Pending review'}).length;
  var wk=[0,0,0,0,0,0,0,0];ss.forEach(function(s){var w=Math.floor((t-new Date(s.date+'T00:00:00'))/864e5/7);if(w>=0&&w<8)wk[7-w]++});
  var att=S.get('attendance').filter(function(a){return ids.indexOf(a.sessionId)>-1}),ac={};AS.forEach(function(a){ac[a]=0});att.forEach(function(a){ac[a.status]++});
  var done=ss.filter(function(s){return s.status==='Completed'}).length,can=ss.filter(function(s){return s.status==='Cancelled'}).length,sch=ss.length-done-can;
  var ad={};ss.forEach(function(s){s.activityIds.forEach(function(i){var a=S.byId('activities',i);if(a)ad[a.name]=(ad[a.name]||0)+1})});var ak=Object.keys(ad).sort(function(a,b){return ad[b]-ad[a]}).slice(0,6);
  var recent=ss.slice().sort(function(a,b){return a.date<b.date?1:-1}).slice(0,6),notes=S.get('notes').filter(function(n){return n.supervisorId===m.id}).slice(0,4);
  el.innerHTML=H.head('Welcome, '+esc(m.name),'Your assigned participants and sessions only. '+H.demoNote(),'')+
  '<section class="kpi-grid">'+kpi('Assigned participants',ps.length)+kpi('Active participants',active,'session in last 30 days')+kpi('Assigned sessions',ss.length)+kpi('Completed',done)+kpi('Upcoming',up,'next '+days+' days')+kpi('Pending reports',pend,'draft, rejected or in review')+'</section>'+
  '<div class="charts-row">'+cbox('c1','Sessions per week')+cbox('c2','Participant attendance')+'</div><div class="charts-row">'+cbox('c3','Session completion')+cbox('c4','Activity distribution')+'</div>'+
  '<div class="panel"><h3>Recent session activity</h3>'+H.table(['Code','Participant','Date','Status'],recent.map(function(s){return[esc(s.code),esc(S.name(s.participantId)),s.date,sb(s.status)]}),'No sessions assigned yet.')+'</div>'+
  '<div class="panel"><h3>Recent participant notes</h3>'+H.table(['Participant','Note','When'],notes.map(function(n){return[esc(S.name(n.participantId)),esc(n.text),fmt(n.at)]}),'No notes yet. Add notes from a participant profile.')+'</div>';
  var col=['#2a78d6','#0d9488','#eda100','#6250d6','#e5484d','#8b95a7'];
  ch(el,'c1',{type:'bar',data:{labels:['-7w','-6w','-5w','-4w','-3w','-2w','Last wk','This wk'],datasets:[{label:'Sessions',data:wk,backgroundColor:'#2a78d6'}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false}}}});
  ch(el,'c2',{type:'doughnut',data:{labels:AS,datasets:[{data:AS.map(function(a){return ac[a]}),backgroundColor:col}]},options:{maintainAspectRatio:false}});
  ch(el,'c3',{type:'doughnut',data:{labels:['Completed','Scheduled/Active','Cancelled'],datasets:[{data:[done,sch,can],backgroundColor:['#0d9488','#2a78d6','#8b95a7']}]},options:{maintainAspectRatio:false}});
  ch(el,'c4',{type:'bar',data:{labels:ak,datasets:[{label:'Sessions',data:ak.map(function(k){return ad[k]}),backgroundColor:'#6250d6'}]},options:{maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}}}})};

/* ---------- Participants ---------- */
V.participants=function(el){el=H.fresh(el);var st={q:'',age:'',consent:'',act:'',view:null};if(!me())return noMe(el);
  function mine(id){return S.myParticipants().some(function(p){return p.id===id})}
  function draw(){
    if(st.view){if(!mine(st.view)){st.view=null;return draw()}var p=S.byId('participants',st.view),ss=mySess().filter(function(s){return s.participantId===p.id}),ids=ss.map(function(s){return s.id}),att=S.get('attendance').filter(function(a){return a.participantId===p.id&&ids.indexOf(a.sessionId)>-1}),m=mm(ids),nt=S.get('notes').filter(function(n){return n.participantId===p.id});
      el.innerHTML=H.head(esc(p.name),esc(p.code)+' · '+p.type+' · '+p.ageGroup+' '+H.demoNote(),'<button class="btn" data-act="back">← Back</button>'+H.btn('edit',p.id,'Edit details'))+
      '<section class="kpi-grid">'+kpi('Sessions',ss.length)+kpi('Attendance',pct(attPct(att)))+kpi('Avg intensity',m.inten+' / 5')+kpi('Distance (demo)',m.dist+' m')+'</section>'+
      '<div class="panel"><h3>Session history &amp; attendance</h3>'+H.table(['Code','Date','Status','Attendance',''],ss.map(function(s){var a=S.attendanceOf(s.id);return[esc(s.code),s.date,sb(s.status),ab(a&&a.status),H.btn('sess',s.id,'Open')]}),'No sessions.')+'</div>'+
      '<div class="panel"><h3>Movement performance</h3>'+DEMO+H.table(['Type','Events'],Object.keys(typeChart(m).labels).map(function(i){var t=typeChart(m);return[esc(t.labels[i]),t.data[i]]}),'No movement events recorded.')+'</div>'+
      '<div class="panel"><h3>Notes</h3><div class="filters"><input id="nt" placeholder="Add a note about this participant"><button class="btn primary" data-act="addnote">Add note</button></div>'+H.table(['When','Author','Note'],nt.map(function(n){return[fmt(n.at),esc(n.author),esc(n.text)]}),'No notes yet.')+'</div>';return}
    if(!el.querySelector('#tbl'))build();
    var acts=S.get('sessions');var rows=S.myParticipants().filter(function(p){var q=st.q.toLowerCase();return(!q||(p.name+p.code+p.id).toLowerCase().indexOf(q)>-1)&&(!st.age||p.ageGroup===st.age)&&(!st.consent||p.consent===st.consent)&&(!st.act||mySess().some(function(s){return s.participantId===p.id&&s.activityIds.indexOf(st.act)>-1}))});
    el.querySelector('#cnt').textContent=rows.length+' participants';
    el.querySelector('#tbl').innerHTML=H.table(['Code','Name','Age','Consent','Sessions','Attendance',''],rows.map(function(p){var ss=mySess().filter(function(s){return s.participantId===p.id}),at=S.get('attendance').filter(function(a){return a.participantId===p.id&&myIds().indexOf(a.sessionId)>-1});return[esc(p.code),'<b>'+esc(p.name)+'</b>',p.ageGroup,H.badge(p.consent),ss.length,pct(attPct(at)),H.btn('view',p.id,'Profile')]}),'No assigned participants match.')}
  function build(){shell(el,'My participants','Only participants assigned to you.','','<input data-f="q" placeholder="Search name or ID"><select data-f="age">'+H.opts(['3-5','6-8','9-12','13-17','18+'],st.age,'All ages')+'</select><select data-f="consent">'+H.opts(['Granted','Pending','Withdrawn'],st.consent,'All statuses')+'</select><select data-f="act">'+H.opts(S.get('activities').map(function(a){return{v:a.id,l:a.name}}),st.act,'All activities')+'</select>');bindF(el,st,draw)}
  H.act(el,{view:function(id){st.view=id;draw()},back:function(){st.view=null;build();draw()},sess:function(id){sessionStorage.setItem('sv.session',id);window.MoveUI.go('sv-sessions')},
    addnote:function(){var v=el.querySelector('#nt').value.trim();if(!v){H.toast('Write a note first');return}S.addNote(st.view,v);H.toast('Note added');draw()},
    edit:function(id){if(!mine(id))return H.toast('Not assigned to you');var p=S.byId('participants',id);H.form('Edit participant',[{k:'name',l:'Display name',req:1},{k:'ageGroup',l:'Age group',t:'select',o:['3-5','6-8','9-12','13-17','18+'],req:1}],p,function(v){S.update('participants',id,v);H.toast('Participant updated');draw()})}});
  draw()};

/* ---------- Sessions ---------- */
V.sessions=function(el){el=H.fresh(el);var st={q:'',status:'',from:'',view:sessionStorage.getItem('sv.session')};sessionStorage.removeItem('sv.session');if(!me())return noMe(el);
  function own(id){return myIds().indexOf(id)>-1}
  function fields(){return[{k:'participantId',l:'Participant',t:'select',req:1,o:S.myParticipants().map(function(p){return{v:p.id,l:p.code+' · '+p.name}})},{k:'date',l:'Date',t:'date',req:1},{k:'start',l:'Start time',t:'time',req:1},{k:'duration',l:'Duration (min)',t:'number',req:1,min:5,max:240,def:S.settings().sessionMinutes||20},{k:'room',l:'Location / Cube area'},{k:'status',l:'Status',t:'select',o:SO,req:1,def:'Pending'},{k:'activityIds',l:'Activities',t:'multi',o:S.get('activities').filter(function(a){return a.status==='Active'}).map(function(a){return{v:a.id,l:a.name}})},{k:'objectives',l:'Session objectives',t:'area'}]}
  function prep(v){var a=v.start.split(':'),t=+a[0]*60+ +a[1]+v.duration;v.end=('0'+Math.floor(t/60)%24).slice(-2)+':'+('0'+t%60).slice(-2);v.supervisor=me().name;v.activityIds=v.activityIds||[];if(!v.code){v.code='MV-'+v.date.slice(0,4)+'-'+('00'+(S.get('sessions').length+1)).slice(-3)}}
  function draw(){
    if(st.view){if(!own(st.view)){st.view=null;return draw()}var s=S.byId('sessions',st.view),p=S.byId('participants',s.participantId),a=S.attendanceOf(s.id),m=mm([s.id]),ob=S.get('objects').filter(function(o){return o.sessionId===s.id}),rp=S.get('reports').filter(function(r){return r.sessionId===s.id});
      el.innerHTML=H.head(esc(s.code),sb(s.status)+' '+H.demoNote(),'<button class="btn" data-act="back">← Back</button>'+H.btn('edit',s.id,'Edit')+H.btn('att',s.id,'Attendance')+H.btn('rep',s.id,'New report'))+
      '<div class="panel"><div class="detail-grid"><div><b>Participant</b>'+(p?esc(p.name):'(deleted)')+'</div><div><b>Date</b>'+s.date+'</div><div><b>Time</b>'+esc(s.start)+(s.end?'–'+esc(s.end):'')+'</div><div><b>Duration</b>'+(s.duration||0)+'m</div><div><b>Location</b>'+esc(s.room||'—')+'</div><div><b>Attendance</b>'+ab(a&&a.status)+'</div></div><p><b>Objectives:</b> '+esc(s.objectives||'—')+'</p><p><b>Activities:</b> '+(s.activityIds.map(function(i){var x=S.byId('activities',i);return x?esc(x.name):''}).join(', ')||'—')+'</p></div>'+
      '<div class="panel"><h3>Movement summary</h3>'+DEMO+mcards(m)+'</div><div class="panel"><h3>Object interactions</h3>'+H.table(['Object','Interaction','Duration'],ob.map(function(o){return[esc(o.object),esc(o.interaction),o.duration+'s']}),'No object interactions.')+'</div>'+
      '<div class="panel"><h3>Related reports</h3>'+H.table(['Report','Status'],rp.map(function(r){return[esc(r.id),H.badge(r.status)]}),'No reports yet.')+'</div>';return}
    if(!el.querySelector('#tbl'))build();
    var rows=mySess().filter(function(s){var q=st.q.toLowerCase();return(!q||(s.code+S.name(s.participantId)).toLowerCase().indexOf(q)>-1)&&(!st.status||s.status===st.status)&&(!st.from||s.date>=st.from)}).sort(function(a,b){return a.date<b.date?1:-1});
    el.querySelector('#cnt').textContent=rows.length+' sessions';
    el.querySelector('#tbl').innerHTML=H.table(['Code','Participant','Date','Time','Status','Attendance',''],rows.map(function(s){var a=S.attendanceOf(s.id);return[esc(s.code),esc(S.name(s.participantId)),s.date,esc(s.start),sb(s.status),ab(a&&a.status),H.btn('view',s.id,'View')+H.btn('edit',s.id,'Edit')+H.btn('del',s.id,'Delete','danger')]}),'No sessions match. Create one with the button above.')}
  function build(){shell(el,'My sessions','Create, edit and run your sessions.','<button class="btn primary" data-act="add">+ New session</button>','<input data-f="q" placeholder="Search code or participant"><select data-f="status">'+H.opts(SO,st.status,'All statuses')+'</select><input type="date" data-f="from" aria-label="From date">');bindF(el,st,draw)}
  H.act(el,{view:function(id){st.view=id;draw()},back:function(){st.view=null;build();draw()},
    add:function(){if(!S.myParticipants().length)return H.toast('No assigned participants yet');H.form('New session',fields(),{},function(v){prep(v);S.add('sessions',v);H.toast('Session created');draw()})},
    edit:function(id){if(!own(id))return H.toast('Not your session');H.form('Edit session',fields(),S.byId('sessions',id),function(v){prep(v);v.code=S.byId('sessions',id).code;S.update('sessions',id,v);H.toast('Session updated');draw()})},
    del:function(id){if(!own(id))return;H.confirmDlg('Delete this session and its movement, object and report data?',function(){S.remove('sessions',id);H.toast('Session deleted');draw()})},
    att:function(id){sessionStorage.setItem('sv.att',id);window.MoveUI.go('sv-attendance')},rep:function(id){sessionStorage.setItem('sv.rep',id);window.MoveUI.go('sv-reports')}});
  draw()};

/* ---------- Attendance ---------- */
V.attendance=function(el){el=H.fresh(el);var st={q:'',status:''};if(!me())return noMe(el);var pre=sessionStorage.getItem('sv.att');sessionStorage.removeItem('sv.att');
  function draw(){var ids=myIds(),ss=mySess().filter(function(s){var a=S.attendanceOf(s.id),q=st.q.toLowerCase();return(!q||S.name(s.participantId).toLowerCase().indexOf(q)>-1)&&(!st.status||(st.status==='none'?!a:a&&a.status===st.status))&&s.status!=='Cancelled'}).sort(function(a,b){return a.date<b.date?1:-1});
    var all=S.get('attendance').filter(function(a){return ids.indexOf(a.sessionId)>-1});
    el.querySelector('#cnt').textContent='Overall attendance '+pct(attPct(all))+' · '+ss.length+' sessions';
    el.querySelector('#tbl').innerHTML=H.table(['Session','Participant','Date','Attendance','Marked at','Note','Participant rate',''],ss.map(function(s){var a=S.attendanceOf(s.id),pa=S.get('attendance').filter(function(x){return x.participantId===s.participantId&&ids.indexOf(x.sessionId)>-1});return[esc(s.code),esc(S.name(s.participantId)),s.date,ab(a&&a.status),a?fmt(a.at):'—',esc(a?a.note:''),pct(attPct(pa)),H.btn('mark',s.id,'Mark')]}),'No sessions to mark.')}
  function mark(id){var a=S.attendanceOf(id);H.form('Attendance · '+esc((S.byId('sessions',id)||{}).code),[{k:'status',l:'Status',t:'select',o:AS,req:1},{k:'note',l:'Note (optional)'}],a||{status:'Present'},function(v){S.setAttendance(id,v.status,v.note);H.toast('Attendance saved');draw()})}
  shell(el,'Attendance','Mark Present, Absent, Late or Excused for each session.','','<input data-f="q" placeholder="Search participant"><select data-f="status">'+H.opts(AS.concat([]),st.status,'All')+'<option value="none">Not marked</option></select>');
  bindF(el,st,draw);H.act(el,{mark:function(id){if(myIds().indexOf(id)<0)return;mark(id)}});draw();if(pre&&myIds().indexOf(pre)>-1)mark(pre)};

/* ---------- Movement ---------- */
V.movement=function(el){el=H.fresh(el);var st={p:'',s:''};if(!me())return noMe(el);
  function draw(){var ss=mySess().filter(function(s){return(!st.p||s.participantId===st.p)&&(!st.s||s.id===st.s)}),ids=ss.map(function(s){return s.id}),m=mm(ids),t=typeChart(m);
    el.querySelector('#out').innerHTML=DEMO+mcards(m)+cbox('mc','Movement events by type')+'<div class="panel"><h3>Per session</h3>'+H.table(['Session','Participant','Events','Distance','Intensity','Completion'],ss.filter(function(s){return s.status==='Completed'||s.status==='Active'}).map(function(s){var x=mm([s.id]);return[esc(s.code),esc(S.name(s.participantId)),x.events,x.dist+' m',x.inten,x.comp+'%']}),'No movement data for this selection.')+'</div>';
    ch(el,'mc',{type:'bar',data:{labels:t.labels,datasets:[{label:'Events',data:t.data,backgroundColor:'#0d9488'}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false}}}})}
  el.innerHTML=H.head('Movement tracking','Demo metrics for your participants and sessions. '+H.demoNote(),'')+'<div class="panel"><div class="filters"><select data-f="p">'+H.opts(S.myParticipants().map(function(p){return{v:p.id,l:p.name}}),'','All participants')+'</select><select data-f="s">'+H.opts(mySess().map(function(s){return{v:s.id,l:s.code}}),'','All sessions')+'</select></div></div><div id="out"></div>';
  bindF(el,st,draw);draw()};

/* ---------- Objects ---------- */
V.objects=function(el){el=H.fresh(el);var st={q:'',obj:''};if(!me())return noMe(el);
  function draw(){var ids=myIds(),rows=S.get('objects').filter(function(o){var q=st.q.toLowerCase();return ids.indexOf(o.sessionId)>-1&&(!st.obj||o.object===st.obj)&&(!q||(S.name((S.byId('sessions',o.sessionId)||{}).participantId)+o.interaction).toLowerCase().indexOf(q)>-1)}),c={},d={};
    rows.forEach(function(o){c[o.object]=(c[o.object]||0)+1;d[o.object]=(d[o.object]||0)+o.duration});var k=Object.keys(c);
    el.querySelector('#cnt').textContent=rows.length+' interactions';
    el.querySelector('#sum').innerHTML='<div class="charts-row">'+cbox('oc','Interaction count by object')+cbox('od','Total duration (s) by object')+'</div>';
    ch(el,'oc',{type:'bar',data:{labels:k,datasets:[{label:'Count',data:k.map(function(x){return c[x]}),backgroundColor:'#2a78d6'}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false}}}});
    ch(el,'od',{type:'bar',data:{labels:k,datasets:[{label:'Seconds',data:k.map(function(x){return d[x]}),backgroundColor:'#eda100'}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false}}}});
    el.querySelector('#tbl').innerHTML=H.table(['Object','Interaction','Count','Duration','Participant','Session','Time'],rows.slice(0,100).map(function(o){var s=S.byId('sessions',o.sessionId)||{};return[esc(o.object),esc(o.interaction),c[o.object],o.duration+'s',esc(S.name(s.participantId)),esc(s.code||'—'),fmt(o.timestamp)]}),'No object interactions yet.')}
  shell(el,'Object interactions','Demo data, ready for future sensor and camera input.','<button class="btn primary" data-act="add">+ Add interaction</button>','<input data-f="q" placeholder="Search participant or type"><select data-f="obj">'+H.opts(S.OBJECTS,'','All objects')+'</select>');
  el.insertAdjacentHTML('afterbegin','<div id="sum"></div>');bindF(el,st,draw);
  H.act(el,{add:function(){H.form('Add object interaction',[{k:'sessionId',l:'Session',t:'select',req:1,o:mySess().map(function(s){return{v:s.id,l:s.code+' · '+S.name(s.participantId)}})},{k:'object',l:'Object',t:'select',o:S.OBJECTS,req:1},{k:'interaction',l:'Interaction',t:'select',o:S.INTERACTIONS,req:1},{k:'duration',l:'Duration (s)',t:'number',req:1,min:1}],{},function(v){var s=S.byId('sessions',v.sessionId);v.timestamp=s.date+'T'+(s.start||'09:00');v.notes='';S.add('objects',v);H.toast('Interaction added');draw()})}});draw()};

/* ---------- Reports ---------- */
V.reports=function(el){el=H.fresh(el);var st={q:'',status:''};if(!me())return noMe(el);var pre=sessionStorage.getItem('sv.rep');sessionStorage.removeItem('sv.rep');
  function mine(id){var r=S.byId('reports',id);return r&&myIds().indexOf(r.sessionId)>-1}
  function fields(){return[{k:'sessionId',l:'Session (participant shown in list)',t:'select',req:1,o:mySess().map(function(s){return{v:s.id,l:s.code+' · '+S.name(s.participantId)}})},{k:'summary',l:'Observations',t:'area',req:1},{k:'movementAnalysis',l:'Movement analysis',t:'area'},{k:'performance',l:'Activity performance notes',t:'area'},{k:'recommendations',l:'Recommendations',t:'area'}]}
  function draw(){var rows=S.get('reports').filter(function(r){var q=st.q.toLowerCase(),s=S.byId('sessions',r.sessionId)||{};return myIds().indexOf(r.sessionId)>-1&&(!st.status||r.status===st.status)&&(!q||(r.id+S.name(s.participantId)).toLowerCase().indexOf(q)>-1)});
    el.querySelector('#cnt').textContent=rows.length+' reports';
    el.querySelector('#tbl').innerHTML=H.table(['Report','Session','Participant','Status','Admin feedback',''],rows.map(function(r){var s=S.byId('sessions',r.sessionId)||{},ed=r.status==='Draft'||r.status==='Rejected';return[esc(r.id),esc(s.code||'—'),esc(S.name(s.participantId)),H.badge(r.status==='Pending review'?'Pending review':r.status),esc(r.feedback||'—'),(ed?H.btn('edit',r.id,'Edit')+H.btn('sub',r.id,r.status==='Rejected'?'Resubmit':'Submit','primary'):H.btn('open',r.id,'Open'))]}),'No reports yet. Create one with the button above.')}
  function openForm(id,sid){var r=id?S.byId('reports',id):{sessionId:sid};H.form(id?'Edit report':'New report',fields(),r,function(v){if(id)S.update('reports',id,v);else{v.status='Draft';S.add('reports',v)}H.toast('Report saved as '+(id?r.status:'Draft'));draw()})}
  shell(el,'My reports','Draft, submit for admin review, and resubmit if rejected. Submitted reports appear in the Admin Reports page as "Pending review".','<button class="btn primary" data-act="add">+ New report</button>','<input data-f="q" placeholder="Search report or participant"><select data-f="status">'+H.opts(['Draft','Pending review','Approved','Rejected'],'','All statuses')+'</select>');
  bindF(el,st,draw);
  H.act(el,{add:function(){openForm(null)},edit:function(id){if(mine(id))openForm(id)},open:function(id){if(!mine(id))return;var r=S.byId('reports',id);H.modal('Report '+esc(id),'<p><b>Observations</b><br>'+esc(r.summary)+'</p><p><b>Movement analysis</b><br>'+esc(r.movementAnalysis||'—')+'</p><p><b>Performance</b><br>'+esc(r.performance||'—')+'</p><p><b>Recommendations</b><br>'+esc(r.recommendations||'—')+'</p><p><b>Admin feedback</b><br>'+esc(r.feedback||'—')+'</p>','<button class="btn" data-close>Close</button>')},
    sub:function(id){if(!mine(id))return;var r=S.byId('reports',id);if(!r.summary){H.toast('Add observations before submitting');return}S.update('reports',id,{status:'Pending review',submittedAt:new Date().toISOString()});H.toast('Submitted for admin review');draw()}});
  draw();if(pre&&myIds().indexOf(pre)>-1)openForm(null,pre)};

/* ---------- Notifications ---------- */
V.notifications=function(el){el=H.fresh(el);var m=me();if(!m)return noMe(el);
  function draw(){var rows=S.get('notifications').filter(function(n){return n.supervisorId===m.id}).sort(function(a,b){return a.at<b.at?1:-1}),u=rows.filter(function(n){return!n.read}).length;
    el.innerHTML=H.head('Notifications',u+' unread. Local demo notifications only; no email or push is connected. '+H.demoNote(),'<button class="btn" data-act="all"'+(u?'':' disabled')+'>Mark all as read</button>')+'<div class="panel">'+H.table(['','Message','When',''],rows.map(function(n){return[n.read?'':'<span class="badge active">New</span>',n.read?esc(n.text):'<b>'+esc(n.text)+'</b>',fmt(n.at),H.btn('tg',n.id,n.read?'Mark unread':'Mark read')]}),'You have no notifications.')+'</div>'}
  H.act(el,{all:function(){S.markAllRead(m.id);draw();window.MoveSV.badge()},tg:function(id){var n=S.get('notifications').filter(function(x){return x.id===id})[0];S.markRead(id,!n.read);draw();window.MoveSV.badge()}});draw()};

/* ---------- Profile ---------- */
V.profile=function(el){el=H.fresh(el);var m=me();if(!m)return noMe(el);
  function draw(){m=me();var ss=mySess(),ids=myIds(),done=ss.filter(function(s){return s.status==='Completed'}).length,at=S.get('attendance').filter(function(a){return ids.indexOf(a.sessionId)>-1}),rp=S.get('reports').filter(function(r){return ids.indexOf(r.sessionId)>-1}),ap=rp.filter(function(r){return r.status==='Approved'}).length,log=S.get('audit').filter(function(a){return ids.indexOf(a.recordId)>-1||a.detail===m.name}).slice(0,8);
    el.innerHTML=H.head('<span class="avatar" style="display:inline-flex;width:40px;height:40px;border-radius:50%;background:var(--blue-soft);color:var(--blue);align-items:center;justify-content:center;font-size:15px;margin-right:10px">'+esc(m.name.split(' ').map(function(w){return w[0]}).join('').slice(0,2).toUpperCase())+'</span>'+esc(m.name),esc(m.id)+' · '+esc(m.email)+' '+H.demoNote(),H.btn('edit',m.id,'Edit profile'))+
    '<section class="kpi-grid">'+kpi('Assigned participants',S.myParticipants().length)+kpi('Assigned sessions',ss.length)+kpi('Completion rate',ss.length?Math.round(done/ss.length*100)+'%':'—')+kpi('Attendance rate',pct(attPct(at)))+kpi('Reports approved',ap+' / '+rp.length)+'</section>'+
    '<div class="panel"><h3>Activity history</h3>'+H.table(['When','Action','Record'],log.map(function(a){return[fmt(a.at),esc(a.action),esc(a.recordId)]}),'No activity recorded yet.')+'</div>'}
  H.act(el,{edit:function(){H.form('Edit profile',[{k:'name',l:'Full name',req:1},{k:'email',l:'Email',t:'email',req:1}],m,function(v){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)){H.toast('Enter a valid email');return false}if(v.name!==m.name)S.renameSupervisor(m.name,v.name);S.update('supervisors',m.id,v);H.toast('Profile updated');draw();window.MoveSV.who()})}});draw()};

/* ---------- Settings ---------- */
V.settings=function(el){el=H.fresh(el);var c=S.settings();
  el.innerHTML=H.head('Settings','Supervisor preferences. '+H.demoNote(),'')+'<div class="panel"><form id="f" class="filters" style="align-items:flex-end" novalidate><label class="fld"><span>"Upcoming sessions" window (days)</span><input name="d" type="number" min="1" max="90" value="'+esc(c.svUpcomingDays||14)+'"></label><button class="btn primary" type="submit">Save</button></form></div><div class="panel"><h3>About this demo</h3><p class="muted">The Admin/Supervisor switch is a frontend simulation only. It is not authentication and does not protect data: anyone can change it or read browser storage. Real security needs a server with authentication and access control. Data lives in this browser only.</p></div>';
  el.querySelector('#f').addEventListener('submit',function(e){e.preventDefault();var d=+e.target.elements.d.value;if(!(d>=1&&d<=90)){H.toast('Enter 1-90 days');return}S.saveSettings({svUpcomingDays:d});H.toast('Saved')})};

/* ---------- navigation + role helpers ---------- */
var ic='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>';
var NAV=[['sv-overview','Overview'],['sv-participants','My participants'],['sv-sessions','My sessions'],['sv-attendance','Attendance'],['sv-movement','Movement tracking'],['sv-objects','Object interactions'],['sv-reports','Reports'],['sv-notifications','Notifications'],['sv-profile','My profile'],['sv-settings','Settings']];
window.MoveSV={pages:V,nav:NAV,
  navHtml:function(){return NAV.map(function(n){return'<button class="nav-item" data-page="'+n[0]+'">'+ic+n[1]+(n[0]==='sv-notifications'?' <span class="badge active" id="svBadge" hidden></span>':'')+'</button>'}).join('')},
  badge:function(){var m=S.me(),b=document.getElementById('svBadge');if(!b||!m)return;var u=S.get('notifications').filter(function(n){return n.supervisorId===m.id&&!n.read}).length;b.textContent=u;b.hidden=!u},
  who:function(){var w=document.getElementById('roleName');if(w&&S.me())w.textContent=S.me().name}};
})();
