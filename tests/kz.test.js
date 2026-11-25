// Run: node tests/kz.test.js
const K=require('../assets/js/kz-core.js'),assert=require('assert');
const kz={zones:K.ZONES.map(z=>({id:z[0],name:z[1],kind:z[2]})),activityMeta:{},ach:K.RULES.map(r=>({...r,enabled:true})),settings:{stars:{Easy:1,Medium:2,Hard:3}}};
const acts=[{id:'A1',name:'Balance course',category:'Balance',difficulty:'Medium',status:'Active'},{id:'A2',name:'Ball push',category:'Object play',difficulty:'Easy',status:'Active'},{id:'A3',name:'Draft',category:'Cognitive',difficulty:'Easy',status:'Draft'}];
const D={participants:[],activities:acts,attendance:[{participantId:'P',status:'Present'},{participantId:'P',status:'Absent'}],movements:[{sessionId:'S1',duration:600,intensity:3,attempts:2},{sessionId:'S2',duration:9999,intensity:2,attempts:1}],objects:[{sessionId:'S1',object:'Balls'}],
 sessions:[{id:'S1',participantId:'P',status:'Completed',date:'2026-11-20',start:'10:00',duration:20,activityIds:['A1','A2']},{id:'S2',participantId:'P',status:'Completed',date:'2026-11-22',start:'10:00',duration:10,activityIds:['A1']},{id:'S3',participantId:'P',status:'Active',date:'2026-11-23',start:'10:00',duration:0,activityIds:['A2']},{id:'S4',participantId:'Q',status:'Completed',date:'2026-11-22',start:'10:00',duration:10,activityIds:['A2']}]};
const ss=K.childSessions(D,'P');assert.strictEqual(ss.length,2);
const m=K.metrics(D,kz,ss);assert.strictEqual(m.play,30);assert.strictEqual(m.move,20);assert.strictEqual(m.rest,10);// movement is clamped to play time
assert.strictEqual(m.stars,5);assert.strictEqual(m.completions,3);assert.strictEqual(m.activities,2);assert.strictEqual(m.balance,2);
const ac=K.achievements(D,kz,'P'),by=id=>ac.find(a=>a.def.id===id);
assert.strictEqual(by('first').date,'2026-11-20');assert.strictEqual(by('balance').date,'2026-11-22');assert.ok(!by('champion').done);assert.strictEqual(by('explorer').done,false);
assert.strictEqual(K.stateOf(D,'P',acts[0]),'Completed');assert.strictEqual(K.stateOf(D,'P',acts[1]),'Completed');assert.strictEqual(K.stateOf(D,'P',acts[2]),'Locked');
assert.strictEqual(K.stateOf(D,'Z',acts[1]),'Available');assert.strictEqual(K.stateOf({...D,sessions:[D.sessions[2]]},'P',acts[1]),'In Progress');
assert.strictEqual(K.addDays('2026-11-30',1),'2026-12-01');
const p=K.period(D,kz,'P',7,'2026-11-23');assert.strictEqual(p.cur.sessions,2);assert.strictEqual(K.period(D,kz,'P',1,'2026-11-23').cur.sessions,0);
const ins=K.insights(D,kz,'P','2026-11-23');assert.ok(ins.items.some(t=>/latest adventure/.test(t)));assert.ok(ins.items.every(t=>!/happy|sad|smart|talent|diagnos/i.test(t)));
assert.strictEqual(K.insights(D,kz,'NOBODY','2026-11-23').empty,true);assert.strictEqual(K.first('Aria Kaviani'),'Aria');
console.log('kz tests OK');
