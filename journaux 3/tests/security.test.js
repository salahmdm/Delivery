const { chromium } = require('playwright');
const http = require('http'), fs = require('fs');
const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync(require('path').join(__dirname,'..','www','index.html'))); }).listen(8765);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const tap = async (pg, code) => { for (const d of code) await pg.click(`#lock button[data-k="${d}"]`); await pg.waitForTimeout(150); };
(async () => {
  const br = await chromium.launch(); const ctx = await br.newContext(); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (/Content Security|Refused/i.test(m.text())) errs.push('CSP ' + m.text()); });
  const url = 'http://localhost:8765/';
  await pg.goto(url); await pg.waitForSelector('#app button');
  ok(errs.length === 0, 'chargement sans erreur/CSP ' + JSON.stringify(errs));
  await pg.evaluate(() => setMode('admin'));
  await pg.evaluate(() => { D.w.push({ id: 'w1', name: "Jean d'Arc <b>", rt: 'paper', rate: 0.1, flat: 0, fuel: 0, veh: 0, oth: 0 }); D.r.push({ id: 'r1', name: 'T1', wid: 'w1', vol: 100, pp: 0.3 }); D.d.push({ id: 'd1', w: 'w1', r: 'r1', day: '2026-10-01', count: 100, st: 'ok' }); sv(); });
  ok(await pg.evaluate(() => esc("a'b")) === 'a&#39;b', 'esc échappe l\'apostrophe');
  // activer le PIN
  await pg.evaluate(() => pinMenu()); await tap(pg, '123456'); ok(await pg.locator('#lock h2').innerText() === 'Nouveau code', 'faible 123456 refusé: ' + await pg.locator('#lock small').innerText());
  await tap(pg, '000000'); await tap(pg, '000000');
  await pg.waitForTimeout(100); ok((await pg.locator('#lock small').innerText()).includes('simple'), 'code répétitif refusé');
  await tap(pg, '482915'); await tap(pg, '482915'); await pg.waitForTimeout(1500);
  let ls = await pg.evaluate(() => ({ ...localStorage }));
  ok(!('db' in ls) && !('prof' in ls), 'plus de données en clair'); ok('dbe' in ls && 'profe' in ls && 'pin2' in ls, 'données chiffrées présentes');
  ok(!JSON.stringify(ls).includes('Jean'), 'aucun nom en clair dans le stockage');
  // modification après activation => chiffrée
  await pg.evaluate(() => { D.w[0].name = 'Marie Secrète'; sv(); }); await pg.waitForTimeout(800);
  ls = await pg.evaluate(() => ({ ...localStorage })); ok(!JSON.stringify(ls).includes('Secrète'), 'nouvelles écritures chiffrées');
  // rechargement => verrou, mauvais code puis bon code
  await pg.reload(); await pg.waitForSelector('#lock');
  ok(await pg.evaluate(() => typeof D === 'undefined'), "l'appli n'est pas exécutée avant déverrouillage");
  await tap(pg, '111222'); await pg.waitForTimeout(1500); ok((await pg.locator('#lock small').innerText()).includes('incorrect'), 'mauvais code refusé');
  await tap(pg, '482915'); await pg.waitForFunction(() => !document.getElementById('lock') && typeof D !== 'undefined', null, { timeout: 15000 });
  ok(await pg.evaluate(() => D.w[0].name === 'Marie Secrète' && D.d.length === 1), 'données restaurées après déverrouillage');
  // sauvegarde chiffrée
  const env = await pg.evaluate(async () => SEC.wrap(JSON.stringify(D))); ok(env.startsWith('{"jrnenc"') && !env.includes('Marie'), 'sauvegarde chiffrée');
  ok((await pg.evaluate(async e => SEC.unwrap(e, '482915'), env)).includes('Marie'), 'sauvegarde déchiffrable avec le bon code');
  ok(await pg.evaluate(async e => SEC.unwrap(e, '000001').then(() => false, () => true), env), 'mauvais code sur sauvegarde refusé');
  // validation restauration
  ok(await pg.evaluate(() => { try { restoreText('{"w":1,"r":[],"d":[]}'); return false } catch (e) { return true } }), 'restauration invalide rejetée');
  // import validé
  const mk = o => 'JRN1:' + Buffer.from(unescape(encodeURIComponent(JSON.stringify(o))), 'binary').toString('base64');
  const bad = mk({ n: 'X', d: [{ i: 'abcd', day: '2026-10-02', r: 'T1', c: -5 }] });
  await pg.evaluate(() => imp()); await pg.fill('#f_c', bad); await pg.click('.ff .btn'); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => D.d.length) === 1 && await pg.locator('.toast').count() > 0, 'import invalide rejeté');
  await pg.evaluate(() => m.innerHTML = ''); await pg.evaluate(() => document.querySelectorAll('.toast').forEach(x => x.remove()));
  const good = mk({ n: 'Paul', d: [{ i: 'zz11', day: '2026-10-02', r: 'T1', c: 40 }] });
  await pg.evaluate(() => imp()); await pg.fill('#f_c', good); await pg.click('.ff .btn'); await pg.waitForSelector('#y_'); ok(await pg.evaluate(() => D.d.length) === 1, 'import en attente de confirmation');
  await pg.click('#y_'); await pg.waitForTimeout(300); ok(await pg.evaluate(() => D.d.length) === 2, 'import confirmé');
  // arrondi
  ok(await pg.evaluate(() => pay({ rt: 'paper', rate: 0.1 }, [{ day: '2026-10-01', count: 3 }]) === 0.3), 'arrondi centime (0.1*3)');
  // retirer le PIN
  await pg.evaluate(() => pinOff()); await tap(pg, '482915'); await pg.waitForTimeout(2000);
  ls = await pg.evaluate(() => ({ ...localStorage })); ok('db' in ls && !('pin2' in ls) && !('dbe' in ls), 'PIN retiré : retour au clair');
  // migration ancien PIN (hash non salé 4 chiffres, données en clair)
  const ctx2 = await br.newContext(); const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push('PE2 ' + e.message));
  await p2.goto(url); await p2.evaluate(async () => { const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('jrn:1234')))].map(x => x.toString(16).padStart(2, '0')).join(''); localStorage.setItem('pin', h); localStorage.setItem('db', JSON.stringify({ w: [{ id: 'a', name: 'Ancien', rt: 'paper', rate: 1 }], r: [], d: [] })); localStorage.setItem('prof', JSON.stringify({ mode: 'admin', name: '', d: [], sent: [] })); });
  await p2.reload(); await p2.waitForSelector('#lock'); await tap(p2, '1234'); await p2.waitForTimeout(400);
  ok(await p2.locator('#lock h2').innerText() === 'Protection renforcée', 'ancien PIN => demande un code à 6 chiffres');
  await tap(p2, '739104'); await tap(p2, '739104'); await p2.waitForFunction(() => typeof D !== 'undefined' && !document.getElementById('lock'), null, { timeout: 15000 });
  const l2 = await p2.evaluate(() => ({ ...localStorage })); ok(!('db' in l2) && !('pin' in l2) && 'dbe' in l2 && !JSON.stringify(l2).includes('Ancien'), 'migration : chiffré, ancien hash supprimé');
  ok(await p2.evaluate(() => D.w[0].name) === 'Ancien', 'migration : données conservées');
  // verrouillage par délai après 5 erreurs
  await p2.reload(); await p2.waitForSelector('#lock'); for (let i = 0; i < 5; i++) { await tap(p2, '000000'); await p2.waitForTimeout(1300); }
  await tap(p2, '739104'); await p2.waitForTimeout(500); ok((await p2.locator('#lock small').innerText()).includes('Trop d'), 'délai après 5 erreurs (même avec le bon code)');
  ok(errs.length === 0, 'aucune erreur JS/CSP : ' + JSON.stringify(errs));
  await br.close(); srv.close(); console.log(fails ? fails + ' ECHEC(S)' : 'TOUT OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
