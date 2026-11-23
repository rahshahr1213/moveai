/* MoveAI core: pure logic, no DOM. Data models (v1), metrics, mock/real API adapters. Works in browser and Node. */
(function(root){
"use strict";
var VERSION=1;
var KP=['nose','left_eye','right_eye','left_ear','right_ear','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'];
var BONES=[[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16]];
var TPL=[[.5,.08],[.47,.06],[.53,.06],[.44,.08],[.56,.08],[.4,.22],[.6,.22],[.33,.38],[.67,.38],[.3,.54],[.7,.54],[.44,.55],[.56,.55],[.43,.76],[.57,.76],[.42,.95],[.58,.95]];
var EVENT_TYPES=['Session started','Person detected','Tracking started','Movement detected','Object detected','Interaction started','Interaction ended','Tracking ended','Session completed'];
var INTERACTION_TYPES=['Approach','Touch (candidate)','Pick up (candidate)','Move','Release','Sustained interaction'];
function rng(s){return function(){s=(s*1664525+1013904223)%4294967296;return s/4294967296}}
function r2(n){return Math.round(n*100)/100}
function angle(a,b,c){var u=[a.x-b.x,a.y-b.y],v=[c.x-b.x,c.y-b.y],m=Math.hypot(u[0],u[1])*Math.hypot(v[0],v[1]);if(!m)return null;return r2(Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/m)))*180/Math.PI)}
function countReps(series,hi,lo){var n=0,up=false;series.forEach(function(v){if(!up&&v>hi){up=true;n++}else if(up&&v<lo)up=false});return n}
function metric(name,value,unit,kind,ctx,q,note){return{name:name,value:value,unit:unit,kind:kind,timestamp:ctx.timestamp||new Date().toISOString(),cameraId:ctx.cameraId||null,sessionId:ctx.sessionId||null,trackingId:ctx.trackingId||null,quality:q==null?null:r2(q),note:note||''}}
/* pos: [{t:ms,x:0..1,y:0..1,conf}] normalised image coordinates. kind: 'measured' | 'estimated' | 'demo'. */
function movement(pos,ctx,opt){
  opt=opt||{};ctx=ctx||{};var kind=opt.kind||'estimated',thr=opt.activeSpeed||0.02;
  if(!pos||pos.length<2)return[];
  var mpu=ctx.calibration&&ctx.calibration.metersPerUnit,dist=0,act=0,rest=0,sp=[],conf=0;
  for(var i=1;i<pos.length;i++){var dt=(pos[i].t-pos[i-1].t)/1000;if(dt<=0)continue;var d=Math.hypot(pos[i].x-pos[i-1].x,pos[i].y-pos[i-1].y),s=d/dt;dist+=d;sp.push(s);if(s>=thr)act+=dt;else rest+=dt}
  pos.forEach(function(p){conf+=(p.conf==null?1:p.conf)});conf/=pos.length;
  var tot=act+rest;if(!tot)return[];
  var unit=mpu?'m':'frame-widths',note=mpu?'Scaled with stored calibration (approximate; ground-plane only).':'No calibration: distance and speed are in image units (fractions of frame width), NOT real-world metres. A single uncalibrated camera cannot give true distance.';
  var k=mpu?kind:(kind==='measured'?'estimated':kind),dv=dist*(mpu||1);
  return[metric('Movement duration',r2(tot),'s',kind,ctx,conf),metric('Active time',r2(act),'s',kind,ctx,conf),metric('Rest time',r2(rest),'s',kind,ctx,conf),
    metric('Distance travelled',r2(dv),unit,k,ctx,conf*.7,note),metric('Average speed',r2(dv/tot),unit+'/s',k,ctx,conf*.7,note),
    metric('Movement intensity',r2(act/tot),'ratio 0-1',kind,ctx,conf,'Share of time above the activity threshold ('+thr+' frame-widths/s).'),
    metric('Movement frequency',r2(countReps(sp,thr*2,thr)/(tot/60)),'bursts/min',kind,ctx,conf)];
}
function bodyRange(frames,minConf){minConf=minConf||.3;var x0=1,x1=0,y0=1,y1=0,n=0;
  (frames||[]).forEach(function(f){f.forEach(function(k){if(k.confidence>=minConf){n++;x0=Math.min(x0,k.x);x1=Math.max(x1,k.x);y0=Math.min(y0,k.y);y1=Math.max(y1,k.y)}})});
  return n?{width:r2(x1-x0),height:r2(y1-y0),unit:'fraction of person box'}:null}
/* ---- seed data (all simulated) ---- */
function seed(ctx){
  ctx=ctx||{};var R=rng(11),now=Date.now(),iso=function(ms){return new Date(ms).toISOString()},pk=function(a){return a[Math.floor(R()*a.length)]};
  var zones=[['Zone A','Open play area, north side'],['Zone B','Open play area, south side'],['Interactive Floor','Projected floor games'],['Climbing Area','Climbing and balance structures'],['Object Interaction Area','Blocks, balls and targets']].map(function(z,i){return{id:'ZN-'+(i+1),name:z[0],description:z[1],activityIds:(ctx.activities||[]).slice(i*2,i*2+2)}});
  var cd=[['North Wide','ZN-1','Online','Good','1920x1080',30,'Partial'],['South Wide','ZN-2','Online','Good','1920x1080',30,'Not calibrated'],['Floor Overhead','ZN-3','Connecting','Degraded','1280x720',15,'Not calibrated'],['Climbing Side','ZN-4','Offline','Unknown','1280x720',25,'Not calibrated']];
  var cameras=cd.map(function(c,i){return{id:'CAM-0'+(i+1),name:c[0],sourceType:'Simulated Camera',simulated:true,enabled:true,status:c[2],health:c[3],zoneId:c[1],location:'Cube, '+c[1].replace('ZN-','zone ')+' (demo)',resolution:c[4],fps:c[5],quality:'High',streamRef:'',calibration:{status:c[6],note:'Demo value. No real calibration data stored.'},lastSeen:c[2]==='Offline'?iso(now-36e5*5):iso(now-i*4000)}});
  var tracks=[],dets=[],poses=[];
  for(var i=0;i<6;i++){var cam=cameras[i%3],t0=now-(i+1)*9e5,x=.3+R()*.4,y=.3+R()*.4,pos=[],ids=[];
    for(var j=0;j<40;j++){x=Math.max(.05,Math.min(.95,x+(R()-.5)*(j%12<5?.012:.06)));y=Math.max(.05,Math.min(.95,y+(R()-.5)*(j%12<5?.012:.06)));pos.push({t:t0+j*1000,x:r2(x),y:r2(y),conf:r2(.7+R()*.28)})}
    for(j=0;j<5;j++){var p=pos[j*8],d={id:'DET-'+(i*5+j+1),cameraId:cam.id,timestamp:iso(p.t),bbox:{x:r2(p.x-.06),y:r2(p.y-.14),w:.12,h:.28},confidence:r2(.6+R()*.37),trackingId:'TRK-00'+(i+1),status:'Simulated'};dets.push(d);ids.push(d.id)}
    tracks.push({id:'TRK-00'+(i+1),cameraId:cam.id,sessionId:(ctx.sessions||[])[i]||null,firstSeen:iso(pos[0].t),lastSeen:iso(pos[39].t),status:i===5?'Occluded':(i<3?'Active':'Ended'),confidence:r2(.72+R()*.2),positions:pos,detectionIds:ids,note:'Temporary tracking ID. Not a verified participant identity.'});
    if(i<3)poses.push({id:'POSE-'+(i+1),trackingId:'TRK-00'+(i+1),cameraId:cam.id,timestamp:iso(pos[20].t),status:'Simulated',keypoints:KP.map(function(n,k){return{name:n,x:r2(TPL[k][0]+(R()-.5)*.06),y:r2(TPL[k][1]+(R()-.5)*.04),confidence:r2(.55+R()*.4),timestamp:iso(pos[20].t)}})});
  }
  var objects=[['Interactive block','Stackable light-up blocks','Block'],['Ball','Soft balls of several sizes','Ball'],['Toy','Free-play toys','Toy'],['Soft play object','Foam shapes and mats','Soft play'],['Target','Wall and floor targets','Target'],['Other','Configurable extra category','Other']].map(function(o,i){return{id:'OBJ-'+(i+1),name:o[0],description:o[1],type:o[2],enabled:i!==5}});
  var odets=[];for(i=0;i<10;i++){var tr=tracks[i%6],o=objects[i%5];odets.push({id:'ODT-'+(i+1),objectId:o.id,category:o.name,cameraId:tr.cameraId,timestamp:iso(Date.parse(tr.firstSeen)+(i+3)*7000),bbox:{x:r2(.2+R()*.6),y:r2(.5+R()*.4),w:.08,h:.08},confidence:r2(.55+R()*.4),trackingId:'OTR-'+(i+1),positions:[{t:i,x:r2(.2+R()*.6),y:r2(.5+R()*.4)}],status:'Simulated'})}
  var inter=[];for(i=0;i<8;i++){var tk=tracks[i%6],st=Date.parse(tk.firstSeen)+(i+2)*6000,du=3+Math.floor(R()*20);inter.push({id:'INT-'+(i+1),trackingId:tk.id,objectId:objects[i%5].id,cameraId:tk.cameraId,sessionId:tk.sessionId,type:INTERACTION_TYPES[i%6],start:iso(st),end:iso(st+du*1000),duration:du,confidence:r2(.45+R()*.35),source:'demo-simulation',validated:false,note:'Candidate from simulated bounding-box proximity. Physical contact is not confirmed.'})}
  var ev=[];function E(ms,type,tk,extra){ev.push({id:'EV-'+(ev.length+1),timestamp:iso(ms),type:type,cameraId:tk.cameraId,zoneId:(cameras.filter(function(c){return c.id===tk.cameraId})[0]||{}).zoneId,sessionId:tk.sessionId,trackingId:tk.id,label:extra||type,simulated:true})}
  tracks.forEach(function(tk,i){var s=Date.parse(tk.firstSeen);E(s-5000,'Session started',tk);E(s,'Person detected',tk);E(s+500,'Tracking started',tk);E(s+12000,'Movement detected',tk,'Movement burst (demo)');E(s+30000,'Tracking ended',tk);E(s+35000,'Session completed',tk)});
  odets.forEach(function(od,i){var tk=tracks[i%6];E(Date.parse(od.timestamp),'Object detected',tk,od.category+' detected (demo)')});
  inter.forEach(function(it){var tk=tracks.filter(function(x){return x.id===it.trackingId})[0];E(Date.parse(it.start),'Interaction started',tk,it.type);E(Date.parse(it.end),'Interaction ended',tk,it.type)});
  ev.sort(function(a,b){return a.timestamp<b.timestamp?1:-1});
  var jobs=['Frame extraction','Human detection','Person tracking','Pose estimation','Object detection','Interaction detection'].map(function(n,i){return{id:'JOB-'+(i+1),name:n,status:'Demo Mode',startedAt:iso(now-i*6e4),updatedAt:iso(now-i*1e4)}});
  return{v:VERSION,demo:true,apiBase:'',retentionDays:30,cameras:cameras,zones:zones,objects:objects,detections:dets,tracks:tracks,poses:poses,objectDetections:odets,interactions:inter,events:ev,jobs:jobs}
}
/* ---- API layer: contracts, mock adapter, real (HTTP) adapter ---- */
var ROUTES={'health':['GET','/v1/health'],'camera.list':['GET','/v1/cameras'],'camera.get':['GET','/v1/cameras/{id}'],'detection.list':['GET','/v1/detections'],'tracking.list':['GET','/v1/tracks'],'pose.latest':['GET','/v1/poses/latest'],'movement.metrics':['GET','/v1/sessions/{sessionId}/metrics'],'object.list':['GET','/v1/objects'],'interaction.list':['GET','/v1/interactions'],'session.process':['POST','/v1/sessions/{sessionId}/process']};
var MOCK={'health':function(){return{status:'demo',mode:'mock'}},'camera.list':function(d){return d.cameras},'camera.get':function(d,p){return d.cameras.filter(function(c){return c.id===p.id})[0]||null},'detection.list':function(d,p){return d.detections.filter(function(x){return!p.cameraId||x.cameraId===p.cameraId})},'tracking.list':function(d){return d.tracks},'pose.latest':function(d){return d.poses},'movement.metrics':function(d,p){return d.tracks.filter(function(t){return t.sessionId===p.sessionId}).reduce(function(a,t){return a.concat(movement(t.positions,{cameraId:t.cameraId,sessionId:t.sessionId,trackingId:t.id},{kind:'demo'}))},[])},'object.list':function(d){return d.objects},'interaction.list':function(d){return d.interactions},'session.process':function(d,p){return{jobId:'JOB-DEMO',status:'demo',sessionId:p.sessionId}}};
/* createApi({getDb, baseUrl, live}). Mock and real implementations are kept separate. Real calls happen only when live=true AND baseUrl is set. */
function createApi(o){
  function mock(op,p){return new Promise(function(res,rej){setTimeout(function(){var h=MOCK[op];if(!h)return rej({state:'error',message:'Unknown operation '+op});res({state:'demo',source:'mock',data:h(o.getDb(),p||{})})},150)})}
  function real(op,p){var r=ROUTES[op];if(!r)return Promise.reject({state:'error',message:'Unknown operation '+op});
    if(!o.baseUrl)return Promise.reject({state:'disconnected',message:'No API base URL configured.'});
    var path=r[1].replace(/\{(\w+)\}/g,function(m,k){return encodeURIComponent((p||{})[k])});
    var ctl=typeof AbortController!=='undefined'?new AbortController():null,tm=setTimeout(function(){ctl&&ctl.abort()},6000);
    return fetch(o.baseUrl.replace(/\/$/,'')+path,{method:r[0],credentials:'omit',headers:{'Accept':'application/json'},signal:ctl&&ctl.signal}).then(function(x){clearTimeout(tm);if(!x.ok)throw{state:'error',message:'HTTP '+x.status};return x.json()}).then(function(j){return{state:'live',source:'api',data:j}}).catch(function(e){clearTimeout(tm);throw e&&e.state?e:{state:'disconnected',message:'Could not reach the AI service.'}})}
  return{mode:o.live?'live':'demo',call:function(op,p){return o.live?real(op,p):mock(op,p)}}
}
var api={VERSION:VERSION,KP:KP,BONES:BONES,TPL:TPL,EVENT_TYPES:EVENT_TYPES,INTERACTION_TYPES:INTERACTION_TYPES,ROUTES:ROUTES,rng:rng,angle:angle,countReps:countReps,metric:metric,movement:movement,bodyRange:bodyRange,seed:seed,createApi:createApi};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MoveAI=api;
})(typeof window!=='undefined'?window:this);
