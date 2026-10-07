import { el, button, field, toast } from '../ui/components.js';
import { t, lang } from '../core/i18n.js';
import { path, dataLang } from '../core/config.js';
import { session } from '../core/auth.js';
import { rpc } from '../core/api.js';
import { FINISHES, STICKERS, loadCabinetStyle, saveCabinetStyle } from './personalization.js';
export async function featuresPanel(onDuel) {
 const dialog=el('dialog',{class:'room-account-dialog features-dialog'}),body=el('div');
 dialog.append(el('div',{class:'room-dialog-header'},el('h2',{},t('features.title')),button('×',()=>dialog.close(),'room-dialog-close',{'aria-label':t('common.close')})),body);
 document.body.append(dialog);dialog.showModal();let closed=false;dialog.addEventListener('close',()=>{closed=true;dialog.remove()},{once:true});
 const duel=el('section',{class:'panel feature-duel'},el('h3',{},t('features.duel')),el('p',{},t('features.duelDescription')));
 const create=button(t('features.invite'),async()=>{
  if(!session()){location.href=path('?panel=login');return}create.disabled=true;
  try{const match=await rpc('create_duel',{p_lang:dataLang(lang())});if(!closed){dialog.close();onDuel(match.id)}}catch{if(!closed){toast(t('features.databaseError'),true);create.disabled=false}}
 });duel.append(create);body.append(duel);
 const custom=el('section',{class:'panel feature-custom'},el('h3',{},t('features.cabinet')),el('p',{},t('features.customDescription')));body.append(custom);
 try{
  const {style,rounds}=await loadCabinetStyle();if(closed)return;
  const title=el('input',{value:style.title??'',maxlength:18,pattern:'[\\p{L}\\p{N} _\\-]*','aria-label':t('features.name')}),finish=el('select',{'aria-label':t('features.finish')}),sticker=el('select',{'aria-label':t('features.sticker')});
  for(const [id,item] of Object.entries(FINISHES))finish.append(el('option',{value:id,selected:id===(style.finish??'original'),disabled:rounds<item.rounds},t(`features.finish_${id}`)+(rounds<item.rounds?` · ${item.rounds} ${t('features.rounds')}`:'')));
  for(const [id,item] of Object.entries(STICKERS))sticker.append(el('option',{value:id,selected:id===(style.sticker??'none'),disabled:rounds<item.rounds},t(`features.sticker_${id}`)+(rounds<item.rounds?` · ${item.rounds} ${t('features.rounds')}`:'')));
  const save=button(t('settings.save'),async()=>{
   if(!title.reportValidity())return;save.disabled=true;reset.disabled=true;
   try{await saveCabinetStyle({title:title.value.trim(),finish:finish.value,sticker:sticker.value},rounds);if(!closed)toast(t('settings.saved'))}catch{if(!closed)toast(t('features.databaseError'),true)}finally{if(!closed){save.disabled=false;reset.disabled=false}}
  });
  const reset=button(t('features.restoreDefault'),async()=>{
   reset.disabled=true;save.disabled=true;
   try{await saveCabinetStyle({title:'',finish:'original',sticker:'none'},0);title.value='';finish.value='original';sticker.value='none';if(!closed)toast(t('features.defaultRestored'))}catch{if(!closed)toast(t('features.databaseError'),true)}finally{reset.disabled=false;save.disabled=false}
  },'button room-restore-default');
  custom.append(el('p',{},`${rounds} ${t('features.rounds')}`),field(t('features.name'),title),field(t('features.finish'),finish),field(t('features.sticker'),sticker),el('div',{class:'room-custom-actions'},save,reset));
 }catch{if(!closed)custom.append(el('p',{},t('features.databaseError')))}
}
