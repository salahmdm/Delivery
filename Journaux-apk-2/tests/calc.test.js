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

w.close();
if (fails) { console.error(fails + " test(s) en échec"); process.exit(1); }
console.log("Tous les tests passent");
process.exit(0);
