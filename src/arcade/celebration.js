import * as THREE from '../../vendor/three/three.module.js';
import { el } from '../ui/components.js';
import { t } from '../core/i18n.js';
// Bounded bursts: a new celebration replaces the old one, never accumulates GPU objects.
export function celebration(scene, host, reduced) {
 const group=new THREE.Group();scene.add(group);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.06,64),new THREE.MeshBasicMaterial({color:'#65ffd5',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
 ring.rotation.x=-Math.PI/2;ring.position.y=.07;group.add(ring);
 const geometry=new THREE.PlaneGeometry(.055,.2),materials=['#65ffd5','#ffcd65','#f876df','#73bfff'].map(color=>new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false}));
 const sparks=Array.from({length:64},(_,i)=>{const mesh=new THREE.Mesh(geometry,materials[i%4]);mesh.visible=false;group.add(mesh);return mesh});
 const overlay=el('div',{class:'room-celebration','aria-live':'polite'});host.append(overlay);let age=10,duration=0,kind='',timer;
 function trigger(detail,x){
  if(!['combo','record'].includes(detail.kind))return;
  kind=detail.kind;age=0;duration=kind==='record'?4.5:1.5;group.position.x=x;
  clearTimeout(timer);overlay.replaceChildren();overlay.dataset.kind=kind;
  const message=kind==='record'?t('features.recordCelebration'):t('features.comboCelebration',{count:detail.combo??1});
  overlay.append(el('strong',{class:'room-celebration-title'},message));
  if(!reduced()&&kind==='record')for(let i=0;i<40;i++)overlay.append(el('i',{class:'room-confetti','aria-hidden':'true',style:`--x:${(i*37)%100}%;--delay:${(i%8)*.06}s;--spin:${i*41}deg;--color:${['#65ffd5','#ffcd65','#f876df','#73bfff'][i%4]}`}));
  timer=setTimeout(()=>overlay.replaceChildren(),reduced()?2200:duration*1000);
 }
 function update(dt){
  age+=dt;const active=age<duration&&!reduced();group.visible=active;
  if(!active)return;
  const progress=age/duration;ring.scale.setScalar(1+progress*3);ring.material.opacity=(1-progress)*.9;
  materials.forEach(m=>m.opacity=1-progress);
  sparks.forEach((mesh,i)=>{const angle=i*2.39996,radius=1.3+age*(kind==='record'?1.4:.5);mesh.visible=true;mesh.position.set(Math.cos(angle)*radius,.1+age*(2+(i%7)*.35)-age*age*.35,Math.sin(angle)*radius+.6);mesh.rotation.set(age*3+i,angle,age*2);});
 }
 function dispose(){clearTimeout(timer);overlay.remove();scene.remove(group);ring.geometry.dispose();ring.material.dispose();geometry.dispose();materials.forEach(m=>m.dispose());}
 return{trigger,update,dispose};
}
