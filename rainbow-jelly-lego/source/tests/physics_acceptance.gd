extends SceneTree
var toy: Node3D
var results: Array = []
var failures: Array = []
func _initialize() -> void:
 call_deferred("run")
func ticks(n: int) -> void:
 for i in n: await physics_frame
func check(condition: bool,label: String,evidence: Dictionary={}) -> void:
 var entry = {"test":label,"pass":condition,"evidence":evidence}
 results.append(entry)
 print("QA ",JSON.stringify(entry))
 if not condition: failures.append(label)
func clean() -> void:
 toy.reset()
 toy.rebuild_graph()
 await ticks(3)
func snap(sh: int,gx: int,gz: int,rot: int=0,bottom: float=-1) -> int:
 var id: int = toy.spawn(sh,0,Vector3(12,15,12),rot)
 var ok: bool = toy.place(id,gx,gz,rot,bottom)
 toy.rebuild_graph()
 if not ok:failures.append("snap helper rejected %d %d %d"%[sh,gx,gz])
 return id
func run() -> void:
 toy=load("res://main.tscn").instantiate()
 root.add_child(toy)
 await ticks(3)
 check(toy.qa_mode and toy.jobs.is_empty(),"qa_mode_no_autobuild")
 for sh in range(7):
  for rot in range(2):
   await clean()
   var a=snap(sh,-4,-4,rot)
   var b=snap(sh,-4,-4,rot)
   await ticks(30)
   var dim: Vector3=toy.dimensions(sh,rot)
   check(toy.bricks[b].snapped and toy.links.any(func(l):return l.active and l.a==b and l.b==a),"snap_%d_rotation_%d"%[sh,rot],{"bottom":toy.bricks[b].bottom,"expected":dim.y,"vertical_error":absf(toy.bricks[b].body.position.y-(dim.y*1.5+.008)),"frozen_upper":toy.bricks[b].body.freeze})
 await clean()
 var a=snap(1,0,0)
 var b=snap(1,0,2)
 var c=snap(0,0,0)
 var support_links=0
 for l in toy.links:
  if l.active and l.a==c:support_links+=1
 check(support_links==2,"bridge_two_supports",{"links":support_links})
 await clean()
 a=toy.spawn(2,0,Vector3(0,.61,0))
 b=toy.spawn(2,1,Vector3(2,.61,0))
 toy.bricks[a].body.rotation.y=PI/4
 toy.bricks[b].body.rotation.y=PI/4
 await ticks(360)
 check(maxf(toy.bricks[a].body.position.y,toy.bricks[b].body.position.y)<.7,"rotated_separated_boxes_no_phantom_contact",{"a":str(toy.bricks[a].body.position),"b":str(toy.bricks[b].body.position)})
 await clean()
 a=toy.spawn(1,0,Vector3(0,3,0))
 b=toy.spawn(1,1,Vector3(0,6,0))
 await ticks(720)
 check(toy.bricks[a].body.position.y<.7 and toy.bricks[b].body.position.y>1.7 and toy.bricks[b].body.position.y<1.9,"unrotated_stack_contacts",{"lower":toy.bricks[a].body.position.y,"upper":toy.bricks[b].body.position.y,"sleeping":[toy.bricks[a].body.sleeping,toy.bricks[b].body.sleeping]})
 await clean()
 a=toy.spawn(1,0,Vector3(0,.6,0))
 await ticks(240)
 var was_sleeping: bool=toy.bricks[a].body.sleeping
 b=toy.spawn(1,1,Vector3(-3,.6,0))
 toy.bricks[b].body.linear_velocity=Vector3(24,0,0)
 var woke=false
 var moved=0.0
 for i in 120:
  await ticks(1)
  if not toy.bricks[a].body.sleeping:woke=true
  moved=maxf(moved,toy.bricks[a].body.position.x)
 check(was_sleeping and woke and moved>.05,"sleeping_body_wakes_on_side_impact",{"initial_sleep":was_sleeping,"woke":woke,"moved_x":moved})
 await clean()
 var ids=[]
 for i in 8:ids.append(snap(1,-1,-1))
 await ticks(360)
 var before: float=toy.bricks[ids[-1]].body.position.y
 toy.remove_brick(ids[0])
 toy.rebuild_graph()
 await ticks(720)
 var after: float=toy.bricks[ids[-1]].body.position.y
 var frozen=false
 for id in ids.slice(1):frozen=frozen or toy.bricks[id].body.freeze
 check(not frozen and after<before-1,"support_removal_falls_without_freezing",{"before":before,"after":after,"frozen":frozen,"awake":toy.get_state().awake})
 await clean()
 for i in 40:snap(1,-1,-1)
 await ticks(1200)
 var tower_state: Dictionary=toy.get_state()
 var top: RigidBody3D=toy.bricks[39].body
 check(tower_state.bricks==40 and tower_state.awake==0 and absf(top.position.y-47.408)<.3,"tower40_stands_sleeps",{"state":tower_state,"top":str(top.position)})
 await clean()
 for item in toy.blueprint:snap(int(item.shape),int(item.gx),int(item.gz),int(item.rot),float(item.y))
 await ticks(1200)
 var built: Dictionary=toy.get_state()
 check(built.bricks==167 and built.awake==0 and built.structures==1,"blueprint167_stands_sleeps",built)
 for level in range(3):
  toy.quake()
  await ticks(600)
  print("QA_QUAKE ",level+1," ",JSON.stringify(toy.get_state()))
 await ticks(1200)
 var quake_state: Dictionary=toy.get_state()
 var peak=0.0
 for item in toy.bricks:
  if item.active:peak=maxf(peak,item.body.position.y)
 check(quake_state.joints<built.joints and quake_state.kineticEnergy<100 and peak<30,"quake3_fractures_and_settles",{"state":quake_state,"peak_y":peak})
 await clean()
 toy.pour(300)
 await ticks(1800)
 var poured: Dictionary=toy.get_state()
 var floating=0
 for item in toy.bricks:
  if item.active and item.body.freeze:floating+=1
 check(poured.bricks==300 and poured.awake<5 and floating==0 and poured.kineticEnergy<.05,"pour300_settles_no_frozen_floaters",{"state":poured,"frozen":floating})
 var output={"passed":failures.is_empty(),"failures":failures,"results":results}
 var f=FileAccess.open("res://tests/physics_acceptance.json",FileAccess.WRITE)
 f.store_string(JSON.stringify(output,"  "))
 print("QA_COMPLETE ",JSON.stringify({"passed":failures.is_empty(),"failures":failures}))
 quit(0 if failures.is_empty() else 1)
