import { normalize } from '../core/rng.js';
export function anagramPool(curated, common) {
 const found=new Map();
 for(const word of [...curated,...Object.values(common).flat()]) {
  if(typeof word!=='string')continue;const value=normalize(word);
  if(/^[a-z]{4,8}$/.test(value)&&new Set(value).size>1&&!found.has(value))found.set(value,word);
 }
 return [...found.values()];
}
export function wordDeck(pool, random=Math.random, recent=[]) {
 const used=new Set(recent.map(normalize));let last='';
 return (maxLength=8)=>{
  let candidates=pool.filter(w=>normalize(w).length<=maxLength&&!used.has(normalize(w)));
  if(!candidates.length){used.clear();if(last)used.add(normalize(last));candidates=pool.filter(w=>normalize(w).length<=maxLength&&!used.has(normalize(w)))}
  if(!candidates.length)throw new Error('empty_word_pool');
  const word=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];used.add(normalize(word));last=word;return word;
 };
}
