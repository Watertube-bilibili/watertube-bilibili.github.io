# SPDX-License-Identifier: AGPL-3.0-only
# Run: godot --headless --path godot --script ../tests/godot_phase_materials.gd
extends SceneTree
var failed=0
func near(a:float,b:float,tolerance:float=0.00001):
 if absf(a-b)>tolerance:
  push_error('Mismatch %s %s'%[a,b]);failed+=1
func check(condition:bool,why:String):
 if not condition:push_error(why);failed+=1
func _initialize():
 var solver=load('res://phase_materials.gd').new()
 for mat in ['water','hypo','wax']:
  var d=solver.material_data(mat)
  var lower=solver.state_of(0.0,d)
  check(lower.phase==d.solid,'h=0 must be fully solid for '+mat)
  near(lower.fraction,0)
  var upper=solver.state_of(d.latent+d.solidC*(d.high-d.low),d)
  check(upper.phase==d.liquid,'upper enthalpy must be fully liquid for '+mat)
  near(upper.fraction,1)
 var full_freeze=solver.solve({'scenario':'freezing','material':'water','mass':.1,'power':100,'time':418,'initial':20})
 check(full_freeze.values.phase=='冰','complete freezing should be ice, not coexistence')
 near(full_freeze.values.temperature,0)
 near(full_freeze.values.fraction,0)
 var ice=solver.solve({'scenario':'melting','material':'water','mass':.1,'power':100,'time':100,'initial':-10})
 near(ice.values.temperature,0)
 near(ice.values.fraction,(10000-2100)/33400.0)
 var melted=solver.solve({'scenario':'melting','material':'water','mass':.1,'power':100,'time':397,'initial':-10})
 near(melted.values.temperature,10)
 var frozen=solver.solve({'scenario':'freezing','mass':.1,'power':100,'time':100,'initial':20})
 near(frozen.values.temperature,0)
 near(frozen.values.fraction,1-(10000-8400)/33400.0)
 var hypo=solver.solve({'scenario':'melting','material':'hypo','mass':.1,'power':100,'time':100,'initial':20})
 near(hypo.values.temperature,48);near(hypo.values.fraction,.22)
 var wax=solver.solve({'scenario':'melting','material':'wax','mass':.1,'power':100,'time':160,'initial':20})
 near(wax.values.temperature,55);near(wax.values.fraction,.5)
 var wax2=solver.solve({'scenario':'melting','material':'wax','mass':.1,'power':100,'time':200,'initial':20})
 check(wax2.values.temperature>wax.values.temperature,'wax may not have flat plateau')
 var limit=solver.solve({'scenario':'melting','material':'hypo','mass':.05,'power':1000,'time':1200,'initial':20})
 check(limit.values.domainLimited,'expected domain stop');near(limit.values.temperature,80)
 near(limit.graph.points[-1][0],limit.values.time)
 var cold=solver.solve({'scenario':'condensation','ambient':25,'surface':8,'dewPoint':15})
 check(cold.values.condensing,'expected droplets')
 check(not solver.solve({'scenario':'condensation','ambient':25,'surface':16,'dewPoint':15}).values.condensing,'warm surface must not condense')
 check(not solver.solve({'scenario':'condensation','ambient':10,'surface':8,'dewPoint':15}).values.valid,'invalid dewpoint')
 var mix=solver.solve({'scenario':'mixture','concentration':10,'action':'cooling','progress':.5})
 check(not mix.has('graph') and not mix.values.has('temperature'),'mixture fabricated temperature')
 check(solver.solve({'scenario':'mixture','concentration':0}).values.freezingPoint==0,'pure water limit')
 check(solver.solve({'scenario':'alcohol_cycle','action':'cooling'}).values.condensing,'alcohol cool')
 check(solver.solve({'scenario':'sublimation','material':'iodine','action':'cooling'}).values.deposition,'iodine deposition')
 check(solver.solve({'scenario':'deposition','material':'water','surfaceTemperature':-10}).is_empty(),'preserve parent frost')
 check(solver.solve({'scenario':'boiling'}).is_empty(),'preserve parent boiling')
 var cases=0
 for mat in ['water','hypo','wax']:
  for scenario in ['melting','freezing']:
   for mass in [.05,.1,1.0]:
    for power in [0,10,1000]:
     for time in [0,100,1200]:
      var r=solver.solve({'scenario':scenario,'material':mat,'mass':mass,'power':power,'time':time,'initial':20})
      cases+=1
      check(is_finite(r.values.temperature),'nonfinite')
      check(r.values.fraction>=0 and r.values.fraction<=1,'fraction range')
      for xy in r.graph.points:check(is_finite(xy[0]) and is_finite(xy[1]),'nonfinite graph')
 print('PHASE MATERIAL TESTS cases=',cases,' failures=',failed)
 quit(1 if failed else 0)
