import { el, button } from '../ui/components.js';
import { t } from '../core/i18n.js';
import { path } from '../core/config.js';
import { session } from '../core/auth.js';
import { rpc } from '../core/api.js';
import { getClient } from '../core/supabase.js';
import { validDuelId, rememberDuel, clearDuel } from './duel-link.js';
import { normalize } from '../core/rng.js';
import { sound } from '../core/audio.js';
export async function runDuel(screen,id) {
 const abort=new AbortController(),root=el('div',{class:'screen-game screen-duel'}),status=el('p',{class:'screen-notice',role:'status'}),time=el('strong',{},'—'),phrase=el('div',{class:'phrase-target'}),input=el('input',{class:'screen-input',disabled:true,autocomplete:'off',spellcheck:'false','aria-label':t('room.typeHere'),maxlength:180});
 const rivals=el('div',{class:'duel-rivals'}),share=el('div',{class:'duel-share'}),headline=el('small',{},t('features.duel'));
 root.append(el('div',{class:'screen-hud'},headline,time),rivals,el('div',{class:'screen-game-area'},phrase),input,share,status);screen.replaceChildren(root);
 let disposed=false,match,index=0,offset=0,newest=0,busy=false,pendingSend=false,timer,sendTimer,channel,client,failures=0,finished=false;
 function invite(){const url=new URL(path());url.searchParams.set('duel',id);return url.href}
 const link=el('input',{readonly:true,value:invite(),'aria-label':t('features.inviteLink')}),copy=button(t('features.copy'),async()=>{try{await navigator.clipboard.writeText(invite());status.textContent=t('features.copied')}catch{link.select();status.textContent=t('features.copyManually')}});
 share.append(link,copy);
 if(!validDuelId(id)){status.textContent=t('features.invalidInvite');return()=>{root.remove()}}
 rememberDuel(id);
 if(!session()){
  status.textContent=t('features.loginDuel');share.replaceChildren(el('a',{href:path(`?panel=login&duel=${id}`),class:'screen-start'},t('room.login')));return()=>{root.remove()};
 }
 function paintPhrase(){const target=match.phrases[index%match.phrases.length];input.readOnly=normalize(input.value)===normalize(target);phrase.replaceChildren(...[...target].map((letter,i)=>el('span',{class:i<input.value.length?(normalize(letter)===normalize(input.value[i])?'right':'wrong'):i===input.value.length?'cursor':''},letter)))}
 function apply(data,started){if(disposed)return;const stamp=Date.parse(data.server_now);if(stamp<newest)return;newest=stamp;offset=stamp-(started+Date.now())/2;match=data;failures=0;const mine=data.players.find(p=>p.id===session()?.user.id);if(mine && mine.index!==index){index=mine.index;input.value='';sound('correct');screen.dispatchEvent(new CustomEvent('arcadefeedback',{bubbles:true,detail:{kind:'combo',combo:index}}))}
  const max=Math.max(100,...data.players.map(p=>p.chars));rivals.replaceChildren(...data.players.map(p=>el('div',{class:p.id===session()?.user.id?'duel-player is-you':'duel-player'},el('span',{},`${p.name} · ${p.chars}`),el('div',{class:'ghost-lane'},el('i',{style:`width:${p.chars/max*100}%`})))));
  paintPhrase();clock();
 }
 function clock(){if(!match||disposed)return;const remaining=60-(Date.now()+offset-Date.parse(match.starts_at))/1000;
  if(match.status==='waiting'){input.disabled=true;time.textContent='—';status.textContent=t('features.waiting');return}
  share.hidden=true;
  if(match.status==='cancelled'){input.disabled=true;status.textContent=t('features.expired');return}
  if(match.status==='finished'){
   input.disabled=true;time.textContent='0:00';if(!finished){finished=true;phrase.textContent=match.winner===session()?.user.id?t('features.win'):match.winner?t('features.loss'):t('features.tie');status.textContent=t('features.duelReward');screen.dispatchEvent(new CustomEvent('arcadefeedback',{bubbles:true,detail:{kind:match.winner===session()?.user.id?'record':'finish'}}));clearInterval(timer)}return;
  }
  if(remaining>60){input.disabled=true;time.textContent=String(Math.ceil(remaining-60));status.textContent=t('features.countdown')}
  else{input.disabled=remaining<=0||failures>0;time.textContent=`0:${String(Math.max(0,Math.ceil(remaining))).padStart(2,'0')}`;status.textContent=failures?t('features.reconnecting'):t('features.duelHelp')}
 }
 async function fetchMatch(send=false){if(disposed||finished)return;if(busy){pendingSend ||= send;return;}busy=true;const started=Date.now();try{const data=await rpc(send?'duel_progress':'get_duel',send?{p_id:id,p_index:index,p_text:input.value}:{p_id:id});apply(data,started)}catch{if(!disposed){failures++;status.textContent=t('features.reconnecting');input.disabled=true}}finally{busy=false;if(pendingSend){pendingSend=false;queueMicrotask(()=>fetchMatch(true))}}}
 input.addEventListener('input',()=>{paintPhrase();clearTimeout(sendTimer);sendTimer=setTimeout(()=>fetchMatch(true),150)},{signal:abort.signal});
 async function poll(){if(disposed||finished)return;await fetchMatch(!!input.value&&!input.disabled);if(!disposed&&!finished)timer=setTimeout(poll,failures?Math.min(8000,1000*2**failures):1000)}
 try{
  const started=Date.now();apply(await rpc('join_duel',{p_id:id}),started);clearDuel();if(disposed)return()=>{};
  client=await getClient();if(disposed)return()=>{};
  channel=client.channel(`duel:${id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'duel_players',filter:`match_id=eq.${id}`},()=>fetchMatch()).on('postgres_changes',{event:'UPDATE',schema:'public',table:'duel_matches',filter:`id=eq.${id}`},()=>fetchMatch()).subscribe();
  timer=setTimeout(poll,1000);
 }catch{if(!disposed){status.textContent=t('features.databaseError');share.hidden=false}}
 const clockTimer=setInterval(clock,200);
 return()=>{disposed=true;abort.abort();clearTimeout(timer);clearTimeout(sendTimer);clearInterval(clockTimer);if(channel)client.removeChannel(channel).catch(()=>{});screen.replaceChildren()};
}
