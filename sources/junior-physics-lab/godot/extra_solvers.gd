# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted
const PhaseMaterials=preload("res://phase_materials.gd")
var phase_materials=PhaseMaterials.new()

func n(p: Dictionary, key: String, fallback: float) -> float:
	return float(p.get(key,fallback))

func reading(label: String, value, unit: String="") -> Dictionary:
	return {"label":label,"value":value,"unit":unit}

func out(model: String, values: Dictionary, readings: Array, formula: String, calculation: String, conclusion: String, assumptions: String, points: Array=[], x_label: String="", y_label: String="") -> Dictionary:
	var r={"model":model,"solver":"Godot scientific solver","values":values,"readings":readings,"process":[{"title":"明确条件与依据","text":formula},{"title":"代入或比较","text":calculation},{"title":"规范作答","text":conclusion}],"conclusion":conclusion,"assumptions":assumptions}
	if points.size()>1:r.graph={"xLabel":x_label,"yLabel":y_label,"points":points}
	return r

func solve(model: String, p: Dictionary) -> Dictionary:
	var s=str(p.get("scenario",""))
	if model=="thermal" and s=="heat-input":
		var heat=n(p,"heat",4200)
		var mass=maxf(n(p,"mass",.1),.000001)
		var capacity=maxf(n(p,"capacity",4200),.000001)
		var initial=n(p,"initial",20)
		var rise=heat/(mass*capacity)
		return out(model,{"heat":heat,"mass":mass,"capacity":capacity,"initial":initial,"rise":rise,"temperature":initial+rise},[reading("给定净吸热",heat,"J"),reading("温升",rise,"℃"),reading("末温",initial+rise,"℃")],"在没有物态变化、比热容近似不变的条件下，Q=cmΔT，所以 ΔT=Q/(cm)。","ΔT=%.6f J÷(%.4f J/(kg·℃)×%.6f kg)=%.4f ℃；t末=%.4f+%.4f=%.4f ℃。"%[heat,capacity,mass,rise,initial,rise,initial+rise],"温度变化还与参与吸热的质量和比热容有关；相同放热量不能在不同质量条件下直接比较温升。","给定体系净吸热的定比热模型，未模拟物态变化、容器吸热和环境散热。负Q表示净放热。")
	if model=="thermal" and s=="efficiency-input":
		var useful=maxf(n(p,"useful",1000000),0)
		var efficiency=clampf(n(p,"efficiency",50),0,100)
		var input=useful/(efficiency/100) if efficiency>0 else null
		var lost=input-useful if input!=null else null
		return out(model,{"useful":useful,"efficiency":efficiency,"input":input,"lost":lost},[reading("有效能量",useful,"J"),reading("能量利用效率",efficiency,"%"),reading("所需输入能量",input,"J"),reading("未有效利用的能量",lost,"J")],"效率 η=Q有用/Q输入。已知有效能量时，应先把百分数效率化为小数，再求 Q输入=Q有用/η。","Q输入=%.4f J÷(%.4f/100)=%s J；Q损失=Q输入−Q有用=%s J。"%[useful,efficiency,str(input),str(lost)] if input!=null else "效率为0时，不能通过有限输入得到正的有效能量，此逆算没有有限解。","在获得相同有效能量时，效率越高，所需输入能量越少。能量损失表示未被有效利用，并不是能量消失。","给定效率的能量核算，效率不是燃料的固有热值；热值与成本等须另外给定。")
	if model=="phase":
		var phase_result=phase_materials.solve(p)
		if not phase_result.is_empty():return phase_result
	if model=="force" and s=="gravity":
		var mass=maxf(n(p,"mass",1),0)
		var gravity=maxf(n(p,"gravity",9.8),0)
		var weight=mass*gravity
		return out(model,{"mass":mass,"gravity":gravity,"weight":weight},[reading("质量",mass,"kg"),reading("重力",weight,"N")],"重力与质量的关系 G=mg。质量用千克，g 的单位为 N/kg，重力单位为牛。","G=%.4f kg×%.4f N/kg=%.4f N。"%[mass,gravity,weight],"同一地点重力与质量成正比；重力方向竖直向下，质量与重力不能混为同一物理量。","给定 g 的大小，忽略不同高度等小变化；水平仪器的竖直基准来自重力方向。")

	if model=="charge" and s=="rubbing":
		var charge=n(p,"charge1",5)
		var charged=absf(charge)>.000001
		return out(model,{"charge1":charge,"totalCharge":charge,"attractsNeutral":charged},[reading("带电情况","带电" if charged else "未带电"),reading("轻小中性纸屑","被吸引（适当条件下）" if charged else "没有由静电引起的明显吸引")],"摩擦可使不同材料间的电子发生转移。带电体可以通过静电感应吸引轻小中性物体。","当前摩擦后物体的电荷为相对量 %.4f；纸屑初始不预设固定正电或负电。"%charge,"带电体能够吸引轻小物体；仅凭吸引现象不能判断带电体的电性，也不能断定被吸引物体原本带异种电荷。","定性静电感应模型；未给出实际电荷量、吸引力或纸屑运动轨迹。")
	if model=="thermal" and s=="calorimetry":
		var mass=maxf(n(p,"mass",.05),0)
		var capacity=maxf(n(p,"capacity",4200),0)
		var rise=n(p,"rise",20)
		var food=maxf(n(p,"foodMass",.001),.000001)
		var heat=mass*capacity*rise
		var energy=heat/(food*1000)/1000
		return out(model,{"mass":mass,"capacity":capacity,"rise":rise,"foodMass":food,"heat":heat,"energyPerGram":energy},[reading("水吸收的热量",heat,"J"),reading("每克食物使水吸收的热量",energy,"kJ/g")],"水吸收的热量 Q = cmΔT。水的比热容取4200 J/(kg·℃)，质量先换算成kg。","Q = %.4f × %.6f × %.4f = %.4f J；食物质量 %.6f kg = %.4f g；每克对应水吸热 %.4f kJ/g。"%[capacity,mass,rise,heat,food,food*1000,energy],"这只是水在本装置吸收的热量。散热和不完全燃烧等会使结果低于食物的实际燃烧热值，不可直接当成精确营养热量。","假定水的比热容在范围内不变；未计入容器吸热、环境散热及未燃尽残留。")
	if model=="density" and s=="air":
		var length=maxf(n(p,"roomLength",6),0)
		var width=maxf(n(p,"roomWidth",4),0)
		var height=maxf(n(p,"roomHeight",3),0)
		var density=maxf(n(p,"airDensity",1.29),0)
		var volume=length*width*height
		var mass=volume*density
		return out(model,{"roomLength":length,"roomWidth":width,"roomHeight":height,"volume":volume,"mass":mass,"densitySI":density},[reading("空气体积",volume,"m³"),reading("给定空气密度",density,"kg/m³"),reading("空气质量估计",mass,"kg")],"先把房间近似成长方体求体积 V=长×宽×高，再用 m=ρV 求空气质量。","V=%.4f×%.4f×%.4f=%.4f m³；m=%.4f kg/m³×%.4f m³=%.4f kg。"%[length,width,height,volume,density,volume,mass],"空气也有质量。估算时应说明采用的空气密度与房间体积近似，不能把密度值视为所有温度和气压下不变。","忽略家具和人体占据的体积；空气密度为给定条件值，未模拟室内外流动。")
	if model=="density" and s=="foil":
		var mass=maxf(n(p,"mass",.27),0)
		var area=maxf(n(p,"area",100),.001)
		var density=maxf(n(p,"materialDensity",2.7),.001)
		var volume=mass/density
		var thickness=volume/area
		return out(model,{"mass":mass,"area":area,"materialDensity":density,"volume":volume,"thickness":thickness},[reading("薄片体积",volume,"cm³"),reading("薄片厚度",thickness*10,"mm")],"薄片厚度难以直接测量时，用质量、密度和面积间接求得：V=m/ρ，d=V/S=m/(ρS)。","V=%.6f g÷%.4f g/cm³=%.6f cm³；d=%.6f÷%.4f=%.6f cm=%.6f mm。"%[mass,density,volume,volume,area,thickness,thickness*10],"厚度 d=m/(ρS)，注意密度、面积和长度单位配套；薄片应平整、厚度近似均匀。","给定均匀材料密度，不把折叠空气层或边缘毛刺计入金属厚度。")
	if model=="molecular" and s=="gap":
		var v1=maxf(n(p,"volume1",50),0)
		var v2=maxf(n(p,"volume2",50),0)
		var contraction=clampf(n(p,"contraction",3),0,20)
		var total=v1+v2
		var final_volume=total*(1-contraction/100)
		return out(model,{"volume1":v1,"volume2":v2,"totalVolume":total,"finalVolume":final_volume,"contraction":contraction},[reading("混合前体积之和",total,"mL"),reading("题设混合后体积",final_volume,"mL"),reading("体积差",total-final_volume,"mL")],"比较混合前后体积，须保持温度等条件可比。题设中给出缩减比例，仅用于分析读数。","V前=%.4f+%.4f=%.4f mL；按给定缩减比例 %.2f%%，V后=%.4f mL。"%[v1,v2,total,contraction,final_volume],"酒精与水混合后体积可小于混合前体积之和，这与分子间有间隙和分子间作用有关；不能认为质量也随之减少。","缩减比例是可调题设，并非预测任意比例酒精与水混合体积的材料方程；真实混合还伴随温度等变化。")
	if model=="buoyancy" and s=="cause":
		var area=maxf(n(p,"area",100),.01)/10000
		var height=maxf(n(p,"objectHeight",10),.001)/100
		var depth=maxf(n(p,"depth",.2),0)
		var density=maxf(n(p,"density",1000),0)
		var top=density*9.8*depth
		var bottom=density*9.8*(depth+height)
		var force_top=top*area
		var force_bottom=bottom*area
		var buoyant=force_bottom-force_top
		return out(model,{"area":area,"objectHeight":height,"depth":depth,"density":density,"pressureTop":top,"pressureBottom":bottom,"forceTop":force_top,"forceBottom":force_bottom,"buoyantForce":buoyant},[reading("上表面液体压强",top,"Pa"),reading("下表面液体压强",bottom,"Pa"),reading("向下的压力",force_top,"N"),reading("向上的压力",force_bottom,"N"),reading("上下压力差",buoyant,"N")],"浸没在静止液体中的长方体，上下表面的液体压强 p=ρgh，压力 F=pS；侧面压力水平抵消。","S=%.6f m²；p上=%.4f Pa，p下=%.4f Pa；F浮=F下−F上=%.4f−%.4f=%.4f N。"%[area,top,bottom,force_bottom,force_top,buoyant],"浮力来自液体对物体向上和向下的压力差，方向竖直向上。浸没后改变深度，浮力在液体密度和排液体积不变时不变。","规则长方体完全浸没，液体接触上下表面；采用液体表压，大气压在上下压力差中抵消。")
	if model=="thermal" and s=="cycle":
		var stroke=str(p.get("stroke","intake"))
		var intake=stroke=="intake"
		var exhaust=stroke=="exhaust"
		var power=stroke=="power"
		var down=stroke in ["intake","power"]
		var names={"intake":"吸气","compression":"压缩","power":"做功","exhaust":"排气"}
		var energy="内能转化为机械能" if power else "机械能转化为内能" if stroke=="compression" else "依靠飞轮惯性完成辅助冲程"
		return out(model,{"stroke":stroke,"intakeOpen":intake,"exhaustOpen":exhaust,"pistonDirection":"down" if down else "up","doesWork":power},[reading("冲程",names.get(stroke,"未知")),reading("进气门","开" if intake else "闭"),reading("排气门","开" if exhaust else "闭"),reading("活塞方向","向下" if down else "向上")],"四冲程汽油机按吸气、压缩、做功、排气的顺序工作；一个工作循环中活塞往复两次、曲轴转两周。","当前%s冲程：进气门%s、排气门%s；活塞%s；%s。"%[names.get(stroke,"未知"),"开" if intake else "闭","开" if exhaust else "闭","下行" if down else "上行",energy],"四个冲程中只有做功冲程对外提供动力；压缩冲程使混合气体内能增加，做功冲程中燃气内能转化为机械能。","汽油机结构与工作顺序示意，未模拟燃烧压力曲线或实际热效率；柴油机吸气与点火方式不同。")
	if model=="magnet" and s=="poles":
		var pole1=str(p.get("pole1","N"))
		var pole2=str(p.get("pole2","N"))
		var repel=pole1==pole2
		return out(model,{"pole1":pole1,"pole2":pole2,"repel":repel,"interaction":"排斥" if repel else "吸引"},[reading("相对的磁极",pole1+" / "+pole2),reading("相互作用","排斥" if repel else "吸引")],"比较两磁体相对磁极的名称，保持距离和磁体等其他条件相同。","当前相对磁极为%s、%s，属于%s名磁极。"%[pole1,pole2,"同" if repel else "异"],"同名磁极相互排斥，异名磁极相互吸引。吸引铁制品不等同于证明该铁制品本来具有磁性。","只判断相互作用方向，没有给出真实磁力大小。")
	if model=="force" and s=="deformation":
		var force=maxf(n(p,"force",5),0)
		return out(model,{"force":force,"deformationObserved":force>0},[reading("给定外力",force,"N"),reading("观察任务","比较受力前后形状")],"比较受力前后物体的形状，判断力的作用效果；形变既可能明显，也可能需要放大观察。","当前外力大小为 %.4f N。是否及怎样形变还与材料、结构和作用方式有关，不能仅由F算出普适形变量。"%force,"力可以改变物体的形状；撤去外力后能否恢复原状，需要进一步观察。","形变定性示意，不假定所有物体都遵循同一个弹性系数。")
	if model=="household" and s=="design":
		var voltage=clampf(n(p,"voltage",6),0,12)
		var r1=maxf(n(p,"resistance1",12),1)
		var r2=maxf(n(p,"resistance2",18),1)
		var on1=int(n(p,"switch1",1))!=0
		var on2=int(n(p,"switch2",1))!=0
		var i1=voltage/r1 if on1 else 0
		var i2=voltage/r2 if on2 else 0
		var p1=voltage*i1
		var p2=voltage*i2
		return out(model,{"voltage":voltage,"resistance1":r1,"resistance2":r2,"switch1":on1,"switch2":on2,"current1":i1,"current2":i2,"totalCurrent":i1+i2,"power1":p1,"power2":p2,"totalPower":p1+p2},[reading("支路1电流",i1,"A"),reading("支路2电流",i2,"A"),reading("干路总电流",i1+i2,"A"),reading("总电功率",p1+p2,"W")],"仅用低压直流电源模拟家庭中支路并联、开关分别控制用电器的关系。每支路 I=U/R，干路 I=I₁+I₂。","支路1：%s，I₁=%.4f A；支路2：%s，I₂=%.4f A；I总=%.4f+%.4f=%.4f A；P总=UI总=%.4f W。"%["闭合" if on1 else "断开",i1,"闭合" if on2 else "断开",i2,i1,i2,i1+i2,p1+p2],"独立断开一个支路，不影响另一支路继续工作；两支路都接通时干路电流等于各支路电流之和。","低压直流、理想电源与定值负载；只能演示连接关系，不是市电施工图。灯丝随温度变阻的效应在此忽略。")
	if model=="sound" and s in ["timbre","noise"]:return sound(p,s)
	if model=="optics" and s in ["rgb","periscope","retroreflection","curved-mirror","gradient"]:return optics(p,s)
	if model=="lens" and s in ["telescope","microscope"]:return instruments(p,s)
	if model=="energy" and s=="elastic":
		var k=maxf(n(p,"stiffness",100),0)
		var x=n(p,"extension",.1)
		var energy=.5*k*x*x
		return out(model,{"stiffness":k,"extension":x,"elasticEnergy":energy},[reading("形变量",x,"m"),reading("弹性势能",energy,"J")],"在弹性限度内，理想弹簧的弹性势能 E = kx²/2（拓展计算）。","E = %.4f N/m × (%.4f m)² ÷ 2 = %.4f J。"%[k,x,energy],"在同一弹簧的弹性限度内，形变越大，弹性势能越大。","理想线性弹簧；x 为相对原长的形变量，未模拟超过弹性限度的材料。")
	if model=="spring" and s=="microdeformation":
		var f=n(p,"force",5)
		var c=maxf(n(p,"compliance",.002),0)
		var area=maxf(n(p,"tubeArea",1),.01)
		var dv=f*c
		var rise=dv/(area/100)
		return out(model,{"force":f,"compliance":c,"volumeChange":dv,"rise":rise,"tubeArea":area},[reading("挤压力",f,"N"),reading("细管液面上升",rise,"cm")],"用细管放大微小体积变化：ΔV = C F，Δh = ΔV/S。此处 C 为给定的教学模型系数。","S = %.4f mm² = %.6f cm²；ΔV = %.6f cm³；Δh = %.6f/%.6f = %.4f cm。"%[area,area/100,dv,dv,area/100,rise],"细管液面上升提供瓶体发生微小形变的间接证据；管越细，相同体积变化对应的液面变化越明显。","仅示意放大法；C 不是实际玻璃的材料常数，不能据此推断真实容器受力极限。")
	if model=="force" and s=="resultant":
		var f=n(p,"force",5)
		var f2=n(p,"force2",3)
		var same=str(p.get("direction","same"))=="same"
		var signed=f+f2 if same else f-f2
		return out(model,{"force":f,"force2":f2,"netForce":signed,"magnitude":absf(signed),"sameDirection":same},[reading("合力大小",absf(signed),"N"),reading("合力方向","与第一力同向" if signed>0 else "与第一力反向" if signed<0 else "合力为零")],"只讨论作用在同一物体、同一直线上的两个力。取第一力方向为正方向。","F合 = %.4f %s %.4f = %.4f N。"%[f,"+" if same else "−",f2,signed],"同向两力合力大小相加；反向两力合力大小相减，方向与较大的力相同。","同一物体上的共线力。不同物体间的相互作用力不能在此相加。")
	if model=="force" and s=="interaction":
		var f=absf(n(p,"force",5))
		return out(model,{"force":f,"force2":f,"reaction":-f},[reading("甲对乙的力",f,"N"),reading("乙对甲的力",f,"N")],"两个物体间的相互作用力同时产生，大小相等、方向相反，分别作用在两个物体上。","甲对乙的力大小为 %.4f N，因此乙对甲的力大小也为 %.4f N。"%[f,f],"相互作用力不作用在同一物体上，不能当作一对平衡力，也不求它们对一个物体的合力。","只比较两物体间这一对相互作用力；并未据此确定每个物体受到的其他力。")
	if model=="pressure" and s=="pump":
		var stroke=str(p.get("stroke","pull"))
		var pull=stroke in ["pull","up","intake"]
		var inlet="打开" if pull else "关闭"
		var outlet="关闭" if pull else "打开"
		return out(model,{"stroke":stroke,"inlet":inlet,"outlet":outlet,"medium":"water","flow":"水箱 → 下腔；上腔水提升至出口" if pull else "下腔 → 活塞阀 → 上腔"},[reading("活塞动作","向上提" if pull else "向下压"),reading("底部进水阀",inlet),reading("活塞上的阀",outlet)],"简易活塞式抽水机设底阀和活塞阀。阀门只允许水向上流动；压强差与活塞运动共同使水逐步提升。","上提：活塞阀闭、底阀开，水箱的水在大气压作用下进入下腔；已有的上腔水被活塞提升至出口。下压：底阀闭、活塞阀开，下腔水穿过活塞阀进入上腔。","当前阶段：%s；水流方向：%s。"%["上提" if pull else "下压","水箱到下腔，上腔水被提升出水" if pull else "从下腔经过活塞阀进入上腔"],"先排出空气并使泵内有水的简易抽水机结构示意。吸水高度受大气压等限制，不能无限增高。")
	if model=="thermal" and s in ["bimetal","linearExpansion"]:return bimetal(p)
	if model=="thermal" and s=="friction":
		var f=maxf(n(p,"force",5),0)
		var distance=maxf(n(p,"distance",2),0)
		var heat=f*distance
		return out(model,{"force":f,"distance":distance,"heat":heat},[reading("滑动摩擦力",f,"N"),reading("相对滑动路程",distance,"m"),reading("转化的内能",heat,"J")],"恒定滑动摩擦力做功，将机械能转化为接触物体的内能。以两个接触物体组成的系统计，Q = f s相对。","Q = %.4f N × %.4f m = %.4f J。"%[f,distance,heat],"克服摩擦做功可以使物体内能增加；不能直接把内能变化等同于某一个物体的温度变化。","假定摩擦功全部转化为这两个物体的内能，未计算传热损失或两物体各自分得的能量。")
	if model=="phase" and s=="deposition":
		var temp=n(p,"surfaceTemperature",n(p,"initial",-10))
		var cold=temp<0
		return out(model,{"temperature":temp,"phase":"凝华条件示意" if cold else "未满足形成霜的低温条件","deposition":cold},[reading("冷表面温度",temp,"℃"),reading("观察目标","直接形成冰晶" if cold else "未形成霜")],"凝华是物质由气态直接变为固态的过程，需要放热。水蒸气直接在冷表面形成霜，属于凝华。","比较原状态（水蒸气）与最终状态（冰晶）；只有确认没有先形成液态水，才能判定为直接凝华。","霜是水蒸气遇冷直接形成的冰晶；若先成为水滴后结冰，则经历液化和凝固两个过程。","表面温度不是能否凝华的全部条件，还需水蒸气含量等。这里只演示指定的直接结霜过程。")
	if model=="magnet" and s in ["field","compass"]:
		var pole=str(p.get("pole","N"))
		var direction="远离磁体 N 极" if pole=="N" else "指向磁体 S 极"
		return out(model,{"pole":pole,"fieldDirection":direction,"permanent":true},[reading("所观察磁极",pole),reading("磁体外部磁感线方向","N 极 → S 极"),reading("小磁针 N 极指向",direction)],"磁场方向规定为放入磁场的小磁针静止时 N 极所指的方向。","在磁体外部，磁感线由 N 极出发，回到 S 极；小磁针转动后，其 N 极与当地磁场方向一致。","磁感线是描述磁场的模型，不是实际存在的线。磁场各点方向不同，铁屑排列只能显示分布形状。","永久磁体定性模型；没有给出磁感应强度或磁场测量值，也不使用线圈电流/匝数代替永久磁体条件。")
	return {}

func sound(p: Dictionary, s: String) -> Dictionary:
	var f=maxf(n(p,"frequency",440),1)
	var a=maxf(n(p,"amplitude",2),0)
	var h2=n(p,"harmonic2",.5)
	var h3=n(p,"harmonic3",.25)
	var points=[]
	for i in range(241):
		var time=float(i)/240*5/f
		var phase=TAU*f*time
		var y=a*(sin(phase)+h2*sin(2*phase)+h3*sin(3*phase))
		if s=="noise":y=a*(sin(phase)+.55*sin(sqrt(2)*phase+.7)+.4*sin(sqrt(5)*phase+2.1)+.3*sin(PI*phase))
		points.append([time*1000,y])
	var timbre=s=="timbre"
	return out("sound",{"frequency":f,"amplitude":a,"harmonic2":h2,"harmonic3":h3,"speed":340,"medium":"air","noise":not timbre},[reading("基频" if timbre else "波形频率尺度",f,"Hz"),reading("相对振幅系数",a),reading("波形特征","同基频、不同谐波" if timbre else "非周期组合示意")],"比较波形时分清频率、振幅与形状；音色与振动波形的谐波组成等有关。" if timbre else "物理角度的噪声振动通常不规则；环境保护角度还要看声音是否妨碍正常生活学习。","给定基频 %.1f Hz，二次谐波系数 %.3f、三次谐波系数 %.3f；改变谐波组成后比较形状。"%[f,h2,h3] if timbre else "用几个非整数倍频率的分量构成不规则示意波形；它不是某个环境的实测声音。","基频相同的声音仍可具有不同音色；不能只凭响度或音调判断音色。" if timbre else "可在声源处、传播过程中或人耳处减弱噪声；不应把相对振幅直接读作分贝。","确定性波形教学合成，不是录音、实测声压或噪声级。",points,"时间 / ms","相对振幅")

func optics(p: Dictionary, s: String) -> Dictionary:
	if s=="rgb":
		var red=int(clampf(n(p,"red",255),0,255))
		var green=int(clampf(n(p,"green",255),0,255))
		var blue=int(clampf(n(p,"blue",255),0,255))
		var hex="#"+Color(red/255.0,green/255.0,blue/255.0).to_html(false)
		return out("optics",{"rgb":[red,green,blue],"hex":hex},[reading("红光通道",red),reading("绿光通道",green),reading("蓝光通道",blue),reading("屏幕混合色",hex)],"光的三原色为红、绿、蓝；光色混合采用相加模型，与颜料混合不同。","屏幕通道设为 R=%d、G=%d、B=%d，得到显示颜色 %s。"%[red,green,blue,hex],"红绿光叠加得到黄光，绿蓝光叠加得到青光，红蓝光叠加得到品红光；适当比例的三色光叠加可得到白光。","显示器 RGB 通道示意，不将数字通道值当成光功率或实际光谱强度。")
	if s in ["periscope","retroreflection"]:
		var angle=clampf(n(p,"angle",45),5,85)
		var retro=s=="retroreflection"
		var stage=int(clampf(n(p,"stage",2),0,2))
		var direction=fposmod(angle+180,360) if retro else angle
		return out("optics",{"angle":angle,"outputDirection":direction,"parallel":true,"opposite":retro,"reflectionCount":stage,"stage":stage},[reading("当前观察的反射次数",stage),reading("出射光相对入射光","平行且方向相反" if retro else "平行且方向相同")],"每次反射均满足反射角等于入射角；连续在两面镜上分别作法线。","两块平面镜互相垂直，经两次反射后，出射光方向与入射光方向相反。" if retro else "两块平面镜互相平行；在标准潜望镜中均与筒轴成45°，光经历两次反射。","角反射装置可使指定二维平面内的入射光沿平行反向返回。" if retro else "潜望镜利用两次反射改变光路，使观察者越过障碍物看见目标。","理想平面镜；忽略有限镜面口径。二维两镜角反射与任意空间方向均返回的三镜角反射器不同。" if retro else "理想平行双镜模型；未模拟遮挡、视场和实际镜面大小。")
	if s=="curved-mirror":return curved_mirror(p)
	var top=maxf(n(p,"nTop",1.3),1)
	var bottom=maxf(n(p,"nBottom",1.5),1)
	var height=maxf(n(p,"height",1),.01)
	var angle=clampf(n(p,"angle",45),0,85)
	var invariant=top*sin(deg_to_rad(angle))
	var ray=[[0.0,0.0]]
	var x=0.0
	var end_angle=angle
	var turned=false
	for i in range(1,101):
		var refractive=lerpf(top,bottom,(float(i)-.5)/100)
		if invariant>=refractive:turned=true;break
		end_angle=rad_to_deg(asin(invariant/refractive))
		x+=height/100*tan(deg_to_rad(end_angle))
		ray.append([x,height*i/100])
	return out("optics",{"nTop":top,"nBottom":bottom,"height":height,"angle":angle,"endAngle":end_angle,"ray":ray,"turned":turned},[reading("上层折射率",top),reading("下层折射率",bottom),reading("末端与竖直方向夹角",end_angle,"°")],"设介质折射率沿竖直方向均匀变化，把介质分成薄层；逐层依据 n·sinθ 保持相同来追迹。","上层 n₁=%.3f，下层 n₂=%.3f，入射方向与竖直方向夹角 %.2f°。"%[top,bottom,angle],"折射率不均匀时光路可以弯曲；均匀介质中光沿直线传播。"+("已到转向条件，图仅画至转向点。" if turned else ""),"给定线性折射率剖面的几何光学模型，不能把结果直接当作真实糖水或大气的测量光路。")

func curved_mirror(p: Dictionary) -> Dictionary:
	var f=n(p,"focal",10)
	var u=maxf(n(p,"distance",30),.01)
	var h=n(p,"height",3)
	var valid=absf(u-f)>1e-8 and absf(f)>1e-8
	var v=f*u/(u-f) if valid else null
	var hi=-h*v/u if valid else null
	var nature="焦距为0不在模型适用范围内" if absf(f)<1e-8 else "无有限位置的像" if not valid else "倒立实像" if v>0 else "正立虚像"
	return out("optics",{"focal":f,"distance":u,"imageDistance":v,"imageHeight":hi,"height":h,"nature":nature},[reading("焦距（凹面为正）",f,"cm"),reading("像距",v,"cm"),reading("像的性质",nature)],"近轴球面镜模型：1/f = 1/u + 1/v，m = −v/u。凹面镜 f>0，凸面镜 f<0（拓展）。","f=%.4f cm，u=%.4f cm；v=fu/(u−f)=%s cm。"%[f,u,str(v)] if valid else "焦距为0不是本球面镜近似的有效输入，请选择非零焦距。" if absf(f)<1e-8 else "物体在焦点处时反射光平行，没有有限位置的像。",nature+"；凹面镜可使平行光会聚，凸面镜使平行光发散。","近轴球面镜近似；不模拟球差，虚像用反射光的反向延长线定位。")

func instruments(p: Dictionary, s: String) -> Dictionary:
	var eyepiece=maxf(n(p,"eyepieceFocal",5),.1)
	if s=="telescope":
		var objective=maxf(n(p,"objectiveFocal",40),.1)
		var magnification=objective/eyepiece
		return out("lens",{"objectiveFocal":objective,"eyepieceFocal":eyepiece,"angularMagnification":magnification,"signedAngularMagnification":-magnification,"tubeLength":objective+eyepiece,"nature":"倒立的放大视角"},[reading("视角放大倍数",magnification,"倍"),reading("理想镜筒长度",objective+eyepiece,"cm")],"开普勒式望远镜由两凸透镜组成，物镜使远处物体成倒立实像，目镜再作为放大镜观察。","远处物体、放松眼睛观察时：|M|=f物/f目=%.4f/%.4f=%.4f；镜间距 L=f物+f目=%.4f cm。"%[objective,eyepiece,magnification,objective+eyepiece],"增大物镜焦距与目镜焦距的比值，可以增大视角放大倍数；两凸透镜式望远镜成倒立像。","远处目标、近轴薄透镜、最终像在无穷远的理想模型；不是所有望远镜的镜筒长度公式。")
	var f=maxf(n(p,"focal",2),.1)
	var u=maxf(n(p,"distance",2.4),.01)
	var valid=u>f
	var v=f*u/(u-f) if valid else null
	var objective=v/u if valid else null
	var eyepiece_m=25/eyepiece
	var combined=objective*eyepiece_m if valid else null
	return out("lens",{"focal":f,"distance":u,"eyepieceFocal":eyepiece,"objectiveImageDistance":v,"objectiveMagnification":objective,"eyepieceMagnification":eyepiece_m,"angularMagnification":combined,"nature":"倒立放大" if valid and u<2*f else "不处于常规显微观察条件"},[reading("物镜像距",v,"cm"),reading("物镜放大倍数",objective,"倍"),reading("目镜放大倍数",eyepiece_m,"倍"),reading("总放大倍数",combined,"倍")],"物镜先形成实像，目镜再放大；常规显微观察应将物体置于物镜一倍与二倍焦距之间，使物镜形成倒立放大的实像。","物镜 v=fu/(u−f)=%s cm，物镜倍率=%s；取明视距离25 cm、目镜放松观察的角放大率约25/f目=%.4f，总倍率约%s。"%[str(v),str(objective),eyepiece_m,str(combined)] if valid else "物距不大于物镜焦距，不能形成所需的中间实像，应调整物距。",("显微镜放大倍数等于物镜与目镜放大倍数的乘积。" if valid and u<2*f else "当前物镜没有形成放大的实像，不处于常规显微观察条件；请把物距调到一倍与二倍物镜焦距之间。")+"观察范围不是放大倍数的平方。","两薄透镜教学近似；25 cm为约定明视距离，实际显微镜应读取镜头标注倍率。")

func bimetal(p: Dictionary) -> Dictionary:
	var length=maxf(n(p,"length",.2),.001)
	var a1=n(p,"alpha1",.000019)
	var a2=n(p,"alpha2",.000012)
	var delta=n(p,"deltaT",n(p,"temperature",80)-n(p,"initial",20))
	var d1=length*a1*delta
	var d2=length*a2*delta
	var direction="材料2" if d1>d2 else "材料1" if d2>d1 else "不因热膨胀差弯曲"
	return out("thermal",{"length":length,"alpha1":a1,"alpha2":a2,"deltaT":delta,"lengthChange1":d1,"lengthChange2":d2,"length1":length+d1,"length2":length+d2,"bendToward":direction},[reading("温度变化",delta,"℃"),reading("材料1自由伸长量",d1*1000,"mm"),reading("材料2自由伸长量",d2*1000,"mm"),reading("弯曲朝向",direction)],"在小温差近似下，自由热膨胀量 ΔL=αL₀ΔT。粘合的双金属片不能各自自由伸长，因膨胀差而弯曲。","L₀=%.4f m，ΔT=%.2f ℃；ΔL₁=%.6f m，ΔL₂=%.6f m。"%[length,delta,d1,d2],"双金属片向自由长度较短的一侧弯曲。改变温度可改变弯曲方向或程度，常用于温控开关。","仅计算两种材料自由伸长量并判断弯曲方向；真实曲率还取决于厚度、弹性模量和粘结，未把自由伸长差直接当作曲率。")
