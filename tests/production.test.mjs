import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
test('Build Vercel inclui todo o cache offline e exclui arquivos internos', async () => {
 const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
 const built=spawnSync(process.execPath,['tools/build.mjs'],{cwd:fileURLToPath(root),encoding:'utf8'});
 assert.equal(built.status,0,built.stderr);
 const manifest=JSON.parse(await readFile(new URL('data/offline-files.json',root),'utf8'));
 for(const item of manifest)await access(new URL(item==='./'?'index.html':item,dist));
 const entries=await readdir(dist);
 for(const privateName of ['supabase','tests','docs','.git','.env','package.json','tools'])assert.ok(!entries.includes(privateName),privateName);
 const config=JSON.parse(await readFile(new URL('vercel.json',root),'utf8'));
 assert.equal(config.outputDirectory,'dist');
 assert.ok(config.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value.includes('wss://*.supabase.co'));
});
