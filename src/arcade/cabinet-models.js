import * as THREE from '../../vendor/three/three.module.js';
// Model geometry is allocated once per cabinet and reused when changing skins.
export function modelKit(group, {shell,paint,dark,metal,decals}) {
 const wood=new THREE.Group(),circuit=new THREE.Group(),chrome=new THREE.Group();group.add(wood,circuit,chrome);
 function texture(draw){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;draw(canvas.getContext('2d'));const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;return map;}
 const grain=texture(c=>{c.fillStyle='#9a5733';c.fillRect(0,0,256,256);for(let i=0;i<100;i++){c.strokeStyle=i%3?'#68391c88':'#e1aa7066';c.lineWidth=i%4+1;c.beginPath();for(let y=0;y<=256;y+=4){const x=i*2.6+Math.sin(y*.025+i)*3;c.lineTo(x,y)}c.stroke()}});
 const board=texture(c=>{c.fillStyle='#052b32';c.fillRect(0,0,256,256);for(let i=0;i<20;i++){const x=12+i*12;c.strokeStyle=i%2?'#4de8c0':'#67b7ff';c.lineWidth=2;c.beginPath();c.moveTo(x,256);c.lineTo(x,60+i%5*25);c.lineTo(x+20,40+i%5*25);c.lineTo(x+20,0);c.stroke();c.fillStyle='#ffd68a';c.fillRect(x-2,120+i%4*22,5,5)}c.fillStyle='#071019';c.fillRect(92,88,72,72);c.strokeStyle='#75f5d5';c.strokeRect(92,88,72,72);c.font='bold 16px monospace';c.fillStyle='#75f5d5';c.fillText('LEXI',107,128)});
 const brushed=texture(c=>{c.fillStyle='#c6d4e4';c.fillRect(0,0,256,256);for(let y=0;y<256;y++){c.fillStyle=`rgba(30,55,85,${.02+(y%7)*.012})`;c.fillRect(0,y,256,1)}});
 const cubeFaces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,64,64);g.addColorStop(0,'#101c33');g.addColorStop(.35,i%2?'#92c8ff':'#eef6ff');g.addColorStop(.48,'#ffffff');g.addColorStop(.6,'#17283b');g.addColorStop(1,'#526f91');x.fillStyle=g;x.fillRect(0,0,64,64);return c});
 const reflection=new THREE.CubeTexture(cubeFaces);reflection.colorSpace=THREE.SRGBColorSpace;reflection.needsUpdate=true;
 const brass=new THREE.MeshStandardMaterial({color:'#d7af68',metalness:.65,roughness:.35,emissive:'#614525',emissiveIntensity:.15});
 const glow=new THREE.MeshBasicMaterial({color:'#65ffd5',toneMapped:false});
 const silver=new THREE.MeshStandardMaterial({color:'#dbe7f7',metalness:.85,roughness:.18,envMap:reflection});
 function box(parent,w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m}
 for(const x of [-1.16,1.16]){box(wood,.12,4.5,.18,x,2.28,.92,brass);box(chrome,.19,4.65,.28,x,2.3,.93,silver)}
 box(wood,2.45,.16,.4,0,4.48,.65,brass);
 for(let i=0;i<6;i++)box(wood,1.6,.045,.04,0,.26+i*.075,.866,brass);
 box(chrome,2.55,.15,.55,0,4.51,.65,silver);box(chrome,2.6,.1,1.8,0,.08,0,silver);
 for(const x of [-1.32,1.32]){box(chrome,.07,.65,.08,x,4.3,.66,glow);box(chrome,.07,.07,.65,x,4.58,.6,glow)}
 for(let i=0;i<4;i++){
  const processor=box(circuit,.7,.33,.32,(i%2-.5)*1.25,.35+Math.floor(i/2)*.42,.32,new THREE.MeshStandardMaterial({color:'#071c23',metalness:.5,roughness:.4}));
  for(let pin=0;pin<5;pin++)box(circuit,.04,.055,.05,processor.position.x-.25+pin*.12,processor.position.y+.18,.5,brass);
 }
 for(const x of [-1.02,1.02])box(circuit,.035,3.2,.05,x,1.85,.5,glow);
 const pcb=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.2),new THREE.MeshBasicMaterial({map:board}));pcb.position.set(0,.7,.12);circuit.add(pcb);
 const sideBoards=[];
 for(const side of [-1,1]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.35,3.45),new THREE.MeshBasicMaterial({map:board}));panel.rotation.y=side*Math.PI/2;panel.position.set(side*.99,2.15,-.03);circuit.add(panel);sideBoards.push(panel)}
 const baseline=new Map([shell,paint,dark,metal].map(m=>[m,{color:m.color.clone(),emissive:m.emissive.clone(),emissiveIntensity:m.emissiveIntensity,metalness:m.metalness,roughness:m.roughness}]));
 let previous='classic';
 function reset(){for(const [m,b]of baseline){m.color.copy(b.color);m.emissive.copy(b.emissive);Object.assign(m,{emissiveIntensity:b.emissiveIntensity,metalness:b.metalness,roughness:b.roughness,transparent:false,opacity:1,depthWrite:true,map:null,envMap:null});m.needsUpdate=true}decals.forEach(d=>d.visible=true)}
 return {
  reset,
  apply(model,accent){previous=model;wood.visible=model==='wood';circuit.visible=model==='circuit';chrome.visible=model==='chrome';decals.forEach(d=>d.visible=model==='classic');glow.color.set(accent);
   if(model==='wood'){for(const m of [shell,paint]){m.map=grain;m.color.set('#edc79c');m.emissive.set('#38220f');m.emissiveIntensity=.24;m.metalness=.05;m.roughness=.72;}dark.color.set('#21140c');metal.color.set('#d7af68');}
   if(model==='circuit'){for(const m of [shell,paint]){m.color.set('#69d7e2');m.transparent=true;m.opacity=m===paint ? .19 : .26;m.depthWrite=false;m.metalness=.12;m.roughness=.15;m.emissive.set('#074753');m.emissiveIntensity=.25;}dark.color.set('#041921');dark.transparent=true;dark.opacity=.32;dark.depthWrite=false;}
   if(model==='chrome'){for(const m of [shell,paint,metal]){m.map=brushed;m.envMap=reflection;m.color.set('#d4e1f2');m.metalness=.85;m.roughness=.22;m.emissive.set('#17283e');m.emissiveIntensity=.18;}dark.color.set('#111b30');}
   for(const m of [shell,paint,dark,metal])m.needsUpdate=true;
  },
  get current(){return previous},
  dispose(){grain.dispose();board.dispose();brushed.dispose();reflection.dispose()}
 };
}
