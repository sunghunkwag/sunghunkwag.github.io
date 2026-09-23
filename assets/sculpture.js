/* GPU-lit research sculpture. Procedural geometry; no library or network dependency. */
(() => {
  'use strict';
  const vertex = [
    'attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV;',
    'uniform mat3 uRotation; uniform float uTime; uniform float uScale;',
    'varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUV;',
    'void main(){',
    'vec3 p=uRotation*aPosition*uScale;',
    'p.y+=sin(uTime*.28)*.055;',
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
    'vec3 c=mix(vec3(.025,.055,.047),vec3(.34,.42,.36),smoothstep(-.5,.9,r.y));',
    'float softbox=exp(-pow((r.x+.42)/.22,2.)-pow((r.y-.65)/.65,2.));',
    'float strip=exp(-pow((r.x-.6)/.08,2.)-pow((r.y+.1)/.8,2.));',
    'float rim=pow(max(dot(r,normalize(vec3(-.7,.2,-.5))),0.),18.);',
    'return c+softbox*vec3(1.8,1.7,1.36)+strip*vec3(.6,1.5,1.25)+rim*vec3(1.4,.75,.32);',
    '}',
    'void main(){',
    'vec3 n=normalize(vNormal); vec3 v=normalize(vec3(0.,0.,8.5)-vPosition);',
    'float band=pow(.5+.5*sin(vUV.x*6.2831853*3.+.6),2.);',
    'vec3 base=mix(vec3(.11,.25,.22),vec3(.7,.51,.26),smoothstep(.23,.85,band));',
    'float metal=.78; float rough=.27;',
    'if(uMaterial>.5){base=vec3(.56,.46,.26);rough=.3;metal=.88;}',
    'vec3 color=light(n,v,normalize(vec3(-3.,5.,5.)-vPosition),vec3(4.5,4.1,3.3),base,metal,rough);',
    'color+=light(n,v,normalize(vec3(4.,1.,1.)-vPosition),vec3(1.1,2.8,2.3),base,metal,rough);',
    'color+=light(n,v,normalize(vec3(-2.,-3.,-2.)-vPosition),vec3(2.4,1.3,.55),base,metal,rough);',
    'float nv=max(dot(n,v),0.);vec3 f=fresnel(nv,mix(vec3(.04),base,metal));',
    'color+=studio(reflect(-v,n))*f*.8+base*.17;',
    'float thread=pow(.5+.5*cos(vUV.y*6.2831853*32.),18.);',
    'color*=.93+.07*thread;',
    'float flow=pow(.5+.5*cos(vUV.x*6.2831853*3.-uTime*.38),34.);',
    'float seam=pow(.5+.5*cos(vUV.y*6.2831853*3.),90.);',
    'if(uMaterial<.5)color+=vec3(.44,.8,.61)*flow*seam*.5;',
    'gl_FragColor=vec4(pow(film(color),vec3(1./2.2)),1.);',
    '}'
  ].join('\n');
  const normalize=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function knot(u){const r=1.62+.49*Math.cos(3*u);return [r*Math.cos(2*u),r*Math.sin(2*u),.72*Math.sin(3*u)];}
  function mesh(halo=false) {
    const vertices=[], indices=[], rings=halo?192:320, sides=halo?10:40;
    for(let i=0;i<=rings;i++){
      const u=i/rings*Math.PI*2;
      const c=halo?[2.6*Math.cos(u),2.6*Math.sin(u)*.4,2.6*Math.sin(u)*.9165]:knot(u);
      const before=halo?[2.6*Math.cos(u-.001),2.6*Math.sin(u-.001)*.4,2.6*Math.sin(u-.001)*.9165]:knot(u-.001);
      const after=halo?[2.6*Math.cos(u+.001),2.6*Math.sin(u+.001)*.4,2.6*Math.sin(u+.001)*.9165]:knot(u+.001);
      const t=normalize(after.map((x,k)=>x-before[k]));
      const b=normalize(cross(t,halo?[0,.9165,-.4]:[Math.cos(2*u),Math.sin(2*u),0]));
      const n=normalize(cross(b,t));
      for(let j=0;j<=sides;j++){
        const v=j/sides*Math.PI*2;
        const norm=n.map((x,k)=>x*Math.cos(v)+b[k]*Math.sin(v));
        const radius=halo?.012:.255;
        vertices.push(...c.map((x,k)=>x+radius*norm[k]),...norm,i/rings,j/sides);
        if(i<rings&&j<sides){const a=i*(sides+1)+j,d=a+sides+1;indices.push(a,d,a+1,d,d+1,a+1);}
      }
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
      gl.uniform1f(u.uTime,time);gl.uniform1f(u.uScale,1.13);
      gl.uniformMatrix3fv(u.uRotation,false,rotation(-.38+pointer.y*.22,.38+time*.085+pointer.x*.32,-.36+Math.sin(time*.09)*.09));
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
