/* Monochrome neural architecture and evaluation feedback. Procedural geometry; no library or network dependency. */
(() => {
  'use strict';
  const vertex = [
    'attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV;',
    'uniform mat3 uRotation; uniform float uTime; uniform float uScale;',
    'varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUV;',
    'void main(){',
    'vec3 p=uRotation*aPosition*uScale;',
    'p.y+=.28+sin(uTime*.28)*.035;',
    'vPosition=p; vNormal=normalize(uRotation*aNormal); vUV=aUV;',
    'vec3 view=p-vec3(0.,0.,8.5);',
    'float near=.1; float far=40.; float f=2.41421356;',
    'gl_Position=vec4(view.xy*f,((far+near)/(near-far))*view.z+(2.*far*near/(near-far)),-view.z);',
    '}'
  ].join('\n');
  const fragment = [
    'precision highp float;',
    'varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUV;',
    'uniform float uTime; uniform float uMaterial;',
    'const float PI=3.14159265;',
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
    'vec3 n=normalize(vNormal); vec3 v=normalize(vec3(0.,0.,8.5)-vPosition);',
    'vec3 base=vec3(.38);float metal=.72;float rough=.32;',
    'if(uMaterial>.5){base=vec3(.13);rough=.4;metal=.45;}',
    'vec3 color=light(n,v,normalize(vec3(-3.,5.,5.)-vPosition),vec3(4.2),base,metal,rough);',
    'color+=light(n,v,normalize(vec3(4.,1.,1.)-vPosition),vec3(2.),base,metal,rough);',
    'color+=light(n,v,normalize(vec3(-2.,-3.,-2.)-vPosition),vec3(1.6),base,metal,rough);',
    'float nv=max(dot(n,v),0.);vec3 f=fresnel(nv,mix(vec3(.04),base,metal));',
    'color+=studio(reflect(-v,n))*f*.8+base*.13;',
    'float signal=exp(-pow((fract(uTime*.12)-vUV.x)/.075,2.));',
    'color+=vec3(signal*(uMaterial>.5?.7:.32));',
    'gl_FragColor=vec4(pow(film(color),vec3(1./2.2)),1.);',
    '}'
  ].join('\n');
  const normalize=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  // A conceptual candidate network, not a measured or deployed model.
  const layers=[3,5,5,2].map((count,layer)=>Array.from({length:count},(_,i)=>({
    p:[[-2.1,-.75,.75,2.1][layer],(i-(count-1)/2)*.58,layer===0?0:(i%2?.38:-.38)],
    phase:layer/3*.82+.06, radius:layer===3?.21:.155
  })));
  const edges=[];
  for(let l=0;l<3;l++)for(let i=0;i<layers[l].length;i++)for(let j=0;j<layers[l+1].length;j++){
    if(l===2||Math.abs(i/(layers[l].length-1)-j/(layers[l+1].length-1))<.51)edges.push([layers[l][i],layers[l+1][j]]);
  }
  function mesh(links=false) {
    const vertices=[],indices=[];
    function surface(rings,sides,point){
      const base=vertices.length/8;
      for(let i=0;i<=rings;i++)for(let j=0;j<=sides;j++){
        vertices.push(...point(i/rings,j/sides));
        if(i<rings&&j<sides){const a=base+i*(sides+1)+j,d=a+sides+1;indices.push(a,d,a+1,d,d+1,a+1);}
      }
    }
    function tube(a,b,radius=.016){
      const tangent=normalize(b.p.map((v,k)=>v-a.p[k]));
      const n=normalize(cross(tangent,Math.abs(tangent[1])>.95?[1,0,0]:[0,1,0]));
      const binormal=normalize(cross(tangent,n));
      surface(16,10,(u,v)=>{
        const angle=v*Math.PI*2,normal=n.map((x,k)=>x*Math.cos(angle)+binormal[k]*Math.sin(angle));
        return [...a.p.map((x,k)=>x+(b.p[k]-x)*u+normal[k]*radius),...normal,a.phase+(b.phase-a.phase)*u,v];
      });
    }
    if(!links){
      for(const node of layers.flat())surface(24,32,(u,v)=>{
        const theta=u*Math.PI,phi=v*Math.PI*2;
        const normal=[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];
        return [...node.p.map((x,k)=>x+normal[k]*node.radius),...normal,node.phase,v];
      });
    }else{
      edges.forEach(([a,b])=>tube(a,b));
      // Evaluation feeds the next search iteration along the lower return path.
      let previous={p:[2.1,-.29,-.38],phase:.9};
      const controls=[[2.1,-.29,-.38],[2.9,-2.35,0],[-2.9,-2.35,0],[-2.1,-.58,0]];
      for(let i=1;i<=64;i++){
        const t=i/64,q=1-t;
        const next={p:[0,1,2].map(k=>q*q*q*controls[0][k]+3*q*q*t*controls[1][k]+3*q*t*t*controls[2][k]+t*t*t*controls[3][k]),phase:.9+t*.1};
        tube(previous,next,.013);previous=next;
      }
      // Arrow tip at the return to candidate generation.
      tube({p:[-2.39,-.9,0],phase:1},previous,.016);
      tube({p:[-1.94,-1.02,0],phase:1},previous,.016);
    }
    return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
  }
  function rotation(x,y,z){
    const sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y),sz=Math.sin(z),cz=Math.cos(z);
    return new Float32Array([cy*cz,cy*sz,-sy,sx*sy*cz-cx*sz,sx*sy*sz+cx*cz,sx*cy,cx*sy*cz+sx*sz,cx*sy*sz-sx*cz,cx*cy]);
  }
  window.createResearchSculpture = canvas => {
    let gl;
    try { gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'}); } catch { return null; }
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
      objects=[false,true].map(halo=>{
        const data=mesh(halo),buffer=gl.createBuffer(),index=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data.vertices,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data.indices,gl.STATIC_DRAW);
        return {buffer,index,count:data.indices.length,halo};
      });
      gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
      canvas.dataset.renderer='webgl';
    }
    try{init();}catch(error){console.warn('Sculpture renderer unavailable; retaining illustration.',error);return null;}
    const uniforms=()=>Object.fromEntries(['uRotation','uTime','uScale','uMaterial'].map(k=>[k,gl.getUniformLocation(program,k)]));
    let u=uniforms();
    const draw=(time,pointer)=>{
      if(lost)return;
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
      gl.uniform1f(u.uTime,time);gl.uniform1f(u.uScale,1.25);
      gl.uniformMatrix3fv(u.uRotation,false,rotation(-.16+pointer.y*.16,-.25+Math.sin(time*.18)*.1+pointer.x*.2,.035));
      for(const object of objects){
        gl.bindBuffer(gl.ARRAY_BUFFER,object.buffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,object.index);
        for(const {location,size,offset} of attributes){
          gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,32,offset);
        }
        gl.uniform1f(u.uMaterial,object.halo?1:0);gl.drawElements(gl.TRIANGLES,object.count,gl.UNSIGNED_SHORT,0);
      }
    };
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;canvas.closest('.hero-figure')?.classList.remove('has-manifold');});
    canvas.addEventListener('webglcontextrestored',()=>{try{init();u=uniforms();lost=false;draw(0,{x:0,y:0});canvas.closest('.hero-figure')?.classList.add('has-manifold');}catch{lost=true;}});
    return {draw, resize(size){canvas.width=canvas.height=size;},kind:'webgl'};
  };
})();
