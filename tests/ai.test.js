// Run: node tests/ai.test.js
var C=require('../assets/js/ai-core.js'),assert=require('assert');
assert.strictEqual(C.angle({x:0,y:1},{x:0,y:0},{x:1,y:0}),90);
assert.strictEqual(C.countReps([0,1,0,1,0,1],.7,.3),3);
var pos=[{t:0,x:0,y:0},{t:1000,x:.1,y:0},{t:2000,x:.1,y:0}];
var m=C.movement(pos,{cameraId:'C',trackingId:'T'},{kind:'measured'}),by=function(n){return m.filter(function(x){return x.name===n})[0]};
assert.strictEqual(by('Distance travelled').value,.1);assert.strictEqual(by('Distance travelled').unit,'frame-widths');
assert.strictEqual(by('Distance travelled').kind,'estimated');assert.ok(by('Distance travelled').note);
assert.strictEqual(by('Active time').value,1);assert.strictEqual(by('Rest time').value,1);
var mc=C.movement(pos,{calibration:{metersPerUnit:10}},{kind:'measured'});assert.strictEqual(mc[3].unit,'m');assert.strictEqual(mc[3].value,1);
assert.deepStrictEqual(C.movement([{t:0,x:0,y:0}],{}),[]);
var d=C.seed({sessions:['S1'],activities:['A1']});assert.strictEqual(d.cameras.length,4);assert.strictEqual(d.zones.length,5);assert.ok(d.cameras.every(function(c){return c.simulated}));
assert.ok(d.interactions.every(function(i){return i.validated===false}));
C.createApi({getDb:function(){return d},live:true,baseUrl:''}).call('camera.list').then(function(){assert.fail()},function(e){assert.strictEqual(e.state,'disconnected');console.log('ai tests OK')});
