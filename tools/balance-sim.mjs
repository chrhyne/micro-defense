import { chromium } from 'playwright';
import fs from 'fs';
const exe = undefined; // nimmt den von Playwright installierten Browser
const file = (process.argv[2]||"") || new URL('../index.html', import.meta.url).pathname;
const runs = +(process.argv[3]||2);
const patch = process.argv[4] || '';
const only = process.argv[5] || '';
const b = await chromium.launch({executablePath:exe});
const LOADS = {
  nichts:      ['bogen','messer','oel','katapult','vulkan'],
  tor_pfeile:  ['bogen','messer','oel','zauber','raeuber'],
  fernwaffen:  ['katapult','gewitter','vulkan','bogen','oel'],
  mix:         ['bogen','katapult','oel','vulkan','messer'],
  mix_lutz:    ['bogen','katapult','oel','gewitter','raeuber'],
};
const out=[];
const jobs=[]; for(const [name,lo] of Object.entries(LOADS)){ if(only && !only.split(',').includes(name)) continue; for(let r=0;r<runs;r++) jobs.push([name,lo]); }
await Promise.all([0,1,2,3].map(async w=>{
  const p = await b.newPage({viewport:{width:800,height:600}});
  p.on('pageerror',e=>out.push({err:e.message}));
  while(jobs.length){ const [name,lo]=jobs.shift();
    await p.goto('file://'+file); await p.evaluate(()=>{ window.render=()=>{}; });
    const res = await p.evaluate(([name,lo,patch])=>{
      if(patch) eval(patch);
      genWaves(); start(lo); toast=()=>{}; sfx=()=>{};
      const dmg={}; const H=hurt; window.hurt=function(i,d,el){ if(!eAlive[i]) return false; const before=eHp[i]; const r=H(i,d,el); dmg[el]=(dmg[el]||0)+Math.max(0,before-Math.max(0,eHp[i])); return r; };
      let n=0, gateSec=0, firstLeak=null; const spent={}; const lvl=[];
      moveHeroTo(BTOWER.x,BTOWER.y);
      const dt=1/20, idle=name==='nichts';
      while(!G.over && n<20*1600){
        update(dt); n++;
        if(G.gateDps>0){ gateSec+=dt; if(firstLeak===null) firstLeak=Math.round(G.t-G.t0); }
        if(n%20===0 && !idle){
          if(G.hp<BURG[G.burgLvl].hp*0.5 && G.coins>=60) buyItem(ITEMS.find(x=>x.id==='heilen'));
          const cands=toolbarItems().filter(it=>!['heilen','tnt'].includes(it.id) && !it.done() && !(it.need&&it.need()));
          cands.sort((a,c)=>a.price()-c.price()); const it=cands[0];
          if(it && G.coins>=it.price()){ spent[it.id]=(spent[it.id]||0)+it.price(); buyItem(it); }
          if(G.kat.lvl>=0 && G.kat.cd<=0){ const mD=reihen(KATAPULT[G.kat.lvl].reihen); let bi=-1,bd=-1; for(let i=0;i<eHi;i+=2){ if(eAlive[i]&&eDist[i]>=mD&&eDist[i]>bd&&!TYPES[eType[i]].fly){bd=eDist[i];bi=i;} } if(bi>=0){ fireCatapult(eX[bi],eY[bi]); G.kat.cd=KATAPULT[G.kat.lvl].cd; } }
          if(G.gew.lvl>=0 && G.gew.cd<=0){ let bi=-1; for(let i=0;i<eHi;i+=3){ if(eAlive[i]&&eDist[i]>=KZ+300){bi=i;break;} } if(bi>=0){ strike(eX[bi],eY[bi]); G.gew.cd=GEWITTER[G.gew.lvl].cd; } }
          if(G.vul.lvl>=0 && G.vul.cd<=0){ let c=0; for(let i=0;i<eHi;i+=2) if(eAlive[i]&&eDist[i]>LAVA.from&&eDist[i]<LAVA.to) c++; if(c>15){ erupt(false); G.vul.cd=VULKAN[G.vul.lvl].cd; } }
          if(G.oil.lvl>=0 && G.oil.cd<=0 && G.gateDps>0) pourOil();
          for(const k of ['bogen','gew','vul']) if(powerReady(k)) usePower(k);
          if(powerReady('kat')){ G.mode='katPow'; tap({x:PX[L-800],y:PY[L-800]}); G.mode=null; }
        }
        if(n%(20*60)===0) lvl.push(Math.round(G.hp));
      }
      const r2=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,Math.round(v)]));
      const levels={brok:G.brok+1,bogen:G.archer+1,kat:G.kat.lvl+1,gew:G.gew.lvl+1,vul:G.vul.lvl+1,oil:G.oil.lvl+1,wiz:G.wiz+1,rob:G.rob+1,messer:G.fighters.length,burg:G.burgLvl+1};
      return {won:G.over&&G.hp>0, t:Math.round(G.t-G.t0), hp:Math.round(G.hp), gateSec:Math.round(gateSec), firstLeak, earned:Math.round(G.earned), coinsLeft:Math.round(G.coins), dmg:r2(dmg), levels, today:TODAY.join(','), hpCurve:lvl.join(' ')};
    },[name,lo,patch]);
    out.push({strat:name,...res});
  }
}));
console.log(JSON.stringify(out,null,1));
await b.close();
