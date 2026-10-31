# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted
## Uniform steel cantilever: fixed material and cross-section, small deflections.
## These ideal model values are not a calibration of a particular classroom ruler.
const YOUNG=200e9
const DENSITY=7850.0
const WIDTH=.020
const THICKNESS=.0007
const BETA=1.8751040687
const VIEW_SECONDS=.05

func reading(label: String,value,unit: String="") -> Dictionary:
	return {"label":label,"value":value,"unit":unit}

func solve(model: String,p: Dictionary) -> Dictionary:
	return vibration(p) if model=="sound" else bending(p)

func vibration(p: Dictionary) -> Dictionary:
	var length=clampf(float(p.get("length",8)),4,20)
	var amplitude=clampf(float(p.get("amplitude",2)),0,4)
	var meters=length/100
	var inertia=WIDTH*pow(THICKNESS,3)/12
	var area=WIDTH*THICKNESS
	var frequency=BETA*BETA/(TAU*meters*meters)*sqrt(YOUNG*inertia/(DENSITY*area))
	var period=1/frequency
	var trajectory=[]
	var points=[]
	# Fixed real time window and fixed playback scale allow meaningful comparison.
	for i in range(1001):
		var time=VIEW_SECONDS*i/1000
		var displacement=amplitude*cos(TAU*frequency*time)
		trajectory.append([time,displacement])
		points.append([time*1000,displacement])
	var shape=[]
	var coefficient=(cosh(BETA)+cos(BETA))/(sinh(BETA)+sin(BETA))
	var tip=cosh(BETA)-cos(BETA)-coefficient*(sinh(BETA)-sin(BETA))
	for i in range(41):
		var x=float(i)/40
		var value=(cosh(BETA*x)-cos(BETA*x)-coefficient*(sinh(BETA*x)-sin(BETA*x)))/tip
		shape.append([x,value])
	var audible=frequency>=20 and frequency<=20000 and amplitude>0
	return {"model":"sound","solver":"Godot cantilever beam solver","values":{"scenario":"ruler","length":length,"amplitude":amplitude,"frequency":frequency,"period":period,"audible":audible,"displaySeconds":VIEW_SECONDS,"thickness":THICKNESS*1000},"displayTrajectory":trajectory,"shape":shape,"readings":[reading("伸出桌面长度",length,"cm"),reading("拨动幅度",amplitude,"mm"),reading("一阶固有频率（模型）",frequency,"Hz"),reading("一个周期",period,"s"),reading("基频试听","未拨动，不发声" if amplitude==0 else "低于通常可听范围" if frequency<20 else "可试听合成音")],"process":[{"title":"控制变量","text":"使用同一把钢尺，保持材料、厚度、夹持方式和拨动幅度相同，只改变伸出桌面的长度。"},{"title":"记录当前条件","text":"伸出长度 L=%.2f cm=%.4f m；末端拨动幅度 A=%.2f mm。画面在同一0.05 s时间窗口内比较振动次数。"%[length,meters,amplitude]},{"title":"区分频率与振幅","text":"模型周期 T≈%.6f s，所以 f=1/T≈%.2f Hz。频率是结果，不是本实验直接调节的条件。"%[period,frequency]},{"title":"比较并解释","text":"同一理想悬臂钢尺的一阶频率随 L² 的倒数变化。长度缩短，振动更快，基频更高；在小幅振动近似下，增大拨动幅度不改变频率。"},{"title":"规范作答","text":"比较音调时要控制拨动幅度；比较响度时要固定伸出长度。振幅为0时没有自由振动，固有频率仍是器材的性质，不表示正在发声。"}],"conclusion":"同一钢尺伸出桌面的部分越短，振动越快、音调通常越高。改变拨动幅度主要改变振动幅度；实际音色与听到的声音还受高阶振动、桌面及环境影响。","assumptions":"理想均匀钢尺，厚0.7 mm、宽20 mm，E=200 GPa、ρ=7850 kg/m³；一阶小挠度悬臂梁模型，忽略阻尼。画面显示50 ms并作100倍慢放，试听按模型基频合成，不是实物录音。梁公式用于模型，不是初中必背公式。","graph":{"xLabel":"真实时间 / ms（固定0–50）","yLabel":"末端位移 / mm","points":points}}

func bending(p: Dictionary) -> Dictionary:
	var length=20.0
	var force=clampf(float(p.get("force",.2)),0,.5)
	var position=clampf(float(p.get("position",15)),2,length)
	var direction=1 if float(p.get("direction",1))>=0 else -1
	var meters=length/100
	var a=position/100
	var inertia=WIDTH*pow(THICKNESS,3)/12
	var profile=[]
	for i in range(61):
		var x=meters*i/60
		var y=force*x*x*(3*a-x)/(6*YOUNG*inertia) if x<=a else force*a*a*(3*x-a)/(6*YOUNG*inertia)
		profile.append([x*100,y*1000*direction])
	var tip=float(profile[-1][1])
	return {"model":"force","solver":"Godot cantilever beam solver","values":{"scenario":"ruler","length":length,"loadPosition":position,"force":force,"direction":direction,"deflection":tip},"deflectionProfile":profile,"readings":[reading("拉力大小",force,"N"),reading("作用点到桌边",position,"cm"),reading("拉力方向","向下" if direction>0 else "向上"),reading("末端挠度（模型）",absf(tip),"mm")],"process":[{"title":"固定器材条件","text":"固定同一把钢尺，伸出长度保持20 cm，材料、厚度和夹持方式不变。"},{"title":"每次只改一个条件","text":"当前拉力为%.2f N，作用点距桌边%.1f cm，方向%s。分别研究大小、方向、作用点，比较时保持其余两项相同。"%[force,position,"向下" if direction>0 else "向上"]},{"title":"观察弯曲效果","text":"当前理想弹性模型的末端挠度大小约%.3f mm。比较相同拉力下不同作用位置，或相同作用点下不同方向，不能把三项同时改变后的差异归于某一项。"%absf(tip)},{"title":"得出结论","text":"力的作用效果与力的大小、方向和作用点都有关，这三项称为力的三要素。"}],"conclusion":"同一固定方式下，力越大、作用点越远离固定端，钢尺通常弯曲得越明显；改变力的方向，弯曲方向也改变。","assumptions":"均匀钢尺的小挠度弹性梁模型，忽略自重。形变显示作适当放大；初中学习重点是控制变量比较三要素，不要求使用梁挠度公式。"}
