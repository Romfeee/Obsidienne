/* OBSIDIENNE — La collection nuit (three.js + GSAP ScrollTrigger + Lenis) */
(() => {
const P = window.PRODUCTS, N = P.length, A = window.ASSETS;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const fmt = n => String(n).padStart(2, '0');
const mobile = () => innerWidth <= 820;
const lerp = (a, b, t) => a + (b - a) * t;
const hex = c => { const v = new THREE.Color(c); return { r: v.r, g: v.g, b: v.b }; };

/* ------------------------------------------------------------------ renderer */
const canvas = $('#gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#nogl').style.display = 'flex'; $('#loader').remove(); return; }
const DPR = () => Math.min(devicePixelRatio || 1, mobile() ? 1.5 : 1.75);
renderer.setPixelRatio(DPR());
renderer.setSize(innerWidth, innerHeight, false);
renderer.setClearColor(0x030304, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x030304, 16, 46);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.05, 140);

/* ------------------------------------------------------------------ set geometry */
const SP = 1.3, NW = 1.0, NH = 2.8, ND = 0.9, PLY = 0.22, SZ = 3.2;
const X = i => (i - (N - 1) / 2) * SP;
const ROWW = (N - 1) * SP + NW;
const HB = p => 1.75 * p.s;

/* ------------------------------------------------------------------ helpers */
function cTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
const loadImg = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(im); im.src = src; });
const loadTex = src => new Promise(r => new THREE.TextureLoader().load(src, t => r(t), undefined, () => r(new THREE.Texture())));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const glowTex = cTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.22, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const stripTex = cTex(128, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; const v = x.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.15, '#000'); v.addColorStop(.85, '#000'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = v; x.fillRect(0, 0, w, h); });
const shadowTex = cTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const fogBandTex = cTex(256, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; const v = x.createLinearGradient(0, 0, w, 0); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.2, '#000'); v.addColorStop(.8, '#000'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = v; x.fillRect(0, 0, w, h); });

/* ------------------------------------------------------------------ shaders */
const BOTTLE_VS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const BOTTLE_FS = `
uniform sampler2D map, rowTex; uniform float uAspect,uRot,uDim,uMirror,uOpacity,uRim,uSpec,uTime; uniform vec3 uAcc,uL;
varying vec2 vUv;
void main(){
  vec4 base=texture2D(map,vUv);
  if(base.a<0.01) discard;
  float dy=1.0/256.0;
  vec4 r=texture2D(rowTex,vec2(0.5,vUv.y));
  float cx=r.r, hw=max(r.g*0.5,0.003);
  float hwU=texture2D(rowTex,vec2(0.5,min(vUv.y+dy,1.0))).g*0.5;
  float hwD=texture2D(rowTex,vec2(0.5,max(vUv.y-dy,0.0))).g*0.5;
  float nx=clamp((vUv.x-cx)/hw,-0.995,0.995);
  float th=asin(nx);
  float th2=th-uRot;
  float back=smoothstep(1.25,1.57,abs(th2));
  float sx=cx+hw*sin(clamp(th2,-1.5707,1.5707));
  vec4 c=texture2D(map,vec2(sx,vUv.y));
  vec3 col=mix(base.rgb,c.rgb,step(0.05,c.a));
  float slope=(hwU-hwD)/(2.0*dy)*uAspect;
  vec3 N=normalize(vec3(sin(th),-slope*0.9,cos(th)));
  vec3 L=normalize(uL);
  float diff=max(dot(N,L),0.0);
  vec3 H=normalize(L+vec3(0.0,0.0,1.0));
  float spec=pow(max(dot(N,H),0.0),48.0)*uSpec;
  float spec2=pow(max(dot(N,normalize(vec3(-L.x,L.y*0.4,L.z)+vec3(0.,0.,1.))),0.0),90.0)*uSpec*0.5;
  float rim=pow(1.0-N.z,2.2)*uRim;
  col*=(0.58+0.62*diff)*mix(0.55,1.0,cos(th));
  col+=(spec+spec2)*vec3(1.0,0.97,0.92);
  col+=rim*uAcc;
  col*=mix(0.45,1.0,1.0-back);
  col*=uDim;
  float alpha=base.a*uOpacity;
  if(uMirror>0.5){ alpha*=(1.0-smoothstep(0.0,0.42,vUv.y))*0.30; col*=0.85; }
  gl_FragColor=vec4(col,alpha);
}`;
const CONE_VS = `varying float vH; varying vec3 vN; varying vec3 vV; void main(){ vH=uv.y; vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const CONE_FS = `uniform float uI; uniform vec3 uC; varying float vH; varying vec3 vN; varying vec3 vV; void main(){ float f=abs(dot(vN,vV)); float a=pow(vH,1.7)*pow(f,1.5)*uI*0.30; gl_FragColor=vec4(uC,a);} `;
const SKY_VS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const SKY_FS = `uniform vec3 uTop,uBot,uSun; uniform vec2 uSunPos; uniform float uO,uSunR,uTime; varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){ vec3 c=mix(uBot,uTop,smoothstep(0.08,0.95,vUv.y));
  vec2 q=(vUv-uSunPos)*vec2(1.8,1.0); float d=length(q);
  c+=uSun*(exp(-d*d/(uSunR*uSunR))*0.95+exp(-d*5.0)*0.22);
  float n=h(floor(vUv*vec2(900.,500.))+floor(uTime*8.0))*0.018; c+=n;
  gl_FragColor=vec4(c,uO); }`;
const PT_VS = `attribute float aR; uniform float uTime,uSpeed,uSize,uWob,uCx,uSpread; varying float vA; varying float vR;
void main(){ vec3 p=position; p.x*=uSpread; p.y=mod(p.y+uTime*uSpeed*(0.45+aR),4.6)-0.1; p.x+=sin(uTime*0.6+aR*6.283)*uWob+uCx; p.z+=cos(uTime*0.4+aR*9.0)*uWob*0.4;
  vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=min(uSize*(0.5+aR)*(200.0/-mv.z),38.0);
  vA=smoothstep(-0.1,0.4,p.y)*(1.0-smoothstep(3.6,4.5,p.y)); vR=aR; }`;
const PT_FS = `uniform vec3 uC; uniform float uO,uRing,uTime; varying float vA; varying float vR;
void main(){ vec2 q=gl_PointCoord-0.5; float d=length(q); if(d>0.5) discard;
  float soft=1.0-smoothstep(0.0,0.5,d); float ring=smoothstep(0.32,0.42,d)*(1.0-smoothstep(0.42,0.5,d))+soft*0.15;
  float a=mix(soft*soft,ring,uRing)*uO*vA*(0.6+0.4*sin(uTime*2.0+vR*20.0));
  gl_FragColor=vec4(uC,a); }`;

/* ------------------------------------------------------------------ state (driven by GSAP) */
const C = { x: 0, y: 5.5, z: 26, lx: 0, ly: 1.2, lz: 0 };                     // camera
const B = P.map((p, i) => ({ x: X(i), y: PLY, z: -ND * 0.5, rot: 0, tilt: 0, yaw: 0, stage: 0 })); // bottles
const L = P.map(() => ({ lit: 0, strip: 0 }));                                  // niche lights
const E = P.map(() => ({ mix: 0, tx: 0 }));                                     // story environments
const SH = { L: 0, R: 0, B: 0, bar: 0 };                                       // UI shades
const LIGHT = { x: -0.55, y: 0.55, z: 0.75 };
const ACC = hex('#e46e91');
const FXP = {
  dust:    { r: 1, g: .92, b: .82, speed: .05, size: 1.9, op: .45, ring: 0, wob: .15 },
  embers:  { r: 1, g: .58, b: .24, speed: .24, size: 2.2, op: .7, ring: 0, wob: .3 },
  bubbles: { r: 1, g: .95, b: .8,  speed: .6,  size: 3.6, op: .55, ring: 1, wob: .05 },
  snow:    { r: .86, g: .93, b: 1, speed: -.13, size: 3.2, op: .75, ring: 0, wob: .35 },
  pollen:  { r: 1, g: .62, b: .86, speed: .07, size: 2.9, op: .65, ring: 0, wob: .45 },
};
const FX = { ...FXP.dust, cx: 0, spread: 2.4 };
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

/* ------------------------------------------------------------------ build the cellar */
const bottleMeshes = [], mirrorMeshes = [], nicheParts = [], envGroups = [];
let points, pool, shadow, floor;

async function buildScene(progress) {
  const stoneImg = await loadImg(A.stone); progress(.15);
  const stoneTex = new THREE.Texture(stoneImg); stoneTex.needsUpdate = true; stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  const wallTex = cTex(512, 1434, (x, w, h) => {
    x.drawImage(stoneImg, 0, 0, w, h);
    x.globalCompositeOperation = 'multiply';
    let g = x.createRadialGradient(w / 2, -h * .02, 0, w / 2, h * .1, h * 1.0); g.addColorStop(0, '#ffffff'); g.addColorStop(.33, '#9c958d'); g.addColorStop(.7, '#3a3836'); g.addColorStop(1, '#141414');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'screen';
    g = x.createRadialGradient(w / 2, 0, 0, w / 2, 0, h * .42); g.addColorStop(0, 'rgba(255,238,215,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  const outerTex = stoneTex.clone(); outerTex.needsUpdate = true; outerTex.repeat.set(3, 2);

  /* outer wall (pillars + top band) */
  const outerMat = new THREE.MeshBasicMaterial({ map: outerTex, color: 0x242428 });
  for (let j = 0; j <= N; j++) {
    const x = X(0) - SP / 2 + j * SP;
    const m = new THREE.Mesh(new THREE.BoxGeometry(SP - NW, NH + 0.02, 0.2), outerMat);
    m.position.set(x, NH / 2, -0.1); scene.add(m);
  }
  const band = new THREE.Mesh(new THREE.BoxGeometry(ROWW + 30, 6, 0.2), outerMat); band.position.set(0, NH + 3, -0.1); scene.add(band);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(15, NH + 0.02, 0.2), outerMat); e.position.set(s * (ROWW / 2 + 0.15 + 7.5), NH / 2, -0.1); scene.add(e); }

  /* floor (drawn over the reflections) */
  floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshBasicMaterial({ color: 0x060607, transparent: true, opacity: .8, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1.5; scene.add(floor);
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(ROWW + 8, 6), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x302a26, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sheen.rotation.x = -Math.PI / 2; sheen.position.set(0, .004, 1.2); sheen.renderOrder = 1.6; scene.add(sheen);

  /* niches */
  for (let i = 0; i < N; i++) {
    const p = P[i], col = new THREE.Color(p.c), g = new THREE.Group(); g.position.x = X(i); scene.add(g);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(NW, NH), new THREE.MeshBasicMaterial({ map: wallTex, color: 0xffffff }));
    back.position.set(0, NH / 2, -ND); g.add(back);
    const sideMat = new THREE.MeshBasicMaterial({ map: wallTex, color: 0x666666 });
    for (const s of [-1, 1]) { const sd = new THREE.Mesh(new THREE.PlaneGeometry(ND, NH), sideMat); sd.rotation.y = -s * Math.PI / 2; sd.position.set(s * NW / 2, NH / 2, -ND / 2); g.add(sd); }
    const top = new THREE.Mesh(new THREE.PlaneGeometry(NW, ND), new THREE.MeshBasicMaterial({ color: 0x0a0a0b })); top.rotation.x = Math.PI / 2; top.position.set(0, NH, -ND / 2); g.add(top);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(NW, PLY, ND), new THREE.MeshBasicMaterial({ color: 0x141416 })); plinth.position.set(0, PLY / 2, -ND / 2); g.add(plinth);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(NW, .006, .02), new THREE.MeshBasicMaterial({ color: 0x3a3836 })); lip.position.set(0, PLY, -.01); g.add(lip);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.34, .02, .08), new THREE.MeshBasicMaterial({ color: 0x2a2826 })); lamp.position.set(0, NH - .012, -ND * .42); g.add(lamp);
    const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0d8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    lampGlow.scale.set(1.3, .45, 1); lampGlow.position.set(0, NH - .06, -ND * .38); g.add(lampGlow);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(.07, .5, NH - PLY, 40, 1, true), new THREE.ShaderMaterial({
      vertexShader: CONE_VS, fragmentShader: CONE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uI: { value: 0 }, uC: { value: new THREE.Color(0xfff0dc) } } }));
    cone.position.set(0, PLY + (NH - PLY) / 2, -ND * .5); g.add(cone);
    const stripMat = new THREE.MeshBasicMaterial({ color: col.clone() });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(.03, NH + .3, .03), stripMat); strip.position.set(NW / 2 + .08, (NH + .3) / 2, .04); g.add(strip);
    const glowMat = new THREE.MeshBasicMaterial({ map: stripTex, color: col.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(.9, NH + 1.2), glowMat); glow.position.set(NW / 2 + .08, NH / 2 + .1, .07); g.add(glow);
    const stripM = strip.clone(); stripM.material = stripMat.clone(); stripM.material.transparent = true; stripM.material.opacity = .45; stripM.position.y = -(NH + .3) / 2; stripM.renderOrder = 1; g.add(stripM);
    const glowM = glow.clone(); glowM.material = glowMat.clone(); glowM.position.y = -(NH / 2 + .1); glowM.renderOrder = 1; g.add(glowM);
    const npool = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.5), new THREE.MeshBasicMaterial({ map: glowTex, color: col.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    npool.rotation.x = -Math.PI / 2; npool.position.set(0, .006, .5); npool.renderOrder = 6; g.add(npool);
    nicheParts.push({ back, sideMat, lamp, lampGlow, cone, stripMat, glowMat, mGlowMat: glowM.material, mStripMat: stripM.material, npool, col });
  }
  progress(.3);

  /* bottles */
  for (let i = 0; i < N; i++) {
    const p = P[i], a = A.bottles[p.key];
    const [map, row] = await Promise.all([loadTex(a.img), loadTex(a.row)]);
    map.anisotropy = renderer.capabilities.getMaxAnisotropy(); map.minFilter = THREE.LinearMipmapLinearFilter;
    row.generateMipmaps = false; row.minFilter = row.magFilter = THREE.LinearFilter; row.wrapS = row.wrapT = THREE.ClampToEdgeWrapping;
    const h = HB(p), w = h * a.aspect;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
    const uniforms = {
      map: { value: map }, rowTex: { value: row }, uAspect: { value: a.aspect }, uRot: { value: 0 }, uDim: { value: .2 }, uMirror: { value: 0 },
      uOpacity: { value: 1 }, uRim: { value: .35 }, uSpec: { value: .55 }, uTime: { value: 0 }, uAcc: { value: new THREE.Color(p.c) }, uL: { value: new THREE.Vector3(-.5, .5, .8) } };
    const mat = new THREE.ShaderMaterial({ vertexShader: BOTTLE_VS, fragmentShader: BOTTLE_FS, uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat); m.renderOrder = 10; m.userData.i = i; scene.add(m); bottleMeshes.push(m);
    const mu = { ...uniforms, uMirror: { value: 1 } };
    const mm = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: BOTTLE_VS, fragmentShader: BOTTLE_FS, uniforms: mu, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    mm.scale.y = -1; mm.renderOrder = 1; scene.add(mm); mirrorMeshes.push(mm);
    progress(.3 + .3 * (i + 1) / N);
  }

  /* stage light pool + contact shadow (follow the emerged bottle) */
  pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  pool.rotation.x = -Math.PI / 2; pool.renderOrder = 7; scene.add(pool);
  shadow = new THREE.Mesh(new THREE.PlaneGeometry(.9, .5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 }));
  shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = 8; scene.add(shadow);

  /* particles */
  const n = mobile() ? 260 : 460, pos = new Float32Array(n * 3), ar = new Float32Array(n), r = rng(7);
  for (let k = 0; k < n; k++) { pos[k * 3] = (r() - .5) * 9; pos[k * 3 + 1] = r() * 4.6; pos[k * 3 + 2] = .3 + r() * 5.0; ar[k] = r(); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aR', new THREE.BufferAttribute(ar, 1));
  points = new THREE.Points(pg, new THREE.ShaderMaterial({ vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSpeed: { value: .05 }, uSize: { value: 2.3 }, uWob: { value: .15 }, uCx: { value: 0 }, uSpread: { value: 2.4 }, uC: { value: new THREE.Color(1, .92, .82) }, uO: { value: .55 }, uRing: { value: 0 } } }));
  points.frustumCulled = false; points.renderOrder = 12; scene.add(points);

  /* story environments */
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]); } catch (e) {}
  for (let i = 0; i < N; i++) { envGroups.push(buildEnv(i)); progress(.6 + .4 * (i + 1) / N); await new Promise(r => setTimeout(r, 0)); }
}

/* ------------------------------------------------------------------ procedural landscapes */
const THEMES = {
  cane:       { top: '#170802', bot: '#6e2a0a', sun: '#ffae5a', sp: [.64, .36], sr: .17, fill: '#120703', rim: '#ff9a3c', haze: '#ff8a3a', draw: 'cane' },
  vines:      { top: '#03101a', bot: '#1a5f80', sun: '#a8e8ff', sp: [.7, .5],  sr: .13, fill: '#03090d', rim: '#7fdcff', haze: '#48b4e0', draw: 'vines' },
  barrels:    { top: '#0c0602', bot: '#3d2108', sun: '#ffc172', sp: [.74, .78], sr: .12, fill: '#120a05', rim: '#ffb347', haze: '#e8a040', draw: 'barrels' },
  agave:      { top: '#130701', bot: '#7a300f', sun: '#ffb26e', sp: [.34, .36], sr: .19, fill: '#100603', rim: '#ff8a3c', haze: '#ff8f45', draw: 'agave' },
  agaveNight: { top: '#01050d', bot: '#0b2a44', sun: '#d6ecff', sp: [.7, .74], sr: .045, fill: '#02060a', rim: '#7fd0ff', haze: '#3f9fd0', draw: 'agave' },
  frost:      { top: '#04080f', bot: '#1b3854', sun: '#eaf5ff', sp: [.5, .8],  sr: .26, fill: 'rgba(210,230,255,.10)', rim: '#e6f2ff', haze: '#bcd8ff', draw: 'frost' },
  botanicals: { top: '#0f0209', bot: '#4c0f2c', sun: '#ff8fc0', sp: [.3, .55], sr: .16, fill: '#0d0207', rim: '#ff6aa8', haze: '#e05a96', draw: 'botanicals' },
  vinesGold:  { top: '#110b02', bot: '#6c4b10', sun: '#ffd982', sp: [.62, .4], sr: .21, fill: '#0e0a03', rim: '#ffd36a', haze: '#f2c25a', draw: 'vines' },
};
const DRAW = {
  hills(x, W, H, r, o, y0, amp, col) {
    x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
    const f1 = 1 + r() * 2, f2 = 3 + r() * 4, ph = r() * 6;
    for (let k = 0; k <= 64; k++) { const u = k / 64; x.lineTo(u * W, y0 - amp * (Math.sin(u * f1 * 3.14 + ph) * .6 + Math.sin(u * f2 * 3.14 + ph * 2) * .25 + .4)); }
    x.lineTo(W, H); x.closePath(); x.fill();
  },
  cane(x, W, H, r, o) {
    if (o.ground) DRAW.hills(x, W, H, r, o, H * .86, H * .1, o.fill);
    const n = Math.round(16 / o.sc);
    for (let k = 0; k < n; k++) {
      const bx = o.edges ? (r() < .5 ? r() * W * .3 : W * .7 + r() * W * .3) : r() * W;
      const h = H * (.5 + r() * .5) * Math.min(1.25, o.sc), lean = (r() - .5) * .3, lw = (4 + r() * 5) * o.sc, seg = 7 + (r() * 4 | 0);
      const pts = []; for (let j = 0; j <= seg; j++) { const u = j / seg; pts.push([bx + lean * h * u * u, H - h * u]); }
      x.strokeStyle = o.fill; x.lineCap = 'round'; x.lineWidth = lw; x.beginPath(); pts.forEach((p, j) => j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
      x.lineWidth = lw * 1.5; pts.forEach((p, j) => { if (j && j < seg) { x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0] + .1, p[1] + lw * .4); x.stroke(); } });
      x.fillStyle = o.fill;
      const leaf = (p, dir, Ll) => { x.beginPath(); x.moveTo(p[0], p[1]); x.quadraticCurveTo(p[0] + dir * Ll * .55, p[1] - Ll * .5, p[0] + dir * Ll, p[1] - Ll * .05 + Ll * .3 * r()); x.quadraticCurveTo(p[0] + dir * Ll * .5, p[1] - Ll * .3, p[0], p[1] + lw * .8); x.fill(); };
      for (let j = 2; j < seg; j++) if (r() < .45) leaf(pts[j], r() < .5 ? -1 : 1, (50 + r() * 110) * o.sc);
      const tp = pts[seg]; for (let j = 0; j < 6; j++) leaf(tp, j % 2 ? 1 : -1, (60 + r() * 120) * o.sc);
    }
  },
  agave(x, W, H, r, o) {
    if (o.ground) DRAW.hills(x, W, H, r, o, H * .82, H * .14, o.fill);
    const n = Math.round(8 / o.sc);
    for (let k = 0; k < n; k++) {
      const cx = o.edges ? (r() < .5 ? r() * W * .28 : W * .72 + r() * W * .28) : r() * W, base = H - r() * H * .06, S = (70 + r() * 80) * o.sc, nl = 15 + (r() * 8 | 0);
      x.fillStyle = o.fill;
      for (let j = 0; j < nl; j++) {
        const a = -Math.PI + (j + .5) / nl * Math.PI + (r() - .5) * .14, mid = 1 - Math.abs(j / nl - .5) * 1.2, Ll = S * (.55 + .7 * mid) * (.85 + r() * .3), wd = S * .1;
        const tx = cx + Math.cos(a) * Ll, ty = base + Math.sin(a) * Ll, nxp = -Math.sin(a), nyp = Math.cos(a);
        x.beginPath(); x.moveTo(cx + nxp * wd, base + nyp * wd);
        x.quadraticCurveTo(cx + Math.cos(a) * Ll * .5 + nxp * wd * 1.2, base + Math.sin(a) * Ll * .5 + nyp * wd * 1.2 - Ll * .06, tx, ty);
        x.quadraticCurveTo(cx + Math.cos(a) * Ll * .5 - nxp * wd * .8, base + Math.sin(a) * Ll * .5 - nyp * wd * .8, cx - nxp * wd, base - nyp * wd); x.fill();
      }
      if (r() < .25 && !o.edges) { x.strokeStyle = o.fill; x.lineWidth = 4 * o.sc; x.beginPath(); x.moveTo(cx, base); x.quadraticCurveTo(cx + 10, base - S * 2, cx + 6, base - S * 3.3); x.stroke();
        for (let j = 0; j < 5; j++) { const yy = base - S * (2.4 + j * .2); x.beginPath(); x.arc(cx + 6 + (j % 2 ? 14 : -14) * o.sc, yy, 7 * o.sc, 0, 6.3); x.fill(); } }
    }
  },
  vines(x, W, H, r, o) {
    DRAW.hills(x, W, H, r, o, H * .6, H * .14, o.fill);
    const R = Math.round(7 / Math.max(.6, o.sc));
    for (let k = 0; k < R; k++) {
      const u = k / R, y = H * .62 + Math.pow(u, 1.5) * H * .4, step = (10 + 30 * u) * o.sc, rad = step * .62, ph = r() * 6;
      x.fillStyle = o.fill;
      for (let xx = -step; xx < W + step; xx += step) {
        if (o.edges && xx > W * .3 && xx < W * .7) continue;
        const yy = y + Math.sin(xx * .004 + ph) * 8 * o.sc; x.beginPath(); x.arc(xx, yy - rad * .6, rad * (.8 + r() * .4), 0, 6.3); x.fill();
        if (r() < .25) { x.fillRect(xx, yy - rad * 1.6, 2 * o.sc, rad * 1.6); }
      }
      x.fillRect(0, y, W, H - y);
    }
  },
  barrels(x, W, H, r, o) {
    const Rr = 34 * o.sc, gap = Rr * .18, rows = Math.ceil(H * .72 / (Rr * 2 + gap));
    for (let row = 0; row < rows; row++) {
      const cy = H - Rr - row * (Rr * 2 + gap) - 6, off = row % 2 ? Rr : 0;
      x.fillStyle = o.fill; x.fillRect(0, cy + Rr - 2, W, gap + 4);
      for (let cx = -Rr + off; cx < W + Rr; cx += Rr * 2.06) {
        if (o.edges && cx > W * .28 && cx < W * .72) continue;
        x.fillStyle = o.fill; x.beginPath(); x.arc(cx, cy, Rr, 0, 6.3); x.fill();
        x.strokeStyle = o.rimA(.22); x.lineWidth = 2.2 * o.sc; x.beginPath(); x.arc(cx, cy, Rr * .93, 0, 6.3); x.stroke();
        x.strokeStyle = o.rimA(.1); x.lineWidth = 1.2 * o.sc; x.beginPath(); x.arc(cx, cy, Rr * .62, 0, 6.3); x.stroke();
        x.strokeStyle = o.rimA(.06); for (let s = -3; s <= 3; s++) { x.beginPath(); x.moveTo(cx + s * Rr * .26, cy - Math.sqrt(Math.max(0, Rr * Rr * .86 - (s * Rr * .26) ** 2))); x.lineTo(cx + s * Rr * .26, cy + Math.sqrt(Math.max(0, Rr * Rr * .86 - (s * Rr * .26) ** 2))); x.stroke(); }
        x.fillStyle = o.rimA(.18); x.beginPath(); x.ellipse(cx, cy + Rr * .35, Rr * .08, Rr * .05, 0, 0, 6.3); x.fill();
      }
    }
  },
  frost(x, W, H, r, o) {
    const n = Math.round(46 / o.sc);
    for (let k = 0; k < n; k++) {
      const side = r(); let bx, by, a;
      if (o.edges) { bx = r() < .5 ? r() * W * .25 : W * .75 + r() * W * .25; by = H; a = -Math.PI / 2 + (r() - .5) * 1.4; }
      else if (side < .7) { bx = r() * W; by = H; a = -Math.PI / 2 + (r() - .5) * 1.5; } else { bx = r() < .5 ? 0 : W; by = H * (.3 + r() * .7); a = bx ? Math.PI + (r() - .5) * 1.2 : (r() - .5) * 1.2; }
      const Ll = (40 + r() * 170) * o.sc, wd = Ll * (.08 + r() * .1), tx = bx + Math.cos(a) * Ll, ty = by + Math.sin(a) * Ll, nx = -Math.sin(a), ny = Math.cos(a);
      const g = x.createLinearGradient(bx, by, tx, ty); g.addColorStop(0, 'rgba(225,238,255,.42)'); g.addColorStop(1, 'rgba(225,238,255,.04)');
      x.fillStyle = g; x.beginPath(); x.moveTo(bx + nx * wd, by + ny * wd); x.lineTo(tx, ty); x.lineTo(bx - nx * wd, by - ny * wd); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(bx + nx * wd, by + ny * wd); x.lineTo(tx, ty); x.stroke();
    }
  },
  botanicals(x, W, H, r, o) {
    const n = Math.round(34 / o.sc);
    for (let k = 0; k < n; k++) {
      let px = r() * W; const py = r() * H;
      if (o.edges) px = r() < .5 ? r() * W * .26 : W * .74 + r() * W * .26;
      else if (px > W * .38 && px < W * .62 && r() < .7) continue;
      const t = r(), S = (18 + r() * 38) * o.sc;
      x.save(); x.translate(px, py); x.rotate(r() * 6.3);
      if (t < .55) { x.fillStyle = o.fill; x.beginPath(); x.moveTo(0, -S); x.quadraticCurveTo(S * .7, 0, 0, S); x.quadraticCurveTo(-S * .7, 0, 0, -S); x.fill();
        x.strokeStyle = o.rimA(.25); x.lineWidth = 1; x.beginPath(); x.moveTo(0, -S); x.lineTo(0, S); x.stroke(); }
      else if (t < .8) { for (let j = 0; j < 9; j++) { x.fillStyle = j % 3 ? o.fill : o.rimA(.25); x.beginPath(); x.arc((j % 3 - 1) * S * .32, (j / 3 | 0) * S * .3, S * .17, 0, 6.3); x.fill(); } }
      else { x.fillStyle = o.rimA(.3); x.beginPath(); x.arc(0, 0, S * .22, 0, 6.3); x.fill(); }
      x.restore();
    }
  },
};
function drawLayer(th, o, W, H, seed) {
  const r = rng(seed);
  const rc = new THREE.Color(th.rim), rimA = a => `rgba(${rc.r * 255 | 0},${rc.g * 255 | 0},${rc.b * 255 | 0},${a})`;
  return cTex(W, H, (x) => {
    if (o.edges) { x.save(); x.beginPath(); x.rect(0, 0, W * .24, H); x.rect(W * .76, 0, W * .24, H); x.clip(); }
    if (o.blur) x.filter = `blur(${o.blur * W / 1024}px)`;
    const sc = o.sc * W / 1024;
    DRAW[th.draw](x, W, H, r, { ...o, sc, fill: o.fill || th.fill, rimA });
    x.filter = 'none';
    if (o.edges) { x.restore(); x.globalCompositeOperation = 'destination-in'; const fg = x.createLinearGradient(0, 0, W, 0);
      fg.addColorStop(0, '#000'); fg.addColorStop(.17, '#000'); fg.addColorStop(.25, 'rgba(0,0,0,0)'); fg.addColorStop(.75, 'rgba(0,0,0,0)'); fg.addColorStop(.83, '#000'); fg.addColorStop(1, '#000');
      x.fillStyle = fg; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
    x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rimA(o.rim)); g.addColorStop(.7, rimA(0)); x.fillStyle = g; x.fillRect(0, 0, W, H);
  });
}
function buildEnv(i) {
  const p = P[i], th = THEMES[p.theme], g = new THREE.Group(); g.position.x = X(i); g.visible = false; scene.add(g);
  const Q = mobile() ? .5 : 1, layers = [];
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(26, 12), new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, transparent: true, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color(th.top) }, uBot: { value: new THREE.Color(th.bot) }, uSun: { value: new THREE.Color(th.sun) }, uSunPos: { value: new THREE.Vector2(...th.sp) }, uSunR: { value: th.sr }, uO: { value: 0 }, uTime: { value: 0 } } }));
  sky.position.set(0, 3.2, .25); sky.renderOrder = 2; g.add(sky);
  const add = (tex, w, h, z, y, base, ro, additive) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, fog: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, color: additive ? new THREE.Color(th.haze) : 0xffffff }));
    m.position.set(0, y + h / 2, z); m.renderOrder = ro; g.add(m); layers.push({ m, base });
  };
  const ground = th.draw !== 'botanicals';
  const yb = th.draw === 'botanicals' ? .2 : -.35;
  add(drawLayer(th, { sc: .55, blur: 3, rim: .22, ground }, 1024 * Q, 512 * Q, i * 11 + 1), 18, 6, .7, yb, 1, 3);
  add(fogBandTex, 20, 2.2, 1.0, .1, .22, 3.5, true);
  add(drawLayer(th, { sc: .95, blur: 1.2, rim: .32, ground }, 1024 * Q, 512 * Q, i * 11 + 2), 13, 4.6, 1.6, yb, 1, 4);
  add(fogBandTex, 16, 1.6, 2.0, 0, .16, 4.5, true);
  add(drawLayer(th, { sc: 1.5, blur: 0, rim: .42, ground }, 1024 * Q, 512 * Q, i * 11 + 3), 10, 3.6, 2.4, yb - .1, 1, 5);
  add(drawLayer(th, { sc: 2.2, blur: 12, rim: .3, ground: false, edges: true, fill: th.fill }, 512 * Q, 256 * Q, i * 11 + 4), 7.2, 2.4, 5.0, -1.45, .9, 11);
  // giant title behind the bottle
  const titleTex = cTex(2048 * Q, 400 * Q, (x, w, h) => {
    x.font = `italic 400 ${300 * Q}px "Cormorant Garamond", Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    const t = p.brand.toUpperCase(); const rc = new THREE.Color(p.c);
    x.fillStyle = `rgba(${rc.r * 255 | 0},${rc.g * 255 | 0},${rc.b * 255 | 0},.10)`; x.fillText(t, w / 2, h / 2);
    x.strokeStyle = `rgba(${rc.r * 255 | 0},${rc.g * 255 | 0},${rc.b * 255 | 0},.55)`; x.lineWidth = 2 * Q; x.strokeText(t, w / 2, h / 2);
  });
  const title = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 1.86), new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  title.position.set(0, 1.55, 1.25); title.renderOrder = 4.8; g.add(title);
  return { g, sky, layers, title };
}

/* ------------------------------------------------------------------ camera shots */
const FOV = () => mobile() ? 40 : 35;
function camWide() {
  const asp = innerWidth / innerHeight, t = Math.tan(FOV() * Math.PI / 360);
  const fitW = mobile() ? ROWW * .6 : ROWW * 1.08;
  return { x: 0, y: 1.75, z: Math.max((fitW / 2) / (t * asp), 7), lx: 0, ly: 1.45, lz: 0 };
}
const camNiche = i => mobile() ? { x: X(i), y: 1.55, z: 6.4, lx: X(i), ly: 1.2, lz: -.5 } : { x: X(i), y: 1.55, z: 4.5, lx: X(i), ly: 1.38, lz: -.5 };
const camMid = (a, b) => { const m = (X(a) + X(b)) / 2; return mobile() ? { x: m, y: 1.8, z: 9.5, lx: m, ly: 1.35, lz: 0 } : { x: m, y: 1.75, z: 7.2, lx: m, ly: 1.4, lz: 0 }; };
function camStage(i, off, close) {
  if (mobile()) return { x: X(i), y: 1.5, z: close ? 8.1 : 9.1, lx: X(i), ly: close ? .7 : .5, lz: SZ };
  const cx = X(i) + off * .25;
  return close ? { x: cx, y: 1.25, z: 6.05, lx: cx, ly: 1.12, lz: SZ } : { x: cx, y: 1.32, z: 7.5, lx: cx, ly: 1.04, lz: SZ };
}

/* ------------------------------------------------------------------ DOM: chapters */
const split = t => t.split(/(\*[^*]+\*)/).filter(Boolean).map(seg => {
  const it = seg.startsWith('*'), txt = it ? seg.slice(1, -1) : seg;
  const words = txt.split(/(\s+)/).map(w => /^\s+$/.test(w) ? ' ' : `<span class="w"><span>${w}</span></span>`).join('');
  return it ? `<em>${words}</em>` : words;
}).join('');
const statHTML = s => `<div class="stat"><span class="num" data-n="${s.n ?? ''}" data-pre="${s.pre || ''}" data-suf="${s.suf || ''}">${s.t ?? ((s.pre || '') + '0' + (s.suf || ''))}</span><small>${s.l}</small></div>`;
const mail = (sub) => `mailto:${window.CONTACT}?subject=${encodeURIComponent(sub)}`;
$('#mailTop').href = mail('Contact — Obsidienne'); $('#mailAll').href = mail('Demande de catalogue pro');
$('#chapters').innerHTML = P.map((p, i) => {
  const sides = mobile() ? ['B', 'B', 'B', 'B'] : ['L', 'R', 'L', 'R'];
  const b = p.beats.map((bt, k) => `
    <section class="beat ${sides[k]}" data-i="${i}" data-k="${k}">
      <div class="bk"><b>${fmt(i + 1)}.${k + 1}</b><i></i>${bt.k}</div>
      <h3>${split(bt.h)}</h3>
      ${bt.p ? `<p>${bt.p}</p>` : ''}
      ${bt.notes ? `<ul class="notes">${bt.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
      ${bt.serve ? `<div class="serve">${bt.serve}</div>` : ''}
      ${bt.stat ? statHTML(bt.stat) : ''}
    </section>`).join('');
  const card = `
    <section class="beat card ${sides[3]}" data-i="${i}" data-k="3">
      <div class="bk"><b>${fmt(i + 1)}.4</b><i></i>La bouteille</div>
      <h3>${split(p.name)}</h3>
      <dl><div><dt>Catégorie</dt><dd>${p.cat}</dd></div><div><dt>Origine</dt><dd>${p.origin}</dd></div><div><dt>Degré</dt><dd>${p.deg}</dd></div><div><dt>Contenance</dt><dd>${p.vol}</dd></div></dl>
      <div class="buy"><div class="price">Sur demande<small>tarif pro</small></div><a class="pill solid" href="${mail('Commande : ' + p.brand + ' ' + p.name.replace(/\*/g, ''))}">Commander</a></div>
    </section>`;
  return `<div class="chap" style="--c:${p.c}">
    <div class="chead" data-i="${i}"><div class="k"><b>Chapitre ${fmt(i + 1)}</b> &nbsp;·&nbsp; ${p.cat} — ${p.origin}</div><h2>${split(p.name)}</h2></div>
    ${b}${card}</div>`;
}).join('');
$('#hTot').textContent = fmt(N);

/* ------------------------------------------------------------------ timeline */
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ lerp: .08, smoothWheel: true, syncTouch: false });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
const UNIT_VH = 52;
let tl, st, chStart = [], chEnd = [], chBeat = [], ready = false;

function canonical() {
  Object.assign(C, camWide());
  B.forEach((b, i) => Object.assign(b, { x: X(i), y: PLY, z: -ND * .5, rot: 0, tilt: 0, yaw: 0, stage: 0 }));
  L.forEach(l => Object.assign(l, { lit: 1, strip: 1 })); E.forEach(e => Object.assign(e, { mix: 0, tx: 0 }));
  Object.assign(SH, { L: 0, R: 0, B: 0, bar: 0 }); Object.assign(LIGHT, { x: -.55, y: .55, z: .75 });
  Object.assign(ACC, hex('#e46e91')); Object.assign(FX, FXP.dust, { cx: 0, spread: 2.4 });
}
function beatIn(el, t) {
  tl.set(el, { autoAlpha: 1 }, t);
  tl.fromTo(el.querySelectorAll('.w>span'), { yPercent: 115, rotate: 5 }, { yPercent: 0, rotate: 0, duration: .8, stagger: .045, ease: 'power4.out', immediateRender: false }, t);
  tl.fromTo(el.querySelectorAll('.bk,p,.serve,.stat,dl,.buy'), { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .7, stagger: .08, ease: 'power3.out', immediateRender: false }, t + .15);
  const lis = el.querySelectorAll('.notes li');
  if (lis.length) tl.fromTo(lis, { autoAlpha: 0, y: 26, scale: .85, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: .6, stagger: .1, ease: 'back.out(1.6)', immediateRender: false }, t + .35);
  const num = el.querySelector('.num');
  if (num && num.dataset.n !== '') {
    const o = { v: 0 }, n = +num.dataset.n, pre = num.dataset.pre, suf = num.dataset.suf;
    tl.fromTo(o, { v: 0 }, { v: n, duration: 1.1, ease: 'power2.out', immediateRender: false, onUpdate: () => { num.textContent = pre + Math.round(o.v) + suf; } }, t + .4);
  }
}
function beatOut(el, t) {
  tl.to(el.querySelectorAll('.w>span'), { yPercent: -112, duration: .5, stagger: .02, ease: 'power2.in' }, t);
  tl.to(el.querySelectorAll('.bk,p,.serve,.stat,dl,.buy,.notes li'), { autoAlpha: 0, y: -14, duration: .4, stagger: .03, ease: 'power2.in' }, t);
  tl.set(el, { autoAlpha: 0 }, t + .62);
}

function build() {
  if (st) st.kill(); if (tl) tl.kill();
  canonical();
  gsap.set('.beat,.chead,#outro', { autoAlpha: 0 });
  tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  chStart = []; chEnd = []; chBeat = [];
  tl.to({}, { duration: .9 }, 0);
  tl.to('#ctitle', { autoAlpha: 0, y: -30, duration: .6 }, .25);
  tl.to('#hint', { autoAlpha: 0, duration: .3 }, .25);
  let t = .9;
  const offs = mobile() ? [0, 0, 0, 0] : [1, -1, .85, -1];
  P.forEach((p, i) => {
    chStart[i] = t;
    /* A — travel to the niche */
    if (i === 0) tl.to(C, { ...camNiche(0), duration: 1.7, ease: 'power3.inOut' }, t);
    else { tl.to(C, { ...camMid(i - 1, i), duration: .85, ease: 'power2.in' }, t); tl.to(C, { ...camNiche(i), duration: .95, ease: 'power3.out' }, t + .85); }
    P.forEach((q, j) => { if (j !== i) tl.to(L[j], { lit: .07, strip: .22, duration: .8 }, t + .1); });
    tl.to(L[i], { lit: 1, strip: 1, duration: .6 }, t + .5);
    tl.to(ACC, { ...hex(p.c), duration: .8 }, t + .4);
    tl.to(FX, { ...FXP.dust, cx: X(i), spread: 1, duration: 1.2 }, t);
    t += 1.8;
    /* B — the bottle comes out of its niche */
    const s0 = t;
    tl.to(B[i], { z: SZ, y: .28, duration: 1.5, ease: 'power3.inOut' }, s0);
    tl.fromTo(B[i], { rot: -p.rot * 2.8 }, { rot: 0, duration: 1.8, ease: 'power2.out', immediateRender: false }, s0);
    tl.to(B[i], { stage: 1, duration: 1.1 }, s0 + .25);
    tl.to(B[i], { keyframes: { tilt: [0, .07, -.035, 0], yaw: [0, -.12, .05, 0] }, duration: 1.6 }, s0);
    tl.to(C, { ...camStage(i, 0, false), duration: 1.6, ease: 'power3.inOut' }, s0);
    tl.to(E[i], { mix: 1, duration: 1.2 }, s0 + .35);
    tl.to(L[i], { lit: .3, duration: 1 }, s0 + .5);
    tl.to(FX, { ...FXP[p.fx], duration: 1 }, s0 + .5);
    tl.to(SH, { bar: mobile() ? 0 : 1, duration: 1 }, s0 + .2);
    const ch = $$('.chead')[i];
    tl.set(ch, { autoAlpha: 1 }, s0 + .6);
    tl.fromTo(ch.querySelectorAll('.k,.w>span'), { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: .7, stagger: .05, ease: 'power3.out', immediateRender: false }, s0 + .6);
    tl.to(ch.querySelectorAll('.k,.w>span'), { autoAlpha: 0, yPercent: -60, duration: .45, stagger: .02, ease: 'power2.in' }, s0 + 1.9);
    tl.set(ch, { autoAlpha: 0 }, s0 + 2.4);
    t = s0 + 2.2;
    /* C — four beats of story */
    const beats = $$(`.beat[data-i="${i}"]`); chBeat[i] = [];
    beats.forEach((el, k) => {
      const bt = t, side = el.classList.contains('L') ? 'L' : el.classList.contains('R') ? 'R' : 'B', close = k === 2;
      chBeat[i].push(bt);
      tl.to(B[i], { x: X(i) + offs[k], rot: (k % 2 ? -1 : 1) * p.rot * (close ? .5 : 1), duration: 1.3, ease: 'power3.inOut' }, bt);
      tl.to(B[i], { keyframes: { tilt: [0, (offs[k] > 0 ? -1 : 1) * .05, 0] }, duration: 1.3 }, bt);
      tl.to(C, { ...camStage(i, offs[k], close), duration: 1.4, ease: 'power3.inOut' }, bt);
      tl.to(SH, { L: side === 'L' ? 1 : 0, R: side === 'R' ? 1 : 0, B: side === 'B' ? 1 : 0, duration: .8 }, bt + .1);
      tl.to(LIGHT, { x: k % 2 ? .65 : -.65, y: k === 2 ? .25 : .55, duration: 1.4 }, bt);
      tl.to(E[i], { tx: -offs[k] * .35, duration: 1.4 }, bt);
      beatIn(el, bt + .55);
      const hold = 1.6;
      if (close) tl.to(B[i], { rot: p.rot * .5, duration: hold + .6, ease: 'none' }, bt + 1.3);   // slow turn on the label
      beatOut(el, bt + 1.3 + hold);
      t = bt + 1.3 + hold + .55;
    });
    /* D — back into the niche */
    const r0 = t;
    tl.to(E[i], { mix: 0, tx: 0, duration: 1.1 }, r0);
    tl.to(SH, { L: 0, R: 0, B: 0, bar: 0, duration: .7 }, r0);
    tl.to(B[i], { x: X(i), z: -ND * .5, y: PLY, duration: 1.4, ease: 'power3.inOut' }, r0);
    tl.to(B[i], { rot: p.rot * 2.4, duration: 1.4, ease: 'power2.in' }, r0);
    tl.set(B[i], { rot: 0 }, r0 + 1.45);
    tl.to(B[i], { stage: 0, duration: .9 }, r0 + .4);
    tl.to(L[i], { lit: 1, duration: .6 }, r0 + .5);
    if (i < N - 1) tl.to(C, { ...camNiche(i), duration: 1.3, ease: 'power3.inOut' }, r0);
    t = r0 + 1.35; chEnd[i] = t;
  });
  /* outro — all the lights come back */
  tl.to(C, { ...camWide(), duration: 2.2, ease: 'power3.inOut' }, t);
  P.forEach((q, j) => { tl.to(L[j], { lit: 1, strip: 1, duration: .25 }, t + .8 + j * .1); });
  tl.to(FX, { ...FXP.dust, cx: 0, spread: 2.4, duration: 1.2 }, t);
  tl.to(ACC, { ...hex('#e46e91'), duration: .8 }, t + .6);
  tl.fromTo('#outro', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', immediateRender: false }, t + 1.6);
  tl.to({}, { duration: 1 }, t + 2.5);

  $('#film').style.height = `calc(${(tl.duration() * UNIT_VH).toFixed(1)}vh + 100vh)`;
  st = ScrollTrigger.create({ trigger: '#film', start: 'top top', end: 'bottom bottom', scrub: 1, animation: tl });
  tl.eventCallback('onUpdate', hud);
  buildTicks(); hud();
}

/* ------------------------------------------------------------------ HUD + navigation */
let lastHud = '';
function where() {
  const t = tl.time(); let i = -1, k = -1;
  for (let j = 0; j < N; j++) if (t >= chStart[j] && t < chEnd[j]) { i = j; chBeat[j].forEach((bt, kk) => { if (t >= bt + .3) k = kk; }); }
  return { i, k };
}
function hud() {
  $('#hBar').style.width = (tl.progress() * 100).toFixed(2) + '%';
  const { i, k } = where(), key = i + ':' + k; if (key === lastHud) return; lastHud = key;
  $('#hIdx').textContent = fmt(i + 1);
  const names = ['Origine', 'Le geste', 'En bouche', 'La bouteille'];
  $('#hName').innerHTML = i < 0 ? 'La collection' : `<b>${P[i].name.replace(/\*/g, '')}</b>${k >= 0 ? ' &nbsp;·&nbsp; ' + names[k] : ''}`;
  $$('#ticks span').forEach((s, j) => s.classList.toggle('on', j === i));
}
function buildTicks() {
  const D = tl.duration();
  $('#ticks').innerHTML = P.map((p, i) => `<span style="left:${(chStart[i] + 1.8) / D * 100}%"><em>${p.name.replace(/\*/g, '')}</em></span>`).join('');
  $$('#ticks span').forEach((s, i) => s.onclick = () => goTo(i + 1));
}
const yFor = t => st.start + (st.end - st.start) * (t / tl.duration());
function goTo(k, instant) {
  stopPlay();
  const t = k === 0 ? 0 : chStart[k - 1] + 1.8 + 2.0;
  const y = yFor(t);
  lenis.scrollTo(y, { duration: instant ? 0 : Math.min(4, 1 + Math.abs(y - scrollY) / innerHeight * .08), immediate: !!instant, easing: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 });
}
let playing = false;
function play() {
  if (!ready) return;
  let from = scrollY; if (from >= st.end - 4) { lenis.scrollTo(0, { immediate: true }); from = 0; }
  playing = true; setPlayUI();
  const secs = (st.end - from) / (st.end - st.start) * tl.duration() * .85;
  lenis.scrollTo(st.end, { duration: secs, easing: x => x, onComplete: () => { playing = false; setPlayUI(); } });
}
function stopPlay() { if (!playing) return; playing = false; lenis.scrollTo(scrollY, { immediate: true }); setPlayUI(); }
function setPlayUI() {
  $('#pTxt').textContent = playing ? 'Pause' : 'Lecture';
  $('#pIco').innerHTML = playing ? '<path d="M1 0h3v10H1zM6 0h3v10H6z" fill="currentColor"/>' : '<path d="M1 0l9 5-9 5z" fill="currentColor"/>';
}
$('#play').onclick = () => playing ? stopPlay() : play();
['wheel', 'touchstart'].forEach(ev => addEventListener(ev, e => { if (playing && !(e.target.closest && e.target.closest('#play,.pill'))) stopPlay(); }, { passive: true }));
addEventListener('keydown', e => {
  if (!ready) return;
  if (e.code === 'Space') { if (e.target.closest && e.target.closest('button,a')) return; e.preventDefault(); playing ? stopPlay() : play(); return; }
  const { i } = where();
  if (e.key === 'ArrowRight') goTo(Math.min(N, i + 2));
  if (e.key === 'ArrowLeft') goTo(Math.max(0, i));
});
window.APP = { play, goTo }; window.__d = { envGroups, scene, B, C, E, at: (i, k) => (chBeat[i][k] + 1.9) / tl.duration(), em: i => (chStart[i] + 2.6) / tl.duration() };

/* click a bottle */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
canvas.addEventListener('click', e => {
  if (!ready) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(bottleMeshes)[0];
  if (hit && B[hit.object.userData.i].stage < .5) goTo(hit.object.userData.i + 1);
});
addEventListener('pointermove', e => {
  mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1;
  if (!ready) return;
  ndc.set(mouse.x, -mouse.y); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(bottleMeshes)[0];
  canvas.style.cursor = hit && B[hit.object.userData.i].stage < .5 ? 'pointer' : '';
}, { passive: true });

/* ------------------------------------------------------------------ render loop */
const clock = new THREE.Clock(); let accCss = '';
const shadeEls = { L: $('#shadeL'), R: $('#shadeR'), B: $('#shadeB') }, barEls = [$('#barT'), $('#barB')];
function frame() {
  const t = clock.getElapsedTime();
  mouse.sx = lerp(mouse.sx, mouse.x, .045); mouse.sy = lerp(mouse.sy, mouse.y, .045);
  const stageMax = Math.max(...B.map(b => b.stage));
  const par = mobile() ? .12 : .32 + stageMax * .25;
  camera.fov = FOV(); camera.updateProjectionMatrix();
  camera.position.set(C.x + mouse.sx * par + Math.sin(t * .37) * .03, C.y - mouse.sy * par * .45 + Math.sin(t * .51) * .02, C.z);
  camera.lookAt(C.lx + mouse.sx * par * .25, C.ly - mouse.sy * par * .1, C.lz);

  let act = -1, am = 0;
  const envMax = Math.max(...E.map(e => e.mix));
  for (let i = 0; i < N; i++) {
    const b = B[i], m = bottleMeshes[i], mm = mirrorMeshes[i], u = m.material.uniforms, l = L[i], np = nicheParts[i];
    const bob = Math.sin(t * 1.1 + i) * .028 * b.stage;
    m.position.set(b.x, b.y + bob, b.z); m.rotation.set(0, b.yaw + mouse.sx * .06 * b.stage, b.tilt);
    mm.position.set(b.x, -(b.y + bob), b.z); mm.rotation.set(0, b.yaw, -b.tilt);
    u.uRot.value = b.rot + Math.sin(t * .45 + i) * .06 * b.stage + mouse.sx * .18 * b.stage;
    u.uDim.value = lerp(.16 + .84 * l.lit, 1.06, b.stage);
    u.uSpec.value = .35 + .55 * b.stage; u.uRim.value = .25 + .6 * b.stage;
    u.uL.value.set(LIGHT.x + Math.sin(t * .3) * .15, LIGHT.y, LIGHT.z); u.uTime.value = t;
    u.uOpacity.value = b.stage > .02 ? 1 : 1 - envMax;
    if (b.stage > am) { am = b.stage; act = i; }
    // niche lights
    const lit = l.lit;
    np.back.material.color.setScalar(.06 + .94 * lit); np.sideMat.color.setScalar(.03 + .4 * lit);
    np.cone.material.uniforms.uI.value = lit; np.lampGlow.material.opacity = lit; np.lamp.material.color.setScalar(.16 + .84 * lit);
    np.stripMat.color.copy(np.col).multiplyScalar(.15 + .85 * l.strip); np.mStripMat.color.copy(np.stripMat.color);
    np.glowMat.opacity = .85 * l.strip; np.mGlowMat.opacity = .3 * l.strip; np.npool.material.opacity = .55 * lit * (1 - b.stage);
    // story environment
    const e = E[i], env = envGroups[i];
    env.g.visible = e.mix > .002;
    if (env.g.visible) {
      env.g.position.x = X(i) + e.tx;
      env.sky.material.uniforms.uO.value = e.mix; env.sky.material.uniforms.uTime.value = t;
      env.layers.forEach(ly => ly.m.material.opacity = e.mix * ly.base);
      env.title.material.opacity = e.mix * .9; env.title.position.x = -e.tx * 2.2 + Math.sin(t * .2) * .1;
    }
  }
  if (act >= 0) {
    const b = B[act], c = new THREE.Color(P[act].c);
    pool.position.set(b.x, .007, b.z + .1); pool.material.color.copy(c); pool.material.opacity = .55 * am;
    shadow.position.set(b.x, .009, b.z); shadow.material.opacity = .85 * am; shadow.scale.set(1 + .15 * Math.sin(t * 1.1 + act), 1, 1);
  } else { pool.material.opacity = 0; shadow.material.opacity = 0; }

  const pu = points.material.uniforms;
  pu.uTime.value = t; pu.uSpeed.value = FX.speed; pu.uSize.value = FX.size * (mobile() ? .8 : 1) * renderer.getPixelRatio() / 1.5; pu.uO.value = FX.op; pu.uRing.value = FX.ring;
  pu.uWob.value = FX.wob; pu.uCx.value = FX.cx; pu.uSpread.value = FX.spread; pu.uC.value.setRGB(FX.r, FX.g, FX.b);

  for (const k in shadeEls) shadeEls[k].style.opacity = SH[k].toFixed(3);
  const bh = (SH.bar * 5.5).toFixed(2) + 'vh'; barEls[0].style.height = bh; barEls[1].style.height = bh;
  const ac = `rgb(${ACC.r * 255 | 0},${ACC.g * 255 | 0},${ACC.b * 255 | 0})`; if (ac !== accCss) { document.documentElement.style.setProperty('--acc', ac); accCss = ac; }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ intro */
function intro() {
  lenis.stop();
  Object.assign(C, { x: -1.5, y: 5.5, z: camWide().z + 14, lx: 0, ly: 1.1, lz: 0 });
  L.forEach(l => Object.assign(l, { lit: 0, strip: 0 }));
  gsap.set(['header', '#hud', '#ctitle', '#hint'], { autoAlpha: 0 });
  const it = gsap.timeline({ onComplete: () => { build(); ready = true; lenis.start(); } });
  it.to('#loader', { autoAlpha: 0, duration: 1, ease: 'power2.inOut', onComplete: () => { $('#loader').remove(); document.body.classList.remove('loading'); } })
    .to(C, { ...camWide(), duration: 4.6, ease: 'power3.out' }, .2);
  L.forEach((l, i) => {
    const at = 1.0 + i * .2;
    it.to(l, { keyframes: [{ lit: 1, duration: .05 }, { lit: .15, duration: .07 }, { lit: .9, duration: .05 }, { lit: .3, duration: .08 }, { lit: 1, duration: .15 }] }, at)
      .to(l, { strip: 1, duration: .6, ease: 'power2.out' }, at + .15);
  });
  it.fromTo('header', { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: .9 }, 2.4)
    .fromTo('#ctitle', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 2.9)
    .fromTo(['#hud', '#hint'], { autoAlpha: 0 }, { autoAlpha: 1, duration: .8 }, 3.4);
}

/* ------------------------------------------------------------------ boot */
history.scrollRestoration = 'manual'; scrollTo(0, 0);
const setLoad = v => { $('#loader .lb i').style.transform = `scaleX(${v})`; };
buildScene(setLoad).then(() => {
  setLoad(1); $('#lmsg').textContent = 'Les lumières s’allument';
  requestAnimationFrame(frame);
  setTimeout(intro, 350);
});
let rz;
addEventListener('resize', () => {
  renderer.setPixelRatio(DPR()); renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (!ready) return;
  clearTimeout(rz); rz = setTimeout(() => { const pr = tl.progress(); build(); tl.progress(pr); ScrollTrigger.refresh(); lenis.scrollTo(yFor(pr * tl.duration()), { immediate: true }); }, 250);
});
})();
