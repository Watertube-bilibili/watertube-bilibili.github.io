# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted
const G: float=9.8
func number(p: Dictionary,key: String,fallback: float) -> float:return float(p.get(key,fallback))
func reading(label: String,value,unit: String="",derived: bool=false) -> Dictionary:return {"label":label,"value":value,"unit":unit,"derived":derived}
func step(title: String,text: String) -> Dictionary:return {"title":title,"text":text}
func answer(model: String,values: Dictionary,readings: Array,process: Array,conclusion: String,assumptions: String) -> Dictionary:
	return {"model":model,"values":values,"readings":readings,"process":process,"conclusion":conclusion,"assumptions":assumptions,"solver":"Godot fluid and density solver"}
func solve(model: String,p: Dictionary) -> Dictionary:
	var scenario: String=str(p.get("scenario",""))
	if model=="density" and scenario=="materialSeries":return material_series(p)
	if model=="pressure" and scenario=="liquidProbe":return liquid_probe(p)
	if model=="pressure" and scenario=="venturi":return venturi(p)
	return {}

func material_data(key: String) -> Dictionary:
	return {"aluminum":{"name":"铝样品","density":2.7,"color":"#b0bcc4"},"iron":{"name":"铁样品","density":7.9,"color":"#889ca9"},"wood":{"name":"题设木样","density":0.6,"color":"#c3a271"}}.get(key,{"name":"铝样品","density":2.7,"color":"#b0bcc4"})
func material_series(p: Dictionary) -> Dictionary:
	var material: String=str(p.get("material","aluminum"))
	var comparison: String=str(p.get("comparisonMaterial","iron"))
	var primary: Dictionary=material_data(material)
	var secondary: Dictionary=material_data(comparison)
	var volume_step: float=clampf(number(p,"volumeStep",10),2,20)
	var selected: int=clampi(int(number(p,"sampleIndex",3)),1,5)
	var samples: Array=[]
	var points: Array=[[0.0,0.0]]
	var comparison_points: Array=[[0.0,0.0]]
	var rows: Array=[]
	for i in range(1,6):
		var volume: float=volume_step*i
		var mass: float=primary.density*volume
		var comparison_mass: float=secondary.density*volume
		samples.append({"index":i,"volume":volume,"mass":mass,"comparisonMass":comparison_mass,"sideLength":pow(volume,1.0/3.0)})
		points.append([volume,mass]);comparison_points.append([volume,comparison_mass])
		rows.append([i,volume,mass,primary.density,comparison_mass,secondary.density])
	var selected_sample: Dictionary=samples[selected-1]
	var values: Dictionary={"scenario":"materialSeries","material":material,"materialName":primary.name,"color":primary.color,"comparisonMaterial":comparison,"comparisonName":secondary.name,"comparisonColor":secondary.color,"density":primary.density,"comparisonDensity":secondary.density,"volumeStep":volume_step,"sampleIndex":selected,"volume":selected_sample.volume,"mass":selected_sample.mass,"comparisonMass":selected_sample.comparisonMass}
	var result=answer("density",values,[reading("当前材料",primary.name),reading("选中样品编号",selected),reading("样品体积",selected_sample.volume,"cm³"),reading("样品质量",selected_sample.mass,"g"),reading("质量/体积比值",primary.density,"g/cm³",true),reading("另一材料同体积质量",selected_sample.comparisonMass,"g")],[step("保持材料与状态相同","选择%s，在相同温度和状态下比较5块均匀样品。体积是各样品的自变量，质量由同一密度关系生成，不允许把质量任意改成另一种材料。"%primary.name),step("整理多组模型读数","体积依次为%.2f、%.2f、%.2f、%.2f、%.2f cm³。逐个选择样品，对照天平质量读数和记录表。"%[volume_step,2*volume_step,3*volume_step,4*volume_step,5*volume_step]),step("求相同比值","当前样品ρ＝m/V＝%.3f g÷%.3f cm³＝%.3f g/cm³＝%.1f kg/m³。其余同材料样品也有相同比值。"%[selected_sample.mass,selected_sample.volume,primary.density,primary.density*1000]),step("作图与比较","横轴V、纵轴m，5组同材料数据落在通过原点的直线上；斜率m/V为密度。比较%s与%s时，不能只看哪一块质量更大，须比较相同体积的质量或图线斜率。"%[primary.name,secondary.name])],"同种均匀物质在相同温度和状态下，质量与体积成正比；不同材料的m—V图线斜率可以不同。","给定密度的理想均匀样品：铝2.7、铁7.9、题设木样0.6 g/cm³。木材密度依品种和含水量而异，此值只属于题设样品。数据由模型生成，不是实物天平测量结果；多组关系用于学习控制材料、作图和比较比值。")
	result["samples"]=samples
	result["table"]={"headers":["样品","体积 V / cm³",primary.name+"质量 / g",primary.name+" m/V / (g/cm³)",secondary.name+"质量 / g",secondary.name+" m/V / (g/cm³)"],"rows":rows,"derivedColumns":[3,5]}
	result["graph"]={"xLabel":"体积 V / cm³","yLabel":"质量 m / g","series":[{"name":primary.name,"points":points},{"name":secondary.name,"points":comparison_points}]}
	return result

func liquid_probe(p: Dictionary) -> Dictionary:
	var density: float=clampf(number(p,"density",1000),500,2000)
	var depth: float=clampf(number(p,"depth",0.3),0,0.5)
	var manometer_density: float=clampf(number(p,"manometerDensity",1000),800,1400)
	var direction: String=str(p.get("probeDirection","right"))
	var angle: float={"right":0.0,"down":90.0,"left":180.0,"up":270.0}.get(direction,0.0)
	var pressure: float=density*G*depth
	var height_difference: float=pressure/(manometer_density*G)
	return answer("pressure",{"scenario":"liquidProbe","density":density,"depth":depth,"probeDirection":direction,"probeAngle":angle,"manometerDensity":manometer_density,"liquidPressure":pressure,"heightDifference":height_difference,"headMillimeters":height_difference*1000},[reading("探头竖直深度",depth,"m"),reading("液体对探头的表压",pressure,"Pa"),reading("U形管两液面高度差",height_difference*1000,"mm"),reading("探头朝向",{"right":"向右","down":"向下","left":"向左","up":"向上"}.get(direction,"向右"))],[step("先调零","探头未受额外压强时，U形管两侧液面应等高。一侧接橡皮膜探头，另一侧通大气。"),step("控制变量改变朝向","保持同种静止液体、同一深度，依次把膜面朝上、下、左、右，比较U形管液面差。探头转动时中心深度不变。"),step("改变深度或密度","p＝ρgh＝%.1f×9.8×%.3f＝%.3f Pa。深度是探头中心到自由液面的竖直距离。"%[density,depth,pressure]),step("解释U形管","接探头的一侧气压较大，压低该侧液面。忽略气体密度：Δp＝ρ示gΔh，因此Δh＝%.3f/(%.1f×9.8)＝%.6f m。这里ρ示是U形管内示压液密度，不是被测液体密度。"%[pressure,manometer_density,height_difference])],"静止液体同一位置向各方向的压强相同；同种液体中深度越深压强越大，同深度下密度越大压强越大。","理想小膜片把被测表压传给封闭气路，忽略膜张力、气体密度与气路容积变化；右支通大气，U形管示压液密度独立给定。示意图的探头与液柱不是实物等比例尺。")

func venturi(p: Dictionary) -> Dictionary:
	var wide_speed: float=clampf(number(p,"wideSpeed",6),0,10)
	var ratio: float=clampf(number(p,"areaRatio",3),1,4)
	var gas_density: float=clampf(number(p,"gasDensity",1.2),0.8,2.0)
	var manometer_density: float=clampf(number(p,"manometerDensity",1000),800,1400)
	var narrow_speed: float=wide_speed*ratio
	var difference: float=0.5*gas_density*(narrow_speed*narrow_speed-wide_speed*wide_speed)
	var head: float=difference/((manometer_density-gas_density)*G)
	var points: Array=[]
	for i in range(21):
		var speed: float=float(i)/2.0
		points.append([speed,0.5*gas_density*speed*speed*(ratio*ratio-1.0)])
	var result=answer("pressure",{"scenario":"venturi","wideSpeed":wide_speed,"narrowSpeed":narrow_speed,"areaRatio":ratio,"diameterRatio":sqrt(ratio),"gasDensity":gas_density,"manometerDensity":manometer_density,"pressureDifference":difference,"wideReferencePressure":0.0,"narrowRelativePressure":-difference,"heightDifference":head,"headMillimeters":head*1000.0},[reading("宽段流速",wide_speed,"m/s"),reading("窄段流速",narrow_speed,"m/s"),reading("宽段静压－窄段静压",difference,"Pa"),reading("U形管液面高度差",head*1000,"mm")],[step("先检查比较条件","水平管道，两个侧壁静压取压口同高；气流稳定且近似不可压缩，忽略黏性损失。管内空气密度与U形管示压液密度必须分开。"),step("用连续性求两处流速","A宽v宽＝A窄v窄。A宽/A窄＝%.3f，所以v窄＝%.3f×%.3f＝%.3f m/s。"%[ratio,wide_speed,ratio,narrow_speed]),step("比较两处静压","同高伯努利关系：p宽＋ρ气v宽²/2＝p窄＋ρ气v窄²/2。Δp＝ρ气(v窄²－v宽²)/2＝%.3f×(%.3f²－%.3f²)/2＝%.3f Pa。不能把宽段流速当成0。"%[gas_density,narrow_speed,wide_speed,difference]),step("把压差换成U形管读数","同高两取压口的差压关系为Δp＝(ρ示－ρ气)gΔh。Δh＝%.3f/[(%.1f－%.3f)×9.8]＝%.6f m＝%.3f mm。"%[difference,manometer_density,gas_density,head,head*1000])],"本模型中窄段流速较大、静压较低；当截面积相同或气流停止时，两处静压差与U形管液面差都为零。","稳态、水平、低速气流的不可压缩伯努利模型，忽略黏性和局部损失。圆管直径比取面积比平方根。取压口位于同高侧壁，读取静压；图中宽段设为相对比较的0 Pa基准，不表示绝对压强为零。U形管按独立的液体密度求读数，不将气体速度头当成液柱高度。")
	result["graph"]={"xLabel":"宽段流速 / (m/s)","yLabel":"宽段－窄段静压差 / Pa","points":points}
	return result
