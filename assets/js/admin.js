/* MoveAdmin: Activities, Supervisors, Audit Logs, platform settings. Reads/writes only through MoveStore. */
(function(){
"use strict";
var S=window.MoveStore,H=window.MovePages._h,esc=H.esc,A={};
var DIFF=['Easy','Medium','Hard'];
function search(root,st,draw){root.querySelectorAll('[data-f]').forEach(function(i){i.addEventListener('input',function(){st[i.dataset.f]=i.value;draw()})})}
function shell(el,title,sub,right,filters,st){
  el.innerHTML=H.head(title,sub+' '+H.demoNote(),right)+'<div class="panel"><div class="filters">'+filters+'<span class="muted" id="cnt"></span></div><div id="tbl"></div></div>';
  return el;
}
function fmt(t){var d=new Date(t);return d.toLocaleDateString('en',{month:'short',day:'numeric'})+' '+d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}

/* ---------- Activities ---------- */
A.activities=function(el){el=H.fresh(el);var st={q:'',cat:'',diff:'',status:''};
  function fields(){return[{k:'name',l:'Activity name',req:1},{k:'category',l:'Category',t:'select',o:S.settings().categories,req:1},{k:'difficulty',l:'Difficulty',t:'select',o:DIFF,req:1},{k:'status',l:'Status',t:'select',o:['Active','Inactive','Draft'],req:1,def:'Active'},{k:'description',l:'Description',t:'area'}]}
  function draw(){
    var rows=S.get('activities').filter(function(a){var q=st.q.toLowerCase();return(!q||(a.name+a.description).toLowerCase().indexOf(q)>-1)&&(!st.cat||a.category===st.cat)&&(!st.diff||a.difficulty===st.diff)&&(!st.status||a.status===st.status)});
    var used={};S.get('sessions').forEach(function(s){s.activityIds.forEach(function(i){used[i]=(used[i]||0)+1})});
    el.querySelector('#cnt').textContent=rows.length+' activities';
    el.querySelector('#tbl').innerHTML=H.table(['ID','Name','Category','Difficulty','Used in','Status',''],rows.map(function(a){return[esc(a.id),'<b>'+esc(a.name)+'</b><div class="muted">'+esc(a.description||'')+'</div>',esc(a.category),a.difficulty,(used[a.id]||0)+' sessions',H.badge(a.status),H.btn('edit',a.id,'Edit')+H.btn('tog',a.id,a.status==='Active'?'Deactivate':'Activate')+H.btn('del',a.id,'Delete','danger')]}),'No activities match your filters.')}
  function build(){shell(el,'Activity library','Manage the activities used in sessions.','<button class="btn primary" data-act="add">+ Add activity</button>',
    '<input data-f="q" placeholder="Search activities"><select data-f="cat">'+H.opts(S.settings().categories,st.cat,'All categories')+'</select><select data-f="diff">'+H.opts(DIFF,st.diff,'All difficulty')+'</select><select data-f="status">'+H.opts(['Active','Inactive','Draft'],st.status,'All statuses')+'</select>');search(el,st,draw);draw()}
  H.act(el,{add:function(){H.form('Add activity',fields(),{},function(v){S.add('activities',v);H.toast('Activity added');draw()})},
    edit:function(id){H.form('Edit activity',fields(),S.byId('activities',id),function(v){S.update('activities',id,v);H.toast('Activity updated');draw()})},
    tog:function(id){var a=S.byId('activities',id);S.update('activities',id,{status:a.status==='Active'?'Inactive':'Active'});H.toast('Status changed');draw()},
    del:function(id){H.confirmDlg('Delete this activity? Sessions keep their data but lose the link.',function(){S.get('sessions').forEach(function(s){if(s.activityIds.indexOf(id)>-1)S.update('sessions',s.id,{activityIds:s.activityIds.filter(function(x){return x!==id})})});S.remove('activities',id);H.toast('Activity deleted');draw()})}});
  build()};

/* ---------- Supervisors ---------- */
A.supervisors=function(el){el=H.fresh(el);var st={q:'',status:'',view:null};
  var EM=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function fields(){return[{k:'name',l:'Full name',req:1},{k:'email',l:'Email',t:'email',req:1},{k:'status',l:'Status',t:'select',o:['Active','Inactive'],req:1,def:'Active'}]}
  function stats(v){var ss=S.get('sessions').filter(function(s){return s.supervisor===v.name}),ids=ss.map(function(s){return s.id}),rp=S.get('reports').filter(function(r){return ids.indexOf(r.sessionId)>-1});
    return{ss:ss,done:ss.filter(function(s){return s.status==='Completed'}).length,rp:rp,pend:rp.filter(function(r){return r.status==='Pending review'}).length}}
  function validate(v,id){if(!EM.test(v.email)){H.toast('Enter a valid email address');return false}
    if(S.get('supervisors').some(function(x){return x.id!==id&&x.email.toLowerCase()===v.email.toLowerCase()})){H.toast('That email is already used');return false}}
  function draw(){
    if(st.view){var v=S.byId('supervisors',st.view);if(!v){st.view=null;return draw()}var k=stats(v),log=S.get('audit').filter(function(a){return(a.detail||'').indexOf(v.name)>-1||k.ss.some(function(s){return s.id===a.recordId})}).slice(0,6);
      el.innerHTML=H.head(esc(v.name),esc(v.email)+' · '+H.demoNote(),'<button class="btn" data-act="back">← Back</button>'+H.btn('edit',v.id,'Edit')+H.btn('pp',v.id,'Assign participants')+H.btn('as',v.id,'Assign session'))+
      '<div class="panel"><div class="detail-grid"><div><b>Status</b>'+H.badge(v.status)+'</div><div><b>Assigned participants</b>'+v.participantIds.length+'</div><div><b>Total sessions</b>'+k.ss.length+'</div><div><b>Completed</b>'+k.done+'</div><div><b>Pending reports</b>'+k.pend+'</div></div></div>'+
      '<div class="panel"><h3>Assigned participants</h3>'+(v.participantIds.length?v.participantIds.map(function(i){return'<span class="chip">'+esc(S.name(i))+'</span> '}).join(''):'<p class="muted">None assigned.</p>')+'</div>'+
      '<div class="panel"><h3>Sessions</h3>'+H.table(['Code','Participant','Date','Status'],k.ss.slice(0,12).map(function(s){return[esc(s.code),esc(S.name(s.participantId)),s.date,H.badge(s.status)]}),'No sessions.')+'</div>'+
      '<div class="panel"><h3>Submitted reports</h3>'+H.table(['Report','Session','Status'],k.rp.map(function(r){return[esc(r.id),esc((S.byId('sessions',r.sessionId)||{}).code||'—'),H.badge(r.status)]}),'No reports.')+'</div>'+
      '<div class="panel"><h3>Recent activity</h3>'+H.table(['When','Action','Record'],log.map(function(a){return[fmt(a.at),esc(a.action),esc(a.recordId)]}),'No recent activity.')+'</div>';return}
    if(!el.querySelector('#tbl'))build();
    var rows=S.get('supervisors').filter(function(v){var q=st.q.toLowerCase();return(!q||(v.name+v.email).toLowerCase().indexOf(q)>-1)&&(!st.status||v.status===st.status)});
    el.querySelector('#cnt').textContent=rows.length+' supervisors';
    el.querySelector('#tbl').innerHTML=H.table(['Name','Email','Participants','Sessions','Completed','Pending reports','Status',''],rows.map(function(v){var k=stats(v);return['<b>'+esc(v.name)+'</b>',esc(v.email),v.participantIds.length,k.ss.length,k.done,k.pend,H.badge(v.status),H.btn('view',v.id,'View')+H.btn('edit',v.id,'Edit')+H.btn('tog',v.id,v.status==='Active'?'Deactivate':'Activate')]}),'No supervisors match.')}
  function build(){shell(el,'Supervisors','Manage supervisors, assignments and review activity.','<button class="btn primary" data-act="add">+ Add supervisor</button>','<input data-f="q" placeholder="Search name or email"><select data-f="status">'+H.opts(['Active','Inactive'],st.status,'All statuses')+'</select>');search(el,st,draw)}
  H.act(el,{back:function(){st.view=null;build();draw()},view:function(id){st.view=id;draw()},
    add:function(){H.form('Add supervisor',fields(),{},function(v){if(validate(v)===false)return false;v.participantIds=[];v.createdAt=new Date().toISOString().slice(0,10);S.add('supervisors',v);H.toast('Supervisor added');draw()})},
    edit:function(id){var o=S.byId('supervisors',id);H.form('Edit supervisor',fields(),o,function(v){if(validate(v,id)===false)return false;if(v.name!==o.name)S.renameSupervisor(o.name,v.name);S.update('supervisors',id,v);H.toast('Supervisor updated');draw()})},
    tog:function(id){var v=S.byId('supervisors',id);S.update('supervisors',id,{status:v.status==='Active'?'Inactive':'Active'});H.toast('Status changed');draw()},
    pp:function(id){var v=S.byId('supervisors',id);H.form('Assign participants',[{k:'participantIds',l:'Participants (Ctrl/Cmd-click for several)',t:'multi',o:S.get('participants').map(function(p){return{v:p.id,l:p.code+' · '+p.name}})}],{participantIds:v.participantIds},function(x){S.update('supervisors',id,{participantIds:x.participantIds});H.toast('Participants assigned');draw()})},
    as:function(id){var v=S.byId('supervisors',id);H.form('Assign session',[{k:'sid',l:'Session',t:'select',req:1,o:S.get('sessions').filter(function(s){return s.supervisor!==v.name&&s.status!=='Completed'&&s.status!=='Cancelled'}).map(function(s){return{v:s.id,l:s.code+' · '+S.name(s.participantId)+' ('+s.status+')'}})}],{},function(x){S.update('sessions',x.sid,{supervisor:v.name});H.toast('Session assigned');draw()})}});
  draw()};

/* ---------- Audit logs ---------- */
A.audit=function(el){el=H.fresh(el);var st={q:'',action:'',type:'',from:'',to:''};
  function draw(){
    var all=S.get('audit'),acts=[],types=[];all.forEach(function(a){if(acts.indexOf(a.action)<0)acts.push(a.action);if(types.indexOf(a.type)<0)types.push(a.type)});
    var rows=all.filter(function(a){var q=st.q.toLowerCase(),d=a.at.slice(0,10);return(!q||(a.actor+a.action+a.recordId+(a.detail||'')).toLowerCase().indexOf(q)>-1)&&(!st.action||a.action===st.action)&&(!st.type||a.type===st.type)&&(!st.from||d>=st.from)&&(!st.to||d<=st.to)});
    el.querySelector('#cnt').textContent=rows.length+' of '+all.length+' entries';
    var sel=el.querySelectorAll('select');sel[0].innerHTML=H.opts(acts.sort(),st.action,'All actions');sel[1].innerHTML=H.opts(types.sort(),st.type,'All record types');
    el.querySelector('#tbl').innerHTML=H.table(['Date & time','Actor','Action','Record type','Record ID','Detail'],rows.slice(0,200).map(function(a){return[fmt(a.at),esc(a.actor),'<b>'+esc(a.action)+'</b>',esc(a.type),esc(a.recordId),esc(a.detail||'')]}),'No audit entries yet. Make a change and it appears here.')}
  shell(el,'Audit logs','Every create, update, delete, assignment, review and data import/export.','','<input data-f="q" placeholder="Search actor, action, record"><select data-f="action"></select><select data-f="type"></select><input type="date" data-f="from" aria-label="From"><input type="date" data-f="to" aria-label="To">');
  el.querySelectorAll('[data-f]').forEach(function(i){i.addEventListener('input',function(){st[i.dataset.f]=i.value;draw()})});draw()};

/* ---------- Platform settings (prepended to Settings page) ---------- */
A.platform=function(host){
  var c=S.settings(),w=document.createElement('div');w.className='panel';
  w.innerHTML='<h3>Platform &amp; defaults</h3><p class="muted">Stored in this browser only. Nothing here needs a server.</p><form id="ps" class="filters" style="align-items:flex-end;flex-wrap:wrap" novalidate>'+
  '<label class="fld"><span>Organization name *</span><input name="org" value="'+esc(c.org)+'"></label><label class="fld"><span>Platform name</span><input name="platform" value="'+esc(c.platform)+'"></label><label class="fld"><span>Acting as (audit name)</span><input name="actor" value="'+esc(c.actor)+'"></label>'+
  '<label class="fld"><span>Default session length (min)</span><input name="sessionMinutes" type="number" min="5" max="180" value="'+esc(c.sessionMinutes)+'"></label><label class="fld"><span>Default session status</span><select name="sessionStatus">'+H.opts(S.STATUSES,c.sessionStatus)+'</select></label><label class="fld"><span>Table page size</span><select name="pageSize">'+H.opts(['5','10','25'],String(c.pageSize))+'</select></label>'+
  '<label class="fld" style="flex-basis:100%"><span>Activity categories (comma separated) *</span><input name="categories" value="'+esc(c.categories.join(', '))+'"></label><button class="btn primary" type="submit">Save settings</button></form>';
  host.insertBefore(w,host.children[1]||null);
  w.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var f=e.target.elements,cats=f.categories.value.split(',').map(function(x){return x.trim()}).filter(Boolean),m=+f.sessionMinutes.value;
    if(!f.org.value.trim()){H.toast('Organization name is required');return}if(!cats.length){H.toast('Add at least one category');return}if(!(m>=5&&m<=180)){H.toast('Session length must be 5-180 minutes');return}
    S.saveSettings({org:f.org.value.trim(),platform:f.platform.value.trim()||'MOVE AI',actor:f.actor.value.trim()||'Admin (demo)',sessionMinutes:m,sessionStatus:f.sessionStatus.value,pageSize:+f.pageSize.value,categories:cats});H.toast('Settings saved')})};
window.MoveAdmin=A;
})();
