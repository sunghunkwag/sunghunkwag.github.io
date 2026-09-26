/* A living search landscape: a 14x14 field of translucent glass bars, explored by a
   search probe that leaves a fading trail, swept by an evaluation beam, and lifted
   locally by the viewer's pointer. Conceptual illustration only — no measured data.
   Procedural geometry; no library or network dependency. */
(() => {
  'use strict';
  const GRID = 14, STEP = .29, HALF = .105, TRAIL = 6, PARTICLES = 180;
  const vertex = [
    'attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV;',
    'uniform mat3 uRotation; uniform float uTime; uniform float uScale; uniform float uMaterial; uniform float uPoint;',
    'uniform vec3 uTrail[' + TRAIL + ']; uniform vec3 uPointer; uniform float uScan;',
    'varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUV; varying float vEdge; varying float vGlow; varying float vScan; varying float vLife;',
    'float field(vec2 c){',
    'float wave=.5+.5*sin(c.x*1.6+c.y*1.1-uTime*.6);',
    'float ripple=.5+.5*cos(c.y*1.9-c.x*.8+uTime*.42);',
    'return .16+.95*wave*wave+.42*ripple;',
    '}',
    'float probe(vec2 c){',
    'float g=0.;',
    'for(int i=0;i<' + TRAIL + ';i++){vec2 d=c-uTrail[i].xy;g+=uTrail[i].z*exp(-dot(d,d)/.32);}',
    'return g;',
    '}',
    'float attention(vec2 c){vec2 d=c-uPointer.xy;return uPointer.z*exp(-dot(d,d)/.22);}',
    'vec3 project(vec3 local){',
    'vec3 p=uRotation*local*uScale;vPosition=p;',
    'vec3 view=p-vec3(0.,0.,8.5);float near=.1;float far=40.;float f=2.41421356;',
    'gl_Position=vec4(view.xy*f,((far+near)/(near-far))*view.z+(2.*far*near/(near-far)),-view.z);',
    'return p;',
    '}',
    'void main(){',
    'vec3 local=aPosition;vec3 normal=aNormal;vGlow=0.;vScan=0.;vLife=1.;vUV=aUV;',
    'if(uPoint>.5){',
    'float life=fract(uTime*aNormal.y+aNormal.x);',
    'vec2 origin=uTrail[0].xy+aPosition.xz*.55;',
    'float lift=field(origin)*(1.+.9*probe(origin));',
    'local=vec3(origin.x+sin(uTime*1.3+aNormal.z*6.)*.05*life,lift-1.1+life*1.35,origin.y);',
    'vLife=life;project(local);vNormal=vec3(0.,1.,0.);vEdge=0.;',
    'gl_PointSize=(1.4+2.6*(1.-life))*uScale*2.;',
    'return;',
    '}',
    'if(uMaterial<.5||uMaterial>1.5){',
    'float g=probe(aUV);float a=attention(aUV);',
    'float height=field(aUV)*(1.+.9*g)+.85*a;',
    'local.y=aPosition.y*height-1.22;normal=normalize(vec3(aNormal.x,aNormal.y/height,aNormal.z));',
    'vGlow=clamp(g*.8+a*.9,0.,1.6);',
    'vScan=exp(-pow(aUV.x-uScan,2.)/.018);',
    '}',
    'project(local);',
    'vNormal=normalize(uRotation*normal);vEdge=smoothstep(1.02,1.55,abs(aNormal.x)+abs(aNormal.y)+abs(aNormal.z));',
    '}'
  ].join('\n');
  const fragment = [
    'precision highp float;',
    'varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUV; varying float vEdge; varying float vGlow; varying float vScan; varying float vLife;',
    'uniform float uTime; uniform float uMaterial; uniform float uPoint;',
    'const float PI=3.14159265;',
    'const vec3 WARM=vec3(1.,.86,.62);',
    'vec3 film(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
    'vec3 fresnel(float h,vec3 f){return f+(1.-f)*pow(1.-h,5.);}',
    'vec3 light(vec3 n,vec3 v,vec3 l,vec3 color,vec3 base,float metal,float rough){',
    'vec3 h=normalize(v+l); float nl=max(dot(n,l),0.); float nv=max(dot(n,v),.001);',
    'float nh=max(dot(n,h),0.); float vh=max(dot(v,h),0.); float a=rough*rough; float a2=a*a;',
    'float d=a2/(PI*pow(nh*nh*(a2-1.)+1.,2.));',
    'float k=pow(rough+1.,2.)/8.; float g=(nl/(nl*(1.-k)+k))*(nv/(nv*(1.-k)+k));',
    'vec3 f=fresnel(vh,mix(vec3(.045),base,metal));',
    'return ((1.-f)*(1.-metal)*base/PI+d*g*f/max(4.*nl*nv,.001))*color*nl;',
    '}',
    'vec3 studio(vec3 r){',
    'float sky=mix(.035,.3,smoothstep(-.5,.9,r.y));',
    'float softbox=exp(-pow((r.x+.42)/.25,2.)-pow((r.y-.65)/.65,2.));',
    'float strip=exp(-pow((r.x-.6)/.1,2.)-pow((r.y+.1)/.8,2.));',
    'return vec3(sky+softbox*1.8+strip*.8);',
    '}',
    'void main(){',
    'if(uPoint>.5){',
    'vec2 c=gl_PointCoord-.5;float r=dot(c,c);if(r>.25)discard;',
    'float a=(1.-smoothstep(.0,.25,r))*(1.-vLife)*smoothstep(0.,.12,vLife)*.9;',
    'gl_FragColor=vec4(WARM*1.2,a);return;',
    '}',
    'if(uMaterial>1.5){float e=.075+vGlow*.5+vScan*.28;gl_FragColor=vec4(mix(vec3(.9),WARM,clamp(vGlow*1.2,0.,1.)),e);return;}',
    'vec3 n=normalize(vNormal); vec3 v=normalize(vec3(0.,0.,8.5)-vPosition);',
    'vec3 base=vec3(.5);float metal=.55;float rough=.3;',
    'if(uMaterial>.5){base=vec3(.045);rough=.52;metal=.25;}',
    'vec3 color=light(n,v,normalize(vec3(-3.,5.,5.)-vPosition),vec3(4.2),base,metal,rough);',
    'color+=light(n,v,normalize(vec3(4.,1.,1.)-vPosition),vec3(2.),base,metal,rough);',
    'color+=light(n,v,normalize(vec3(-2.,-3.,-2.)-vPosition),vec3(1.6),base,metal,rough);',
    'float nv=max(dot(n,v),0.);vec3 f=fresnel(nv,mix(vec3(.04),base,metal));',
    'color+=studio(reflect(-v,n))*f*.8+base*.13;',
    'if(uMaterial>.5){',
    'vec2 cell=abs(mod(vUV+vec2(2.03),.29)-.145);',
    'float contact=1.-smoothstep(.09,.145,max(cell.x,cell.y));',
    'color*=1.-contact*.5;',
    'float grid=1.-smoothstep(.002,.009,min(.145-cell.x,.145-cell.y));',
    'color+=vec3(grid*.006);',
    '}',
    'if(uMaterial<.5){',
    'float rim=pow(1.-nv,3.);',
    'float glow=.05+rim*.2+vEdge*.18;',
    'vec3 glass=vec3(glow)+studio(reflect(-v,n))*.15;',
    'glass+=WARM*(vGlow*(.45+rim*.7))+vec3(vScan*(.1+vEdge*.26));',
    'float alpha=.006+rim*.022+vEdge*.018+vGlow*.06+vScan*.016;',
    'gl_FragColor=vec4(glass,alpha);',
    '}else{gl_FragColor=vec4(pow(film(color),vec3(1./2.2))*.35,1.);}',
    '}'
  ].join('\n');
  const centers = () => {
    const out = [];
    for (let row = 0; row < GRID; row++) for (let col = 0; col < GRID; col++) out.push([(col - (GRID - 1) / 2) * STEP, (row - (GRID - 1) / 2) * STEP]);
    return out;
  };
  // Shared static beveled geometry; only bar heights change in the vertex shader.
  function mesh(platform=false) {
    const vertices=[],indices=[];
    function box(center,half,radius,seed){
      const cuts=[-1,-.8,.8,1];
      for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
        const base=vertices.length/8,u=(axis+1)%3,v=(axis+2)%3;
        for(let i=0;i<4;i++)for(let j=0;j<4;j++){
          const point=[0,0,0];point[axis]=sign*half[axis];point[u]=cuts[i]*half[u];point[v]=cuts[j]*half[v];
          const inner=point.map((x,k)=>Math.max(-half[k]+radius,Math.min(half[k]-radius,x)));
          const delta=point.map((x,k)=>x-inner[k]),len=Math.hypot(...delta)||1,normal=delta.map(x=>x/len);
          const pos=inner.map((x,k)=>center[k]+x+normal[k]*radius);
          vertices.push(...pos,...normal,...(platform?[pos[0],pos[2]]:seed));
          if(i<3&&j<3){const n=base+i*4+j;indices.push(n,n+4,n+1,n+4,n+5,n+1);}
        }
      }
    }
    if(platform)box([0,-1.32,0],[2.1,.1,2.1],.045,[0,0]);
    else for(const [x,z] of centers())box([x,.5,z],[HALF,.5,HALF],.016,[x,z]);
    return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
  }
  function edgeMesh(){
    const vertices=[],indices=[],e=HALF-.008;
    for(const [x,z] of centers()){
      const base=vertices.length/8;
      for(const y of [0,1])for(const dx of [-e,e])for(const dz of [-e,e])vertices.push(x+dx,y,z+dz,0,0,1,x,z);
      for(const [a,b] of [[0,1],[0,2],[1,3],[2,3],[4,5],[4,6],[5,7],[6,7],[0,4],[1,5],[2,6],[3,7]])indices.push(base+a,base+b);
    }
    return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
  }
  // Deterministic particle seeds: offset around the probe (x,z), phase, rate, sway.
  function particleMesh(){
    const vertices=[];let s=0x9e3779b9;
    const rand=()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};
    for(let i=0;i<PARTICLES;i++){
      const angle=rand()*Math.PI*2,radius=Math.sqrt(rand());
      vertices.push(Math.cos(angle)*radius,0,Math.sin(angle)*radius,rand(),.18+rand()*.32,rand(),0,0);
    }
    return {vertices:new Float32Array(vertices),count:PARTICLES};
  }
  function rotation(x,y,z){
    const sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y),sz=Math.sin(z),cz=Math.cos(z);
    return new Float32Array([cy*cz,cy*sz,-sy,sx*sy*cz-cx*sz,sx*sy*sz+cx*cz,sx*cy,cx*sy*cz+sx*sz,cx*sy*sz-sx*cz,cx*cy]);
  }
  // The probe wanders a Lissajous path; its recent positions form a fading trail.
  function probeAt(t){return [1.55*Math.sin(t*.23),1.55*Math.sin(t*.31+1.2)];}
  function trail(time){
    const out=new Float32Array(TRAIL*3);
    for(let i=0;i<TRAIL;i++){const [x,z]=probeAt(time-i*.7);out.set([x,z,Math.pow(.66,i)],i*3);}
    return out;
  }
  window.createResearchSculpture = canvas => {
    let gl;
    try { gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'low-power'}); } catch { return null; }
    if(!gl)return null;
    let program, objects=[], attributes=[], lost=false;
    function init(){
      const compile=(kind,source)=>{
        const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(error);}
        return shader;
      };
      const v=compile(gl.VERTEX_SHADER,vertex),f=compile(gl.FRAGMENT_SHADER,fragment);
      program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      attributes=[['aPosition',3,0],['aNormal',3,12],['aUV',2,24]].map(([name,size,offset])=>({location:gl.getAttribLocation(program,name),size,offset}));
      objects=['platform','glass','edges','particles'].map(kind=>{
        const data=kind==='edges'?edgeMesh():kind==='particles'?particleMesh():mesh(kind==='platform'),buffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data.vertices,gl.STATIC_DRAW);
        let index=null;
        if(data.indices){index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data.indices,gl.STATIC_DRAW);}
        return {buffer,index,count:data.indices?data.indices.length:data.count,kind};
      });
      gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
      canvas.dataset.renderer='webgl';
    }
    try{init();}catch(error){console.warn('Sculpture renderer unavailable; retaining illustration.',error);return null;}
    const names=['uRotation','uTime','uScale','uMaterial','uPoint','uTrail','uPointer','uScan'];
    const uniforms=()=>Object.fromEntries(names.map(k=>[k,gl.getUniformLocation(program,k)]));
    let u=uniforms();
    const draw=(time,pointer)=>{
      if(lost)return;
      const active=Math.max(0,Math.min(1,pointer.active??0));
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
      gl.uniform1f(u.uTime,time);gl.uniform1f(u.uScale,.98);
      gl.uniformMatrix3fv(u.uRotation,false,rotation(.58+pointer.y*.08,-.62+Math.sin(time*.1)*.1+pointer.x*.12,0));
      gl.uniform3fv(u.uTrail,trail(time));
      gl.uniform3fv(u.uPointer,new Float32Array([pointer.x*1.9,pointer.y*1.9,active]));
      gl.uniform1f(u.uScan,(time*.5)%5.6-2.8);
      for(const object of objects){
        const points=object.kind==='particles';
        if(object.kind==='platform'){gl.disable(gl.BLEND);gl.depthMask(true);}
        else{gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}
        gl.bindBuffer(gl.ARRAY_BUFFER,object.buffer);
        if(object.index)gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,object.index);
        for(const {location,size,offset} of attributes){
          gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,32,offset);
        }
        gl.uniform1f(u.uPoint,points?1:0);
        gl.uniform1f(u.uMaterial,object.kind==='edges'?2:object.kind==='platform'?1:0);
        if(points)gl.drawArrays(gl.POINTS,0,object.count);
        else gl.drawElements(object.kind==='edges'?gl.LINES:gl.TRIANGLES,object.count,gl.UNSIGNED_SHORT,0);
      }
      gl.depthMask(true);gl.disable(gl.BLEND);
    };
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;canvas.closest('.hero-figure')?.classList.remove('has-manifold');});
    canvas.addEventListener('webglcontextrestored',()=>{try{init();u=uniforms();lost=false;draw(0,{x:0,y:0});canvas.closest('.hero-figure')?.classList.add('has-manifold');}catch{lost=true;}});
    return {draw, resize(size){canvas.width=canvas.height=size;},kind:'webgl'};
  };
})();
