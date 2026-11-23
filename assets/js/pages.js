/* MovePages: data-management screens. All reads/writes go through MoveStore. */
(function(){
"use strict";
var S=window.MoveStore,P={};
function fresh(el){var n=el.cloneNode(false);el.parentNode.replaceChild(n,el);return n}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function toast(m){window.MoveUI&&window.MoveUI.toast(m)}
function opts(a,sel,all){return (all?'<option value="">'+all+'</option>':'')+a.map(function(o){var v=o.v!==undefined?o.v:o,l=o.l!==undefined?o.l:o;return'<option value="'+esc(v)+'"'+(String(v)===String(sel)?' selected':'')+'>'+esc(l)+'</option>'}).join('')}
function pOpts(){return S.get('participants').map(function(p){return{v:p.id,l:p.code+' · '+p.name}})}
function sOpts(){return S.get('sessions').map(function(s){return{v:s.id,l:s.code+' · '+S.name(s.participantId)}})}
function badge(s){var c={Completed:'completed',Active:'active',Pending:'pending',Cancelled:'cancelled',Approved:'completed','Pending review':'pending',Draft:'cancelled',Granted:'completed',Withdrawn:'cancelled'}[s]||'pending';return'<span class="badge '+c+'">'+esc(s)+'</span>'}
function btn(act,id,label,cls){return'<button class="btn sm '+(cls||'')+'" data-act="'+act+'" data-id="'+esc(id)+'">'+label+'</button>'}
function table(cols,rows,empty){return rows.length?'<div class="table-wrap"><table><thead><tr>'+cols.map(function(c){return'<th>'+c+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return'<tr>'+r.map(function(c){return'<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>':'<div class="empty-state">'+empty+'</div>'}
function head(t,sub,right){return'<div class="page-head"><div><h1>'+t+'</h1><p>'+sub+'</p></div><div class="head-actions">'+(right||'')+'</div></div>'}
function demoNote(){return'<span class="demo-tag">Local demo storage</span>'}
/* ---- modal / form / confirm ---- */
function modal(title,body,foot){var w=document.createElement('div');w.className='modal-wrap';w.innerHTML='<div class="modal" role="dialog" aria-modal="true"><h3>'+title+'</h3><div class="mbody">'+body+'</div><div class="mfoot">'+foot+'</div></div>';document.body.appendChild(w);w.addEventListener('click',function(e){if(e.target===w||e.target.closest('[data-close]'))w.remove()});return w}
function confirmDlg(msg,ok){var w=modal('Please confirm','<p>'+msg+'</p>','<button class="btn" data-close>Cancel</button><button class="btn danger" id="okBtn">Delete</button>');w.querySelector('#okBtn').onclick=function(){w.remove();ok()}}
function form(title,fields,vals,save){
  vals=vals||{};
  var html='<form id="mf" novalidate>'+fields.map(function(f){var v=vals[f.k]!==undefined?vals[f.k]:(f.def!==undefined?f.def:'');var inp;
    if(f.t==='select')inp='<select name="'+f.k+'">'+opts(f.o,v,f.req?'Select…':'')+'</select>';
    else if(f.t==='multi')inp='<select name="'+f.k+'" multiple size="4">'+f.o.map(function(o){return'<option value="'+esc(o.v)+'"'+((v||[]).indexOf(o.v)>-1?' selected':'')+'>'+esc(o.l)+'</option>'}).join('')+'</select>';
    else if(f.t==='area')inp='<textarea name="'+f.k+'" rows="3">'+esc(v)+'</textarea>';
    else inp='<input name="'+f.k+'" type="'+(f.t||'text')+'" value="'+esc(v)+'"'+(f.t==='number'?' min="0"':'')+'>';
    return'<label class="fld"><span>'+f.l+(f.req?' *':'')+'</span>'+inp+'<em class="ferr" data-e="'+f.k+'"></em></label>'}).join('')+'</form>';
  var w=modal(title,html,'<button class="btn" data-close>Cancel</button><button class="btn primary" id="saveBtn">Save</button>');
  w.querySelector('#saveBtn').onclick=function(){
    var f=w.querySelector('#mf'),out={},ok=true;
    fields.forEach(function(x){var el=f.elements[x.k],v=x.t==='multi'?Array.prototype.filter.call(el.options,function(o){return o.selected}).map(function(o){return o.value}):el.value.trim(),err='';
      if(x.req&&(!v||!v.length))err='Required';else if(x.t==='number'&&v!==''&&(isNaN(+v)||+v<0))err='Enter a positive number';else if(x.min&&+v<x.min)err='Min '+x.min;else if(x.max&&+v>x.max)err='Max '+x.max;
      w.querySelector('[data-e="'+x.k+'"]').textContent=err;if(err)ok=false;out[x.k]=x.t==='number'&&v!==''?+v:v});
    if(ok){var r=save(out);if(r!==false)w.remove()}};
}
function act(root,map){root.addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(b&&map[b.dataset.act])map[b.dataset.act](b.dataset.id,b)})}
function bind(root,st,draw){root.querySelectorAll('[data-f]').forEach(function(i){i.addEventListener('input',function(){st[i.dataset.f]=i.value;draw(true)})})}
function filt(){return Array.prototype.slice.call(arguments).join('')}
/* ---- fields ---- */
var AGE=['3-5','6-8','9-12','13-17','18+'];
function pFields(){return[{k:'code',l:'Participant code',req:1},{k:'name',l:'Display name',req:1},{k:'ageGroup',l:'Age group',t:'select',o:AGE,req:1},{k:'type',l:'Participant type',t:'select',o:['Child','Adult'],req:1},{k:'consent',l:'Consent status',t:'select',o:['Granted','Pending','Withdrawn'],req:1},{k:'regDate',l:'Registration date',t:'date',req:1},{k:'notes',l:'Notes',t:'area'}]}
function sFields(){return[{k:'participantId',l:'Participant',t:'select',o:pOpts(),req:1},{k:'supervisor',l:'Supervisor',t:'select',o:S.SUPERVISORS,req:1},{k:'date',l:'Session date',t:'date',req:1},{k:'start',l:'Start time',t:'time',req:1},{k:'end',l:'End time',t:'time'},{k:'status',l:'Status',t:'select',o:S.STATUSES,req:1},{k:'room',l:'Room',t:'select',o:['Cube A','Cube B','Cube C']},{k:'activityIds',l:'Activities performed',t:'multi',o:S.get('activities').map(function(a){return{v:a.id,l:a.name}})},{k:'notes',l:'Notes',t:'area'}]}
function mFields(sid){return[{k:'sessionId',l:'Session',t:'select',o:sOpts(),req:1,def:sid},{k:'type',l:'Movement type',t:'select',o:S.MOVEMENT_TYPES,req:1},{k:'duration',l:'Duration (seconds)',t:'number',req:1},{k:'intensity',l:'Intensity (1-5)',t:'number',req:1,min:1,max:5},{k:'attempts',l:'Number of attempts',t:'number',req:1,min:1},{k:'timestamp',l:'Timestamp',t:'datetime-local',req:1,def:new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16)},{k:'source',l:'Data source',t:'select',o:['Manual entry','Camera (planned)','Sensor (planned)'],def:'Manual entry'},{k:'notes',l:'Notes',t:'area'}]}
function oFields(sid){return[{k:'sessionId',l:'Session',t:'select',o:sOpts(),req:1,def:sid},{k:'object',l:'Object',t:'select',o:S.OBJECTS,req:1},{k:'interaction',l:'Interaction type',t:'select',o:S.INTERACTIONS,req:1},{k:'duration',l:'Duration (seconds)',t:'number',req:1},{k:'timestamp',l:'Timestamp',t:'datetime-local',req:1,def:new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16)},{k:'notes',l:'Notes',t:'area'}]}
function rFields(sid){return[{k:'sessionId',l:'Session',t:'select',o:sOpts(),req:1,def:sid},{k:'summary',l:'Summary',t:'area',req:1},{k:'status',l:'Status',t:'select',o:['Draft','Pending review','Approved'],req:1,def:'Draft'},{k:'comments',l:'Supervisor comments',t:'area'}]}
function afterSave(r,msg){toast(msg);r()}
function editRec(col,fields,title,id,vals,redraw,pre){form(id?'Edit '+title:'Add '+title,fields,vals,function(v){if(pre)pre(v);if(id)S.update(col,id,v);else S.add(col,v);afterSave(redraw,title+(id?' updated':' added'))})}
function delRec(col,id,msg,redraw){confirmDlg(msg,function(){S.remove(col,id);afterSave(redraw,'Deleted')})}
/* ---- Participants ---- */
P.participants=function(el){el=fresh(el);
  var st={q:'',age:'',type:'',view:null};
  function draw(keep){
    if(st.view){var p=S.byId('participants',st.view);if(!p){st.view=null;return draw()}
      var ss=S.get('sessions').filter(function(s){return s.participantId===p.id});
      el.innerHTML=head(esc(p.name),esc(p.code)+' · '+p.type+' · '+p.ageGroup,'<button class="btn" data-act="back">← Back</button>'+btn('edit',p.id,'Edit'))+
        '<div class="panel"><div class="detail-grid"><div><b>Consent</b>'+badge(p.consent)+'</div><div><b>Registered</b>'+esc(p.regDate)+'</div><div><b>Sessions</b>'+ss.length+'</div><div><b>Notes</b>'+(esc(p.notes)||'—')+'</div></div></div><div class="panel"><div class="panel-head"><h3>Session history</h3></div>'+
        table(['Code','Date','Supervisor','Duration','Status',''],ss.map(function(s){return[esc(s.code),s.date,esc(s.supervisor),s.duration?s.duration+'m':'—',badge(s.status),btn('open',s.id,'Open')]}),'No sessions yet for this participant.')+'</div>';return}
    var rows=S.get('participants').filter(function(p){var q=st.q.toLowerCase();return(!q||(p.name+p.code).toLowerCase().indexOf(q)>-1)&&(!st.age||p.ageGroup===st.age)&&(!st.type||p.type===st.type)});
    var cnt={};S.get('sessions').forEach(function(s){cnt[s.participantId]=(cnt[s.participantId]||0)+1});
    var tb=table(['Code','Name','Age group','Type','Consent','Registered','Sessions',''],rows.map(function(p){return[esc(p.code),'<b>'+esc(p.name)+'</b>',p.ageGroup,p.type,badge(p.consent),p.regDate,cnt[p.id]||0,btn('view',p.id,'View')+btn('edit',p.id,'Edit')+btn('del',p.id,'Delete','danger')]}),'No participants match your filters.');
    if(keep){el.querySelector('#tbl').innerHTML=tb;el.querySelector('#cnt').textContent=rows.length+' participants';return}
    el.innerHTML=head('Participants','Everyone enrolled at The Cube. '+demoNote(),'<button class="btn primary" data-act="add">+ Add participant</button>')+
      '<div class="panel"><div class="filters"><input data-f="q" placeholder="Search name or code" value="'+esc(st.q)+'"><select data-f="age">'+opts(AGE,st.age,'All age groups')+'</select><select data-f="type">'+opts(['Child','Adult'],st.type,'All types')+'</select><span class="muted" id="cnt">'+rows.length+' participants</span></div><div id="tbl">'+tb+'</div></div>';
    bind(el,st,draw);
  }
  act(el,{back:function(){st.view=null;draw()},view:function(id){st.view=id;draw()},open:function(id){window.MoveUI.openSession=id;window.MoveUI.go('sessions')},add:function(){editRec('participants',pFields(),'participant',null,{regDate:new Date().toISOString().slice(0,10),consent:'Pending'},draw)},edit:function(id){editRec('participants',pFields(),'participant',id,S.byId('participants',id),draw)},del:function(id){delRec('participants',id,'Delete this participant and all of their sessions, events, interactions and reports? This cannot be undone (export a backup first).',draw)}});
  draw();
};
/* ---- Sessions ---- */
P.sessions=function(el){el=fresh(el);
  var st={q:'',date:'',pid:'',sup:'',status:'',view:window.MoveUI.openSession||null,tab:'Overview'};window.MoveUI.openSession=null;
  function fixDur(v){v.duration=S.minutes(v.start,v.end);v.activityIds=v.activityIds||[];if(!v.code){var n=S.get('sessions').length+1;v.code='MV-'+v.date.slice(0,4)+'-'+('00'+n).slice(-3)}}
  function detail(s){
    var p=S.byId('participants',s.participantId),mv=S.get('movements').filter(function(x){return x.sessionId===s.id}),ob=S.get('objects').filter(function(x){return x.sessionId===s.id}),rp=S.get('reports').filter(function(x){return x.sessionId===s.id});
    var tabs=['Overview','Activities','Movement','Objects','Reports'],body='';
    if(st.tab==='Overview')body='<div class="detail-grid"><div><b>Participant</b>'+(p?esc(p.name)+' ('+esc(p.code)+')':'(deleted)')+'</div><div><b>Supervisor</b>'+esc(s.supervisor)+'</div><div><b>Date</b>'+s.date+'</div><div><b>Time</b>'+esc(s.start)+' – '+(esc(s.end)||'—')+'</div><div><b>Duration</b>'+(s.duration?s.duration+' min':'—')+'</div><div><b>Status</b>'+badge(s.status)+'</div><div><b>Room</b>'+esc(s.room||'—')+'</div><div><b>Supervisor notes</b>'+(esc(s.notes)||'—')+'</div></div>';
    if(st.tab==='Activities')body=table(['Activity','Category','Difficulty'],s.activityIds.map(function(id){var a=S.byId('activities',id);return a?[esc(a.name),esc(a.category),a.difficulty]:['(deleted)','','']}),'No activities recorded.');
    if(st.tab==='Movement')body='<p>'+btn('addm',s.id,'+ Add movement event')+'</p>'+table(['Type','Duration','Intensity','Attempts','Source',''],mv.map(function(m){return[m.type,m.duration+'s',m.intensity,m.attempts,esc(m.source),btn('em',m.id,'Edit')+btn('dm',m.id,'Delete','danger')]}),'No movement events yet.');
    if(st.tab==='Objects')body='<p>'+btn('addo',s.id,'+ Add interaction')+'</p>'+table(['Object','Interaction','Duration','Notes',''],ob.map(function(m){return[esc(m.object),esc(m.interaction),m.duration+'s',esc(m.notes)||'—',btn('eo',m.id,'Edit')+btn('do',m.id,'Delete','danger')]}),'No object interactions yet.');
    if(st.tab==='Reports')body='<p>'+btn('addr',s.id,'+ Add report')+'</p>'+table(['Report','Summary','Status','Comments',''],rp.map(function(r){return[r.id,esc(r.summary),badge(r.status),esc(r.comments)||'—',btn('er',r.id,'Edit')+btn('dr',r.id,'Delete','danger')]}),'No reports for this session.');
    el.innerHTML=head(esc(s.code),(p?esc(p.name):'')+' · '+s.date,'<button class="btn" data-act="back">← Back</button>'+btn('edit',s.id,'Edit session'))+'<div class="panel"><div class="seg tabs">'+tabs.map(function(t){return'<button data-act="tab" data-id="'+t+'" class="'+(t===st.tab?'active':'')+'">'+t+'</button>'}).join('')+'</div><div style="margin-top:14px">'+body+'</div></div>';
  }
  function draw(keep){
    if(st.view){var s=S.byId('sessions',st.view);if(!s){st.view=null;return draw()}return detail(s)}
    var rows=S.get('sessions').filter(function(s){return(!st.q||s.code.toLowerCase().indexOf(st.q.toLowerCase())>-1)&&(!st.date||s.date===st.date)&&(!st.pid||s.participantId===st.pid)&&(!st.sup||s.supervisor===st.sup)&&(!st.status||s.status===st.status)}).sort(function(a,b){return a.date<b.date?1:-1});
    var tb=table(['Code','Participant','Supervisor','Date','Time','Duration','Status',''],rows.map(function(s){return[esc(s.code),esc(S.name(s.participantId)),esc(s.supervisor),s.date,esc(s.start)+(s.end?'–'+esc(s.end):''),s.duration?s.duration+'m':'—',badge(s.status),btn('view',s.id,'View')+btn('edit',s.id,'Edit')+btn('del',s.id,'Delete','danger')]}),'No sessions match your filters.');
    if(keep){el.querySelector('#tbl').innerHTML=tb;el.querySelector('#cnt').textContent=rows.length+' sessions';return}
    el.innerHTML=head('Sessions','Every tracked session. '+demoNote(),'<button class="btn primary" data-act="add">+ Create session</button>')+'<div class="panel"><div class="filters"><input data-f="q" placeholder="Search session code" value="'+esc(st.q)+'"><input type="date" data-f="date" value="'+esc(st.date)+'"><select data-f="pid">'+opts(pOpts(),st.pid,'All participants')+'</select><select data-f="sup">'+opts(S.SUPERVISORS,st.sup,'All supervisors')+'</select><select data-f="status">'+opts(S.STATUSES,st.status,'All statuses')+'</select><span class="muted" id="cnt">'+rows.length+' sessions</span></div><div id="tbl">'+tb+'</div></div>';
    bind(el,st,draw);
  }
  var sid=function(){return st.view};
  act(el,{back:function(){st.view=null;st.tab='Overview';draw()},view:function(id){st.view=id;st.tab='Overview';draw()},tab:function(t){st.tab=t;draw()},
    add:function(){editRec('sessions',sFields(),'session',null,{date:new Date().toISOString().slice(0,10),status:'Pending'},draw,fixDur)},
    edit:function(id){editRec('sessions',sFields(),'session',id,S.byId('sessions',id),draw,function(v){v.duration=S.minutes(v.start,v.end);v.activityIds=v.activityIds||[]})},
    del:function(id){delRec('sessions',id,'Delete this session with its movement events, object interactions and reports?',draw)},
    addm:function(){editRec('movements',mFields(sid()),'movement event',null,{},draw)},em:function(id){editRec('movements',mFields(),'movement event',id,S.byId('movements',id),draw)},dm:function(id){delRec('movements',id,'Delete this movement event?',draw)},
    addo:function(){editRec('objects',oFields(sid()),'interaction',null,{},draw)},eo:function(id){editRec('objects',oFields(),'interaction',id,S.byId('objects',id),draw)},do:function(id){delRec('objects',id,'Delete this interaction?',draw)},
    addr:function(){editRec('reports',rFields(sid()),'report',null,{},draw,function(v){v.created=new Date().toISOString().slice(0,10)})},er:function(id){editRec('reports',rFields(),'report',id,S.byId('reports',id),draw)},dr:function(id){delRec('reports',id,'Delete this report?',draw)}});
  draw();
};
/* ---- Movement & object tracking ---- */
P.tracking=function(el){el=fresh(el);
  var st={tab:'Movement',sid:'',q:'',type:''};
  function draw(keep){
    var mov=st.tab==='Movement',col=mov?'movements':'objects',key=mov?'type':'object',types=mov?S.MOVEMENT_TYPES:S.OBJECTS;
    var rows=S.get(col).filter(function(r){return(!st.sid||r.sessionId===st.sid)&&(!st.type||r[key]===st.type)&&(!st.q||(r.notes+(r.interaction||'')+r[key]).toLowerCase().indexOf(st.q.toLowerCase())>-1)}).sort(function(a,b){return a.timestamp<b.timestamp?1:-1});
    var cols=mov?['Session','Movement','Duration','Intensity','Attempts','When','']:['Session','Object','Interaction','Duration','When',''];
    var tb=table(cols,rows.map(function(r){var ss=S.byId('sessions',r.sessionId),c=[esc(ss?ss.code:'(deleted)')];if(mov)c.push(r.type,r.duration+'s',r.intensity+'/5',r.attempts);else c.push(esc(r.object),esc(r.interaction),r.duration+'s');c.push(esc(r.timestamp.replace('T',' ')),btn('edit',r.id,'Edit')+btn('del',r.id,'Delete','danger'));return c}),'No records yet. Use the add button to record one.');
    if(keep){el.querySelector('#tbl').innerHTML=tb;return}
    el.innerHTML=head('Movement tracking','Record movement events and object interactions per session. '+demoNote(),'<button class="btn primary" data-act="add">+ Add '+(mov?'movement event':'interaction')+'</button>')+'<div class="panel"><div class="seg tabs">'+['Movement','Objects'].map(function(t){return'<button data-act="tab" data-id="'+t+'" class="'+(t===st.tab?'active':'')+'">'+(t==='Movement'?'Movement events':'Object interactions')+'</button>'}).join('')+'</div><div class="filters" style="margin-top:14px"><input data-f="q" placeholder="Search notes" value="'+esc(st.q)+'"><select data-f="sid">'+opts(sOpts(),st.sid,'All sessions')+'</select><select data-f="type">'+opts(types,st.type,'All types')+'</select></div><div id="tbl">'+tb+'</div></div>';
    bind(el,st,draw);
  }
  function fl(){return st.tab==='Movement'?mFields(st.sid):oFields(st.sid)}
  act(el,{tab:function(t){st.tab=t;st.type='';draw()},add:function(){editRec(st.tab==='Movement'?'movements':'objects',fl(),st.tab==='Movement'?'movement event':'interaction',null,{},draw)},edit:function(id){var c=st.tab==='Movement'?'movements':'objects';editRec(c,fl(),'record',id,S.byId(c,id),draw)},del:function(id){delRec(st.tab==='Movement'?'movements':'objects',id,'Delete this record?',draw)}});
  draw();
};
/* ---- Reports ---- */
P.reports=function(el){el=fresh(el);
  function draw(){var rows=S.get('reports');el.innerHTML=head('Reports','Session reports and supervisor comments. '+demoNote(),'<button class="btn primary" data-act="add">+ Add report</button>')+'<div class="panel">'+table(['Report','Session','Summary','Status','Created',''],rows.map(function(r){var ss=S.byId('sessions',r.sessionId);return[r.id,esc(ss?ss.code:'(deleted)'),esc(r.summary),badge(r.status),r.created,btn('edit',r.id,'Edit')+btn('del',r.id,'Delete','danger')]}),'No reports yet.')+'</div>'}
  act(el,{add:function(){editRec('reports',rFields(),'report',null,{},draw,function(v){v.created=new Date().toISOString().slice(0,10)})},edit:function(id){editRec('reports',rFields(),'report',id,S.byId('reports',id),draw)},del:function(id){delRec('reports',id,'Delete this report?',draw)}});
  draw();
};
/* ---- Settings: backup / restore ---- */
P.settings=function(el){el=fresh(el);
  function draw(){var c={};['participants','sessions','activities','movements','objects','reports'].forEach(function(k){c[k]=S.get(k).length});
    el.innerHTML=head('Settings','Data management '+demoNote(),'')+'<div class="panel"><h3>Local demo storage</h3><p class="muted">Data is saved in this browser only (localStorage). It is not shared with other users or devices, and clearing site data erases it. Export a JSON backup regularly. This layer is ready to be replaced by a real API and MySQL backend.</p><div class="detail-grid">'+Object.keys(c).map(function(k){return'<div><b>'+k+'</b>'+c[k]+'</div>'}).join('')+'</div><div class="filters" style="margin-top:16px"><button class="btn primary" data-act="exp">Export JSON</button><button class="btn" data-act="imp">Import JSON</button><button class="btn" data-act="rb"'+(S.hasBackup()?'':' disabled')+'>Restore previous data</button><button class="btn danger" data-act="reset">Restore demo dataset</button><input type="file" id="fi" accept="application/json,.json" hidden></div></div>'}
  act(el,{exp:function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([S.exportJSON()],{type:'application/json'}));a.download='moveai-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();toast('Backup exported')},
    imp:function(){el.querySelector('#fi').click()},
    rb:function(){confirmDlg('Replace current data with the data saved before your last import/reset?',function(){S.restoreBackup();draw();toast('Previous data restored')})},
    reset:function(){confirmDlg('Replace ALL current data with the original demo dataset? Your current data is kept once as a restorable backup.',function(){S.reset();draw();toast('Demo dataset restored')})}});
  el.addEventListener('change',function(e){if(e.target.id!=='fi'||!e.target.files[0])return;var r=new FileReader();r.onload=function(){try{S.importJSON(r.result);draw();toast('Import complete')}catch(x){toast('Import failed: '+x.message)}};r.readAsText(e.target.files[0])});
  draw();
};
P._h={fresh:fresh,esc:esc,toast:toast,opts:opts,badge:badge,btn:btn,table:table,head:head,demoNote:demoNote,form:form,confirmDlg:confirmDlg,act:act,modal:modal};
window.MovePages=P;
})();
