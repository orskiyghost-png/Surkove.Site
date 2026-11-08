import{n as e,r as t,t as n}from"./surkove-index-BX9xuLv-.js";var r=t(e(),1),i=n(),a=`#version 300 es
precision highp float;
in vec2 aPoint;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uFrame;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;
uniform float uCount;
uniform float uThickness;
uniform float uSoftness;
uniform float uWaves;
uniform float uSplit;
uniform float uFray;
uniform float uSeed;
uniform vec2 uTurn;
uniform vec4 uPart;
uniform float uTaper;
out float vEdge;
out float vBand;
out float vDraw;
out float vAlpha;
out float vIndex;

float Perlin2D(vec2 P) {
  vec2 Pi = floor(P);
  vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
  vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
  Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
  Pt += vec2(26.0, 161.0).xyxy;
  Pt *= Pt;
  Pt = Pt.xzxz * Pt.yyww;
  vec4 hash_x = fract(Pt * (1.0 / 951.135664));
  vec4 hash_y = fract(Pt * (1.0 / 642.949883));
  vec4 grad_x = hash_x - 0.49999;
  vec4 grad_y = hash_y - 0.49999;
  vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y) * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
  grad_results *= 1.4142135623730950;
  vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
  vec4 blend2 = vec4(blend, vec2(1.0 - blend));
  return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

void main() {
  float perc = float(gl_InstanceID) / uCount;
  float x = aPoint.x;
  float pixel = 1.0 / max(uResolution.x, uResolution.y);
  float splitPoint = uSplit + perc * uFray;
  float amplitudeNormal = smoothstep(splitPoint, max(0.7, splitPoint + 0.2), x);
  float finalAmplitude = amplitudeNormal * 0.5 * uAmplitude * (1.0 + (uMouse.y - 0.5) * 0.2);
  float timeScaled = uTime / 10.0 + (uMouse.x - 0.5);
  float blur = smoothstep(splitPoint, splitPoint + 0.05, x) * perc;
  float xnoise = mix(
    Perlin2D(vec2(timeScaled * 2.5 + uSeed, (x * uWaves + perc) * 2.5)),
    Perlin2D(vec2(timeScaled * 3.5 + uSeed, (x * uWaves + timeScaled) * 3.5)) / 1.5,
    x * 0.3
  );
  float y = 0.5 + (perc - 0.5) * uDistance + xnoise / 2.0 * finalAmplitude;
  vec2 local = vec2((x - 0.5) * uFrame.x, (y - 0.5) * uFrame.y);
  if (uPart.z > 0.0) {
    vec2 delta = local - uPart.xy;
    float reach = uPart.w;
    float pull = exp(-dot(delta, delta) / (reach * reach));
    local.y += delta.y * pull * uPart.z;
  }
  float width = 7.0 * uThickness * pixel * (1.0 - perc);
  float band = (width / 2.0 + 10.0 * uSoftness * pixel * blur) * uFrame.y;
  float draw = max(band, 1.0);
  local.y += aPoint.y * draw;
  vec2 turned = vec2(local.x * uTurn.x - local.y * uTurn.y, local.x * uTurn.y + local.y * uTurn.x);
  gl_Position = vec4(turned / (uResolution * 0.5), 0.0, 1.0);
  vEdge = aPoint.y * draw;
  vBand = band;
  vDraw = draw;
  vAlpha = 1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3)) * uTaper;
  vIndex = perc;
}`,o=`#version 300 es
precision highp float;
in float vEdge;
in float vBand;
in float vDraw;
in float vAlpha;
in float vIndex;
uniform vec3 uColor;
uniform vec3 uAccent;
out vec4 outColor;
void main() {
  float coverage = (1.0 - smoothstep(0.0, vDraw, abs(vEdge))) * (vBand / vDraw) * vAlpha;
  outColor = vec4(mix(uColor, uAccent, vIndex) * coverage, coverage);
}`,s=`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,c=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uLines;
uniform vec2 uResolution;
uniform float uFade;
uniform float uOpacity;
uniform float uCurve;
out vec4 outColor;

float smootherstep(float edge, float x) {
  float t = clamp(x / edge, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec4 lines = texture(uLines, vUv);
  float alpha = lines.a;
  vec3 color = alpha > 0.0001 ? lines.rgb / alpha : vec3(0.0);
  float mask = uOpacity;
  if (uFade > 0.0) {
    vec2 px = vUv * uResolution;
    float edge = uFade * min(uResolution.x, uResolution.y) * 0.5;
    mask *= smootherstep(edge, px.x) * smootherstep(edge, uResolution.x - px.x);
    mask *= smootherstep(edge, px.y) * smootherstep(edge, uResolution.y - px.y);
  }
  outColor = vec4(color * pow(alpha, uCurve), alpha) * mask;
}`,l=1920,u=(e,t,n)=>Math.min(n,Math.max(t,e)),d=(e,t,n)=>{let r=e.createShader(t);return r?(e.shaderSource(r,n),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(e.deleteShader(r),null)):null},f=(e,t,n)=>{let r=d(e,e.VERTEX_SHADER,t),i=d(e,e.FRAGMENT_SHADER,n),a=e.createProgram();return!r||!i||!a?null:(e.attachShader(a,r),e.attachShader(a,i),e.linkProgram(a),e.deleteShader(r),e.deleteShader(i),e.getProgramParameter(a,e.LINK_STATUS)?a:(e.deleteProgram(a),null))},p=(e,t,n)=>{let r={};for(let i of n)r[i]=e.getUniformLocation(t,i);return r},m=({color:e=[1,1,1],accentColor:t,amplitude:n=1.7,distance:d=.4,enableMouseInteraction:m=!1,lineCount:h=90,thickness:g=.6,softness:_=1.3,speed:v=.6,waves:y=1.05,split:b=.04,fray:x=.5,angle:S=25,seed:C=0,parting:w=0,taper:T=.85,brightness:E=1.4,fade:D=0,opacity:O=1,paused:k=!1,...A})=>{let j=(0,r.useRef)(null),M=(0,r.useRef)(null),N=(0,r.useRef)(null),P={color:e,accentColor:t,colorKey:`${Array.isArray(e)?e.join(`,`):String(e)}|${Array.isArray(t)?t.join(`,`):String(t??``)}`,amplitude:n,distance:d,enableMouseInteraction:m,lineCount:u(Math.round(h),1,400),thickness:Math.max(0,g),softness:Math.max(0,_),speed:v,waves:Math.max(0,y),split:u(b,0,1),fray:u(x,0,1),angle:S,seed:C,parting:u(w,0,1),taper:u(T,0,1),brightness:u(E,.25,2),fade:u(D,0,1),opacity:u(O,0,1),paused:k},F=(0,r.useRef)(P);F.current=P,(0,r.useEffect)(()=>{let e=j.current,t=M.current,n=t?.getContext(`webgl2`,{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!e||!t||!n)return;let r=f(n,a,o),i=f(n,s,c);if(!r||!i)return;let d=p(n,r,[`uTime`,`uResolution`,`uFrame`,`uAmplitude`,`uDistance`,`uMouse`,`uCount`,`uThickness`,`uSoftness`,`uWaves`,`uSplit`,`uFray`,`uSeed`,`uTurn`,`uPart`,`uTaper`,`uColor`,`uAccent`]),m=p(n,i,[`uLines`,`uResolution`,`uFade`,`uOpacity`,`uCurve`]),h=n.createVertexArray(),g=n.createBuffer();n.bindVertexArray(h),n.bindBuffer(n.ARRAY_BUFFER,g);let _=n.getAttribLocation(r,`aPoint`);n.enableVertexAttribArray(_),n.vertexAttribPointer(_,2,n.FLOAT,!1,0,0);let v=n.createVertexArray(),y=n.createBuffer();n.bindVertexArray(v),n.bindBuffer(n.ARRAY_BUFFER,y),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW);let b=n.getAttribLocation(i,`aPosition`);n.enableVertexAttribArray(b),n.vertexAttribPointer(b,2,n.FLOAT,!1,0,0),n.bindVertexArray(null);let x=n.createTexture(),S=n.createFramebuffer();n.bindTexture(n.TEXTURE_2D,x),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.NEAREST),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE);let C=document.createElement(`canvas`);C.width=1,C.height=1;let w=C.getContext(`2d`,{willReadFrequently:!0}),T=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1,E={time:0,width:1,height:1,segments:0,colorKey:``,color:[1,1,1],accent:[1,1,1],mouse:[.5,.5],targetMouse:[.5,.5],pointer:[0,0],targetPointer:[0,0],presence:0,inside:!1},D=0,O=0,k=!0,A=!0,P=e=>{if(Array.isArray(e))return[0,1,2].map(t=>u(Number(e[t]??1),0,1));if(!w)return[1,1,1];w.clearRect(0,0,1,1),w.fillStyle=`#ffffff`,w.fillStyle=String(e),w.fillRect(0,0,1,1);let[t,n,r]=w.getImageData(0,0,1,1).data;return[t/255,n/255,r/255]},I=e=>{e.colorKey!==E.colorKey&&(E.colorKey=e.colorKey,E.color=P(e.color),E.accent=e.accentColor===void 0||e.accentColor===null?E.color:P(e.accentColor))},L=e=>{if(e===E.segments)return;E.segments=e;let t=new Float32Array((e+1)*4);for(let n=0;n<=e;n++){let r=n/e;t.set([r,-1,r,1],n*4)}n.bindBuffer(n.ARRAY_BUFFER,g),n.bufferData(n.ARRAY_BUFFER,t,n.STATIC_DRAW)},R=()=>{let r=Math.max(1,e.clientWidth),i=Math.max(1,e.clientHeight),a=Math.min(window.devicePixelRatio||1,2),o=Math.max(r,i)*a,s=o>l?a*l/o:a;t.width=Math.max(1,Math.round(r*s)),t.height=Math.max(1,Math.round(i*s)),E.width=r,E.height=i,n.bindTexture(n.TEXTURE_2D,x),n.texImage2D(n.TEXTURE_2D,0,n.RGBA,t.width,t.height,0,n.RGBA,n.UNSIGNED_BYTE,null),n.bindFramebuffer(n.FRAMEBUFFER,S),n.framebufferTexture2D(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,x,0),n.bindFramebuffer(n.FRAMEBUFFER,null),L(u(Math.round(r/3),96,640)),z()},z=()=>{let e=F.current;I(e);let a=t.width,o=t.height,s=e.angle*Math.PI/180,c=Math.cos(s),l=Math.sin(s),u=Math.abs(a*c)+Math.abs(o*l),f=Math.abs(a*l)+Math.abs(o*c),p=a/E.width,g=e.enableMouseInteraction?E.mouse:[.5,.5],_=e.parting*E.presence*2,y=E.pointer[0]*p,b=E.pointer[1]*p,C=[y*c+b*l,-y*l+b*c];n.bindFramebuffer(n.FRAMEBUFFER,S),n.viewport(0,0,a,o),n.clearColor(0,0,0,0),n.clear(n.COLOR_BUFFER_BIT),n.enable(n.BLEND),n.blendFunc(n.ONE,n.ONE_MINUS_SRC_ALPHA),n.useProgram(r),n.uniform1f(d.uTime,E.time),n.uniform2f(d.uResolution,a,o),n.uniform2f(d.uFrame,u,f),n.uniform1f(d.uAmplitude,e.amplitude),n.uniform1f(d.uDistance,e.distance),n.uniform2f(d.uMouse,g[0],g[1]),n.uniform1f(d.uCount,e.lineCount),n.uniform1f(d.uThickness,e.thickness),n.uniform1f(d.uSoftness,e.softness),n.uniform1f(d.uWaves,e.waves),n.uniform1f(d.uSplit,e.split),n.uniform1f(d.uFray,e.fray),n.uniform1f(d.uSeed,e.seed*13.37),n.uniform2f(d.uTurn,c,l),n.uniform4f(d.uPart,C[0],C[1],_,Math.min(a,o)*.16),n.uniform1f(d.uTaper,e.taper),n.uniform3f(d.uColor,E.color[0],E.color[1],E.color[2]),n.uniform3f(d.uAccent,E.accent[0],E.accent[1],E.accent[2]),n.bindVertexArray(h),n.drawArraysInstanced(n.TRIANGLE_STRIP,0,(E.segments+1)*2,e.lineCount),n.bindFramebuffer(n.FRAMEBUFFER,null),n.viewport(0,0,a,o),n.disable(n.BLEND),n.clear(n.COLOR_BUFFER_BIT),n.useProgram(i),n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,x),n.uniform1i(m.uLines,0),n.uniform2f(m.uResolution,a,o),n.uniform1f(m.uFade,e.fade),n.uniform1f(m.uOpacity,e.opacity),n.uniform1f(m.uCurve,2/e.brightness),n.bindVertexArray(v),n.drawArrays(n.TRIANGLES,0,3),n.bindVertexArray(null)},B=e=>{if(D=0,!A||!k||document.hidden)return;let t=F.current,n=O?Math.min(.05,(e-O)/1e3):1/60;O=e;let r=!t.paused&&!T;r&&(E.time+=n*t.speed);let i=1-Math.exp(-n*3);E.mouse[0]+=(E.targetMouse[0]-E.mouse[0])*i,E.mouse[1]+=(E.targetMouse[1]-E.mouse[1])*i;let a=1-Math.exp(-n*10);E.pointer[0]+=(E.targetPointer[0]-E.pointer[0])*a,E.pointer[1]+=(E.targetPointer[1]-E.pointer[1])*a,E.presence+=((E.inside&&t.parting>0?1:0)-E.presence)*(1-Math.exp(-n*4)),z();let o=Math.abs(E.targetMouse[0]-E.mouse[0])>5e-4||Math.abs(E.targetMouse[1]-E.mouse[1])>5e-4||Math.abs(E.targetPointer[0]-E.pointer[0])>.05||Math.abs(E.targetPointer[1]-E.pointer[1])>.05||Math.abs((E.inside&&t.parting>0?1:0)-E.presence)>.002;r||o?D=requestAnimationFrame(B):O=0},V=()=>{!D&&A&&k&&!document.hidden&&(D=requestAnimationFrame(B))},H=t=>{let n=e.getBoundingClientRect(),r=(t.clientX-n.left)/Math.max(1,n.width),i=(t.clientY-n.top)/Math.max(1,n.height),a=r>=0&&r<=1&&i>=0&&i<=1;a?(E.targetMouse=[r,1-i],E.targetPointer=[t.clientX-n.left-n.width/2,n.height/2-(t.clientY-n.top)],!E.inside&&E.presence<.01&&(E.pointer=[...E.targetPointer])):E.inside&&(E.targetMouse=[.5,.5]),E.inside=a,V()},U=()=>{E.inside=!1,E.targetMouse=[.5,.5],V()},W=()=>{O=0,V()},G=new ResizeObserver(R);G.observe(e);let K=new IntersectionObserver(e=>{k=e.some(e=>e.isIntersecting),k&&(O=0,V())});return K.observe(e),window.addEventListener(`pointermove`,H,{passive:!0}),document.documentElement.addEventListener(`pointerleave`,U),document.addEventListener(`visibilitychange`,W),R(),N.current=()=>{D||z(),V()},()=>{A=!1,cancelAnimationFrame(D),N.current=null,G.disconnect(),K.disconnect(),window.removeEventListener(`pointermove`,H),document.documentElement.removeEventListener(`pointerleave`,U),document.removeEventListener(`visibilitychange`,W),n.deleteFramebuffer(S),n.deleteTexture(x),n.deleteBuffer(g),n.deleteBuffer(y),n.deleteVertexArray(h),n.deleteVertexArray(v),n.deleteProgram(r),n.deleteProgram(i)}},[]),(0,r.useEffect)(()=>{N.current?.()});let{className:I=``,...L}=A;return(0,i.jsx)(`div`,{ref:j,className:`threads-container${I?` ${I}`:``}`,...L,children:(0,i.jsx)(`canvas`,{ref:M,className:`threads-canvas`,"aria-hidden":`true`})})};export{m as default};