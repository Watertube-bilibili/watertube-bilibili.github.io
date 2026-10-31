# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree
var failures: Array=[]
var checks: int=0
func test(condition: bool,message: String) -> void:
	checks+=1
	if not condition:failures.append(message)
func close(a: float,b: float,epsilon: float,message: String) -> void:
	test(absf(a-b)<=epsilon,message+" actual="+str(a)+" expected="+str(b))
func _initialize() -> void:
	var solver=load("res://optics_review.gd").new()
	for incidence in [0,30,60]:
		for roughness in [0,15,25]:
			var r=solver.solve("optics",{"scenario":"diffuse","angle":incidence,"roughness":roughness})
			for facet in r.facets:
				close(facet.incidence,facet.reflection,0.0003,"every local reflection obeys law")
				if roughness==0:close(facet.reflected[0],sin(deg_to_rad(incidence)),0.000001,"flat facets parallel reflected beam")
	var r=solver.solve("optics",{"scenario":"mirrorCompare","distance":30,"secondDistance":30,"eyeHeight":15,"screen":true})
	test(r.values.matched and not r.values.screenImage,"mirror alignment and virtual image screen test")
	var changed=solver.solve("optics",{"scenario":"mirrorCompare","distance":30,"secondDistance":20,"eyeHeight":25})
	test(not changed.values.matched,"independent replacement candle operation")
	close(changed.values.imageDistance,r.values.imageDistance,0.000001,"observer does not move virtual image")
	test(changed.rays[0].mirror!=r.rays[0].mirror,"observer changes actual reflected light path")
	for incidence in [30,50,65]:
		for apex in [50,60,65]:
			r=solver.solve("optics",{"scenario":"prism","incidence":incidence,"apex":apex})
			for ray in r.rays:
				close(sin(deg_to_rad(ray.incidence)),ray.refractiveIndex*sin(deg_to_rad(ray.firstRefraction)),0.00001,"prism entry Snell")
				close(ray.firstRefraction+ray.secondIncidence,apex,0.0001,"prism two faces geometry")
				if ray.secondRefraction!=null:
					close(ray.refractiveIndex*sin(deg_to_rad(ray.secondIncidence)),sin(deg_to_rad(ray.secondRefraction)),0.00001,"prism exit Snell")
				else:test(ray.internalReflections>0 and ray.segments.size()>3,"TIR traced to following surface")
	r=solver.solve("optics",{"scenario":"prism","incidence":50,"apex":60})
	test(r.rays[0].deviation<r.rays[-1].deviation,"violet greater deviation for given normal dispersion")
	for kind in ["myopia","hyperopia"]:
		for distance in [0.25,1.0,5.0]:
			var p={"scenario":"correctedEye","type":kind,"objectDistance":distance,"eyePower":62 if kind=="myopia" else 56,"withLens":false}
			r=solver.solve("lens",p)
			p["withLens"]=true;p["correctionPower"]=r.values.recommendedPower
			var corrected=solver.solve("lens",p)
			close(corrected.values.imageDistance,0.017,0.00000001,"separated corrective lens focuses at retina")
			test(corrected.values.retinalSpread<0.00000001,"all pupil rays meet on retina")
			p["withLens"]=false
			var removed=solver.solve("lens",p)
			close(removed.values.imageDistance,r.values.imageDistance,0.00000001,"removing lens restores uncorrected image")
	r=solver.solve("lens",{"scenario":"correctedEye","type":"myopia","objectDistance":5,"eyePower":62})
	test(r.values.recommendedPower<0,"myopic far object needs concave correction")
	r=solver.solve("lens",{"scenario":"correctedEye","type":"hyperopia","objectDistance":0.25,"eyePower":56})
	test(r.values.recommendedPower>0,"hyperopic near object needs convex correction")
	r=solver.solve("lens",{"scenario":"cylinder","focal":8,"distance":4})
	close(r.values.horizontalMagnification,2,0.000001,"cylinder doubles width at half focal distance")
	close(r.values.verticalMagnification,1,0.000001,"cylinder preserves vertical dimension")
	r=solver.solve("lens",{"scenario":"cylinder","focal":8,"distance":8})
	test(r.values.atFocus and r.values.horizontalMagnification==null,"cylinder focal singularity not fabricated")
	r=solver.solve("lens",{"scenario":"imagingBench","focal":10,"distance":30,"height":3,"screenDistance":25})
	test(not r.values.focused and r.values.screenSpread>0,"screen position independently controls focus")
	r=solver.solve("lens",{"scenario":"imagingBench","focal":10,"distance":30,"height":3,"screenDistance":15})
	test(r.values.focused and r.values.screenSpread<0.0000001,"three rays converge on focused screen")
	close(r.values.imageHeight,-1.5,0.000001,"focused image upside down and reduced")
	r=solver.solve("lens",{"scenario":"imagingBench","focal":10,"distance":5,"screenDistance":15})
	test(not r.values.focused and not r.values.real,"virtual image not projected to screen")
	r=solver.solve("measurement",{"scenario":"nearPoint","observedDistance":15,"trial2":15,"trial3":18,"clarity":"clear"})
	close(r.values.average,16,0.000001,"personal entered readings average")
	r=solver.solve("measurement",{"scenario":"nearPoint","clarity":"blurred"})
	test(r.values.average==null,"blurred trial not claimed as clear near point")
	print(JSON.stringify({"checks":checks,"failures":failures}))
	quit(0 if failures.is_empty() else 1)
