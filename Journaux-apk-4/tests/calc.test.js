// Tests des règles de calcul de l'application (paie, tarifs datés, coûts, simulateur).
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "../www/index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://localhost/", pretendToBeVisual: true });
const w = dom.window;
const E = (s) => w.eval(s);
let fails = 0;
const eq = (name, got, want, tol = 1e-6) => {
  if (Math.abs(got - want) <= tol) console.log("ok   ", name);
  else { fails++; console.error("ECHEC", name, "obtenu", got, "attendu", want); }
};

// pay() : paie par journal, jour, semaine, mois
E(`var W1={rt:"paper",rate:.07,hist:[]}`);
eq("paie au journal", E(`pay(W1,[{day:"2026-10-05",count:100},{day:"2026-10-06",count:50}])`), 10.5);
E(`var W2={rt:"day",rate:30}`);
eq("paie au jour (un jour compté une fois)", E(`pay(W2,[{day:"2026-10-05",count:10},{day:"2026-10-05",count:20},{day:"2026-10-06",count:5},{day:"2026-10-07",count:5}])`), 90);
E(`var W3={rt:"week",rate:150}`);
eq("paie à la semaine", E(`pay(W3,[{day:"2026-10-05",count:1},{day:"2026-10-07",count:1},{day:"2026-10-12",count:1}])`), 300);
E(`var W4={rt:"month",rate:600}`);
eq("paie au mois complet", E(`pay(W4,[{day:"2026-10-05",count:1},{day:"2026-10-20",count:1}],1)`), 600);
eq("paie au mois au prorata", E(`pay(W4,[{day:"2026-10-05",count:1}],.5)`), 300);

// tarifs datés
E(`var W5={rt:"paper",rate:.07,hist:[{from:"2000-01-01",rt:"paper",rate:.06},{from:"2026-10-10",rt:"paper",rate:.07}]}`);
eq("ancien tarif avant la date", E(`pay(W5,[{day:"2026-10-05",count:100}])`), 6);
eq("nouveau tarif après la date", E(`pay(W5,[{day:"2026-10-12",count:100}])`), 7);

// jours planifiés
eq("jours lun-sam en octobre 2026", E(`sdays({jours:[1,2,3,4,5,6]},"2026-10")`), 27);
eq("jours lun-ven en octobre 2026", E(`sdays({jours:[1,2,3,4,5]},"2026-10")`), 22);

// stats() : revenus, salaires, résultat
E(`D.w=[{id:"w1",name:"A",rt:"paper",rate:.07,jours:[1,2,3,4,5,6],fuel:0,veh:0,oth:0,flat:0,cree:"2026-01-01"}];
   D.r=[{id:"r1",name:"T1",client:"C",wid:"w1",vol:100,volSat:100,pp:.44}];
   D.d=[{id:"d1",w:"w1",r:"r1",day:"2026-10-05",count:100,st:"ok"},{id:"d2",w:"w1",r:"r1",day:"2026-10-06",count:100,st:"p"}];
   D.co=[];D.pm=[];D.ab=[];D.en=[];PER={k:"month",o:0,a:"",b:""}`);
const S = E(`(()=>{const s=stats("2026-10-01","2026-10-31");return {N:s.N,rev:s.rev,sal:s.sal,T:s.T}})()`);
eq("journaux validés seulement", S.N, 100);
eq("revenus", S.rev, 44);
eq("salaires", S.sal, 7);
eq("résultat", S.T, 37);

// prime et retenue
E(`D.pm=[{id:"p1",w:"w1",day:"2026-10-10",type:"prime",amt:10},{id:"p2",w:"w1",day:"2026-10-11",type:"retenue",amt:4}]`);
eq("prime et retenue dans le résultat", E(`stats("2026-10-01","2026-10-31").T`), 37 - 10 + 4);

// simulateur
const SIM = `{per:"month",days:[1,2,3,4,5,6],vo:"100",vs:"",pp:"0.44",rt:"paper",rate:"0.07",t:[{n:"",vo:"100",vs:"",pp:"0.44"}],
 fl:{on:false,a:"",u:"month"},fuel:{on:false,mode:"amt",km:"60",conso:"8",prix:"1.75",a:"",u:"month"},veh:{on:false,a:"",u:"month"},
 oth:{on:true,a:"500",u:"month"},soc:{on:false,pct:"25"},co:{on:false,u:"month",a:""}}`;
const r = E(`(()=>{const c=simCalc(${SIM},1);return {J:c.J,rev:c.rev,cost:c.cost,res:c.res}})()`);
eq("simulateur : journaux par mois", r.J, 2600, 1e-6);
eq("simulateur : revenus", r.rev, 1144, 1e-6);
eq("simulateur : coûts (salaire + 500 €)", r.cost, 682, 1e-6);
eq("simulateur : résultat", r.res, 462, 1e-6);
eq("simulateur : seuil de rentabilité", E(`simBe(${SIM}).perDay`), 500 / 962 * 100, 1e-3);


// --- v38 : impayés, tendance, zip, recherche, sauvegarde ---
E(`D.w=[{id:"w1",name:"Karim",rt:"paper",rate:.07,jours:[1,2,3,4,5,6],fuel:0,veh:0,oth:0,flat:0,cree:"2020-01-01"}];
   D.r=[{id:"r1",name:"Centre-ville",client:"Journal X",wid:"w1",vol:100,volSat:100,pp:.5}];D.pm=[];D.ab=[];D.co=[];D.en=[];
   D.d=[];const t=new Date();for(let k=0;k<70;k++){const d=new Date(t);d.setDate(d.getDate()-k);if(d.getDay()!=0)D.d.push({id:"d"+k,w:"w1",r:"r1",day:iso(d),count:100,st:"ok"})}`);
const od = E(`(()=>{LS.setItem("db",JSON.stringify(D));const o=overdue().find(x=>x.c=="Journal X");return o?{over:o.over,age:o.age}:null})()`);
eq("impayés : un client sans paiement est en retard", od ? 1 : 0, 1);
eq("impayés : montant en retard positif", od && od.over > 0 ? 1 : 0, 1);
E(`D.en=[{id:"e1",c:"Journal X",day:iso(new Date()),amt:1e6,note:""}];LS.setItem("db",JSON.stringify(D))`);
eq("impayés : un gros paiement solde tout", E(`overdue().filter(x=>x.c=="Journal X").length`), 0);
const f = E(`forecastN([100,200,300,400,500,600],3)`);
eq("prévision : tendance croissante", f[0] > 600 ? 1 : 0, 1);
eq("prévision : suite plate", E(`forecastN([100,100,100,100],2)[1]`), 100, 1e-6);
eq("zip : crc32 de 'abc'", E(`crc32(new TextEncoder().encode("abc"))`), 0x352441c2);
eq("recherche : trouve le salarié sans accent ni casse", E(`srchFind("KARIM").filter(x=>x.k=="w").length`), 1);
eq("recherche : trouve le client", E(`srchFind("journal x").filter(x=>x.k=="c").length`), 1);
const bk = E(`JSON.stringify(D)`);
E(`D.w=[];D.r=[];D.d=[];restoreText(${JSON.stringify(bk)})`);
eq("sauvegarde : restauration rétablit le salarié", E(`D.w.length`), 1);
eq("sauvegarde : restauration rétablit les saisies", E(`D.d.length > 50 ? 1 : 0`), 1);


// --- v39 : « Et si » réglable et contrôle des doublons ---
E(`D.w=[{id:"w1",name:"Karim Benali",rt:"paper",rate:.07,jours:[1,2,3,4,5,6],fuel:0,veh:0,oth:0,flat:0,cree:"2020-01-01"}];
   D.r=[{id:"r1",name:"Centre-ville",client:"",wid:"w1",vol:100,volSat:100,pp:.5}];D.pm=[];D.ab=[];D.co=[];D.en=[];D.d=[];
   sim();simIn("wn","karim  benali");simIn("rn"," CENTRE-VILLE ");simIn("t.0.vo","100");simIn("t.0.pp","0.5");simIn("rate","0.07");ES.vp=10;ES.pc=0`);
const q = E(`(()=>{const c=etsiCalc(simState());return {a:c.r0.inc,b:c.r1.inc}})()`);
eq("et si : volume +10 % augmente les revenus de 10 %", q.b / q.a, 1.1, 1e-9);
E(`ES.vp=0;ES.pc=2`);
const q2 = E(`(()=>{const c=etsiCalc(simState());return {a:c.r0.inc,b:c.r1.inc,j:c.r0.J}})()`);
eq("et si : prix +2 centimes ajoute 0,02 € par journal", q2.b - q2.a, q2.j * 0.02, 1e-6);
const pl = E(`(()=>{ES.vp=0;ES.pc=0;const p=simPlan(simState(),true);return {d:p.dups.length,w:p.wEx?1:0,n:p.T[0].name}})()`);
eq("doublons : le nom de tournée est reconnu (accents, casse, espaces)", pl.d, 1);
eq("doublons : le salarié existant est reconnu", pl.w, 1);
E(`D.r=[];D.w=[]`);
eq("doublons : aucun doublon sur une base vide", E(`simPlan(simState(),false).dups.length`), 0);

w.close();
if (fails) { console.error(fails + " test(s) en échec"); process.exit(1); }
console.log("Tous les tests passent");
process.exit(0);
