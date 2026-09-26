import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/sculpture.js',import.meta.url),'utf8');
function driver() {
 const uploads=[],draws=[],events={},states=[],vectors=[]; let id=0;
 const gl={
 ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,VERTEX_SHADER:4,FRAGMENT_SHADER:5,COMPILE_STATUS:6,LINK_STATUS:7,DEPTH_TEST:8,CULL_FACE:9,COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,FLOAT:10,TRIANGLES:11,UNSIGNED_SHORT:12,BLEND:13,SRC_ALPHA:14,ONE:15,ONE_MINUS_SRC_ALPHA:17,LINES:18,POINTS:19,
 createShader:()=>++id,shaderSource(){},compileShader(){},getShaderParameter:()=>true,deleteShader(){},
 createProgram:()=>++id,attachShader(){},linkProgram(){},getProgramParameter:()=>true,useProgram(){},
 createBuffer:()=>++id,bindBuffer(){},bufferData(type,data){uploads.push({type,data});},
 enable(flag){states.push(["enable",flag]);},disable(flag){states.push(["disable",flag]);},blendFuncSeparate(a,b){states.push(["blend",a,b]);},depthMask(value){states.push(["depthMask",value]);},clearColor(){},getUniformLocation:(_,name)=>name,getAttribLocation:()=>0,
 viewport(){},clear(){},uniform1f(_,value){assert.ok(Number.isFinite(value));},uniform3fv(name,data){assert.ok([...data].every(Number.isFinite));vectors.push([name,[...data]]);},uniformMatrix3fv(_,__,data){assert.ok([...data].every(Number.isFinite));},
 enableVertexAttribArray(){},vertexAttribPointer(){},drawElements(mode,count){draws.push([mode,count]);},drawArrays(mode,first,count){draws.push([mode,count]);}
 };
 const canvas={width:500,height:500,dataset:{},getContext:()=>gl,addEventListener:(name,fn)=>events[name]=fn,closest:()=>({classList:{add(){},remove(){}}})};
 const window={};vm.runInNewContext(source,{window,console});
 const renderer=window.createResearchSculpture(canvas);
 return {renderer,uploads,draws,events,canvas,states,vectors};
}
test('GPU meshes have finite unit normals, valid indices and a particle cloud',()=>{
 const d=driver();assert.equal(d.canvas.dataset.renderer,'webgl');assert.equal(d.uploads.length,7);
 for(let m=0;m<3;m++){
   const vertices=d.uploads[m*2].data,indices=d.uploads[m*2+1].data;
   assert.ok([...vertices].every(Number.isFinite));
   assert.equal(vertices.length%8,0);
   assert.ok(indices.length%2===0);
   assert.ok([...indices].every(i=>i<vertices.length/8),'index within the 16-bit vertex range');
   for(let i=0;i<vertices.length;i+=8)assert.ok(Math.abs(Math.hypot(vertices[i+3],vertices[i+4],vertices[i+5])-1)<.00001);
 }
 const bars=d.uploads[2].data;assert.equal(bars.length/8,14*14*96,'a 14 x 14 field of beveled bars');
 const particles=d.uploads[6].data;assert.equal(particles.length%8,0);assert.ok([...particles].every(Number.isFinite));
 d.renderer.draw(0,{x:0,y:0});d.renderer.draw(45,{x:-1,y:1,active:1});
 assert.equal(d.draws.length,8);assert.equal(d.uploads.length,7,'Draws must reuse uploaded geometry');
 assert.deepEqual(d.draws.slice(0,4).map(x=>x[0]),[11,11,18,19]);
});
test('The probe trail fades and the pointer strength is clamped',()=>{
 const d=driver();d.renderer.draw(12,{x:.4,y:-.2,active:3});
 const trail=d.vectors.find(v=>v[0]==='uTrail')[1],pointer=d.vectors.find(v=>v[0]==='uPointer')[1];
 const weights=[2,5,8,11,14,17].map(i=>trail[i]);
 assert.equal(weights[0],1);assert.ok(weights.every((w,i)=>i===0||w<weights[i-1]));
 assert.equal(pointer[2],1);
});
test('A lost graphics context stops drawing and restoration rebuilds resources',()=>{
 const d=driver();let prevented=false;
 d.events.webglcontextlost({preventDefault(){prevented=true;}});
 d.renderer.draw(5,{x:0,y:0});assert.equal(d.draws.length,0);assert.equal(prevented,true);
 d.events.webglcontextrestored();assert.equal(d.uploads.length,14);assert.equal(d.draws.length,4);
});
test('Unsupported WebGL preserves the fallback contract',()=>{
 const window={};vm.runInNewContext(source,{window,console});
 assert.equal(window.createResearchSculpture({getContext:()=>null}),null);
});
test('Glass uses transparent depth state and restores writes after drawing',()=>{
 const d=driver();d.renderer.draw(2,{x:0,y:0});
 assert.ok(d.states.some(s=>s[0]==='blend'&&s[1]===14&&s[2]===15));
 assert.ok(d.states.some(s=>s[0]==='depthMask'&&s[1]===false));
 assert.deepEqual(d.states.filter(s=>s[0]==='depthMask').at(-1),['depthMask',true]);
});
