import { el, button, field, toast } from '../ui/components.js';
import { t, lang } from '../core/i18n.js';
import { path, dataLang } from '../core/config.js';
import { session } from '../core/auth.js';
import { rpc } from '../core/api.js';
import { FINISHES, STICKERS, MODELS, loadCabinetStyle, saveCabinetStyle } from './personalization.js';
export async function featuresPanel(onDuel) {
 const dialog=el('dialog',{class:'room-account-dialog features-dialog'}),body=el('div');
 dialog.append(el('div',{class:'room-dialog-header'},el('h2',{},t('features.title')),button('×',()=>dialog.close(),'room-dialog-close',{'aria-label':t('common.close')})),body);
 document.body.append(dialog);dialog.showModal();let closed=false,preview;dialog.addEventListener('close',()=>{closed=true;preview?.dispose();dialog.remove()},{once:true});
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
  let model=style.model??'classic',busy=false;
  const previewHost=el('div',{class:'room-model-preview'}),hint=el('p',{class:'room-model-hint'}),cards=el('div',{class:'room-model-cards',role:'group','aria-label':t('features.model')});
  custom.append(el('h4',{},t('features.model')),previewHost,el('small',{},t('features.rotateModel')),cards,hint);
  try{preview=(await import('./model-preview.js')).modelPreview(previewHost,t('features.cabinet'));if(closed){preview.dispose();return}}catch{previewHost.append(el('p',{},t('features.previewUnavailable')))}
  const modelButtons=[];
  for(const [id,item]of Object.entries(MODELS)){
   const card=button([el('span',{class:`room-model-art model-${id}`,'aria-hidden':'true'}),el('strong',{},t(`features.model_${id}`)),el('small',{},t(`features.model_${id}_description`)),el('small',{class:'room-model-lock'},rounds<item.rounds?`${item.rounds} ${t('features.rounds')}`:t('features.available'))],()=>{model=id;refresh()},'room-model-card',{'aria-pressed':model===id,'data-model':id});modelButtons.push(card);cards.append(card);
  }
  function refresh(){
   const locked=rounds<MODELS[model].rounds;
   save.disabled=busy||locked;reset.disabled=busy;hint.textContent=locked?t('features.previewLocked',{count:MODELS[model].rounds}):t(`features.model_${model}_description`);
   modelButtons.forEach(card=>card.setAttribute('aria-pressed',card.dataset.model===model));
   preview?.update({model,title:title.value.trim(),finish:finish.value,sticker:sticker.value});
  }
  for(const node of [title,finish,sticker])node.addEventListener('input',refresh);
  const save=button(t('settings.save'),async()=>{
   if(!title.reportValidity()||busy)return;busy=true;refresh();
   try{await saveCabinetStyle({model,title:title.value.trim(),finish:finish.value,sticker:sticker.value},rounds);if(!closed)toast(t('settings.saved'))}catch{if(!closed)toast(t('features.databaseError'),true)}finally{busy=false;if(!closed)refresh()}
  });
  const reset=button(t('features.restoreDefault'),async()=>{
   if(busy)return;busy=true;refresh();
   try{await saveCabinetStyle({model:'classic',title:'',finish:'original',sticker:'none'},0);model='classic';title.value='';finish.value='original';sticker.value='none';refresh();if(!closed)toast(t('features.defaultRestored'))}catch{if(!closed)toast(t('features.databaseError'),true)}finally{busy=false;if(!closed)refresh()}
  },'button room-restore-default');
  custom.append(el('p',{},`${rounds} ${t('features.rounds')}`),field(t('features.name'),title),field(t('features.finish'),finish),field(t('features.sticker'),sticker),el('div',{class:'room-custom-actions'},save,reset));refresh();
 }catch{if(!closed)custom.append(el('p',{},t('features.databaseError')))}
}
