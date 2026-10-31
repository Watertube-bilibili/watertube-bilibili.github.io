# SPDX-License-Identifier: AGPL-3.0-only
# Scientific regression for measured rigid-body runs, not fabricated trajectories.
extends SceneTree

const G=9.8
var solver
var failures: Array=[]
var failure_count=0
var assertion_count=0
var fixtures: Array=[]
var originals: Dictionary
var failure_groups: Dictionary={}

func check(condition: bool,message: String) -> void:
	assertion_count+=1
	if not condition:
		failure_count+=1
		var group=message.split(": got")[0]
		failure_groups[group]=failure_groups.get(group,0)+1
		if failures.size()<60:failures.append(message)

func near(actual: float,expected: float,tolerance: float,message: String) -> void:
	check(is_finite(actual) and absf(actual-expected)<=tolerance,"%s: got %s, expected %s, tolerance %s"%[message,str(actual),str(expected),str(tolerance)])

func _initialize() -> void:
	call_deferred("run_tests")

func finite_tree(value,where: String) -> void:
	if value is float:check(is_finite(value),"finite "+where)
	elif value is Array:
		for i in range(value.size()):finite_tree(value[i],where+"/"+str(i))
	elif value is Dictionary:
		for key in value:finite_tree(value[key],where+"/"+str(key))

func serializable_inputs(value):
	if value is float and not is_finite(value):return str(value)
	if value is Dictionary:
		var result={}
		for key in value:result[key]=serializable_inputs(value[key])
		return result
	return value

func simulate(name: String,p: Dictionary) -> Dictionary:
	var result=await solver.evaluate("energy",dict(p,"scenario","rollingPendulum"))
	fixtures.append({"name":name,"params":serializable_inputs(p),"result":result})
	check(result.solver.contains("RigidBody2D"),name+": actual rigid-body solver")
	finite_tree(result,name)
	check(Engine.physics_ticks_per_second==originals.ticks,name+": physics tick rate restored")
	near(Engine.time_scale,originals.scale,0,name+": time scale restored")
	check(Engine.max_physics_steps_per_frame==originals.steps,name+": max physics steps restored")
	await process_frame
	return result

func dict(p: Dictionary,key: String,value) -> Dictionary:
	var copy=p.duplicate();copy[key]=value;return copy

func verify_run(name: String,r: Dictionary) -> void:
	var v=r.values
	var m=float(v.mass);var radius=float(v.radius);var inertia=float(v.inertia)
	var h=float(v.height);var initial=m*G*h
	var expected_q=(inertia-m*radius*radius)/(inertia+m*radius*radius)
	near(v.q,expected_q,1e-10,name+": impulse-derived velocity retention")
	check(v.valid,name+": accepted physical domain")
	check(r.rollingStates.size()>10,name+": many actually integrated states")
	check(r.trajectory.size()==r.rollingStates.size(),name+": numeric trajectory accompanies physical states")
	var energy_tolerance=maxf(1e-7,initial*0.012)
	var previous_time=-1.0
	var previous_loss=-1.0
	for s in r.rollingStates:
		check(s.time>=previous_time,name+": sample time never decreases")
		check(s.position>=-0.00002 and s.position<=h+0.00002,name+": centre remains within unwound travel")
		near(s.position-s.branchPositionAnchor,s.branch*radius*(s.angle-s.branchAngleAnchor),0.00015,name+": branch-local no-slip position")
		near(s.velocity,s.branch*radius*s.angularVelocity,0.0002,name+": no-slip velocity")
		# Godot stores the body's mass and physics vectors in single precision;
		# the external control dictionary retains the original double value.
		near(s.potentialEnergy,m*G*(h-s.position),initial*2e-7+1e-9,name+": gravitational potential uses current height")
		near(s.translationEnergy,0.5*m*s.velocity*s.velocity,initial*2e-7+1e-9,name+": translational energy")
		near(s.rotationEnergy,0.5*inertia*s.angularVelocity*s.angularVelocity,1e-8,name+": rotational energy")
		near(s.mechanicalEnergy+s.energyLost,initial,energy_tolerance,name+": energy plus explicitly accounted losses")
		check(s.energyLost>=previous_loss-1e-9,name+": cumulative dissipation never falls")
		if s.phase=="ascending":check(s.velocity<=1e-9,name+": ascent is negative vertical velocity")
		elif s.phase=="descending":check(s.velocity>=-1e-9,name+": descent is positive vertical velocity")
		elif s.phase in ["turning","stopped"]:
			near(s.velocity,0,1e-12,name+": extremum linear speed")
			near(s.angularVelocity,0,1e-12,name+": extremum angular speed")
		previous_time=s.time;previous_loss=s.energyLost
	var bottoms=r.events.filter(func(e):return e.kind=="bottom")
	var tops=r.events.filter(func(e):return e.kind=="top")
	check(bottoms.size()==int(v.cycles),name+": requested captures occur")
	check(tops.size()==int(v.cycles),name+": each capture followed by a return apex")
	check(v.stopReason=="observation-complete",name+": end is an observation cutoff, not fictitious damping to rest")
	var expected_a=G/(1.0+inertia/(m*radius*radius))
	var descent=v.descent
	near(descent.distance,h,1e-8,name+": exact first bottom height")
	near(descent.duration,sqrt(2*h/expected_a),maxf(0.002,descent.duration*0.003),name+": preserved descent duration")
	near(descent.velocity,sqrt(2*expected_a*h),maxf(0.002,absf(descent.velocity)*0.008),name+": preserved descent speed")
	near(descent.translationEnergy+descent.rotationEnergy,initial,energy_tolerance,name+": descent supplies both kinetic terms")
	var prior_height=h
	for i in range(bottoms.size()):
		var event=bottoms[i];var before=event.pre;var after=event.post
		near(before.time,after.time,0,name+": capture has two sides at the same model time")
		near(event.time,before.time,0,name+": event timestamp matches physical states")
		near(before.position,h,1e-9,name+": capture at lowest centre position")
		near(after.position,h,1e-9,name+": no position teleport during capture")
		near(after.angle,before.angle,1e-10,name+": orientation continuous through capture")
		check(after.branch==-before.branch,name+": only bottom swaps winding side")
		check(before.velocity>0 and after.velocity<0,name+": capture reverses centre motion upward")
		check(before.angularVelocity*after.angularVelocity>0,name+": rotation does not reverse at bottom")
		# q is exact for an exactly constrained incoming state. The actual impulse
		# projector also corrects the independently measured pre-capture drift.
		var drift=absf(before.velocity-before.branch*radius*before.angularVelocity)
		var denominator=inertia+m*radius*radius
		var linear_allowance=inertia/denominator*drift+absf(before.velocity)*2e-7+1e-9
		var angular_allowance=m*radius/denominator*drift+absf(before.angularVelocity)*2e-7+1e-9
		near(after.velocity,-expected_q*before.velocity,linear_allowance,name+": capture linear-velocity law with measured incoming drift")
		near(after.angularVelocity,expected_q*before.angularVelocity,angular_allowance,name+": capture angular-velocity law with measured incoming drift")
		near(event.impulse,m*(before.velocity-after.velocity),1e-7,name+": impulse changes linear momentum")
		var angular_scale=absf(inertia*before.angularVelocity)+absf(m*radius*before.velocity)
		near(inertia*after.angularVelocity+after.branch*m*radius*after.velocity,inertia*before.angularVelocity+after.branch*m*radius*before.velocity,angular_scale*2e-7+1e-10,name+": angular momentum about new tangency conserved")
		var kinetic_before=before.translationEnergy+before.rotationEnergy
		var kinetic_after=after.translationEnergy+after.rotationEnergy
		var kinetic_allowance=m*(absf(expected_q*before.velocity)*linear_allowance+0.5*linear_allowance*linear_allowance)+inertia*(absf(expected_q*before.angularVelocity)*angular_allowance+0.5*angular_allowance*angular_allowance)+kinetic_before*2e-7+1e-10
		near(kinetic_after,expected_q*expected_q*kinetic_before,kinetic_allowance,name+": capture kinetic-energy retention with measured incoming drift")
		near(event.lostEnergy,kinetic_before-kinetic_after,1e-9,name+": event loss is actual kinetic-energy difference")
		check(event.lostEnergy>0,name+": inelastic capture dissipates positive energy")
		if i<tops.size():
			var top=tops[i];var peak=h-float(top.post.position)
			check(top.pre.branch==after.branch and top.post.branch==after.branch,name+": apex keeps the winding side")
			near(top.post.velocity,0,1e-12,name+": apex centre stops instantaneously")
			near(top.post.angularVelocity,0,1e-12,name+": apex rotation stops instantaneously")
			near(top.lostEnergy,0,0,name+": apex has no invented loss event")
			near(peak,prior_height*expected_q*expected_q,maxf(0.00002,prior_height*0.012),name+": return height follows capture energy")
			check(peak<prior_height,name+": successive excursions lose height")
			# Neighbourhood must contain actual ascent and, unless observation ends,
			# a later descent with reversed angular velocity on the SAME branch.
			var earlier: Dictionary={};var later: Dictionary={}
			for sample in r.rollingStates:
				if sample.time<top.time:earlier=sample
				elif sample.time>top.time:
					later=sample;break
			check(not earlier.is_empty() and earlier.velocity<0,name+": physical sample approaching apex upward")
			if i<tops.size()-1:
				check(not later.is_empty() and later.velocity>0,name+": actual next samples descend after apex")
				if not earlier.is_empty() and not later.is_empty():check(earlier.angularVelocity*later.angularVelocity<0,name+": rotation naturally reverses at apex")
			prior_height=peak

func run_tests() -> void:
	originals={"ticks":Engine.physics_ticks_per_second,"scale":Engine.time_scale,"steps":Engine.max_physics_steps_per_frame}
	solver=load("res://apparatus_dynamics.gd").new();root.add_child(solver)
	await process_frame
	var cases=[
		["default-three-returns",{}],
		["one-return",{"cycles":1}],
		["five-returns",{"cycles":5}],
		["slow-small-axle",{"mass":0.1,"radius":0.003,"inertia":0.001,"height":1,"cycles":1}],
		["large-mass-large-axle",{"mass":1,"radius":0.015,"inertia":0.001,"height":0.1,"cycles":2}],
		["small-inertia",{"mass":0.1,"radius":0.003,"inertia":0.00002,"height":1,"cycles":2}],
		["minimum-height",{"height":0.1}],
		["maximum-height",{"height":1}],
		["larger-axle",{"radius":0.012,"cycles":1}],
		["larger-inertia",{"inertia":0.0004,"cycles":1}]
	]
	var default_run: Dictionary={}
	for item in cases:
		var result=await simulate(item[0],item[1]);verify_run(item[0],result)
		if item[0]=="default-three-returns":default_run=result
	var half_step=await simulate("half-integration-step",{"step":1.0/1920.0})
	verify_run("half-integration-step",half_step)
	check(half_step.values.integrationStep<default_run.values.integrationStep,"finer step actually changes integration")
	check(half_step.values.energyBalanceError<default_run.values.energyBalanceError*0.8,"energy accounting converges when fixed step halves")
	var q=float(default_run.values.q)
	var exact_first_peak=float(default_run.values.height)*q*q
	var coarse_peak=float(default_run.values.height)-float(default_run.events.filter(func(e):return e.kind=="top")[0].post.position)
	var fine_peak=float(half_step.values.height)-float(half_step.events.filter(func(e):return e.kind=="top")[0].post.position)
	check(absf(fine_peak-exact_first_peak)<absf(coarse_peak-exact_first_peak)*0.8,"first return height converges with finer integration")
	var stopped=await simulate("equal-inertia-capture-stop",{"mass":0.2,"radius":0.01,"inertia":0.00002})
	check(stopped.values.valid and stopped.values.stopReason=="capture-stop","I=mr² is fully dissipative capture limit")
	check(stopped.values.completedCycles==0,"q=0 does not invent a return apex")
	near(stopped.values.finalState.mechanicalEnergy,0,1e-12,"q=0 remaining kinetic and potential energies zero")
	near(stopped.values.finalState.energyLost,stopped.values.initialPotential,stopped.values.initialPotential*0.012,"q=0 energy explicitly dissipated")
	var invalid=await simulate("below-inertia-domain",{"mass":1,"radius":0.015,"inertia":0.00002})
	check(not invalid.values.valid and invalid.rollingStates.is_empty() and invalid.events.is_empty(),"I<mr² is rejected, not converted to fake reverse winding")
	var zero=await simulate("zero-release-height",{"height":0})
	check(zero.values.valid and zero.values.duration==0 and zero.rollingStates.size()==1,"zero height is a finite stationary state")
	near(zero.values.finalState.velocity,0,0,"zero-height speed zero")
	near(zero.values.finalState.mechanicalEnergy,0,0,"zero-height energy zero")
	var limited=await simulate("unresolved-small-return",{"mass":0.2,"radius":0.01,"inertia":0.000020001})
	check(limited.values.valid and limited.values.stopReason=="resolution-limit","tiny positive return is explicitly below observation resolution")
	check(limited.values.completedCycles==0,"unresolved excursion is not counted as a completed ascent")
	check(limited.values.finalState.mechanicalEnergy>0,"resolution cutoff preserves unresolved mechanical energy")
	var capture=limited.events.filter(func(e):return e.kind=="bottom")[0]
	near(limited.values.finalState.energyLost,capture.post.energyLost,1e-12,"resolution cutoff adds no artificial physical loss")
	check(not limited.events.any(func(e):return e.kind=="settled"),"resolution cutoff is not reported as physical settling")
	for value in [NAN,INF,-INF]:
		var result=await simulate("nonfinite-"+str(value),{"mass":value,"radius":value,"inertia":value,"height":value,"cycles":value,"step":value})
		check(result.values.valid,"nonfinite controls use finite documented defaults")
		near(result.values.mass,0.3,0,"nonfinite mass fallback")
		near(result.values.radius,0.006,0,"nonfinite radius fallback")
		near(result.values.inertia,0.0002,0,"nonfinite inertia fallback")
		near(result.values.height,0.5,0,"nonfinite height fallback")
		check(result.values.cycles==3,"nonfinite cycle-count fallback")
	var low=await simulate("clamped-low-controls",{"mass":-1,"radius":-1,"inertia":-1,"height":-1,"cycles":-5})
	check(low.values.mass==0.1 and low.values.radius==0.003 and low.values.inertia==0.00002 and low.values.height==0 and low.values.cycles==1,"low controls bounded without nonfinite motion")
	var high=await simulate("clamped-high-controls",{"mass":2,"radius":0.1,"inertia":1,"height":2,"cycles":20})
	check(high.values.mass==1 and high.values.radius==0.015 and high.values.inertia==0.001 and high.values.height==1 and high.values.cycles==5,"high controls bounded")
	verify_run("clamped-high-controls",high)
	var fixture_path=OS.get_environment("ROLLING_FIXTURE_PATH")
	if not fixture_path.is_empty():
		var file=FileAccess.open(fixture_path,FileAccess.WRITE)
		check(file!=null,"fixture output opens")
		if file:file.store_string(JSON.stringify(fixtures))
	print(JSON.stringify({"cases":fixtures.size(),"assertions":assertion_count,"failureCount":failure_count,"failureGroups":failure_groups,"failures":failures,"fixturePath":fixture_path}))
	quit(0 if failure_count==0 else 1)
