// PostgreSQL WASM isolado. Nenhuma conexão com Supabase remoto.
// Instalação opcional: npm install --no-save --package-lock=false @electric-sql/pglite@0.3.14
// Execução: node supabase/tests/run-local.mjs
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite }=process.argv[2]?await import(pathToFileURL(process.argv[2]).href):await import('@electric-sql/pglite');
const db=new PGlite();await db.waitReady;
await db.exec(`
create role anon;create role authenticated;create schema auth;
grant usage on schema public,auth to anon,authenticated;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb,raw_app_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
grant execute on function auth.uid() to anon,authenticated;
`);
for(const file of ['migrations/001_schema.sql','migrations/002_rpcs.sql','migrations/003_queries.sql','seed.sql','migrations/004_arcade_focus.sql','migrations/005_arcade_social.sql','tests/security.sql','tests/social.sql']){
  const sql=await readFile(new URL('../'+file,import.meta.url),'utf8');
  try{await db.exec(sql);console.log('PASS',file)}catch(error){console.error('FAIL',file,error.message,'position',error.position,'internal',error.internalPosition,error.internalQuery,'context',error.where);await db.close();process.exit(1)}
}
// Extra checks against the real PostgreSQL evaluator, not a SQL parser.
const colors=await db.query(`select public.guess_colors('limão','limao') as clues,public.level_for_xp(283) as level`);
if(JSON.stringify(colors.rows[0].clues)!==JSON.stringify(Array(5).fill('correct'))||colors.rows[0].level!==2)throw new Error('SQL scoring / normalization mismatch');
await db.exec(await readFile(new URL('economy.sql',import.meta.url),'utf8'));
console.log('PASS economy.sql / JS-SQL equivalence');await db.close();
// Verifica também o caminho de instalação único, usado pelo iniciante.
const bundled=new PGlite();await bundled.waitReady;
await bundled.exec(`create role anon;create role authenticated;create schema auth;
grant usage on schema public,auth to anon,authenticated;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb,raw_app_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
grant execute on function auth.uid() to anon,authenticated;`);
try{
  await bundled.exec(await readFile(new URL('../INSTALAR-TUDO.sql',import.meta.url),'utf8'));
  const test=await bundled.query(`select count(*)::int as games from public.achievements where kind='games' and target between 1 and 4`);
  if(test.rows[0].games!==4)throw new Error('Conquistas não correspondem às quatro máquinas');
  await bundled.exec(await readFile(new URL('security.sql',import.meta.url),'utf8'));
  await bundled.exec(await readFile(new URL('economy.sql',import.meta.url),'utf8'));
  await bundled.exec(await readFile(new URL('social.sql',import.meta.url),'utf8'));
  console.log('PASS INSTALAR-TUDO.sql / segurança / economia / social');
}catch(error){console.error('FAIL INSTALAR-TUDO.sql',error.message);await bundled.close();process.exit(1)}
await bundled.close();
