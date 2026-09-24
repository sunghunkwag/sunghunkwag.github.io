import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/sculpture.js',import.meta.url),'utf8');
function driver() {
 const uploads=[],draws=[],events={},states=[]; let id=0;
 const gl={
 ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,VERTEX_SHADER:4,FRAGMENT_SHADER:5,COMPILE_STATUS:6,LINK_STATUS:7,DEPTH_TEST:8,CULL_FACE:9,COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,FLOAT:10,TRIANGLES:11,UNSIGNED_SHORT:12,BLEND:13,SRC_ALPHA:14,ONE:15,ONE_MINUS_SRC_ALPHA:17,LINES:18,
 createShader:()=>++id,shaderSource(){},compileShader(){},getShaderParameter:()=>true,deleteShader(){},
 createProgram:()=>++id,attachShader(){},linkProgram(){},getProgramParameter:()=>true,useProgram(){},
 createBuffer:()=>++id,bindBuffer(){},bufferData(type,data){uploads.push({type,data});},
 enable(flag){states.push(["enable",flag]);},disable(flag){states.push(["disable",flag]);},blendFuncSeparate(a,b){states.push(["blend",a,b]);},depthMask(value){states.push(["depthMask",value]);},clearColor(){},getUniformLocation:(_,name)=>name,getAttribLocation:()=>0,
 viewport(){},clear(){},uniform1f(){},uniformMatrix3fv(_,__,data){assert.ok([...data].every(Number.isFinite));},
 enableVertexAttribArray(){},vertexAttribPointer(){},drawElements(_,count){draws.push(count);}
 };
 const canvas={width:500,height:500,dataset:{},getContext:()=>gl,addEventListener:(name,fn)=>events[name]=fn,closest:()=>({classList:{add(){},remove(){}}})};
 const window={};vm.runInNewContext(source,{window,console});
 const renderer=window.createResearchSculpture(canvas);
 return {renderer,uploads,draws,events,canvas,states};
}
test('GPU meshes have finite unit normals and valid mesh indices',()=>{
 const d=driver();assert.equal(d.canvas.dataset.renderer,'webgl');assert.equal(d.uploads.length,6);
 for(let m=0;m<3;m++){
   const vertices=d.uploads[m*2].data,indices=d.uploads[m*2+1].data;
   assert.ok([...vertices].every(Number.isFinite));
   assert.equal(vertices.length%8,0);assert.equal(indices.length%3,0);
   assert.ok([...indices].every(i=>i<vertices.length/8));
   for(let i=0;i<vertices.length;i+=8)assert.ok(Math.abs(Math.hypot(vertices[i+3],vertices[i+4],vertices[i+5])-1)<.00001);
 }
 d.renderer.draw(0,{x:0,y:0});d.renderer.draw(45,{x:-1,y:1});
 assert.equal(d.draws.length,6);assert.equal(d.uploads.length,6,'Draws must reuse uploaded geometry');
});
test('A lost graphics context stops drawing and restoration rebuilds resources',()=>{
 const d=driver();let prevented=false;
 d.events.webglcontextlost({preventDefault(){prevented=true;}});
 d.renderer.draw(5,{x:0,y:0});assert.equal(d.draws.length,0);assert.equal(prevented,true);
 d.events.webglcontextrestored();assert.equal(d.uploads.length,12);assert.equal(d.draws.length,3);
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
