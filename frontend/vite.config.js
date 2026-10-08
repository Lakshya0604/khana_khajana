import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Generate public catalogue HTML at build time, independent of sign-in or API cold starts.
function publicCatalogue() {
  let outDir
  return {
    name: 'public-catalogue',
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir) },
    closeBundle() {
      const listings = JSON.parse(fs.readFileSync(new URL('../backend/seed/listings.json', import.meta.url), 'utf8'))
      const base = 'https://khana-khajana-2ijn.onrender.com'
      const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
      const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const cities = [...new Set(listings.map(r => r.city))].sort((a,b) => a === 'Agra' ? -1 : b === 'Agra' ? 1 : a.localeCompare(b))
      const pages = []
      const link = (url, label) => `<a href="${url}">${esc(label)}</a>`
      const cards = entries => `<div class="grid">${entries.map(([url,label,text]) => `<article>${link(url,label)}<p>${esc(text)}</p></article>`).join('')}</div>`
      const note = '<aside>Catalogue information comes from previously collected public listings. These restaurants are not confirmed delivery partners. Menus, opening hours, prices and delivery availability may have changed. Check current details directly with the restaurant before ordering. Online payments in the app are in test mode.</aside>'
      const faqs = [
        ['Can I browse without an account?', 'Yes. Public city, restaurant and dish guides can be read without signing in. An account is needed to use the ordering app.'],
        ['Are all restaurants delivery partners?', 'No. Public catalogue entries are not proof of a delivery partnership or current availability. Confirm directly before ordering.'],
        ['Are online payments live?', 'Online payments currently run in Razorpay test mode. No live online payment service is advertised here.']
      ]
      const faqHtml = `<section><h2>Before you order</h2>${faqs.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`
      const css = `*{box-sizing:border-box}body{margin:0;background:#fff9f6;color:#29231f;font:16px/1.6 system-ui,sans-serif}header,main,footer{max-width:1100px;margin:auto;padding:24px}header{display:flex;gap:20px;align-items:center;justify-content:space-between;border-bottom:1px solid #eadbd2}a{color:#ad3518;text-underline-offset:3px}header a{font-weight:700}h1{font-size:clamp(28px,5vw,44px);line-height:1.15;max-width:850px}h2{margin-top:32px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:16px}article{background:white;border:1px solid #eadbd2;border-radius:16px;padding:20px}article a{font-size:20px;font-weight:700}article p{margin-bottom:0}aside{padding:16px;background:#fff0d6;border-left:4px solid #bb6300;margin:24px 0;border-radius:8px}nav{display:flex;gap:10px;flex-wrap:wrap;font-size:14px}.cta{display:inline-block;background:#c43c1d;color:white;border-radius:8px;padding:10px 18px;font-weight:700}details{background:white;border-bottom:1px solid #eadbd2;padding:16px}summary{font-weight:600;cursor:pointer}footer{font-size:14px;color:#62534b}ul{padding-left:24px}li{margin:8px 0}@media(max-width:500px){header,main,footer{padding:18px}header{gap:12px;font-size:14px}}`
      const website = {'@type':'WebSite','@id':base+'/#website',name:'Khana Khajana',url:base+'/',inLanguage:'en-IN'}
      const write = (url,title,desc,body,crumbs=[],extra=[]) => {
        const graph = [website,{'@type':'WebPage','@id':base+url+'#page',url:base+url,name:title,description:desc,isPartOf:{'@id':base+'/#website'}},...extra]
        if (crumbs.length) graph.push({'@type':'BreadcrumbList',itemListElement:crumbs.map(([u,n],i)=>({'@type':'ListItem',position:i+1,name:n,item:base+u}))})
        const nav = crumbs.map(([u,n])=>link(u,n)).join(' / ')
        const html = `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="google-site-verification" content="VmtF0n2v9kW-PdDnQYRXZWfHCxVaf0Ue8J7DGcgmmY0"><link rel="canonical" href="${base+url}"><link rel="icon" href="/favicon.svg"><meta property="og:type" content="website"><meta property="og:site_name" content="Khana Khajana"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${base+url}"><meta property="og:image" content="${base}/og-image.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${base}/og-image.png"><style>${css}</style><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script></head><body><header>${link('/','Khana Khajana')}<a class="cta" href="/signin">Open ordering app</a></header><main><nav aria-label="Breadcrumb">${nav}</nav>${body}</main><footer>${link('/browse/','Browse all cities')} · ${link('/signin','Sign in')}<p>Public food catalogue by Khana Khajana. Listing information is not a guarantee of service.</p></footer></body></html>`
        const dest=path.join(outDir,url,'index.html');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);pages.push(base+url)
      }
      write('/browse/','Khana Khajana | Browse restaurants and food by city','Explore the Khana Khajana public restaurant catalogue by city. Browse menu names and dish guides before opening the ordering app.',`<h1>Find your city. Explore its food.</h1><p>Browse restaurants and menu ideas on Khana Khajana without signing in. Start with Agra, or choose another city below.</p>${note}${cards(cities.map(c=>['/cities/'+slug(c)+'/',c,listings.filter(r=>r.city===c).map(r=>r.name).join(' · ')]))}${faqHtml}`,[['/','Home'],['/browse/','Cities']])
      const groups=[['biryani',/biryani/i],['pizza',/pizza/i],['paneer',/paneer/i],['dosa',/dosa/i],['chicken',/chicken/i],['thali',/thali/i],['burgers',/burger/i],['desserts',/gulab jamun|rasmalai|ice cream|brownie|jalebi|halwa/i]]
      for (const city of cities) {
        const cp='/cities/'+slug(city)+'/'
        const restaurants=listings.filter(r=>r.city===city)
        const families=groups.filter(([,re])=>restaurants.some(r=>r.items.some(i=>re.test(i.name))))
        write(cp,`Restaurants in ${city} | Khana Khajana`, `Browse ${city} restaurant listings, cuisine information and dish guides on Khana Khajana. Confirm current menus and delivery availability directly.`, `<h1>Restaurants and food in ${esc(city)}</h1><p>Planning a meal in ${esc(city)}? Compare the cuisine and menu names in this public catalogue, then check current availability with the restaurant.</p>${note}<h2>Restaurant catalogue</h2>${cards(restaurants.map(r=>['/restaurants/'+slug(city)+'/'+slug(r.name)+'/',r.name,r.cuisines]))}<h2>Explore dishes in ${esc(city)}</h2>${cards(families.map(([name])=>[cp+'dishes/'+name+'/',name.charAt(0).toUpperCase()+name.slice(1),'See matching menu names and restaurants']))}${faqHtml}`, [['/','Home'],['/browse/','Cities'],[cp,city]])
        for(const r of restaurants){
          const rp='/restaurants/'+slug(city)+'/'+slug(r.name)+'/'
          // Never generate sample menus, prices, ratings, offers or partner claims.
          const sections=[...new Set(r.items.map(i=>i.cat))]
          const menu=r.items.length?sections.map(cat=>`<h2>${esc(cat||'Menu names')}</h2><ul>${[...new Set(r.items.filter(i=>i.cat===cat).map(i=>i.name))].map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`).join(''):'<p>A sourced menu is not available in this catalogue. No sample menu is presented as this restaurant\'s real menu.</p>'
          const schema={'@type':'Restaurant',name:r.name,address:{'@type':'PostalAddress',streetAddress:r.address,addressLocality:city,addressRegion:r.state,addressCountry:'IN'},servesCuisine:r.cuisines.split(',').map(s=>s.trim()),url:base+rp}
          write(rp,`${r.name}, ${city} | Menu guide | Khana Khajana`,`Explore the collected ${r.name} listing in ${city}: cuisine, address and available menu names. Check current details directly before ordering.`,`<h1>${esc(r.name)} in ${esc(city)}</h1><p>${esc(r.cuisines)}</p><p>Listed address: ${esc(r.address)}</p>${note}<p>${link(r.source,'Original public listing source')}</p>${menu}<h2>More in ${esc(city)}</h2>${cards(restaurants.filter(o=>o!==r).map(o=>['/restaurants/'+slug(city)+'/'+slug(o.name)+'/',o.name,o.cuisines]))}`,[['/','Home'],[cp,city],[rp,r.name]],[schema])
        }
        for(const [family,re] of families){
          const dp=cp+'dishes/'+family+'/'
          const matches=restaurants.map(r=>({r,names:[...new Set(r.items.filter(i=>re.test(i.name)).map(i=>i.name))]})).filter(x=>x.names.length)
          write(dp,`${family.charAt(0).toUpperCase()+family.slice(1)} in ${city} | Khana Khajana menu guide`,`Find ${family} menu names in the collected ${city} restaurant catalogue. Compare restaurants and check current menus and delivery availability directly.`,`<h1>${esc(family.charAt(0).toUpperCase()+family.slice(1))} in ${esc(city)}</h1><p>These collected menu names can help you compare food options in ${esc(city)}. They are catalogue references, not live offers.</p>${note}${matches.map(({r,names})=>`<section><h2>${link('/restaurants/'+slug(city)+'/'+slug(r.name)+'/',r.name)}</h2><ul>${names.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></section>`).join('')}<p>${link(cp,'See all restaurants in '+city)}</p>`,[['/','Home'],[cp,city],[dp,family]])
        }
      }
      fs.writeFileSync(path.join(outDir,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[base+'/',...pages].map(url=>`<url><loc>${esc(url)}</loc></url>`).join('')}</urlset>`)
      // Render meaningful public content before React loads. React replaces it after startup.
      const entry=path.join(outDir,'index.html')
      let html=fs.readFileSync(entry,'utf8')
      html=html.replace('<div id="root"></div>',`<div id="root"><main style="font-family:system-ui;max-width:1000px;margin:auto;padding:24px"><h1>Khana Khajana - food and restaurants in Agra</h1><p>Explore restaurant listings and dish guides before opening the ordering app.</p><p>${link('/cities/agra/','Browse Agra restaurants')} · ${link('/browse/','Browse all cities')} · ${link('/signin','Sign in to the app')}</p>${note}</main></div>`)
      fs.writeFileSync(entry,html)
      console.log(`[public-catalogue] Generated ${pages.length} static pages and sitemap`)
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), publicCatalogue()],
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' } }
})
