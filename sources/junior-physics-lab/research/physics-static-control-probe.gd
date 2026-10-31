# SPDX-License-Identifier: AGPL-3.0-only
# Run with godot --headless --path godot --script ../research/physics-static-control-probe.gd
extends SceneTree
func _init():
 var research=ProjectSettings.globalize_path('res://').path_join('../research').simplify_path()
 var src=FileAccess.get_file_as_string(research.path_join('physics-final-records.json'))
 var records=JSON.parse_string(src)
 var solver=load('res://solvers.gd').new()
 root.add_child(solver)
 var inert=[]
 var failures=[]
 var evaluated=0
 var defaults=0
 for exp in records:
  if exp.model in ['incline','motion'] or (exp.model=='energy' and exp.modelParams.scenario=='pendulum'):continue
  defaults+=1
  var params=exp.modelParams.duplicate(true)
  for c in exp.controls:params[c.key]=c.value
  var base=solver.solve(exp.model,params)
  if base.has('error') or base.is_empty():failures.append({'id':exp.id,'error':base});continue
  var signature=JSON.stringify([base.get('readings'),base.get('graph'),base.get('conclusion')])
  for c in exp.controls:
   var values=[]
   if c.has('options'):
    for opt in c.options:values.append(opt.value)
   else:values=[c.min,c.max]
   var changed=false
   for value in values:
    var trial=params.duplicate(true);trial[c.key]=value
    var r=solver.solve(exp.model,trial);evaluated+=1
    if r.has('error') or r.is_empty():failures.append({'id':exp.id,'control':c.key,'value':value,'error':r});continue
    if JSON.stringify([r.get('readings'),r.get('graph'),r.get('conclusion')])!=signature:changed=true
   if not changed:inert.append({'id':exp.id,'model':exp.model,'scenario':params.scenario,'control':c.key})
 var output={'checkedDefaults':defaults,'evaluatedControls':evaluated,'errors':failures,'displayUnchanged':inert,'scope':'Static scientific models only; motion, incline and pendulum use separate actual rigid-body solvers. Display comparisons exclude apparatus changes.'}
 var file=FileAccess.open(research.path_join('physics-static-control-probe.json'),FileAccess.WRITE)
 file.store_string(JSON.stringify(output,'  '));file.close()
 print(JSON.stringify(output))
 quit(1 if failures.size()>0 else 0)
