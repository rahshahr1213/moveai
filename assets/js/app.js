(function(){
"use strict";

/* ================= demo dataset ================= */
var RANGE_DATA = {
  7:{ sessions:[196,188,205,214,221,209,230], labels:['Nov 17','18','19','20','21','22','23'],
      kpi:{participants:1248,sessions:712,completed:654,active:14,duration:'23m',pending:5},
      kpiDelta:{participants:3.1,sessions:2.4,completed:91.9,duration:-0.8}},
  14:{ sessions:[142,156,149,168,172,165,180,174,189,196,188,205,214,221], labels:['Nov 10','11','12','13','14','15','16','17','18','19','20','21','22','23'],
      kpi:{participants:1248,sessions:1326,completed:1218,active:14,duration:'24m',pending:7},
      kpiDelta:{participants:8.2,sessions:4.6,completed:91.9,duration:-1.3}},
  30:{ sessions:[118,124,131,129,142,138,150,156,149,168,172,165,180,174,189,196,188,205,214,221,196,188,205,214,221,209,230,217,224,238], labels:Array.from({length:30},function(_,i){return 'd'+(i+1)}),
      kpi:{participants:1248,sessions:2840,completed:2601,active:14,duration:'24m',pending:11},
      kpiDelta:{participants:12.4,sessions:9.1,completed:91.6,duration:0.4}},
  90:{ sessions:Array.from({length:90},function(_,i){return 110+Math.round(70*Math.sin(i/9)+i*1.1)}), labels:Array.from({length:90},function(_,i){return 'd'+(i+1)}),
      kpi:{participants:1248,sessions:8420,completed:7714,active:14,duration:'25m',pending:19},
      kpiDelta:{participants:21.7,sessions:17.3,completed:91.6,duration:1.1}}
};
var currentRange = 14;

var SESSIONS = [
  {id:'S-1024', p:'P-001', name:'Aria Kaviani', init:'AK', activity:'Obstacle crossing', movement:'Jumping', room:'Cube A', duration:'22m', status:'Completed', date:'Nov 23'},
  {id:'S-1025', p:'P-014', name:'Dorsa Moradi', init:'DM', activity:'Jump & reach', movement:'Jumping', room:'Cube B', duration:'31m', status:'Active', date:'Nov 23'},
  {id:'S-1026', p:'P-032', name:'Kian Tabrizi', init:'KT', activity:'Obstacle crossing', movement:'Walking', room:'Cube A', duration:'18m', status:'Completed', date:'Nov 23'},
  {id:'S-1027', p:'P-045', name:'Sara Zand', init:'SZ', activity:'Free play', movement:'Balancing', room:'Cube C', duration:'—', status:'Pending', date:'Nov 23'},
  {id:'S-1028', p:'P-019', name:'Mehdi Rostami', init:'MR', activity:'Crawl pattern', movement:'Crawling', room:'Cube B', duration:'15m', status:'Cancelled', date:'Nov 22'},
  {id:'S-1029', p:'P-027', name:'Lina Pakzad', init:'LP', activity:'Ball push', movement:'Reaching', room:'Cube A', duration:'27m', status:'Completed', date:'Nov 22'},
  {id:'S-1030', p:'P-008', name:'Nima Hashemi', init:'NH', activity:'Balance course', movement:'Balancing', room:'Cube C', duration:'19m', status:'Active', date:'Nov 22'},
  {id:'S-1031', p:'P-052', name:'Roya Ahmadi', init:'RA', activity:'Obstacle crossing', movement:'Jumping', room:'Cube A', duration:'24m', status:'Completed', date:'Nov 22'},
  {id:'S-1032', p:'P-061', name:'Bardia Nouri', init:'BN', activity:'Free play', movement:'Walking', room:'Cube B', duration:'12m', status:'Pending', date:'Nov 21'},
  {id:'S-1033', p:'P-003', name:'Yasmin Rezaei', init:'YR', activity:'Crawl pattern', movement:'Crawling', room:'Cube C', duration:'20m', status:'Completed', date:'Nov 21'},
  {id:'S-1034', p:'P-041', name:'Arman Jafari', init:'AJ', activity:'Ball push', movement:'Reaching', room:'Cube A', duration:'29m', status:'Completed', date:'Nov 21'},
  {id:'S-1035', p:'P-058', name:'Hana Shirazi', init:'HS', activity:'Balance course', movement:'Balancing', room:'Cube B', duration:'16m', status:'Cancelled', date:'Nov 20'}
];

var NOTIFICATIONS = [
  {icon:'check', color:'teal', text:'Session S-1024 completed by Aria Kaviani', time:'4 min ago', unread:true},
  {icon:'user', color:'blue', text:'New participant P-061 (Bardia Nouri) added', time:'22 min ago', unread:true},
  {icon:'file', color:'amber', text:'Weekly report generated for Cube B', time:'1 h ago', unread:true},
  {icon:'alert', color:'red', text:'Sensor calibration flagged in Cube C', time:'3 h ago', unread:false},
  {icon:'user2', color:'blue', text:'Supervisor Reza Farhadi invited to Site 01', time:'5 h ago', unread:false}
];

var SUPERVISORS = [
  {name:'Sarah Miller', init:'SM', role:'Program lead · Site 01', sessions:214},
  {name:'Reza Farhadi', init:'RF', role:'Supervisor · Cube B', sessions:168},
  {name:'Elaheh Moini', init:'EM', role:'Supervisor · Cube C', sessions:142},
  {name:'Omid Karimi', init:'OK', role:'Supervisor · Cube A', sessions:129}
];

var TOP_ACTIVITIES = [
  {name:'Obstacle crossing', count:412, max:412},
  {name:'Ball push', count:356, max:412},
  {name:'Balance course', count:298, max:412},
  {name:'Free play', count:210, max:412},
  {name:'Crawl pattern', count:164, max:412}
];

var DASH=null;
function syncStore(){
  DASH=window.MoveStore.dash(); RANGE_DATA=DASH.range; SESSIONS=DASH.sessions; TOP_ACTIVITIES=DASH.top;
  SEARCH_INDEX = SESSIONS.map(function(x){ return {type:'Session', label:x.name+' \u2014 '+x.id, sub:x.activity}; })
    .concat(window.MoveStore.get('participants').map(function(x){ return {type:'Participant', label:x.name+' \u2014 '+x.code, sub:x.ageGroup}; }))
    .concat(SUPERVISORS.map(function(x){ return {type:'Supervisor', label:x.name, sub:x.role}; }));
}
var SEARCH_INDEX=[];
var ICONS = {
  check:'<path d="M20 6 9 17l-5-5"/>', user:'<circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.3 2.9-6 7-6s7 2.7 7 6"/>',
  file:'<path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/>', alert:'<path d="M12 9v4"/><circle cx="12" cy="16.2" r=".4" fill="currentColor"/><path d="M10.4 3.6 2.6 18a1.8 1.8 0 0 0 1.6 2.7h15.6A1.8 1.8 0 0 0 21.4 18L13.6 3.6a1.8 1.8 0 0 0-3.2 0z"/>',
  user2:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/><path d="M16 4.5c1.5.4 2.5 1.7 2.5 3.2s-1 2.8-2.5 3.2"/>'
};
var COLORS = {teal:['var(--teal-soft)','#0a6b61'], blue:['var(--blue-soft)','var(--blue)'], amber:['var(--amber-soft)','var(--amber)'], red:['var(--red-soft)','var(--red)']};

/* ================= helpers ================= */
function ink(varName){ return getComputedStyle(document.body).getPropertyValue(varName).trim(); }
function icon(name){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+ICONS[name]+'</svg>'; }
function showToast(msg){
  var t=document.getElementById('toast'); document.getElementById('toastMsg').textContent=msg;
  t.classList.add('show'); clearTimeout(t._tm); t._tm=setTimeout(function(){t.classList.remove('show')},2600);
}
function closeAllDropdowns(except){
  ['notifPanel','userPanel','datePop'].forEach(function(id){ if(id!==except) document.getElementById(id).classList.remove('show'); });
  document.getElementById('searchResults').classList.remove('show');
}
Chart.defaults.font.family = "'Inter',system-ui,sans-serif";
Chart.defaults.font.size = 11.5;
var charts = {};
function destroyChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }

/* ================= page renderers ================= */
var PAGES = {
  overview: { crumb:'Overview', render: renderOverview },
  participants: { crumb:'Participants', render: function(el){ MovePages.participants(el); } },
  sessions: { crumb:'Sessions', render: function(el){ MovePages.sessions(el); } },
  tracking: { crumb:'Movement tracking', render: function(el){ MovePages.tracking(el); } },
  analytics: { crumb:'Analytics', render: function(el){ MoveAN.pages['an-overview'](el); } },
  reports: { crumb:'Reports', render: function(el){ MovePages.reports(el); } },
  supervisors: { crumb:'Supervisors', render: function(el){ MoveAdmin.supervisors(el); } },
  activities: { crumb:'Activities', render: function(el){ MoveAdmin.activities(el); } },
  audit: { crumb:'Audit logs', render: function(el){ MoveAdmin.audit(el); } },
  settings: { crumb:'Settings', render: function(el){ MovePages.settings(el); MoveAdmin.platform(document.getElementById('content')); } },
  profile: { crumb:'User profile', render: function(el){ renderPlaceholder(el,'User profile','user2','Sarah Miller\'s profile, activity log and preferences will be available here.'); } }
};

function renderPlaceholder(el, title, iconName, desc){
  var icons = {
    user2:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/><path d="M16 4.5c1.5.4 2.5 1.7 2.5 3.2s-1 2.8-2.5 3.2"/>',
    move:'<path d="M3 17 9 9l4 4 8-9"/>', chart:'<path d="M4 20V10M12 20V4M20 20v-7"/>',
    file:'<path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/>', gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.4 7.4 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.4 7.4 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7c.8.7 1.6 1.2 2.6 1.5L10 22h4l.4-2.7c1-.3 1.8-.8 2.6-1.5l2.4.7 2-3.4z"/>'
  };
  el.innerHTML =
    '<div class="page-head"><div><h1>'+title+'</h1></div></div>'+
    '<div class="panel placeholder-panel">'+
      '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">'+icons[iconName]+'</svg></div>'+
      '<h3>'+title+'</h3><p>'+desc+'</p>'+
      '<span class="badge-soon">Coming in the next milestone</span>'+
    '</div>';
}

function renderOverview(el){
  var d = RANGE_DATA[currentRange];
  el.innerHTML =
  '<div class="page-head">'+
    '<div><h1>Good morning, Sarah</h1><p>Here\'s what\'s happening across your MOVE AI environment.</p></div>'+
    '<div class="head-actions">'+
      '<button class="btn" id="addParticipantBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M4 12h16"/></svg>New participant</button>'+
      '<button class="btn primary" id="startSessionBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Start session</button>'+
    '</div>'+
  '</div>'+

  '<section class="kpi-grid" id="kpiGrid"></section>'+

  '<section class="charts-row-3">'+
    '<div class="panel">'+
      '<div class="panel-head"><div><h3>Sessions overview</h3><div class="sub" id="sessionsSub">Last '+currentRange+' days</div></div>'+
        '<div class="seg" id="chartSeg"><button data-r="7">7d</button><button data-r="14" class="active">14d</button><button data-r="30">30d</button><button data-r="90">90d</button></div>'+
      '</div>'+
      '<div style="position:relative;height:230px"><canvas id="sessionsChart" role="img" aria-label="Line chart of sessions over time">Sessions chart</canvas></div>'+
    '</div>'+
    '<div class="panel">'+
      '<div class="panel-head"><div><h3>Movement categories</h3><div class="sub">Share of tracked movement</div></div></div>'+
      '<div style="position:relative;height:190px"><canvas id="movementChart" role="img" aria-label="Donut chart of movement categories: walking 38%, reaching 24%, jumping 16%, balancing 14%, crawling 8%">Movement categories chart</canvas></div>'+
      '<div class="legend">'+
        '<span><i style="background:#2a78d6"></i>Walking 38%</span>'+
        '<span><i style="background:#0d9488"></i>Reaching 24%</span>'+
        '<span><i style="background:#eda100"></i>Jumping 16%</span>'+
        '<span><i style="background:#6250d6"></i>Balancing 14%</span>'+
        '<span><i style="background:#cdd3dc"></i>Crawling 8%</span>'+
      '</div>'+
    '</div>'+
    '<div class="panel">'+
      '<div class="panel-head"><div><h3>Object interactions</h3><div class="sub">Top interactive props, this week</div></div></div>'+
      '<div style="position:relative;height:190px"><canvas id="objectsChart" role="img" aria-label="Horizontal bar chart of object interactions">Object interactions chart</canvas></div>'+
    '</div>'+
  '</section>'+

  '<section class="charts-row-2">'+
    '<div class="panel">'+
      '<div class="panel-head"><div><h3>Activity distribution</h3><div class="sub">Minutes spent per activity type, this week</div></div></div>'+
      '<div style="position:relative;height:210px"><canvas id="activityDistChart" role="img" aria-label="Stacked bar chart of activity distribution by day">Activity distribution chart</canvas></div>'+
    '</div>'+
    '<div class="panel">'+
      '<div class="panel-head"><h3>Top activities</h3></div>'+
      '<div class="rank-list" id="topActivities"></div>'+
    '</div>'+
  '</section>'+

  '<section class="bottom-grid">'+
    '<div class="panel">'+
      '<div class="panel-head"><div><h3>Recent sessions</h3><div class="sub">Latest activity across all rooms</div></div></div>'+
      '<div class="table-toolbar">'+
        '<div class="table-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="tableFilter" placeholder="Filter by name, session ID or activity…"></div>'+
        '<select class="filter-select" id="statusFilter"><option value="">All statuses</option><option>Completed</option><option>Active</option><option>Pending</option><option>Cancelled</option></select>'+
      '</div>'+
      '<div class="table-wrap"><table><thead><tr><th>Session</th><th>Participant</th><th>Activity</th><th>Room</th><th>Duration</th><th>Status</th></tr></thead><tbody id="sessionsTable"></tbody></table></div>'+
      '<div class="pagination"><span id="pageInfo"></span><div class="pages" id="pagesWrap"></div></div>'+
    '</div>'+

    '<div class="side-col">'+
      '<div class="panel">'+
        '<div class="panel-head"><h3>Quick actions</h3></div>'+
        '<div class="quick-actions">'+
          '<button class="qa-btn" data-qa="participant"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M4 12h16"/></svg></span>Add participant</button>'+
          '<button class="qa-btn" data-qa="session"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>Start session</button>'+
          '<button class="qa-btn" data-qa="report"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/></svg></span>Generate report</button>'+
          '<button class="qa-btn" data-qa="invite"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.9-4 3.7-6 7.5-6s6.6 2 7.5 6"/></svg></span>Invite supervisor</button>'+
        '</div>'+
      '</div>'+
      '<div class="panel">'+
        '<div class="panel-head"><h3>Recent activity</h3></div>'+
        '<div class="activity" id="activityFeed"></div>'+
      '</div>'+
      '<div class="panel">'+
        '<div class="panel-head"><h3>Supervisor overview</h3></div>'+
        '<div class="supervisor-list" id="supervisorList"></div>'+
      '</div>'+
    '</div>'+
  '</section>';

  renderKpis(el);
  renderTopActivities(el);
  renderActivityFeed(el);
  renderSupervisors(el);
  initTable(el);
  buildCharts();

  el.querySelector('#chartSeg').addEventListener('click', function(e){
    var b=e.target.closest('button'); if(!b) return;
    currentRange = parseInt(b.dataset.r,10);
    el.querySelectorAll('#chartSeg button').forEach(function(x){x.classList.remove('active')});
    b.classList.add('active');
    el.querySelector('#sessionsSub').textContent = 'Last '+currentRange+' days';
    document.getElementById('dateChipLabel').textContent = 'Last '+currentRange+' days';
    document.querySelectorAll('.date-opt').forEach(function(o){o.classList.toggle('active', parseInt(o.dataset.range,10)===currentRange)});
    renderKpis(el);
    updateSessionsChart();
  });

  el.querySelector('#addParticipantBtn').addEventListener('click', function(){ showToast('Add participant form would open here'); });
  el.querySelector('#startSessionBtn').addEventListener('click', function(){ showToast('New session started — redirecting to live tracking'); });
  el.querySelectorAll('.qa-btn').forEach(function(b){
    b.addEventListener('click', function(){
      var map={participant:'Add participant form would open here', session:'New session started', report:'Generating report from current filters…', invite:'Invite link copied for supervisor'};
      showToast(map[b.dataset.qa]);
    });
  });
}

function renderKpis(root){
  var d = RANGE_DATA[currentRange];
  var cards = [
    {label:'Total participants', value:d.kpi.participants.toLocaleString(), delta:d.kpiDelta.participants, unit:'%', note:'vs previous period', bg:'blue-soft', fg:'blue', icon:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>'},
    {label:'Total sessions', value:d.kpi.sessions.toLocaleString(), delta:d.kpiDelta.sessions, unit:'%', note:'vs previous period', bg:'teal-soft', fg:'teal2', icon:'<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18"/>'},
    {label:'Completed sessions', value:d.kpi.completed.toLocaleString(), delta:d.kpiDelta.completed, unit:'%', note:'completion rate', bg:'teal-soft', fg:'teal2', icon:'<circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/>'},
    {label:'Avg. session duration', value:d.kpi.duration, delta:d.kpiDelta.duration, unit:'%', note:'vs previous period', bg:'amber-soft', fg:'amber', icon:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'},
    {label:'Total activities', value:String(window.MoveStore.get('activities').length), delta:null, note:'activity types', bg:'blue-soft', fg:'blue', icon:'<path d="M4 20V10M12 20V4M20 20v-7"/>'},
    {label:'Pending reports', value:String(d.kpi.pending), delta:null, note:'needs review', bg:'red-soft', fg:'red', icon:'<path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/>'}
  ];
  var fgMap = {blue:'var(--blue)', teal2:'#0a6b61', amber:'var(--amber)', red:'var(--red)'};
  root.querySelector('#kpiGrid').innerHTML = cards.map(function(c){
    var deltaHtml = '';
    if(c.delta !== null){
      var up = c.delta >= 0;
      deltaHtml = '<div class="delta '+(up?'up':'down')+'"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">'+(up?'<path d="M6 15l6-6 6 6"/>':'<path d="M6 9l6 6 6-6"/>')+'</svg>'+Math.abs(c.delta)+c.unit+' <span>'+c.note+'</span></div>';
    } else {
      deltaHtml = '<div class="delta"><span>'+c.note+'</span></div>';
    }
    return '<div class="kpi"><div class="top"><span class="label">'+c.label+'</span><span class="ic" style="background:var(--'+c.bg+');color:'+fgMap[c.fg]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+c.icon+'</svg></span></div><div class="value">'+c.value+'</div>'+deltaHtml+'</div>';
  }).join('');
}

function renderTopActivities(root){
  root.querySelector('#topActivities').innerHTML = TOP_ACTIVITIES.map(function(a){
    var pct = Math.round(a.count/a.max*100);
    return '<div class="rank-item"><div class="info"><div class="t">'+a.name+'<span>'+a.count+'</span></div><div class="rank-track"><i style="width:'+pct+'%"></i></div></div></div>';
  }).join('');
}

function renderActivityFeed(root){
  root.querySelector('#activityFeed').innerHTML = NOTIFICATIONS.map(function(a){
    var c = COLORS[a.color];
    return '<div class="activity-item"><span class="dot-ic" style="background:'+c[0]+';color:'+c[1]+'">'+icon(a.icon)+'</span><div class="body"><p>'+a.text+'</p><time>'+a.time+'</time></div></div>';
  }).join('');
}

function renderSupervisors(root){
  root.querySelector('#supervisorList').innerHTML = SUPERVISORS.map(function(s){
    return '<div class="sup-item"><span class="av">'+s.init+'</span><div class="info"><b>'+s.name+'</b><span>'+s.role+'</span></div><div class="stat">'+s.sessions+'<span>sessions</span></div></div>';
  }).join('');
}

/* ---- table: filter + pagination ---- */
var tableState = { query:'', status:'', page:1, perPage:5 };
function initTable(root){
  var filterInput = root.querySelector('#tableFilter');
  var statusSelect = root.querySelector('#statusFilter');
  filterInput.addEventListener('input', function(){ tableState.query = filterInput.value.toLowerCase(); tableState.page=1; renderTable(root); });
  statusSelect.addEventListener('change', function(){ tableState.status = statusSelect.value; tableState.page=1; renderTable(root); });
  renderTable(root);
}
function renderTable(root){
  var filtered = SESSIONS.filter(function(s){
    var matchesQuery = !tableState.query || (s.name.toLowerCase()+' '+s.id.toLowerCase()+' '+s.activity.toLowerCase()).indexOf(tableState.query) > -1;
    var matchesStatus = !tableState.status || s.status === tableState.status;
    return matchesQuery && matchesStatus;
  });
  var totalPages = Math.max(1, Math.ceil(filtered.length / tableState.perPage));
  if(tableState.page > totalPages) tableState.page = totalPages;
  var start = (tableState.page-1)*tableState.perPage;
  var pageRows = filtered.slice(start, start+tableState.perPage);

  var tbody = root.querySelector('#sessionsTable');
  if(pageRows.length === 0){
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--ink-faint);padding:24px 0">No sessions match your filters.</td></tr>';
  } else {
    tbody.innerHTML = pageRows.map(function(s){
      return '<tr><td><span class="mono">'+s.id+'</span></td><td><div class="who-cell"><span class="av">'+s.init+'</span>'+s.name+'</div></td><td>'+s.activity+'</td><td>'+s.room+'</td><td>'+s.duration+'</td><td><span class="badge '+s.status.toLowerCase()+'">'+s.status+'</span></td></tr>';
    }).join('');
  }

  root.querySelector('#pageInfo').textContent = filtered.length === 0 ? 'No results' : ('Showing '+(start+1)+'–'+Math.min(start+tableState.perPage,filtered.length)+' of '+filtered.length);
  var pagesWrap = root.querySelector('#pagesWrap');
  var html = '<button id="prevPage" '+(tableState.page<=1?'disabled style="opacity:.4"':'')+'>‹</button>';
  for(var p=1;p<=totalPages;p++){ html += '<button data-p="'+p+'" class="'+(p===tableState.page?'active':'')+'">'+p+'</button>'; }
  html += '<button id="nextPage" '+(tableState.page>=totalPages?'disabled style="opacity:.4"':'')+'>›</button>';
  pagesWrap.innerHTML = html;
  pagesWrap.querySelectorAll('button[data-p]').forEach(function(b){ b.addEventListener('click', function(){ tableState.page = parseInt(b.dataset.p,10); renderTable(root); }); });
  var prev = pagesWrap.querySelector('#prevPage'), next = pagesWrap.querySelector('#nextPage');
  if(prev) prev.addEventListener('click', function(){ if(tableState.page>1){tableState.page--; renderTable(root);} });
  if(next) next.addEventListener('click', function(){ if(tableState.page<totalPages){tableState.page++; renderTable(root);} });
}

function renderSessionsPage(el){
  el.innerHTML =
    '<div class="page-head"><div><h1>Sessions</h1><p>Every tracked session across all rooms at Site 01.</p></div></div>'+
    '<div class="panel">'+
      '<div class="table-toolbar">'+
        '<div class="table-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="tableFilter" placeholder="Filter by name, session ID or activity…"></div>'+
        '<select class="filter-select" id="statusFilter"><option value="">All statuses</option><option>Completed</option><option>Active</option><option>Pending</option><option>Cancelled</option></select>'+
      '</div>'+
      '<div class="table-wrap"><table><thead><tr><th>Session</th><th>Participant</th><th>Activity</th><th>Movement</th><th>Room</th><th>Duration</th><th>Status</th></tr></thead><tbody id="sessionsTableFull"></tbody></table></div>'+
      '<div class="pagination"><span id="pageInfo"></span><div class="pages" id="pagesWrap"></div></div>'+
    '</div>';

  tableState = { query:'', status:'', page:1, perPage:7 };
  var filterInput = el.querySelector('#tableFilter'), statusSelect = el.querySelector('#statusFilter');
  filterInput.addEventListener('input', function(){ tableState.query = filterInput.value.toLowerCase(); tableState.page=1; renderFullTable(el); });
  statusSelect.addEventListener('change', function(){ tableState.status = statusSelect.value; tableState.page=1; renderFullTable(el); });
  renderFullTable(el);
}
function renderFullTable(root){
  var filtered = SESSIONS.filter(function(s){
    var matchesQuery = !tableState.query || (s.name.toLowerCase()+' '+s.id.toLowerCase()+' '+s.activity.toLowerCase()).indexOf(tableState.query) > -1;
    var matchesStatus = !tableState.status || s.status === tableState.status;
    return matchesQuery && matchesStatus;
  });
  var totalPages = Math.max(1, Math.ceil(filtered.length / tableState.perPage));
  if(tableState.page > totalPages) tableState.page = totalPages;
  var start = (tableState.page-1)*tableState.perPage;
  var pageRows = filtered.slice(start, start+tableState.perPage);
  var tbody = root.querySelector('#sessionsTableFull');
  tbody.innerHTML = pageRows.length ? pageRows.map(function(s){
    return '<tr><td><span class="mono">'+s.id+'</span></td><td><div class="who-cell"><span class="av">'+s.init+'</span>'+s.name+'</div></td><td>'+s.activity+'</td><td>'+s.movement+'</td><td>'+s.room+'</td><td>'+s.duration+'</td><td><span class="badge '+s.status.toLowerCase()+'">'+s.status+'</span></td></tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--ink-faint);padding:24px 0">No sessions match your filters.</td></tr>';
  root.querySelector('#pageInfo').textContent = filtered.length===0 ? 'No results' : ('Showing '+(start+1)+'–'+Math.min(start+tableState.perPage,filtered.length)+' of '+filtered.length);
  var pagesWrap = root.querySelector('#pagesWrap');
  var html = '<button id="prevPage" '+(tableState.page<=1?'disabled style="opacity:.4"':'')+'>‹</button>';
  for(var p=1;p<=totalPages;p++){ html += '<button data-p="'+p+'" class="'+(p===tableState.page?'active':'')+'">'+p+'</button>'; }
  html += '<button id="nextPage" '+(tableState.page>=totalPages?'disabled style="opacity:.4"':'')+'>›</button>';
  pagesWrap.innerHTML = html;
  pagesWrap.querySelectorAll('button[data-p]').forEach(function(b){ b.addEventListener('click', function(){ tableState.page = parseInt(b.dataset.p,10); renderFullTable(root); }); });
  var prev = pagesWrap.querySelector('#prevPage'), next = pagesWrap.querySelector('#nextPage');
  if(prev) prev.addEventListener('click', function(){ if(tableState.page>1){tableState.page--; renderFullTable(root);} });
  if(next) next.addEventListener('click', function(){ if(tableState.page<totalPages){tableState.page++; renderFullTable(root);} });
}

/* ================= charts ================= */
function updateSessionsChart(){
  var d = RANGE_DATA[currentRange];
  var c = charts['sessionsChart'];
  if(!c) return;
  c.data.labels = d.labels;
  c.data.datasets[0].data = d.sessions;
  c.options.scales.x.ticks.maxTicksLimit = currentRange > 30 ? 6 : 7;
  c.update();
}

function buildCharts(){
  ['sessionsChart','movementChart','objectsChart','activityDistChart'].forEach(destroyChart);
  var d = RANGE_DATA[currentRange];

  charts.sessionsChart = new Chart(document.getElementById('sessionsChart'), {
    type:'line',
    data:{ labels:d.labels, datasets:[{ data:d.sessions, borderColor:'#2f6fed', backgroundColor:'rgba(47,111,237,0.08)', fill:true, tension:.35, pointRadius:0, pointHoverRadius:5, pointHoverBackgroundColor:'#2f6fed', pointHoverBorderColor:'#fff', pointHoverBorderWidth:2, borderWidth:2.2 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{mode:'index', intersect:false, callbacks:{label:function(c){return c.parsed.y+' sessions'}}}},
      scales:{ x:{grid:{display:false}, ticks:{color:ink('--ink-faint'), maxRotation:0, autoSkip:true, maxTicksLimit:7}}, y:{grid:{color:ink('--border')}, ticks:{color:ink('--ink-faint')}, border:{display:false}} },
      interaction:{mode:'nearest', axis:'x', intersect:false}
    }
  });

  charts.movementChart = new Chart(document.getElementById('movementChart'), {
    type:'doughnut',
    data:{ labels:DASH.mv.labels, datasets:[{data:DASH.mv.data, backgroundColor:['#2a78d6','#0d9488','#eda100','#6250d6','#cdd3dc'], borderColor:ink('--surface'), borderWidth:3}] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{display:false}, tooltip:{callbacks:{label:function(c){return c.label+': '+c.raw+'%'}}}} }
  });

  charts.objectsChart = new Chart(document.getElementById('objectsChart'), {
    type:'bar',
    data:{ labels:DASH.ob.labels, datasets:[{data:DASH.ob.data, backgroundColor:'#0d9488', borderRadius:4, barThickness:14}] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{callbacks:{label:function(c){return c.raw+' interactions'}}}},
      scales:{ x:{grid:{color:ink('--border')}, ticks:{color:ink('--ink-faint')}, border:{display:false}}, y:{grid:{display:false}, ticks:{color:ink('--ink-soft')}, border:{display:false}} }
    }
  });

  charts.activityDistChart = new Chart(document.getElementById('activityDistChart'), {
    type:'bar',
    data:{
      labels:DASH.act.labels,
      datasets:DASH.act.datasets
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{mode:'index', intersect:false, callbacks:{label:function(c){return c.dataset.label+': '+c.raw+' min'}}}},
      scales:{ x:{stacked:true, grid:{display:false}, ticks:{color:ink('--ink-faint')}}, y:{stacked:true, grid:{color:ink('--border')}, ticks:{color:ink('--ink-faint')}, border:{display:false}} }
    }
  });
}

/* ================= navigation / routing ================= */
MoveAN.tabs.forEach(function(t){var k=t[0];PAGES[k]={crumb:'Analytics \u00b7 '+t[1],render:function(el){MoveAN.pages[k](el)}}});
/* ---- Supervisor panel pages + frontend-only role simulation ---- */
MoveSV.nav.forEach(function(n){var k=n[0].slice(3);PAGES[n[0]]={crumb:n[1],render:function(el){MoveSV.pages[k](el);MoveSV.badge()}}});
/* ---- AI & cameras (Admin only; supervisors are redirected by setActivePage) ---- */
MoveAIUI.nav.forEach(function(n){PAGES[n[0]]={crumb:'AI \u00b7 '+n[1],render:function(el){MoveAIUI.pages[n[0]](el)}}});
/* ---- Kids Zone (child view hides the admin chrome; adult pages stay inside the app) ---- */
MoveKZ.nav.forEach(function(n){PAGES[n[0]]={crumb:'Kids Zone',render:function(el){MoveKZ.pages[n[0]](el)}}});
var KZ_SV='<div class="nav-label">Kids Zone</div><button class="nav-item" data-page="kz-home">Kids Zone (child view)</button><button class="nav-item" data-page="kz-adult">Child management</button>';
var adminNav=document.getElementById('nav').innerHTML;
function applyRole(){
  var sup=MoveStore.role()==='Supervisor',sel=document.getElementById('roleSel'),sv=document.getElementById('svSel');
  document.getElementById('nav').innerHTML=sup?MoveSV.navHtml()+KZ_SV:adminNav;
  sel.value=sup?'Supervisor':'Admin';
  sv.hidden=!sup;sv.innerHTML=MoveStore.get('supervisors').filter(function(v){return v.status==='Active'}).map(function(v){return'<option value="'+v.id+'"'+(v.id===MoveStore.svId()?' selected':'')+'>'+v.name+'</option>'}).join('');
  MoveSV.badge();
}
document.getElementById('roleSel').addEventListener('change',function(e){MoveStore.setRole(e.target.value);applyRole();setActivePage(e.target.value==='Supervisor'?'sv-overview':'overview');showToast('Demo role: '+e.target.value+' (frontend simulation, not security)');});
document.getElementById('svSel').addEventListener('change',function(e){MoveStore.setRole('Supervisor',e.target.value);applyRole();setActivePage('sv-overview');});
function pageFromHash(){
  var m = /^#\/?([a-z-]+)/.exec(location.hash || '');
  return m && PAGES[m[1]] ? m[1] : 'overview';
}
function setActivePage(page, opts){
  if(!PAGES[page]) page = 'overview';
  var supRole = MoveStore.role()==='Supervisor', isSv = page.indexOf('sv-')===0, isKz = page.indexOf('kz-')===0;
  var wanted = page;
  if(supRole && !isSv && !isKz) page = 'sv-overview'; else if(!supRole && isSv) page = 'overview';
  if(wanted !== page && opts && opts.fromHash) history.replaceState(null, '', '#/' + page);
  syncStore();
  document.querySelectorAll('.nav-item[data-page]').forEach(function(n){ n.classList.toggle('active', n.dataset.page===(page.indexOf('an-')===0?'analytics':page)); });
  document.getElementById('crumbPage').textContent = PAGES[page].crumb;
  document.title = PAGES[page].crumb + ' \u00b7 MOVE AI';
  var content = document.getElementById('content');
  PAGES[page].render(content);
  if(window.MoveKZ) MoveKZ.chrome(page);
  closeNav();
  /* keep the URL in sync (hash routing works on GitHub Pages without server rewrites) */
  if(!(opts && opts.fromHash) && pageFromHash() !== page){
    history.pushState(null, '', '#/' + page);
  }
  if(!(opts && opts.keepScroll)) window.scrollTo(0, 0);
}
window.MoveUI={toast:showToast,go:function(p){setActivePage(p)}};
function closeNav(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.remove('show'); }

document.addEventListener('click', function(e){
  var navBtn = e.target.closest('[data-page]');
  if(navBtn){ setActivePage(navBtn.dataset.page); }
});

var sidebar=document.getElementById('sidebar'), scrim=document.getElementById('scrim'), menuBtn=document.getElementById('menuBtn');
menuBtn.addEventListener('click',function(){sidebar.classList.toggle('open');scrim.classList.toggle('show')});
scrim.addEventListener('click',closeNav);
document.getElementById('helpBtn').addEventListener('click', function(){ showToast('Help center would open in a new tab'); });

/* ---- notifications ---- */
function renderNotifList(){
  document.getElementById('notifList').innerHTML = NOTIFICATIONS.map(function(n){
    var c = COLORS[n.color];
    return '<div class="notif-item"><span class="dot-ic" style="background:'+c[0]+';color:'+c[1]+'">'+icon(n.icon)+'</span><div class="body"><p>'+n.text+(n.unread?' <span class="demo-tag">new</span>':'')+'</p><time>'+n.time+'</time></div></div>';
  }).join('');
  document.getElementById('notifDot').style.display = NOTIFICATIONS.some(function(n){return n.unread}) ? 'block' : 'none';
}
renderNotifList();
document.getElementById('markRead').addEventListener('click', function(){
  NOTIFICATIONS.forEach(function(n){n.unread=false}); renderNotifList(); showToast('All notifications marked as read');
});
document.getElementById('notifBtn').addEventListener('click', function(e){ e.stopPropagation(); var p=document.getElementById('notifPanel'); var willShow=!p.classList.contains('show'); closeAllDropdowns(); if(willShow) p.classList.add('show'); });
document.getElementById('userBtn').addEventListener('click', function(e){ e.stopPropagation(); var p=document.getElementById('userPanel'); var willShow=!p.classList.contains('show'); closeAllDropdowns(); if(willShow) p.classList.add('show'); });
document.getElementById('dateChip').addEventListener('click', function(e){ e.stopPropagation(); var p=document.getElementById('datePop'); var willShow=!p.classList.contains('show'); closeAllDropdowns(); if(willShow) p.classList.add('show'); });
document.getElementById('signOutBtn').addEventListener('click', function(){ closeAllDropdowns(); showToast('Signed out (demo only)'); });

document.querySelectorAll('.date-opt').forEach(function(o){
  o.addEventListener('click', function(){
    currentRange = parseInt(o.dataset.range,10);
    document.querySelectorAll('.date-opt').forEach(function(x){x.classList.remove('active')});
    o.classList.add('active');
    document.getElementById('dateChipLabel').textContent = o.textContent;
    closeAllDropdowns();
    var activeNav = document.querySelector('.nav-item.active');
    if(activeNav && activeNav.dataset.page === 'overview') setActivePage('overview', {keepScroll:true});
  });
});

document.addEventListener('click', function(e){
  if(!e.target.closest('.dropdown-wrap')) closeAllDropdowns();
});

document.getElementById('exportBtn').addEventListener('click', function(){
  var btn=this, label=btn.querySelector('.export-label');
  var original = label.textContent;
  label.textContent='Preparing…'; btn.disabled=true;
  setTimeout(function(){
    label.textContent=original; btn.disabled=false;
    showToast('moveai-report-'+new Date().toISOString().slice(0,10)+'.csv exported (demo)');
  }, 900);
});

/* ---- search ---- */
var SEARCH_INDEX_INIT = SESSIONS.map(function(s){ return {type:'Session', label:s.name+' — '+s.id, sub:s.activity}; })
  .concat(SUPERVISORS.map(function(s){ return {type:'Supervisor', label:s.name, sub:s.role}; }));
var searchInput = document.getElementById('searchInput'), searchResults = document.getElementById('searchResults');
searchInput.addEventListener('input', function(){
  var q = searchInput.value.trim().toLowerCase();
  if(!q){ searchResults.classList.remove('show'); return; }
  var matches = SEARCH_INDEX.filter(function(item){ return item.label.toLowerCase().indexOf(q)>-1 || item.sub.toLowerCase().indexOf(q)>-1; }).slice(0,6);
  searchResults.innerHTML = matches.length ? matches.map(function(m){ return '<div class="res"><span>'+m.label+'</span><span>'+m.type+'</span></div>'; }).join('') : '<div class="search-empty">No matches for "'+searchInput.value+'"</div>';
  searchResults.classList.add('show');
});
searchInput.addEventListener('focus', function(){ if(searchInput.value.trim()) searchResults.classList.add('show'); });

/* ---- init ---- */
/* back/forward buttons and shared deep links such as #/sessions */
applyRole();
window.addEventListener('popstate', function(){ setActivePage(pageFromHash(), {fromHash:true}); });
window.MoveNav = function(p,o){ setActivePage(p,o); };
window.addEventListener('hashchange', function(){ if((document.querySelector('.nav-item.active')||{dataset:{}}).dataset.page !== (pageFromHash().indexOf('an-')===0?'analytics':pageFromHash())) setActivePage(pageFromHash(), {fromHash:true}); });
setActivePage(pageFromHash(), {fromHash:true, keepScroll:true});
})();
