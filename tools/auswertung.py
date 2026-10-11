import json,sys,collections
d=json.load(open(sys.argv[1])); verbose=len(sys.argv)>2
by=collections.defaultdict(list)
for o in d:
  if 'err' in o: print('ERR',o['err']); continue
  by[o['strat']].append(o)
for k,v in by.items():
  w=sum(o['won'] for o in v)
  print(f"{k:12} Siege {w}/{len(v)}  Zeit Ø{sum(o['t'] for o in v)//len(v):4}s  Münzen Ø{sum(o['earned'] for o in v)//len(v):6}  Rest Ø{sum(o['coinsLeft'] for o in v)//len(v):6} Tor Ø{sum(o['gateSec'] for o in v)//len(v)}s")
  tot=collections.Counter()
  for o in v: tot.update(o['dmg'])
  s=sum(tot.values()) or 1; print('     Schaden%',{a:round(b*100/s) for a,b in tot.most_common()})
  if verbose:
    for o in v: print('     ',('WIN ' if o['won'] else 'LOSE'),o['t'],o['levels'],o['today'],'| HP',o['hpCurve'])
