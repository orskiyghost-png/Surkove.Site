import{n as e,r as t,t as n}from"./surkove-index-ddf60fF2.js";var r=t(e(),1),i=n(),a=`#version 300 es
in vec2 aCorner;
in vec4 aShape;
in vec4 aTop;
in vec4 aBottom;
uniform vec2 uView;
uniform float uAngle;
out vec2 vLocal;
out vec4 vShape;
out vec4 vTop;
out vec4 vBottom;
void main() {
  float halo = aShape.z + 5.0;
  float reachX = aShape.z + max(aTop.w * 2.5, halo * 2.0);
  float reachY = aShape.w + max(aTop.w * 2.5, halo * 2.0);
  vec2 local = aCorner * vec2(reachX, reachY);
  vLocal = local;
  vShape = aShape;
  vTop = aTop;
  vBottom = aBottom;
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 p = aShape.xy + local - uView * 0.5;
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + uView * 0.5;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`,o=`#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vShape;
in vec4 vTop;
in vec4 vBottom;
uniform float uGlow;
uniform float uSlices;
uniform float uBase;
uniform float uHalfBar;
uniform float uScale;
out vec4 outColor;

float erfApprox(float x) {
  float a = x * x;
  float t = 1.0 - exp(-a * (1.2732395 + 0.147 * a) / (1.0 + 0.147 * a));
  return sign(x) * sqrt(max(t, 0.0));
}

float box(float d, float h, float s) {
  float k = 0.70710678 / max(s, 0.3);
  return 0.5 * (erfApprox((h - d) * k) + erfApprox((h + d) * k));
}

void main() {
  float blur = vTop.w;
  float body = box(vLocal.x, vShape.z, blur) * box(vLocal.y, vShape.w, blur * 1.15);
  float halo = vShape.z + 5.0;
  float glow = box(vLocal.x, vShape.z, halo) * box(vLocal.y, vShape.w, halo);
  float t = clamp(vLocal.y / max(vShape.w, 0.001) * 0.5 + 0.5, 0.0, 1.0);
  vec3 color = mix(vTop.rgb, vBottom.rgb, t);
  float v = clamp(vLocal.y / max(vShape.w, 0.001), -1.0, 1.0);
  float core = exp(-pow(vLocal.x / max(vShape.z + blur * 0.5, 0.5), 2.0) * 1.5);
  body *= (1.0 + 0.35 * core) * (1.0 - 0.35 * v * v * v * v);
  if (uSlices > 0.0) {
    float cell = vShape.z / max(uHalfBar, 0.00001) / uSlices;
    float y = (uBase - vShape.y - vLocal.y) / max(cell, 0.001);
    float f = 1.0 - abs(fract(y) - 0.5) * 2.0;
    float soft = clamp(blur / max(cell, 0.001) * 1.6, 0.04, 1.0);
    body *= smoothstep(0.28 - soft, 0.28 + soft, f);
  }
  vec3 tint = color * color / max(max(color.r, max(color.g, color.b)), 0.05);
  outColor = vec4((color * body + tint * uGlow * glow * 0.16) * vBottom.w * uScale, 1.0);
}`,s=`#version 300 es
in vec2 aCorner;
void main() {
  gl_Position = vec4(aCorner, 0.0, 1.0);
}`,c=`#version 300 es
precision highp float;
uniform sampler2D uLight;
uniform vec2 uResolution;
uniform float uScale;
uniform float uExposure;
uniform float uGrain;
uniform float uTime;
uniform float uFade;
uniform float uOpacity;
uniform float uLightMode;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec3 hdr = texelFetch(uLight, ivec2(gl_FragCoord.xy), 0).rgb / uScale * uExposure;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  float peak = max(hdr.r, max(hdr.g, hdr.b));
  if (uLightMode > 0.5) {
    vec3 hue = hdr / max(peak, 0.0001);
    float tone = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    vec3 color = pow(clamp(hue * min(1.0, 0.66 / max(tone, 0.001)), 0.0, 1.0), vec3(1.0 / 2.2));
    float alpha = clamp((1.0 - exp(-peak * 1.1)) * 0.85 * (1.0 + grain), 0.0, 1.0) * mask;
    outColor = vec4(color * alpha, alpha);
  } else {
    vec3 mapped = 1.0 - exp(-hdr);
    mapped = mix(mapped, vec3(1.0), smoothstep(1.1, 3.2, peak) * 0.75);
    float level = max(mapped.r, max(mapped.g, mapped.b));
    mapped = clamp(mapped + grain * (0.25 + level), 0.0, 1.0) * mask;
    outColor = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
  }
}`,l=Math.PI*2,u=6,d=1.1,f=2.6,p=1.5,m=2560,h=(e,t,n)=>Math.min(n,Math.max(t,e)),g=e=>{let t=Math.sin(e*127.1+311.7)*43758.5453;return t-Math.floor(t)},ee=e=>{let t=Math.floor(e),n=e-t,r=n*n*(3-2*n);return g(t)*(1-r)+g(t+1)*r},_=(e,t,n)=>{let r=e.createShader(t);return r?(e.shaderSource(r,n),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(e.deleteShader(r),null)):null},v=(e,t,n,r)=>{let i=_(e,e.VERTEX_SHADER,t),a=_(e,e.FRAGMENT_SHADER,n),o=e.createProgram();return!i||!a||!o?null:(e.attachShader(o,i),e.attachShader(o,a),r.forEach((t,n)=>e.bindAttribLocation(o,n,t)),e.linkProgram(o),e.deleteShader(i),e.deleteShader(a),e.getProgramParameter(o,e.LINK_STATUS)?o:(e.deleteProgram(o),null))},y=(e,t,n)=>{let r={};for(let i of n)r[i]=e.getUniformLocation(t,i);return r},b=({color1:e=`#ffd9a8`,color2:t=`#ff5fa2`,color3:n=`#5b8cff`,ribbons:g=3,spacing:_=28,barWidth:b=.5,ribbonHeight:x=.26,spread:S=.1,amplitude:C=.1,frequency:w=1,speed:T=1,perspective:E=.45,curve:D=.5,blur:O=.6,glow:k=1,brightness:A=1.25,position:j=.78,rotation:M=0,slices:N=0,grain:P=.08,mouseInteraction:F=!0,intro:I=!0,fade:L=0,opacity:R=1,lightMode:z=!1,paused:B=!1,dpr:V,className:H=``,...U})=>{let W=(0,r.useRef)(null),G=(0,r.useRef)(null),K=(0,r.useRef)(null),q={color1:String(e),color2:String(t),color3:String(n),ribbons:Math.round(h(g,1,u)),spacing:h(_,4,200),barWidth:h(b,.05,1),ribbonHeight:Math.max(0,x),spread:Math.max(0,S),amplitude:Math.max(0,C),frequency:Math.max(0,w),speed:T,perspective:h(E,0,1),curve:h(D,0,1),blur:h(O,0,2),glow:Math.max(0,k),brightness:Math.max(0,A),position:h(j,0,1),rotation:M,slices:Math.max(0,Math.round(N)),grain:Math.max(0,P),mouseInteraction:F,intro:I,fade:h(L,0,1),opacity:h(R,0,1),lightMode:z,paused:B,dpr:V},J=(0,r.useRef)(q);return J.current=q,(0,r.useEffect)(()=>{let e=W.current,t=G.current,n=t?.getContext(`webgl2`,{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!e||!t||!n)return;let r=!!n.getExtension(`EXT_color_buffer_float`),i=r?1:.25,u=v(n,a,o,[`aCorner`,`aShape`,`aTop`,`aBottom`]),g=v(n,s,c,[`aCorner`]);if(!u||!g)return;let _=y(n,u,[`uView`,`uAngle`,`uGlow`,`uSlices`,`uBase`,`uHalfBar`,`uScale`]),b=y(n,g,[`uLight`,`uResolution`,`uScale`,`uExposure`,`uGrain`,`uTime`,`uFade`,`uOpacity`,`uLightMode`]),x=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,x),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),n.STATIC_DRAW);let S=n.createBuffer(),C=n.createVertexArray();n.bindVertexArray(C),n.bindBuffer(n.ARRAY_BUFFER,x),n.enableVertexAttribArray(0),n.vertexAttribPointer(0,2,n.FLOAT,!1,0,0),n.bindBuffer(n.ARRAY_BUFFER,S);for(let e=1;e<=3;e++)n.enableVertexAttribArray(e),n.vertexAttribPointer(e,4,n.FLOAT,!1,48,(e-1)*16),n.vertexAttribDivisor(e,1);let w=n.createBuffer(),T=n.createVertexArray();n.bindVertexArray(T),n.bindBuffer(n.ARRAY_BUFFER,w),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW),n.enableVertexAttribArray(0),n.vertexAttribPointer(0,2,n.FLOAT,!1,0,0),n.bindVertexArray(null);let E=n.createTexture();n.bindTexture(n.TEXTURE_2D,E),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.NEAREST),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE);let D=n.createFramebuffer(),O=document.createElement(`canvas`).getContext(`2d`,{willReadFrequently:!0}),k=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1,A=new Map,j=new Float32Array,M={x:0,y:0,inside:!1},N={width:1,height:1,targetWidth:0,targetHeight:0,time:0,intro:J.current.intro&&!k?0:1,focus:f,focusVelocity:0,lift:0,liftX:0},P=0,F=0,I=!0,L=!0,R=e=>{if(A.has(e))return A.get(e);let t=[1,1,1];if(O&&e){O.clearRect(0,0,1,1),O.fillStyle=`#000000`,O.fillStyle=/^[0-9a-f]{3,8}$/i.test(e)?`#${e}`:e,O.fillRect(0,0,1,1);let[n,r,i]=O.getImageData(0,0,1,1).data;t=[n,r,i].map(e=>(e/255)**2.2)}return A.set(e,t),t},z=(e,t,n)=>{let r=e.length,i=(t%r+r)%r,a=Math.floor(i),o=i-a;o=o*o*(3-2*o);let s=e[a],c=e[(a+1)%r];for(let e=0;e<3;e++)j[n+e]=s[e]+(c[e]-s[e])*o},B=()=>{(N.targetWidth!==t.width||N.targetHeight!==t.height)&&(N.targetWidth=t.width,N.targetHeight=t.height,n.bindTexture(n.TEXTURE_2D,E),r?n.texImage2D(n.TEXTURE_2D,0,n.RGBA16F,t.width,t.height,0,n.RGBA,n.HALF_FLOAT,null):n.texImage2D(n.TEXTURE_2D,0,n.RGBA,t.width,t.height,0,n.RGBA,n.UNSIGNED_BYTE,null),n.bindFramebuffer(n.FRAMEBUFFER,D),n.framebufferTexture2D(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,E,0),n.bindFramebuffer(n.FRAMEBUFFER,null))},V=e=>{let{width:t,height:n}=N,r=n*d,i=r/f,a=e.spacing/i,o=a*e.barWidth*.5,s=e.perspective*.66,c=Math.cos(s),l=Math.sin(s),u=e.curve*.6,p=e.rotation*Math.PI/180,m=Math.abs(Math.cos(p))*t*.5+Math.abs(Math.sin(p))*n*.5,h=Math.ceil(Math.max(t,n)/r*f*2.4/a),g=[];for(let e=-h;e<=h;e++){let n=e*a,i=u*Math.sin(n*.9+.8),s=n*c-i*l,d=n*l+i*c+f;if(d<.45)continue;let p=r/d,h=t*.5+s*p;Math.abs(h-t*.5)>m+o*p+80||g.push({i:e,x:n,Z:d,sx:h,scale:p})}return{bars:g,halfBar:o,centerScale:i}},H=(e,t)=>{let{width:n,height:r}=N,{bars:i,halfBar:a,centerScale:o}=t,s=[e.color1,e.color2,e.color3].map(R),c=N.time,u=e.ribbonHeight*r*.5/o,d=e.spread*r/o,f=e.amplitude*r/o,p=.22*e.frequency,m=r*e.position,g=N.focus,_=e.blur*16,v=1.6+.04*(e.ribbons-1),y=i.length*e.ribbons*12;y>j.length&&(j=new Float32Array(y+1200));let b=0;for(let t of i){let r=a*t.scale,i=t.sx/Math.max(n,1),o=N.lift*Math.exp(-(((t.sx-N.liftX)/Math.max(n*.12,60))**2)),y=(.5+e.blur*.6+_*Math.abs(g/t.Z-1))*(e.lightMode?.55:1);for(let n=0;n<e.ribbons;n++){let a=(n-(e.ribbons-1)/2)*d+(.62*Math.sin(l*p*t.x-c*1.6+n*2.1)+.38*Math.sin(l*p*1.9*t.x+c*2.25+n*1.3))*f,g=.5+.5*Math.sin(l*p*.7*t.x+c*1.1+n*2.7),_=h((N.intro*v-i-n*.04)/.6,0,1),x=_*_*(3-2*_),S=u*(.6+.4*g)*x*t.scale;if(S<.4)continue;let C=n*1.15+t.x*.3+c*.12,w=b*12;j[w]=t.sx,j[w+1]=m-a*t.scale,j[w+2]=r,j[w+3]=S,z(s,C-.22,w+4),j[w+7]=y,z(s,C+.22,w+8),j[w+11]=(.75+.25*ee(t.i*.9+n*7.7-c*1.2))*(1+o*.6)*(.4+.6*x),b++}}return{count:b,halfBar:a,base:m}},U=(e,r=V(e))=>{B();let{count:a,halfBar:o,base:s}=H(e,r);n.bindFramebuffer(n.FRAMEBUFFER,D),n.viewport(0,0,t.width,t.height),n.clearColor(0,0,0,0),n.clear(n.COLOR_BUFFER_BIT),a>0&&(n.enable(n.BLEND),n.blendFunc(n.ONE,n.ONE),n.useProgram(u),n.uniform2f(_.uView,N.width,N.height),n.uniform1f(_.uAngle,e.rotation*Math.PI/180),n.uniform1f(_.uGlow,e.lightMode?e.glow*.4:e.glow),n.uniform1f(_.uSlices,e.slices),n.uniform1f(_.uBase,s),n.uniform1f(_.uHalfBar,o),n.uniform1f(_.uScale,i),n.bindVertexArray(C),n.bindBuffer(n.ARRAY_BUFFER,S),n.bufferData(n.ARRAY_BUFFER,j.subarray(0,a*12),n.DYNAMIC_DRAW),n.drawArraysInstanced(n.TRIANGLE_STRIP,0,4,a),n.disable(n.BLEND)),n.bindFramebuffer(n.FRAMEBUFFER,null),n.viewport(0,0,t.width,t.height),n.clearColor(0,0,0,0),n.clear(n.COLOR_BUFFER_BIT),n.useProgram(g),n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,E),n.uniform1i(b.uLight,0),n.uniform2f(b.uResolution,t.width,t.height),n.uniform1f(b.uScale,i),n.uniform1f(b.uExposure,1.6*e.brightness),n.uniform1f(b.uGrain,e.grain),n.uniform1f(b.uTime,N.time%1e3),n.uniform1f(b.uFade,e.fade),n.uniform1f(b.uOpacity,e.opacity),n.uniform1f(b.uLightMode,+!!e.lightMode),n.bindVertexArray(T),n.drawArrays(n.TRIANGLES,0,3),n.bindVertexArray(null)},q=(e,t)=>{let n=null;for(let r of e.bars)(!n||Math.abs(r.sx-t)<Math.abs(n.sx-t))&&(n=r);return n?n.Z:f},Y=e=>{if(P=0,!L||!I||document.hidden)return;let t=J.current,n=F?Math.min(.05,(e-F)/1e3):1/60;F=e;let r=!t.paused&&!k;r&&(N.time+=n*t.speed),!t.intro||k?N.intro=1:N.intro<1&&(N.intro=Math.min(1,N.intro+n/p));let i=t.mouseInteraction&&M.inside&&!k,a=t.rotation*Math.PI/180,o=Math.cos(a)*(M.x-N.width*.5)+Math.sin(a)*(M.y-N.height*.5)+N.width*.5,s=V(t),c=i?q(s,o):f;N.focusVelocity+=(36*(c-N.focus)-11*N.focusVelocity)*n,N.focus+=N.focusVelocity*n,N.lift+=(+!!i-N.lift)*(1-Math.exp(-n/(i?.25:.6))),N.liftX+=(o-N.liftX)*(1-Math.exp(-n/.12)),U(t,s);let l=N.intro<1||Math.abs(c-N.focus)>.001||Math.abs(N.focusVelocity)>.001||N.lift>.002||i;r||l?P=requestAnimationFrame(Y):F=0},X=()=>{!P&&L&&I&&!document.hidden&&(P=requestAnimationFrame(Y))},Z=()=>{let n=J.current,r=Math.max(1,e.clientWidth),i=Math.max(1,e.clientHeight),a=Math.min(n.dpr||window.devicePixelRatio||1,2),o=Math.max(r,i)*a,s=o>m?a*m/o:a;N.width=r,N.height=i,t.width=Math.max(1,Math.round(r*s)),t.height=Math.max(1,Math.round(i*s)),P||U(n),X()},Q=t=>{let n=e.getBoundingClientRect();M.x=t.clientX-n.left,M.y=t.clientY-n.top,M.inside=M.x>=0&&M.y>=0&&M.x<=n.width&&M.y<=n.height,X()},$=()=>{M.inside=!1,X()},te=()=>{F=0,X()},ne=new ResizeObserver(Z);ne.observe(e);let re=new IntersectionObserver(e=>{I=e.some(e=>e.isIntersecting),I&&(F=0,X())});return re.observe(e),window.addEventListener(`pointermove`,Q,{passive:!0}),document.documentElement.addEventListener(`pointerleave`,$),document.addEventListener(`visibilitychange`,te),Z(),K.current=()=>{P||U(J.current),X()},()=>{L=!1,cancelAnimationFrame(P),K.current=null,ne.disconnect(),re.disconnect(),window.removeEventListener(`pointermove`,Q),document.documentElement.removeEventListener(`pointerleave`,$),document.removeEventListener(`visibilitychange`,te),n.deleteFramebuffer(D),n.deleteTexture(E),n.deleteBuffer(x),n.deleteBuffer(S),n.deleteBuffer(w),n.deleteVertexArray(C),n.deleteVertexArray(T),n.deleteProgram(u),n.deleteProgram(g)}},[]),(0,r.useEffect)(()=>{K.current?.()}),(0,i.jsx)(`div`,{ref:W,className:`sliced-waves-container${H?` ${H}`:``}`,...U,children:(0,i.jsx)(`canvas`,{ref:G,className:`sliced-waves-canvas`,"aria-hidden":`true`})})};export{b as default};