import { cp, mkdir, rm, access } from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('dist/',root);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const name of ['index.html','404.html','manifest.webmanifest','sw.js','robots.txt','sitemap.xml','src','data','assets','vendor','pages','games']){
 try{await access(new URL(name,root))}catch{continue}
 await cp(new URL(name,root),new URL(name,out),{recursive:true});
}
console.log('dist/ pronto: somente arquivos públicos do site, sem SQL, testes ou segredos.');
