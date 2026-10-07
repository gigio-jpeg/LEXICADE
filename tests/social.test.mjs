import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {ghostValue,saveGhost,loadGhost} from '../src/arcade/ghost.js';import {anagramPool,wordDeck} from '../src/arcade/word-deck.js';import {seeded,normalize} from '../src/core/rng.js';import {validDuelId} from '../src/arcade/duel-link.js';
test('Fantasma interpola tempo e só substitui uma partida por recorde maior',()=>{
 const samples=[{ms:0,value:0},{ms:1000,value:10},{ms:2000,value:20}];assert.equal(ghostValue(samples,500),5);assert.equal(ghostValue(samples,4000),20);
 assert.equal(saveGhost('test',{phrases:['frase'],samples,score:100},null),true);
 assert.equal(loadGhost('test',['frase']).score,100);
 assert.equal(saveGhost('test',{phrases:['frase'],samples,score:99},{score:100}),false);
 assert.equal(loadGhost('test',['nova frase']),null);
});
test('Anagrama usa mais de 1600 palavras reais por idioma e não repete na rodada',async()=>{
 for(const lang of ['pt','en','es']){
  const get=async n=>JSON.parse(await readFile(new URL(`../data/words/${lang}/${n}.json`,import.meta.url),'utf8'));
  const pool=anagramPool(await get('curadas'),await get('comuns'));assert.ok(pool.length>=1600,lang);
  assert.equal(new Set(pool.map(normalize)).size,pool.length);
  const recent=pool.filter(w=>normalize(w).length<=5).slice(0,80);const draw=wordDeck(pool,seeded('deck'),recent);const seen=new Set();
  for(let i=0;i<100;i++){const word=draw(5);assert.ok(!recent.includes(word));assert.ok(!seen.has(normalize(word)));seen.add(normalize(word))}
 }
});
test('Convites aceitam somente UUIDs, sem destinos ou scripts arbitrários',()=>{
 assert.equal(validDuelId('12345678-1234-4234-8234-123456789abc'),true);assert.equal(validDuelId('https://example.invalid'),false);assert.equal(validDuelId(null),false);
});
