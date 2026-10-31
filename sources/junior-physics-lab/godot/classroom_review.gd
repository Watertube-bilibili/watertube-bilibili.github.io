# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted

func can_handle(model: String, scenario: String) -> bool:
	return (model=="measurement" and scenario in ["caliper","balancePractice","thermometerPractice"]) or (model=="thermal" and scenario in ["liquidExpansion","infraredCompare","kitchenHeat"]) or (model=="sound" and scenario=="surfaceWave") or (model=="phase" and scenario=="mixtureObservation") or (model=="emwave" and scenario in ["vacuumCompare","sparkCompare","radioTransmission"])

func reading(label: String, value, unit: String="") -> Dictionary:
	return {"label":label,"value":value,"unit":unit}

func result(model: String, values: Dictionary, readings: Array, formula: String, substitution: String, conclusion: String, assumptions: String) -> Dictionary:
	return {"model":model,"values":values,"readings":readings,"process":[{"title":"原理","text":formula},{"title":"代入与分析","text":substitution},{"title":"结论与检查","text":conclusion}],"conclusion":conclusion,"assumptions":assumptions,"solver":"Godot classroom apparatus model"}

func evaluate(model: String, p: Dictionary) -> Dictionary:
	var scenario=str(p.get("scenario",""))
	if scenario=="vacuumCompare":
		var medium=str(p.get("medium","air"))
		var source=bool(p.get("sourceOn",true))
		var sound_on=bool(p.get("phoneSoundOn",true))
		var received=source
		var audible=received and sound_on and medium!="vacuum"
		return result(model,{"medium":medium,"sourceOn":source,"phoneSoundOn":sound_on,"received":received,"audibleOutside":audible,"sourceVibrating":received and sound_on},[reading("罩内手机是否收到无线信号",received),reading("罩内扬声器是否振动",received and sound_on),reading("理想条件下罩外能否听到铃声",audible)],"手机收发的无线信号由电磁波传递，电磁波可以在真空传播；铃声属于机械波，传播需要介质。","本次罩内介质：%s；发射端%s，手机铃声%s。"%["真空" if medium=="vacuum" else "空气","开启" if source else "关闭","开启" if sound_on else "关闭"],"真空中仍可收到无线信号，但没有空气传声路径；发声体可以仍在振动。" if medium=="vacuum" and received else "有空气时可同时比较屏幕来电信号和声音；关闭发射端则没有本次来电信号。","理想真空与普通透明罩的课堂对照，忽略通过固体支架传声、屏蔽与天线损耗；不是手机通信协议或实际声压的模拟。")
	if scenario=="sparkCompare":
		var mode=str(p.get("mode","switching"))
		var receiver_on=bool(p.get("receiverOn",true))
		var changing=mode=="switching"
		var response=result(model,{"mode":mode,"receiverOn":receiver_on,"changingCurrent":changing,"interference":changing and receiver_on},[reading("电流是否迅速变化",changing),reading("接收机是否接通",receiver_on),reading("是否出现对应干扰响应",changing and receiver_on)],"迅速变化的电流可产生电磁波；火花与快速通断常产生瞬态、宽频的电磁干扰。稳恒阶段不等同于连续的火花信号。","发射电路选择%s；接收机%s。"%["迅速通断" if changing else "稳恒电流","接通" if receiver_on else "关闭"],"快速通断时接收端出现对应的杂音/干扰示意。" if changing and receiver_on else "当前没有这组瞬态通断引起的接收响应；刚接通瞬间的暂态未包含在稳恒阶段。","响应包络为相对示意，不是假定火花具有单一MHz频率，不输出精确噪声级、场强或传播距离。")
		response["graph"]={"xLabel":"操作时间 / s（慢放）","yLabel":"相对接收响应示意","points":[]}
		response["sourceGraph"]={"xLabel":"操作时间 / s（慢放）","yLabel":"发射端瞬态示意","points":[]}
		for i in range(121):
			var pulse=1.0 if i%20 in [0,1,2] else 0.0
			response.graph.points.append([i/20.0,pulse if changing and receiver_on else 0.0])
			response.sourceGraph.points.append([i/20.0,pulse if changing else 0.0])
		return response
	if scenario=="radioTransmission":
		var frequency=clampf(float(p.get("frequency",100)),1,1000)
		var source=bool(p.get("sourceOn",true))
		var receiver_on=bool(p.get("receiverOn",true))
		var wavelength=299792458.0/(frequency*1000000)
		return result(model,{"sourceOn":source,"receiverOn":receiver_on,"received":source and receiver_on,"frequencyMHz":frequency,"wavelength":wavelength},[reading("给定频率",frequency,"MHz"),reading("对应真空波长",wavelength,"m"),reading("本模型接收端有信号",source and receiver_on)],"电磁波传递信息；给定频率的真空波长λ＝c/f。接收信号需要发射端工作且接收端接通。","f＝%.1f MHz＝%.1f×10⁶ Hz；λ＝299792458/(%.1f×10⁶)＝%.4f m。"%[frequency,frequency,frequency,wavelength],"发射与接收条件均满足，显示收到信号。" if source and receiver_on else "发射端或接收端关闭，本次没有接收信号；表中波长仅指给定频率对应值。","这是无屏蔽、匹配接收的工作原理模型，未计算真实天线效率、传播损耗、干扰或通信编码；波前图不按实际波长缩放。")
	if scenario=="surfaceWave":
		var frequency=clampf(float(p.get("frequency",1)),.2,2)
		var amplitude=clampf(float(p.get("amplitude_mm",3)),0,5)
		var speed=clampf(float(p.get("speed",.2)),.1,.5)
		var duration=4.0
		var wavelength=speed/frequency
		var response=result(model,{"frequency":frequency,"amplitude":amplitude,"speed":speed,"duration":duration,"wavelength":wavelength,"probeRadius":.25},[reading("给定相速",speed,"m/s"),reading("频率",frequency,"Hz"),reading("波长",wavelength,"m")],"采用给定相速的圆形简谐表面波示意，λ＝v/f。固定位置的浮标在波到达后上下振动，不随波前一起向外迁移。","λ＝%.2f÷%.2f＝%.3f m；浮标到波源距离0.25 m。"%[speed,frequency,wavelength],"波传播的是扰动与能量；这个水面波类比不能说明空气声波中的质点也上下振动。","忽略水深色散、黏性、反射与圆形波幅衰减；相速为题设，不由液体种类预测。波形和浮标振动由Godot的给定波关系计算。")
		response["waveStates"]=[]
		response["graph"]={"xLabel":"时间 / s","yLabel":"浮标竖直位移 / mm","points":[]}
		for i in range(161):
			var time=duration*i/160.0
			var radii=[]
			for cycle in range(int(floor(time*frequency))+1):
				var radius=speed*(time-cycle/frequency)
				if amplitude>0 and radius>=0 and radius<=.8:radii.append(radius)
			var displacement=amplitude*sin(TAU*frequency*(time-.25/speed)) if time>=.25/speed else 0.0
			response.waveStates.append({"time":time,"radii":radii,"displacement":displacement})
			response.graph.points.append([time,displacement])
		return response
	if scenario=="mixtureObservation":
		var stage=str(p.get("stage","before"))
		var cooled=stage=="cooled"
		return result(model,{"stage":stage,"waterState":"出现冰" if cooled else "液态","mixtureState":"仍可流动","temperatureCondition":"相同低于0℃的冷浴" if cooled else "相同室温","givenObservation":true},[reading("纯水的观察", "出现冰" if cooled else "液态"),reading("给定含酒精样品的观察","仍可流动"),reading("环境条件","相同低于0℃的冷浴" if cooled else "相同室温")],"先观察，再提出成分是否改变凝固温度的猜想。不能把纯水0℃凝固条件直接套给所有混合物。","题设观察：两试管由同一室温置于同一低于0℃的冷浴；观察时纯水出现冰，给定含酒精样品仍可流动。" if cooled else "先比较相同室温下两个液态样品，再切换到冷浴后的题设观察。","由这个观察可提出：混合物组成可能影响凝固温度；还需改变浓度并测量温度进行检验。","这是明确给定的观察情境，不是由任意酒精浓度预测相图；不提供未经核验的精确凝固点或凝固时刻。纯水也可能过冷，本题观察已经给定出现冰。")
	if scenario=="kitchenHeat":
		var activity=str(p.get("activity","heating"))
		var covered=bool(p.get("covered",true))
		var mass=clampf(float(p.get("mass",.3)),.1,1)
		var temperature=clampf(float(p.get("initial",80)),20,95)
		var initial=temperature
		var ambient=clampf(float(p.get("ambient",20)),10,30)
		var power=0.0 if activity=="cooling" else clampf(float(p.get("power",300)),0,500)
		var duration=clampf(float(p.get("time",300)),0,600)
		var conductance=1.0 if covered else 4.0
		var evaporated=0.0
		var lost=0.0
		var actual_time=duration
		var dry=false
		var points=[]
		var states=[]
		var steps=600
		var dt=duration/steps
		for i in range(steps+1):
			if i%5==0:points.append([i*dt,temperature]);states.append({"time":i*dt,"temperature":temperature,"evaporated":evaporated,"remainingMass":mass-evaporated,"boiling":temperature>=99.999,"dry":false})
			if i==steps:break
			var remaining=mass-evaporated
			var loss_rate=conductance*(temperature-ambient)
			var net_power=power-loss_rate
			var added=net_power*dt
			var sensible=remaining*4200*(100-temperature)
			if net_power>0 and added>=sensible+remaining*2260000:
				var last_dt=(sensible+remaining*2260000)/net_power
				lost+=loss_rate*last_dt
				actual_time=i*dt+last_dt
				temperature=100
				evaporated=mass
				dry=true
				points.append([actual_time,temperature])
				states.append({"time":actual_time,"temperature":temperature,"evaporated":mass,"remainingMass":0,"boiling":false,"dry":true})
				break
			lost+=loss_rate*dt
			if added>sensible:
				temperature=100
				evaporated+=(added-sensible)/2260000.0
			else:temperature+=added/(remaining*4200)
		var response=result(model,{"activity":activity,"covered":covered,"temperature":temperature,"initial":initial,"ambient":ambient,"power":power,"time":actual_time,"requestedTime":duration,"mass":mass,"remainingMass":mass-evaporated,"dry":dry,"heatLoss":lost,"evaporated":evaporated,"conductance":conductance,"boiling":temperature>=99.999 and not dry},[reading("水温",temperature if not dry else null,"℃"),reading("散向环境的热量",lost,"J"),reading("沸腾阶段汽化质量",evaporated*1000,"g"),reading("题设总热导",conductance,"W/℃")],"每一时步：输入热量减去对环境散热，余量用于水升温；到100℃后的余量用于汽化。关火冷却时输入功率为0。","散热采用题设K(T－T环境)；加盖K＝1 W/℃，敞口K＝4 W/℃，水c＝4200 J/(kg·℃)。本次Q散≈%.1f J，计算到%.2f s。"%[lost,actual_time],"水已耗尽，本模型在此停止，不能继续把空锅当液态水计算。" if dry else "相同其他条件下加盖减少散热，通常有助于保温或更快加热；锅盖遇到温暖湿空气时可形成液化水滴。","K为明确给定的装置总热导示例，不代表真实所有锅具；定压100℃沸点，随汽化扣减水质量，不含容器热容与冷却阶段蒸发。锅盖水滴为液化现象示意，不定量求冷凝量。")
		response["thermalStates"]=states
		response["graph"]={"xLabel":"时间 / s","yLabel":"水温 / ℃","points":points}
		return response
	if scenario=="caliper":
		var diameter=clampf(float(p.get("diameter",2.5)),1,4)
		var left=clampf(float(p.get("left",4.5)),0,10)
		var right=clampf(float(p.get("right",8)),0,10)
		var start=5.0
		var measured=right-left
		var touching=absf(left-start)<=.025 and absf(right-(start+diameter))<=.025
		var obstructed=left>start+.025 or right<start+diameter-.025 or right<=left
		var turns=clampf(float(p.get("rollTurns",0)),0,1)
		var rolling=str(p.get("method","clamp"))=="rolling"
		var roll_distance=PI*diameter*turns
		return result(model,{"diameter":diameter,"left":left,"right":right,"start":start,"measured":measured,"touching":touching,"obstructed":obstructed,"method":"rolling" if rolling else "clamp","rollTurns":turns,"rollAngle":turns*360,"rollDistance":roll_distance,"circumference":PI*diameter},[reading("左夹板读数",left,"cm"),reading("右夹板读数",right,"cm"),reading("两板距离",measured,"cm"),reading("两板是否恰好相切",touching),reading("滚过路程",roll_distance,"cm")],"辅助夹测：圆形物体直径等于两内侧刻度之差。滚动法：无滑动滚一周的路程等于周长，s＝πd×圈数。","s＝π×%.2f×%.2f＝%.3f cm。滚满一周才把路程记为周长。"%[diameter,turns,roll_distance] if rolling else "d＝右边读数－左边读数＝%.2f－%.2f＝%.2f cm。"%[right,left,measured],"已滚满一周，可记录周长。" if rolling and is_equal_approx(turns,1.0) else "沿尺无滑动滚动，观察记号回到原朝向。" if rolling else "两边均相切，此时差值可作为直径。" if touching else "请移动两夹板，使它们分别与硬币相切；有间隙或穿入物体时不能把两板距离当直径。","硬币为理想圆，滚动法按无滑动几何约束计算。夹测物体左边固定在5 cm；读数容差为0.025 cm。屏幕缩放不代表实体刻度尺精度。")
	if scenario=="balancePractice":
		var mass=clampf(float(p.get("objectMass",37.6)),0,100)
		var weights=clampf(float(p.get("weights",30)),0,100)
		var rider=clampf(float(p.get("rider",0)),0,5)
		var zero=clampf(float(p.get("zero",0)),-2,2)
		var indicated=weights+rider
		var difference=mass+zero-indicated
		var balanced=absf(difference)<.051
		return result(model,{"objectMass":mass,"weights":weights,"rider":rider,"indicated":indicated,"corrected":indicated-zero,"difference":difference,"balanced":balanced,"zero":zero},[reading("砝码总质量",weights,"g"),reading("游码读数",rider,"g"),reading("平衡时示数",indicated if balanced else null,"g"),reading("零点偏移",zero,"g")],"左物右码；游码读数与砝码质量相加。只有天平平衡时才能作为质量读数，零点偏移还须修正。","砝码＋游码＝%.1f＋%.1f＝%.1f g；修正值＝%.1f－(%.1f)＝%.1f g。"%[weights,rider,indicated,indicated,zero,indicated-zero],"天平平衡，可记录质量。" if balanced else "左侧较重，增加右侧砝码或游码。" if difference>0 else "右侧较重，减少右侧砝码或游码。","指针偏角仅用于判断哪侧较重，不表示真实天平灵敏度；0.1 g为本模型读数间隔。先将游码归零并检查零点，再放物称量。")
	if scenario=="thermometerPractice":
		var temperature=clampf(float(p.get("temperature",35)),-10,100)
		var immersion=str(p.get("immersion","proper"))
		var eye=str(p.get("eyeLevel","level"))
		var ready=bool(p.get("stable",true))
		var valid=immersion=="proper" and eye=="level" and ready
		var reason="玻璃泡完全浸入、不碰壁不碰底，示数稳定，视线与液柱上端相平。"
		if immersion=="wall":reason="玻璃泡碰到容器壁，读数可能受容器温度影响。"
		elif immersion=="bottom":reason="玻璃泡碰底，读数不能可靠代表液体温度。"
		elif immersion=="outside":reason="温度计已离开待测液体，不能据此读取液体温度。"
		elif eye!="level":reason="视线没有与液柱上端相平，需纠正视差。"
		elif not ready:reason="示数尚未稳定，应继续等待。"
		return result(model,{"temperature":temperature,"immersion":immersion,"eyeLevel":eye,"stable":ready,"valid":valid},[reading("可记录温度",temperature if valid else null,"℃"),reading("读数条件正确",valid)],"温度计使用要满足量程、浸入位置、稳定时间和视线要求。",reason,"可以记录 %.1f ℃。"%temperature if valid else "先修正操作条件，再记录温度；不编造错误操作的固定误差值。","未建立容器壁温、液体温度分布或玻璃泡热惯性模型；错误操作仅判定读数不可靠，不凭空给出偏高或偏低的具体数值。")
	if scenario=="liquidExpansion":
		var volume=clampf(float(p.get("volume",10)),5,30)
		var beta=clampf(float(p.get("beta",.0011)),.0002,.0012)
		var delta=clampf(float(p.get("deltaT",20)),-10,30)
		var area=clampf(float(p.get("tubeArea",2)),1,10)
		var extra_volume=volume*beta*delta
		var height=extra_volume/(area*.01)
		return result(model,{"volume":volume,"beta":beta,"deltaT":delta,"tubeArea":area,"extraVolume":extra_volume,"rise":height},[reading("温度变化",delta,"℃"),reading("液体体积变化",extra_volume,"mL"),reading("细管液面位移",height,"cm")],"在给定温度范围近似ΔV＝βV₀ΔT；体积增加挤入细管，h＝ΔV/S。","ΔV＝%.4f×%.1f×%.1f＝%.4f mL；S＝%.2f mm²＝%.4f cm²；h＝%.4f/%.4f＝%.3f cm。"%[beta,volume,delta,extra_volume,area,area*.01,extra_volume,area*.01,height],"同一温度变化下，细管越细，液面位移越明显；必须用标准温度计标定后才有温度刻度。","β为指定液体在该温区的体膨胀近似值；忽略瓶与管自身热膨胀、表面张力和气泡，不能用于水在4℃附近的反常膨胀。")
	if scenario=="infraredCompare":
		var position=str(p.get("position","outsideRed"))
		var blocked=bool(p.get("blocked",false))
		var mass=.005
		var capacity=900.0
		var initial=clampf(float(p.get("initial",20)),10,30)
		var duration=clampf(float(p.get("time",120)),0,180)
		var infrared_power=clampf(float(p.get("absorbedPower",.06)),0,.1)
		var power=0.0 if blocked or position=="shade" else infrared_power if position=="outsideRed" else infrared_power*.7
		var temperature=initial+power*duration/(mass*capacity)
		var response=result(model,{"temperature":temperature,"referenceTemperature":initial,"initial":initial,"mass":mass,"capacity":capacity,"power":power,"heat":power*duration,"position":position,"blocked":blocked,"time":duration},[reading("实验温度计末温",temperature,"℃"),reading("遮光对照末温",initial,"℃"),reading("温差",temperature-initial,"℃")],"两个相同探测器初温相同；有有效辐射吸收时Q＝Pt＝cmΔT。遮光对照无额外光热输入。","给定位置有效吸收功率%.3f W，t＝%.0f s；ΔT＝%.3f×%.0f/(%.3f×%.0f)＝%.3f ℃。"%[power,duration,power,duration,mass,capacity,temperature-initial],"红光外侧看不见可见光，但该位置探测器仍升温；加入遮挡后额外温升消失。" if position=="outsideRed" and power>0 else "比较位置和遮挡条件，保持探测器、初温与观察时间相同。","吸收功率和红光处0.7倍率为题设，不是测得的太阳光谱；模型演示红外热效应的对照方法，不独立测量真实光谱或探测器响应。忽略散热。")
		response["graph"]={"xLabel":"时间 / s","yLabel":"温度 / ℃","points":[]}
		response["comparison"]={"values":{"temperature":initial},"graph":{"points":[]}}
		for i in range(61):
			var time=duration*i/60.0
			response.graph.points.append([time,initial+power*time/(mass*capacity)])
			response.comparison.graph.points.append([time,initial])
		return response
	return {"error":"未识别课堂器材专用场景"}
