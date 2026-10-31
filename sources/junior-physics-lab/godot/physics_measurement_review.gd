# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted

const G = 9.8

func reading(label: String, value, unit: String = "") -> Dictionary:
	return {"label":label,"value":value,"unit":unit}

func result(model: String, values: Dictionary, readings: Array, steps: Array, conclusion: String, limits: String) -> Dictionary:
	return {"model":model,"values":values,"readings":readings,"process":steps,"conclusion":conclusion,"assumptions":limits,"solver":"Godot measurement and contact classroom solver"}

func solve(model: String, p: Dictionary) -> Dictionary:
	var scenario = str(p.get("scenario", ""))
	if model == "buoyancy" and scenario == "weighingDepth":
		return weighing(p)
	if model == "buoyancy" and scenario == "forceFactors":
		return force_factors(p)
	if model == "buoyancy" and scenario == "archimedesEvidence":
		return archimedes(p)
	if model == "pulley" and scenario == "efficiencyMeasurement":
		return efficiency(p)
	if model == "molecular" and scenario == "contactAttraction":
		return contact(p)
	return {}

func weighing(p: Dictionary) -> Dictionary:
	var mass = clampf(float(p.get("mass",270)),50,600)
	var volume = clampf(float(p.get("volume",100)),20,200)
	var density = clampf(float(p.get("density",1000)),500,1500)
	var bottom = clampf(float(p.get("bottomDepth",15)),-5,35)
	var height = 10.0
	var fraction = clampf(bottom/height,0,1)
	var displacement = volume*fraction
	var gravity = mass*.001*G
	var buoyant = density*G*displacement*.000001
	var tensile = gravity-buoyant
	var supported = tensile >= -.000000001
	var tension = maxf(tensile,0) if supported else null
	var conclusion = "物体未接触液体，测力计示数等于重力。"
	if bottom > 0 and bottom < height:
		conclusion = "浸入部分增大时排液体积增大，浮力增大，测力计示数减小。"
	elif bottom >= height:
		conclusion = "物体已完全浸没；继续改变深度时排液体积不变，浮力与测力计示数不变。"
	if not supported:
		conclusion = "该位置的浮力大于重力，上方细线不能提供向下的力；不能在此位置静止悬挂，应换用更重的物体。"
	var points: Array = []
	var table_rows: Array = []
	for i in range(-5,36):
		var displaced = volume*clampf(i/height,0,1)
		var force = density*G*displaced*.000001
		points.append([i,force])
		if i in [0,5,10,20,30]:
			table_rows.append([i,displaced,force,maxf(gravity-force,0) if gravity>=force else "无法上悬静止"])
	var output = result("buoyancy",{"scenario":"weighingDepth","mass":mass,"volume":volume,"density":density,"blockHeight":height,"blockWidth":sqrt(volume/height),"bottomDepth":bottom,"topDepth":bottom-height,"fraction":fraction,"displacedVolume":displacement,"weight":gravity,"buoyantForce":buoyant,"apparentWeight":tension,"validSuspension":supported,"fullySubmerged":bottom>=height},[reading("空气中示数 G",gravity,"N"),reading("液体中可静止示数 F拉",tension,"N"),reading("由称重差求浮力",buoyant if supported else null,"N"),reading("下表面深度",bottom,"cm"),reading("排液体积",displacement,"cm³")],[{"title":"先读空气中的重力","text":"m＝%.1f g＝%.4f kg，G＝mg＝%.4f×9.8＝%.4f N。"%[mass,mass*.001,mass*.001,gravity]},{"title":"确定排开的液体","text":"物块高10 cm，下表面深度%.1f cm，浸入比例%.2f，V排＝%.1f×%.2f＝%.2f cm³。完全浸没后只改变深度，不改变V排。"%[bottom,fraction,volume,fraction,displacement]},{"title":"读取液中拉力并作差","text":"F浮＝ρ液gV排＝%.0f×9.8×%.8f＝%.4f N；静止上悬时F拉＝G−F浮＝%.4f−%.4f。"%[density,displacement*.000001,buoyant,gravity,buoyant]},{"title":"比较完全浸没的不同深度","text":"固定物体和液体，分别把下表面放在10、20、30 cm，记录G、F拉及G−F拉。只要能静止上悬，三处示数相同。"}],conclusion,"不吸水刚性长方体，高10 cm；水槽足够深，不触底不碰壁，液体密度均匀。忽略表面张力与液面改变；测力计读数是理想静止值，不模拟升降瞬间水阻力。")
	output["graph"]={"xLabel":"物块下表面深度 / cm","yLabel":"浮力 / N","points":points}
	output["table"]={"headers":["下表面深度 / cm","V排 / cm³","F浮 / N","静止拉力 / N"],"rows":table_rows}
	return output

func force_factors(p: Dictionary) -> Dictionary:
	var configured=p.duplicate()
	configured["bottomDepth"]=10*clampf(float(p.get("fraction",1)),0,1)
	var output=weighing(configured)
	var v: Dictionary=output["values"]
	v["scenario"]="forceFactors"
	var points: Array=[]
	for i in range(21):
		var displaced=float(v.volume)*i/20
		points.append([displaced,float(v.density)*G*displaced*.000001])
	output["graph"]={"xLabel":"排液体积 / cm³","yLabel":"浮力 / N","points":points}
	output["readings"][3]=reading("液体密度",v.density,"kg/m³")
	output["process"][3]={"title":"控制变量比较","text":"研究排液体积时保持液体密度相同，只改变浸入比例或物体体积；研究液体密度时保持排液体积相同。若只能由上方细线悬挂，还须确保F浮不大于G。"}
	if v.validSuspension:
		output["conclusion"]="同种液体中，排液体积越大浮力越大；相同排液体积时，液体密度越大浮力越大。改变物体质量不会直接改变给定V排和ρ液下的浮力。"
	return output

func archimedes(p: Dictionary) -> Dictionary:
	var configured=p.duplicate()
	configured["bottomDepth"]=10*clampf(float(p.get("fraction",1)),0,1)
	var output=weighing(configured)
	var v: Dictionary=output["values"]
	var headroom=clampf(float(p.get("headroom",0)),0,100)
	var loss=clampf(float(p.get("lossPercent",0)),0,50)/100
	var cup_mass=.03
	var overflow=maxf(float(v.displacedVolume)-headroom,0)
	var collected=overflow*(1-loss)
	var collected_mass=float(v.density)*collected*.000001
	var cup_before=cup_mass*G
	var cup_after=(cup_mass+collected_mass)*G
	var collected_weight=cup_after-cup_before
	var valid=bool(v.validSuspension) and headroom==0 and loss==0
	v.merge({"scenario":"archimedesEvidence","headroom":headroom,"remainingHeadroom":maxf(headroom-float(v.displacedVolume),0),"lossPercent":loss*100,"overflowVolume":overflow,"collectedVolume":collected,"cupEmptyWeight":cup_before,"cupFilledWeight":cup_after,"collectedWeight":collected_weight,"collectedMass":collected_mass,"validEvidence":valid,"comparisonDifference":float(v.buoyantForce)-collected_weight},true)
	var conclusion="称重法的G−F拉与排液称重的G杯液−G空杯相等，支持F浮＝G排。"
	if not v.validSuspension:
		conclusion="该物体在所选浸入位置受到的浮力超过重力，上方细线不能使其静止；不能把零拉力当作有效称重法记录。"
	elif float(v.displacedVolume)==0:
		conclusion="物体尚未浸入，排液量为零；应浸入一定体积后比较两种独立读数的差。"
	elif headroom>0 or loss>0:
		conclusion="浮力不等于本次收到的液体重力，因为溢水杯未装满或排液收集有损失；不能据此否定阿基米德原理。"
	output["readings"]=[reading("空气中物重G",v.weight,"N"),reading("液中拉力F拉",v.apparentWeight,"N"),reading("称重法浮力G−F拉",v.buoyantForce if v.validSuspension else null,"N"),reading("空接水杯重力",cup_before,"N"),reading("杯与收集液重力",cup_after,"N"),reading("收集液重力（差量）",collected_weight,"N")]
	output["process"]=[{"title":"第一条证据：称重法","text":"空气中G＝%.4f N；物体静止浸入液体时读取F拉，用G−F拉求浮力。上方细线不能提供向下的力，故浮力超过重力时此读数无效。"%float(v.weight)},{"title":"第二条证据：排液称重","text":"空杯重力%.4f N，杯与液体重力%.4f N；收到液体的重力＝%.4f−%.4f＝%.4f N。"%[cup_before,cup_after,cup_after,cup_before,collected_weight]},{"title":"检查操作与比较","text":"V排＝%.2f cm³；溢水前尚可容纳%.2f cm³，溢出%.2f cm³；题设收集损失%.0f%%，实际收到%.2f cm³。正确操作须先装至溢水口并待滴流停止，再完整收集。"%[float(v.displacedVolume),headroom,overflow,loss*100,collected]},{"title":"结论","text":conclusion}]
	output["conclusion"]=conclusion
	output["assumptions"]="刚性不吸水物块、均匀液体，静止且不触底不碰壁。空接水杯质量30 g；缺水空量和收集损失为明确题设，分别用于检验操作影响，不是实际流动或飞溅率预测。两种读数通道在同一理想物理条件下产生，不用已知答案替代空杯与总杯读数。"
	output["table"]={"headers":["证据路径","第一次读数 / N","第二次读数 / N","差值 / N"],"rows":[["称重法",v.weight,v.apparentWeight,v.buoyantForce if v.validSuspension else null],["排液称重",cup_after,cup_before,collected_weight]]}
	return output

func efficiency(p: Dictionary) -> Dictionary:
	var load = clampf(float(p.get("load",20)),1,100)
	var pull = clampf(float(p.get("pull",12.5)),.5,100)
	var height = clampf(float(p.get("height",.5)),.1,1)
	var rope = clampf(float(p.get("ropeDistance",1)),.1,2)
	var strands = 2
	var useful = load*height
	var total = pull*rope
	var ratio = useful/total*100
	var geometry = absf(rope-strands*height)<=maxf(.02,.03*rope)
	var energy_valid = total+1e-10>=useful
	var valid = geometry and energy_valid
	var conclusion = "根据本组测量记录，机械效率为%.2f%%。可另换载荷，重新测F、h、s后比较；省力不意味着省功。"%ratio
	if not geometry:
		conclusion = "本装置由两段绳承担动滑轮与重物，理想s约为2h；这组位移记录不符合装置关系，请核查起止位置、绳段数或打滑。"
	if not energy_valid:
		conclusion = "数据比值超过100%，不能报告为有效机械效率。请检查拉力是否在匀速提升中读取、位移和单位是否一致。"
	return result("pulley",{"scenario":"efficiencyMeasurement","load":load,"pull":pull,"height":height,"ropeDistance":rope,"strands":strands,"expectedRopeDistance":strands*height,"usefulWork":useful,"inputWork":total,"lossWork":total-useful,"rawEfficiency":ratio,"efficiency":ratio if valid else null,"geometryConsistent":geometry,"energyConsistent":energy_valid,"validMeasurement":valid},[reading("物重G（测量记录）",load,"N"),reading("提升时拉力F（测量记录）",pull,"N"),reading("有用功 Gh",useful,"J"),reading("总功 Fs",total,"J"),reading("按记录求得的比值",ratio,"%"),reading("有效机械效率",ratio if valid else null,"%")],[{"title":"记录四个测量量","text":"G＝%.2f N，F＝%.2f N，h＝%.2f m，s＝%.2f m。F必须在缓慢匀速提升过程中读取，不用静止示数代替。"%[load,pull,height,rope]},{"title":"计算有用功与总功","text":"W有＝Gh＝%.2f×%.2f＝%.3f J；W总＝Fs＝%.2f×%.2f＝%.3f J。"%[load,height,useful,pull,rope,total]},{"title":"求比值并检查实验数据","text":"η＝W有/W总×100%%＝%.3f/%.3f×100%%＝%.2f%%。本装置n＝2，应有s≈2h＝%.2f m。"%[useful,total,ratio,2*height]},{"title":"作答与复测","text":conclusion}],conclusion,"四个输入是待分析的测量记录，不把效率当输入反推拉力。示意采用两承重绳段；核对s≈2h容差取2 cm或3%中的较大者。摩擦、滑轮重等损耗已体现在实测拉力中，不另编造精确损耗来源。")

func contact(p: Dictionary) -> Dictionary:
	var surface = str(p.get("surface","fresh"))
	var separator = str(p.get("separator","none"))
	var stage = str(p.get("stage","released"))
	var direct = separator=="none" and stage!="apart"
	var intimate = surface=="fresh" and direct
	var joined = intimate and stage!="apart"
	var gap = 34.0 if stage=="apart" else 0.0 if stage=="pressed" or joined else 34.0
	var conclusion = "两柱分开时，不能从宏观间隙状态观察到使其结合的显著分子间作用。"
	if stage=="pressed":
		conclusion = "目前有外力压紧；撤去压紧力后再比较是否保持结合，不能用压紧时靠在一起作为唯一证据。"
	elif stage=="released":
		conclusion = "新鲜、清洁、平整的铅面紧密接触后，撤去压紧力仍可结合，这是分子间引力的宏观证据。" if intimate else "粗糙、氧化或隔纸阻止大量铅表面达到足够近的接触；撤去压紧后不显示同样的结合。"
	return result("molecular",{"scenario":"contactAttraction","surface":surface,"separator":separator,"stage":stage,"directContact":direct,"intimateContact":intimate,"joinedAfterRelease":joined and stage=="released","gapPixels":gap,"pressed":stage=="pressed"},[reading("接触面",{"fresh":"新鲜清洁平整","rough":"粗糙","oxidized":"有氧化层"}.get(surface,surface)),reading("隔层","纸片" if separator=="paper" else "无"),reading("观察阶段",{"apart":"接触前","pressed":"外力压紧中","released":"压紧后撤去外力"}.get(stage,stage)),reading("撤去外力后仍结合",joined if stage=="released" else "尚未检验")],[{"title":"先控制接触条件","text":"比较同样两铅柱的新鲜平整面、粗糙面或氧化面，再单独比较是否隔一张纸。"},{"title":"区分操作与证据","text":"先使两表面压紧，再撤去外力。压紧过程中靠在一起本身不能证明撤力后仍有结合。"},{"title":"解释观察","text":conclusion},{"title":"作答范围","text":"分子之间同时存在引力与斥力；这里的接触证据不来自磁性，也不能用于计算整块铅的实际承重。"}],conclusion,"Godot执行条件模型并返回接触状态；只比较典型界面条件，不计算铅柱最大承载质量、表面粗糙度、黏着强度或真实分子尺度。铅有毒，仅屏幕模拟或观看教师演示。")
