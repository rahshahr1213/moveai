/* Run: node tests/analytics.test.js */
var assert=require('assert'),A=require('../assets/js/analytics.js');
var d={participants:[{id:'P1',code:'P-1',name:'A',ageGroup:'6-8'},{id:'P2',code:'P-2',name:'B',ageGroup:'6-8'}],
 activities:[{id:'A1',category:'Balance',difficulty:'Easy'}],supervisors:[],reports:[],audit:[],
 sessions:[{id:'S1',code:'X1',participantId:'P1',supervisor:'Sv',date:'2026-11-20',status:'Completed',duration:20,activityIds:['A1']},
  {id:'S2',code:'X2',participantId:'P1',supervisor:'Sv',date:'2026-11-21',status:'Cancelled',duration:0,activityIds:[]},
  {id:'S3',code:'X3',participantId:'P2',supervisor:'Sv',date:'2026-11-22',status:'Completed',duration:10,activityIds:['A1']}],
 movements:[{id:'M1',sessionId:'S1',duration:60,intensity:4},{id:'M1',sessionId:'S1',duration:60,intensity:4},{id:'M2',sessionId:'S1',duration:30,intensity:2},{id:'M3',sessionId:'S3',duration:0,intensity:3}],
 objects:[{id:'O1',sessionId:'S1',duration:10},{id:'O2',sessionId:'S3',duration:5}],
 attendance:[{sessionId:'S1',participantId:'P1',status:'Present',at:'1'},{sessionId:'S1',participantId:'P1',status:'Late',at:'2'},{sessionId:'S3',participantId:'P2',status:'Absent',at:'1'},{sessionId:'S3',participantId:'P2',status:'Bogus',at:'2'}]};
var now=new Date(2026,10,23),r=A.range('7d',null,now);
assert.deepStrictEqual([r.from,r.to,r.days,r.prev.from,r.prev.to],['2026-11-17','2026-11-23',7,'2026-11-10','2026-11-16']);
var s=A.sessionsIn(d,r),g=A.agg(d,s);
assert.strictEqual(g.sessions,3);assert.strictEqual(g.completionRate,66.7);       // 2 completed / (2 + 1 cancelled)
assert.strictEqual(g.events,2);                                                    // duplicate id and zero-duration event ignored
assert.strictEqual(g.activeSec,90);assert.strictEqual(g.avgIntensity,3);
assert.strictEqual(g.attRecords,2);assert.strictEqual(g.attRate,50);               // latest record wins, invalid status ignored
assert.strictEqual(g.objects,2);
assert.strictEqual(A.agg(d,[]).attRate,null);assert.strictEqual(A.agg(d,[]).avgIntensity,null);   // no division by zero, no invented values
assert.strictEqual(A.change(10,0),null);assert.strictEqual(A.change(15,10),50);
assert.strictEqual(A.sessionsIn(d,r,{activityId:'A1'}).length,2);assert.strictEqual(A.sessionsIn(d,r,{status:'Cancelled'}).length,1);
assert.strictEqual(Object.keys(A.groupBy(d,s,'participant')).length,2);
assert.strictEqual(A.series(d,s,r,function(a){return a.sessions}).values.filter(function(v){return v}).length,3);
assert.strictEqual(A.trend(d,s).state,'insufficient');
assert.strictEqual(A.quality(d).completedNoMovement,0);assert.strictEqual(A.quality(d).invalid,1);
assert.strictEqual(A.csv(['a','b'],[['x,y','z']]),'a,b\r\n"x,y",z');
console.log('analytics tests passed');
