# SPDX-License-Identifier: AGPL-3.0-only
"""Combine original teaching records, actual engine controls and verified activity evidence."""
import json,copy
from pathlib import Path
P=Path(__file__).resolve().parent.parent; R=P/'research'; D=P/'dist/catalog'
schema=json.loads((P/'godot/model-schema.json').read_text())['models']
records=sum([json.loads((R/f'physics-{part}-records.json').read_text()) for part in ['g8a','g8b','g9','supplement']],[])
byid={r['id']:r for r in records}
def num(key,label,unit,lo,hi,step,value): return dict(key=key,label=label,unit=unit,min=lo,max=hi,step=step,value=value)
def sel(key,label,items,value): return dict(key=key,label=label,options=[dict(value=k,label=v) for k,v in items],value=value)
def setmodel(id,model,scenario):
 r=byid['phy-'+id];r['model']=model;r['modelParams']['scenario']=scenario
aliases={'heat-capacity':'capacity','heat-capacity-sensor':'capacity','gas-diffusion':'diffusion','liquid-diffusion':'diffusion','temperature-diffusion':'diffusion','friction':'conversionPower','solar-water':'solarWater','solar-fan':'solarFan','steam-work':'engine','heat-engine':'engine','simple':'ohm','shorted-lamp':'shortedBulb','topology':'series','series-current':'series','parallel-current':'parallel','series-voltage':'series','parallel-voltage':'parallel','resistance-material':'material','resistance-factors':'material','dimmer':'rheostat','ohm-voltage':'ohm','ohm-resistance':'ohm','measure-resistance':'ohm','multimeter':'ohm','lamp-power':'filament','energy-audit':'power','energy-plan':'power','fuse':'overload','design':'safety','poles':'poles','field-map':'field','wire-force':'wireForce','wire':'motion'}
for r in records:
 p=r['modelParams'];p.setdefault('variant',p['scenario']);p['scenario']=aliases.get(p['scenario'],p['scenario']) if r['term'].startswith('9') else p['scenario']
 if p['scenario']=='engine':r['model']='thermal'
setmodel('classroom-air-mass','density','air');setmodel('foil-thickness-density','density','foil')
setmodel('bimetal-thermometer','thermal','bimetal')
setmodel('friction-warming','thermal','friction')
setmodel('home-circuit-design','household','design')
setmodel('frost-can','phase','deposition')
setmodel('alcohol-bag','phase','alcohol_cycle')
setmodel('water-drop-microscope','lens','microscope')
setmodel('freezing-mixture','phase','mixture')
# Specialized scenarios are deliberately named, never silently replaced by unrelated formulas.
keys={
 'measurement':{'*':'value division zero'},'incline':{'*':'length angle mass'},
 'motion':{'uniform':'velocity duration','inertia':'mass velocity duration friction','friction':'mass velocity duration friction force','force':'mass velocity force duration','freefall':'mass duration','collision':'mass velocity duration distance elasticity'},
 'sound':{'pitch':'frequency amplitude','amplitude':'amplitude frequency','timbre':'frequency amplitude harmonic2 harmonic3','medium':'medium frequency distance','vacuum':'medium frequency amplitude','echo':'distance medium','noise':'amplitude frequency','resonance':'frequency amplitude'},
 'thermal':{'heating':'mass capacity power time initial','capacity':'mass power time initial','mixing':'mass mass2 initial temperature2','conduction':'conductivity initial temperature2','engine':'power time efficiency','compression':'compressionRatio initial','expansion':'compressionRatio initial','bimetal':'length deltaT alpha1 alpha2','cycle':'stroke','friction':'force distance'},
 'phase':{'melting':'material mass power time initial','freezing':'mass power time initial','mixture':'concentration action progress','boiling':'mass power time initial pressure','condensation':'ambient surface dewPoint','alcohol_cycle':'action progress','evaporation':'initial area airflow','sublimation':'action progress','deposition':'surfaceTemperature'},
 'density':{'solid':'mass volume','liquid':'mass volume','displacement':'mass volume initialVolume','hollow':'mass volume voidVolume','air':'roomLength roomWidth roomHeight airDensity','foil':'mass area materialDensity'},
 'optics':{'reflection':'angle','refraction':'angle n1 n2','dispersion':'angle','straight':'angle','shadow':'distance screen height','pinhole':'distance screen height','mirror':'distance height','fiber':'angle n1 n2','retroreflection':'angle','periscope':'angle','curved-mirror':'distance focal','gradient':'angle nTop nBottom height','rgb':'red green blue'},
 'lens':{'convex':'focal distance height','concave':'focal distance height','eye':'focal distance height','myopia':'focal distance','hyperopia':'focal distance','telescope':'objectiveFocal eyepieceFocal','microscope':'focal distance eyepieceFocal','camera':'focal distance height'},
 'force':{'gravity':'mass gravity','balance':'force force2','interaction':'force','deformation':'force','resultant':'force force2 direction'},
 'spring':{'hooke':'force stiffness limit','measurement':'force stiffness limit','microdeformation':'force compliance tubeArea'},
 'pressure':{'solid':'force area','liquid':'density depth','communicating':'density depth','atmosphere':'height','flow':'speed density','pump':'stroke'},
 'buoyancy':{'archimedes':'mass volume density fraction','submerged':'mass volume density fraction','floating':'mass volume density','densitymeter':'mass volume density','submarine':'mass volume density','cause':'area objectHeight depth density'},
 'lever':{'*':'force arm load loadArm'},'pulley':{'fixed':'load height','movable':'load height','block':'load strands height efficiency'},
 'work':{'work':'force distance angle','power':'force distance time','efficiency':'force distance useful'},
 'energy':{'kinetic':'mass velocity','potential':'mass height','conversion':'mass height velocity','conservation':'mass height velocity','solar':'power efficiency time','solarFan':'power efficiency time','solarWater':'power efficiency time','conversionPower':'power efficiency time','pendulum':'length gravity','elastic':'stiffness extension'},
 'molecular':{'diffusion':'temperature time','attraction':'distance','repulsion':'distance','gap':'volume1 volume2 contraction'},
 'charge':{'electroscope':'charge1','interaction':'charge1 charge2 distance','rubbing':'charge1','transfer':'charge1 charge2','conduction':'charge1 charge2'},
 'circuit':{'ohm':'voltage resistance','series':'voltage resistance resistance2','parallel':'voltage resistance resistance2','ammeter':'voltage resistance resistance2','voltmeter':'voltage resistance resistance2','rheostat':'voltage resistance resistance2 slider','shortedBulb':'voltage resistance2','filament':'voltage ratedVoltage ratedPower','lamp':'voltage ratedVoltage ratedPower','led':'voltage resistance orientation','conductivity':'material voltage','material':'material length area temperature voltage','battery':'cells cellVoltage orientation resistance','open':'voltage resistance'},
 'joule':{'*':'current resistance time'},
 'household':{'power':'power time','meter':'power time','overload':'power voltage limit','safety':'power voltage limit','design':'voltage resistance1 resistance2 switch1 switch2'},
 'magnet':{'field':'pole','poles':'pole1 pole2','compass':'pole','electromagnet':'current turns core','motor':'current turns angle core','coil':'current turns angle','torque':'current turns angle','relay':'current turns core','oersted':'current','solenoid':'current turns core','wireForce':'current field length angle'},
 'induction':{'motion':'field length velocity angle','generator':'field turns area frequency','coil':'field turns area frequency'},'emwave':{'tuning':'frequency receiverFrequency bandwidth','*':'frequency'}
}
notes={
'measurement':'读数按给定分度值取整并示范零点修正；估读能力、视差和真实测量误差需结合器材训练。',
'incline':'运动由 Godot 刚体引擎计算；斜面光滑、忽略空气阻力，质量不改变理想下滑加速度。计时输出是模型值。',
'motion':'由 Godot 刚体引擎计算运动；采用理想水平面和给定摩擦系数，不包含空气阻力或实物轮轴细节。',
'sound':'波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。',
'thermal':'按能量关系计算，默认不计散热且比热容保持常数；温度模型不包含熔化和沸腾，相变需在物态变化实验中观察。',
'phase':'数值曲线采用给定物质的理想热量与状态关系；忽略散热、过冷和加热器惯性，平台表示相变中仍在吸热或放热。',
'density':'根据模型质量和体积计算密度；默认材料均匀、无吸水、无气泡，排水量按完全浸入的体积计算。',
'optics':'采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。',
'lens':'采用理想薄透镜模型，忽略像差；焦点处无有限像距。画面与实物装置比例不同，不能据示意图直接量出真实焦距。',
'force':'展示指定方向的力与合力；静态受力结果不等于物体实际运动轨迹。',
'spring':'在弹性限度内使用胡克定律，超出限度不外推弹性伸长；劲度系数为模型参数。',
'pressure':'固体使用p=F/S，静止液体使用p=ρgh；未包含容器材料形变，流动模型需另看具体说明。',
'buoyancy':'使用阿基米德原理，液体密度均匀、物体不吸水；浸没比例决定排液体积，漂浮平衡时需满足浮力等于重力。',
'lever':'采用轻质刚性杠杆，忽略支点摩擦；输入的力臂是到力作用线的垂距。',
'pulley':'定滑轮与动滑轮采用无重无摩擦模型；滑轮组按给定机械效率计算，绳子不可伸长。',
'work':'使用恒力做功关系；一般夹角公式为拓展，初中重点是力方向有位移。机械效率只在有用功不超过总功时有意义。',
'energy':'数值用理想能量公式计算；动能表达式属于定量拓展，初中实验重点是控制变量后比较做功能力。',
'molecular':'粒子大小、间距、扩散速度与受力曲线为定性示意，不能读作真实分子尺度或实测扩散系数。',
'charge':'电荷与静电作用均为相对量；验电器张角不能直接当作准确电量，吸引轻小物体还涉及极化。',
'circuit':'采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。',
'joule':'按Q=I²Rt计算，电流和电阻保持不变；容器与空气升温仅作能量转换示意，未模拟真实热损失。',
'household':'家庭用电仅在图示和低压模型中讨论；功率、电能和电流为理论估算，不模拟实际市电接线。',
'magnet':'磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。',
'induction':'直导体用Blv sinθ，转动线圈用理想正弦感应电动势；忽略内阻与负载反作用，定量公式作为拓展。',
'emwave':'使用真空光速与波长频率关系；接收强弱是相对示意，未模拟真实天线、干扰和复杂传播损耗。'}
# Extra control fallback descriptors are checked against the final engine schema below.
extra={
 ('sound','harmonic'):num('harmonic','高次谐波相对振幅','',0,1,.1,.4),
 ('phase','material'):sel('material','物质',[('water','冰与水'),('hypo','海波'),('wax','石蜡')],'water'),
 ('phase','concentration'):num('concentration','乙醇质量分数（题设）','%',0,30,1,10),
 ('thermal','stroke'):sel('stroke','冲程',[('intake','吸气'),('compression','压缩'),('power','做功'),('exhaust','排气')],'intake'),
 ('density','roomLength'):num('roomLength','教室长','m',3,15,.5,10),('density','roomWidth'):num('roomWidth','教室宽','m',3,10,.5,6),('density','roomHeight'):num('roomHeight','教室高','m',2,6,.1,3),('density','airDensity'):num('airDensity','空气密度','kg/m³',.8,1.5,.01,1.29),('density','area'):num('area','薄膜面积','cm²',10,1000,10,100),('density','materialDensity'):num('materialDensity','材料密度','g/cm³',.5,12,.1,2.7),
 ('optics','focal'):num('focal','曲面镜焦距','cm',-30,30,1,10),('optics','gradient'):num('gradient','折射率梯度（示意）','',0,1,.05,.2),
 **{('optics',k):num(k,l,'%',0,100,5,100) for k,l in [('red','红光强度'),('green','绿光强度'),('blue','蓝光强度')]},
 ('lens','objectiveFocal'):num('objectiveFocal','物镜焦距','cm',10,100,1,40),('lens','eyepieceFocal'):num('eyepieceFocal','目镜焦距','cm',2,20,1,5),
 ('force','direction2'):sel('direction2','第二力方向',[('opposite','反向'),('same','同向')],'opposite'),
 ('energy','length'):num('length','摆长','m',.1,2,.05,1),('energy','gravity'):num('gravity','重力场强度','N/kg',1,10,.1,9.8),('energy','stiffness'):num('stiffness','劲度系数','N/m',10,500,10,100),('energy','extension'):num('extension','弹性形变','m',0,.2,.01,.1),
 ('molecular','volume1'):num('volume1','液体一体积','mL',10,100,5,50),('molecular','volume2'):num('volume2','液体二体积','mL',10,100,5,50),('molecular','contraction'):num('contraction','体积缩减比例（示意）','%',0,8,.5,4),
 ('buoyancy','area'):num('area','上下表面面积','cm²',1,100,1,20),('buoyancy','objectHeight'):num('objectHeight','物体高度','cm',1,20,1,5),('buoyancy','depth'):num('depth','上表面深度','m',0,2,.05,.2),
 ('magnet','pole1'):sel('pole1','磁体一朝向',[('N','N极'),('S','S极')],'N'),('magnet','pole2'):sel('pole2','磁体二朝向',[('N','N极'),('S','S极')],'S')}

extra.update({
 ('sound','harmonic2'):num('harmonic2','二次谐波相对系数','',0,1,.05,.5),('sound','harmonic3'):num('harmonic3','三次谐波相对系数','',0,1,.05,.25),
 ('thermal','length'):num('length','金属片原长','m',.05,.5,.01,.2),('thermal','deltaT'):num('deltaT','温度变化','℃',-40,100,5,60),('thermal','alpha1'):num('alpha1','材料一线膨胀系数','1/℃',.000005,.00003,.000001,.000019),('thermal','alpha2'):num('alpha2','材料二线膨胀系数','1/℃',.000005,.00003,.000001,.000012),
 ('thermal','force'):num('force','滑动摩擦力','N',0,20,.5,5),('thermal','distance'):num('distance','相对滑动路程','m',0,10,.1,2),
 ('phase','action'):sel('action','变化过程',[('warming','温热'),('cooling','冷却')],'warming'),('phase','progress'):num('progress','观察进度','',0,1,.05,.5),('phase','ambient'):num('ambient','环境温度','℃',10,35,1,25),('phase','surface'):num('surface','瓶壁温度','℃',0,35,1,8),('phase','dewPoint'):num('dewPoint','空气露点','℃',0,25,1,15),
 ('phase','surfaceTemperature'):num('surfaceTemperature','冷表面温度','℃',-20,10,1,-10),
 ('optics','nTop'):num('nTop','上层折射率','',1,1.6,.01,1.3),('optics','nBottom'):num('nBottom','下层折射率','',1,1.6,.01,1.5),
 ('force','direction'):sel('direction','第二力方向',[('same','同向'),('opposite','反向')],'opposite'),
 ('spring','compliance'):num('compliance','等效体积柔度（模型）','cm³/N',.0005,.005,.0005,.002),('spring','tubeArea'):num('tubeArea','细管截面积','mm²',.5,5,.5,1),
 ('pressure','stroke'):sel('stroke','活塞动作',[('pull','上提'),('push','下压')],'pull'),
 ('household','resistance1'):num('resistance1','支路一负载电阻','Ω',5,100,1,20),('household','resistance2'):num('resistance2','支路二负载电阻','Ω',5,100,1,30),('household','switch1'):sel('switch1','支路一开关',[(1,'闭合'),(0,'断开')],1),('household','switch2'):sel('switch2','支路二开关',[(1,'闭合'),(0,'断开')],1),
 ('magnet','pole'):sel('pole','所观察磁极',[('N','N极'),('S','S极')],'N')
})
for key in ['red','green','blue']:
 extra['optics',key].update(unit='通道值',max=255,step=1,value=255)

def control(model,key):
 for c in schema[model].get('controls',[])+schema[model].get('extraControls',[]):
  if c['key']==key:return copy.deepcopy(c)
 if (model,key) in extra:return copy.deepcopy(extra[model,key])
 raise KeyError((model,key))
for r in records:
 m=r['model'];s=r['modelParams']['scenario']; selected=keys[m].get(s,keys[m].get('*'))
 if selected is None:raise ValueError((r['id'],m,s))
 r['controls']=[control(m,k) for k in selected.split()]
 r['modelNote']=notes[m]
 for c in r['controls']:
  if c['key'] in r['modelParams']:c['value']=r['modelParams'].pop(c['key'])

def edit(id,params=None,settings=None,note=None,controls=None):
 r=byid['phy-'+id]
 if params:r['modelParams'].update(params)
 if controls is not None:r['controls']=controls
 if settings:
  for key,attrs in settings.items():
   c=next((c for c in r['controls'] if c['key']==key),None)
   if c is None:raise ValueError((id,key))
   c.update(attrs)
 if note:r['modelNote']=note
 return r
for r in records:
 m=r['model'];s=r['modelParams']['scenario']
 if m=='measurement':
  unit={'length':'cm','time':'s','temperature':'℃','balance':'g','volume':'mL'}[s]
  for c in r['controls']:c['unit']=unit
  if s=='temperature':
   for c in r['controls']:
    if c['key']=='value':c.update(min=-10,max=100,value=35)
    if c['key']=='division':c.update(min=.1,max=5,step=.1,value=1)
 if m=='phase':
  for c in r['controls']:
   if c['key']=='mass':c['label']='样品质量'
   if c['key']=='initial' and s in ['boiling','freezing','mixture']:c.update(value=20,min=-20,max=90)
   if c['key']=='initial' and s=='condensation':c.update(value=110,min=100,max=150)
   if c['key']=='time':c['value']=300
   if s=='boiling':
    if c['key']=='power':c.update(max=200,value=100)
    if c['key']=='time':c.update(max=500,value=500)
   if s=='evaporation' and c['key']=='initial':c.update(min=5,max=60,value=25)
 if m=='pressure' and s=='flow':
  for c in r['controls']:
   if c['key']=='density':c.update(label='流体密度',min=1,max=1000,step=.1,value=1.2)
  r['modelNote']='用理想流体伯努利关系比较流速和静压；空气密度取近似值。忽略黏性和湍流，喷雾、托球等现象还受实际流场和阻力影响，不能仅用一个静压公式预测完整轨迹。'
 if m=='thermal' and s in ['compression','expansion']:
  r['modelParams'].update(mass=.01,capacity=718,gamma=1.4)
  r['modelNote']='采用理想气体的绝热模型，温度先换为开尔文；不含散热、雾滴形成细节。初中只需理解做功改变内能，绝热公式和数值属于拓展。'
 if m=='thermal' and s in ['heating','capacity']:
  for c in r['controls']:
   if c['key']=='mass':c.update(min=.2,max=1,step=.1,value=.4)
   if c['key']=='power':c.update(min=10,max=100,step=10,value=50)
   if c['key']=='time':c.update(min=0,max=120,step=5,value=60)
   if c['key']=='initial':c.update(min=10,max=30,value=20)
   if c['key']=='capacity':c.update(min=2000,max=4500,step=100,value=4200)
 if m=='energy' and s in ['solarWater','solarFan','conversionPower']:
  r['modelNote']='以输入功率、时间和给定整体效率估算有效能量；不把光功率直接等同于转速或温升，不模拟装置细节和实际散热。'
 if m=='circuit':
  for c in r['controls']:
   if c['key']=='voltage':c.update(max=12,value=3)
 if m=='household':r['modelParams'].setdefault('voltage',220)

edit('stopwatch-pulse-step',settings={'value':{'label':'计时时间','min':0,'max':120,'value':30.28},'division':{'min':.01,'max':1,'value':.01}})
edit('paper-thickness',settings={'value':{'label':'整叠厚度','min':.1,'max':5,'step':.01,'value':1},'division':{'min':.01,'max':.2,'step':.01,'value':.1}},note='交互读数表示整叠纸厚度；实际需再除以已计数的张数。单张厚度不能靠这把刻度尺直接测得，整叠应压紧但不损伤纸张。')
edit('paperclip-mass',settings={'value':{'label':'多个回形针总质量','value':10},'division':{'value':.2}},note='天平读数表示多个回形针的总质量；再除以已知个数得到平均单个质量，不能把总质量当成单个质量。')
edit('desk-sound',settings={'medium':{'value':'steel'}},note='介质选择用空气、水、钢的常温声速作比较；桌面材料不同，其真实声速不等于钢，图中信号仅说明固体能够传声。')
edit('cup-telephone',settings={'medium':{'value':'steel'}},note='纸杯和拉紧棉线传递机械振动；介质声速数值为参照材料示例，不是棉线电话的实测速度。松紧、阻尼与纸杯共振未定量模拟。')
edit('vacuum-bell',settings={'medium':{'value':'vacuum'}})
for id in ['soundproof-room','noise-waveform']:
 edit(id,note='通过相对振幅和波形观察噪声变化；声学隔音性能、吸声系数与分贝不在模型中定量计算。降低相对振幅表示减弱声音，不等同于固定分贝差。')
edit('cold-water-reboil',controls=[num('initial','降压前水温','℃',80,95,1,90),num('pressure','瓶内压强','kPa',60,101,.1,65)],params={'mass':.1,'power':0,'time':0},note='不再输入热量，比较既有热水在降压后的相平衡状态；压强降低可能使水重新沸腾。未模拟冷水流动、瓶内蒸汽凝结速度和后续散热，热玻璃操作仅由教师演示。')
byid['phy-melting-curves']['pitfalls']=['不可只看升温快慢判断晶体，应结合熔化时是否持续吸热和固液共存状态。']
byid['phy-melting-curves']['safety']=['热水浴、热玻璃和样品由教师指导操作；不直接接触或品尝化学样品。']
edit('pendulum-period',note='采用小摆角理想单摆周期公式T=2π√(L/g)作拓展计算；忽略空气阻力、线质量与摆球大小，实物实验通过多次完整摆动的平均时间测周期。')
edit('fuse-comparison',note='根据总功率、电压和设定额定电流判断过流；未计算保险丝和铜丝的熔点、直径与散热，不把阈值判断当作真实熔断时间预测。')
edit('melting-curves',settings={'material':{'options':[{'value':'hypo','label':'海波'},{'value':'wax','label':'石蜡'}],'value':'hypo'},'initial':{'value':20,'min':0,'max':45}},note='海波采用48℃理想熔化平台，石蜡采用50–60℃题设软化区间；海波和石蜡的比热容、相变热均为题设系数，并非样品实测值。曲线超出适用温区时停止外推。')
edit('ice-melting',controls=[control('phase',k) for k in ['mass','power','time','initial']],params={'material':'water'},note='纯冰与水在正常压强下采用0℃相变平台；不包含盐、酒精等混合物的凝固点下降，也不模拟过冷。')
edit('freezing-mixture',settings={'action':{'value':'cooling'}},note='定性比较纯水与水酒精混合液的凝固行为，不由浓度计算未经核验的精确凝固点；状态判断还取决于温度，进度只表示观察过程。')
edit('alcohol-bag',note='按温热或冷却过程定性演示酒精汽化与液化；不输出套用水参数的温度、潜热或质量变化，进度是教学观察尺度。只用教师准备的安全演示资料。')
edit('cold-bottle-condensation',note='根据给定空气露点和瓶壁温度判断凝结条件；露点作为输入，未由湿度反算，也不预测水珠质量与长大速率。冷瓶外水珠来自空气水蒸气。')
edit('iodine-sublimation',params={'material':'iodine'},settings={'action':{'options':[{'value':'heating','label':'温和加热'},{'value':'cooling','label':'冷却'}],'value':'heating'}},note='仅比较碘由固态到气态、由气态到固态的变化方向，不计算真实升华速率、浓度或实验温度；只使用密封教学演示资料。')
edit('frost-can',params={'material':'water'},note='画面展示指定的水蒸气直接结霜过程；表面温度不是凝华的全部条件，还需水蒸气含量等，未计算真实成霜质量与速率。')
edit('infrared-heating',settings={'power':{'label':'有效吸收功率','max':100,'value':30}},note='用吸收的有效功率计算温升，不计算太阳光谱或探测器响应；真实太阳光色散实验中温升还受波段强度、位置和散热影响。')
edit('gradient-saline-ray',settings={'height':{'label':'介质层高度','unit':'m','min':.1,'max':2,'step':.1,'value':1}},note='使用连续折射率梯度的教学光路，表示光在非均匀介质中连续偏折；梯度不是实际盐水浓度刻度，不用于定量反推溶液配比。')
edit('diffuse-reflection',note='每个局部表面仍满足反射定律；入射角滑杆控制一条局部光线，粗糙表面不同法线造成向多个方向反射，不模拟真实粗糙度统计。')
edit('water-light-guide',settings={'n1':{'value':1.33,'label':'水的折射率'},'n2':{'value':1,'label':'外部介质折射率'},'angle':{'value':65}},note='以水到空气的界面全反射解释导光；实际弯曲水柱存在损耗，光纤通常还具有芯层、包层，不能等同于一根均匀直线光路。')
edit('covered-lens',note='遮住部分透镜仍可由剩余部分形成完整像，但光通量减少；薄透镜模型计算像位置与大小，未计算亮度、衍射和遮挡形状。')
edit('water-drop-microscope',note='将水滴作为物镜、上方放大镜作为目镜，采用两级薄透镜近似；水滴等效焦距是题设参数，真实形状、像差和光照会影响清晰度，不用模型倍率替代实物测量。',settings={'focal':{'label':'水滴等效焦距','min':.5,'max':3,'step':.1,'value':1},'distance':{'label':'物体到水滴距离','min':.6,'max':6,'step':.1,'value':1.2},'eyepieceFocal':{'label':'上方放大镜焦距','min':2,'max':10,'step':.5,'value':5}})
edit('bottle-lens',note='瓶中水的局部凸曲面以薄凸透镜近似；真实瓶壁通常有柱面像差，不是所有方向都有相同焦距。')
edit('near-point',note='薄透镜计算仅表示简化镜片成像关系，眼睛近点需由本人清晰观察范围实际测定；不根据焦距滑杆诊断视力或预测个人近点。')
edit('myopia-correction',note='数值输出为凹透镜单独成像参数；眼球与矫正光路只作定性示意，不能当作完整眼模型或配镜度数。近视矫正的关键是使入眼光先适当发散。')
edit('hyperopia-correction',note='数值输出为凸透镜单独成像参数；眼球与矫正光路只作定性示意，不能用于视力诊断或配镜。远视矫正镜使入眼光先适当会聚。')
edit('periscope',controls=[sel('stage','观察阶段',[(0,'入射光'),(1,'第一次反射'),(2,'第二次反射')],2)],params={'angle':45},note='标准潜望镜采用互相平行的两块平面镜，各与筒轴约成45°；演示双反射结构，不模拟有限镜面造成的视场变化。')
edit('retroreflector',controls=[sel('stage','观察阶段',[(0,'入射光'),(1,'第一次反射'),(2,'第二次反射')],2)],params={'angle':45},note='固定展示二维互相垂直双镜的两次反射；出射光与入射光平行反向，不等同于任意空间方向都能回返的三镜角反射器。')
edit('telescope',note='采用理想开普勒望远镜，角放大率近似为物镜焦距与目镜焦距之比；这是两镜系统，忽略像差与有限视场。')
edit('classroom-air-mass',note='先由长×宽×高求教室体积，再用给定空气密度求质量；真实空气密度随温度、压强和湿度变化，忽略室内物品排开的体积。')
edit('foil-thickness-density',settings={'mass':{'min':.1,'max':10,'step':.1,'value':2.7}},note='由m=ρSh反求平均厚度，假定薄膜均匀、无孔、单层且密度已知；面积用cm²、密度用g/cm³时先得厚度cm，再换算。')
edit('glass-microdeform',note='以给定等效体积柔度计算形变量，再由细管截面积计算放大液面高度；参数不是实际玻璃常数，不计算三维应力和容器受力极限。')
edit('magnet-ball',note='当前动力学计算展示沿选定方向的外力使速度变化；磁力大小作为给定量，未按磁铁位置计算二维弯曲轨迹。磁体在旁侧使运动方向改变的实物观察见实验步骤。')
edit('sliding-friction',params={'uniformPull':True},controls=[control('motion',k) for k in ['mass','friction','velocity','duration']],note='匀速水平拉动时拉力等于滑动摩擦力μmg；引擎按此平衡条件设定拉力。模型不定量描述静摩擦启动或材料磨损。')
edit('resistance-motion',controls=[control('motion',k) for k in ['mass','velocity','duration','friction']],params={'force':0})
edit('sponge-pressure',note='由压力和受力面积计算压强；海绵凹陷只用作效果示意，没有真实材料应力应变参数，不能据图测凹陷深度。')
edit('shoe-pressure',settings={'force':{'label':'对地压力','value':500},'area':{'label':'总接触面积','min':20,'max':500,'value':250}})
for id in ['liquid-pressure','water-jet']:
 edit(id,settings={'depth':{'max':1,'step':.01,'value':.3},'density':{'max':2000,'step':50,'value':1000}})
edit('water-jet',note='数值给出侧孔处静压ρgh；水流弯曲为示意，落地射程同时受孔高和出流速度影响，不把最远射程直接等同于最大压强。')
edit('communicating-vessels',note='同种液体、各支管液面受相同外压且静止时液面相平；输出深度处静压，未模拟瞬时灌注或毛细作用。')
edit('torricelli',note='气压随海拔采用标准大气近似；汞柱高度由气压与汞密度换算。仅作虚拟演示，不提供学生自行接触水银的操作。')
edit('piston-pump',note='通过阀门和活塞位置解释大气压帮助提升水；理想提升高度受气压限制，实际泵受密封、摩擦和水蒸气压影响。')
edit('buoyancy-weighing',settings={'mass':{'value':200},'volume':{'value':100}})
edit('buoyancy-cause',note='完全浸没长方体上、下表面压力分别为ρghS，侧向合力抵消；不包含贴底密封而下表面无液体的情况。')
edit('micro-hydrometer',settings={'mass':{'min':5,'max':50,'step':1,'value':20},'volume':{'min':50,'max':200,'value':100}},note='理想密度计漂浮，重力保持不变，液体密度改变时排液体积改变；未模拟真实细管刻度和表面张力。')
edit('pendulum-lock',note='用机械能总量说明无额外推力时不能回到高于释放点的位置；当前高度与速度可独立设定，是能量状态比较，不自动构造真实摆动全过程。真实装置有耗散。')
edit('rolling-pendulum',note='展示动能与重力势能间转化；当前简化数值只计质心平动能，不含轮轴转动惯量，因此不能直接作为麦克斯韦滚摆的精确周期或速度。')
edit('pulley-properties',settings={'efficiency':{'value':100}},note='以承重绳段数比较省力和绳端位移；效率100%代表理想模型。真实定滑轮/动滑轮还有重量与摩擦，需在效率实验中比较。')
for id in ['heat-capacity','heat-capacity-sensor']:
 edit(id,params={'capacity':4200,'capacity2':2100},note='两次独立Godot计算采用等质量、相同初温和同功率，水取4200、油取2100 J/(kg·℃)代表值；油的实际比热容依种类和温度而变，忽略散热与相变。')
edit('friction-warming',note='采用恒定滑动摩擦力，摩擦功转化为接触物体系统的内能；不把全部能量归给单个物体，未计算两物体温升分配与散热。')
r=edit('heat-mass-temperature',params={'capacity':4200},note='本条仅研究水，常温水的比热容固定取4200 J/(kg·℃)，以质量和温升作比较；忽略散热、比热容随温度的微小变化与相变。')
r['controls']=[c for c in r['controls'] if c['key']!='capacity']
edit('thermal-conductivity',note='交互比较材料的相对导热能力和冷热端温度，未由实物响应时间反推出真实导热系数。瞬态温度响应还受密度、比热容、接触热阻和几何尺寸影响。')
edit('thermal-conductivity')['chapter']='拓展：材料的物理属性'
edit('molecular-gap',note='用给定缩减比例表示某些互溶液体体积不简单相加；比例为教学输入，未从真实酒精浓度或分子势预测体积收缩。质量守恒仍成立。')
edit('heat-engine-cycle',note='按四个冲程展示气门、活塞和做功方向；不模拟燃烧化学、压力曲线或具体发动机效率。')
edit('simple-circuit')['controls'].insert(0,sel('scenario','开关状态',[('ohm','闭合'),('open','断开')],'ohm'))
edit('series-parallel-connect')['controls'].insert(0,sel('scenario','连接方式',[('series','串联'),('parallel','并联')],'series'))
edit('led-direction',settings={'voltage':{'max':6,'value':3},'resistance':{'label':'限流电阻','min':100,'max':1000,'step':50,'value':200},'orientation':{'label':'二极管方向'}},note='采用约2V正向压降和串联限流电阻；反向时不导通，不模拟击穿与温度影响。')
for id in ['resistance-comparison','resistance-factors']:
 r=edit(id)
 next(c for c in r['controls'] if c['key']=='material')['options']=[dict(value=k,label=v) for k,v in [('copper','铜'),('aluminum','铝'),('iron','铁'),('nichrome','镍铬合金')]]
edit('ohm-voltage',controls=[control('circuit','voltage')],params={'resistance':10},note='定值电阻固定10Ω，改变两端电压观察电流；保持电阻和温度不变。电压0表示没有外加电压，不能用于R=U/I的除法测量。')
edit('ohm-resistance',controls=[control('circuit','resistance')],params={'voltage':3},note='电压固定3V，改变电阻观察电流；实物实验换电阻后需调滑动变阻器以保持被测电阻两端电压相同。')
edit('measure-resistance',settings={'voltage':{'min':.5,'max':6,'value':3}},note='模拟理想伏安法：定值电阻电流由I=U/R产生，读U和I再求R=U/I。实际实验需多组读数并考虑电表内阻及接触误差。')
edit('digital-multimeter',controls=[control('circuit','resistance')],params={'voltage':1},note='以表内参考电源测得的理想电流推算电阻，画面为电阻挡示意；真实电阻测量须断电并隔离元件，不能对带电电路使用欧姆挡。')
edit('lamp-power',settings={'voltage':{'max':6,'step':.1,'value':3}},note='灯丝采用随电压变化的热电阻近似，仅额定点由标称参数确定；亮度按实际功率示意，不是实测灯丝温度或光通量。')
edit('filament-resistance',note='使用示意性灯丝热电阻模型，保留电压升高时电阻增大的趋势；不是厂家给定的精确伏安曲线，不把不同温度下阻值平均成固定电阻。')
edit('joule-resistance',params={'resistance2':20},settings={'resistance':{'label':'容器一电阻','value':10}},note='两容器电流和通电时间相同，第二电阻固定20Ω，比较Q=I²Rt；气柱或液面表示热量趋势，不是实际温升。')
edit('joule-current',params={'current2':.5},settings={'current':{'label':'容器一电流','value':1}},note='两容器电阻和时间相同，第二电流固定0.5A，比较焦耳热；原装置分流支路的详细电路不在此模型中求解。')
r=edit('home-circuit-design',settings={'voltage':{'label':'安全低压模型电压','min':3,'max':12,'step':1,'value':6}},note='只搭建安全低压供电的并联电路，用理想电阻负载表示小灯泡；可独立操作两支路开关。220V例题仅作理论估算，不指导连接市电。')
r['objective']='用安全低压模型设计用电器并联、开关串联控制的家庭电路结构。'
r['steps']=['先在纸面规划并联支路与各支路开关。','用安全低压电源与小灯泡模拟家庭结构，断电检查后再闭合。','观察一条支路断开时其余支路是否仍能工作。','以图示辨认保护接地、漏电保护与市电火线位置，不实际连接市电。']
r['apparatus']=['安全低压电源','小灯泡与开关','绝缘导线','家庭电路图示']
r['safety']=['只用安全低压教学电源；不得连接插座或家用市电。']
for id in ['model-camera','water-jet']:
 byid['phy-'+id]['sourceIds'].append('physics-g8a-textbook' if id=='model-camera' else 'physics-g8b-textbook')
# Source catalog: direct evidence and edition scope are intentionally separate.
sources=[
 {'id':'physics-g8a-textbook','title':'人教版物理八年级上册（2024修订版）活动文字核对','url':'https://jymxkt.com/rht_soft_updata/jiaocai/物理八年级上册-2024新版本.pdf','publisher':'人民教育出版社；公开教材镜像用于核对','edition':'2024年修订，2024年秋启用','scope':'核对目录及实验、演示、想想做做、拓展、项目和含操作的练习；来源页码见覆盖文件。本站不转载教材扫描页。'},
 {'id':'physics-g8b-textbook','title':'人教版物理八年级下册（新版）活动文字核对','url':'https://jymxkt.com/rht_soft_updata/jiaocai/2024%E7%89%88%E3%80%90%E4%BA%BA%E6%95%99%E7%89%88%E3%80%91%E7%89%A9%E7%90%86%E5%85%AB%E5%B9%B4%E7%BA%A7%E4%B8%8B%E5%86%8C.pdf','publisher':'人民教育出版社；公开教材镜像用于核对','edition':'新版八下，2025年春启用；镜像文件名含2024不等同于实际启用学期','scope':'逐项核对教材文本层与印刷页码；同原理练习变式合并到对应实验，独立列出映射关系。'},
 {'id':'physics-g9-textbook','title':'人教版物理九年级全一册（2025新版）公开文字核对','url':'https://www.yeyulingfeng.com/wendang/91248011.html','publisher':'人民教育出版社；公开文档文字镜像用于核对','edition':'2025年6月新版，2025年秋启用','scope':'核对九全第13—22章的实验、演示、制作和拓展活动；网站9上/9下是浏览组织方式，不是官方教材分册。'},
 {'id':'physics-ncet-2023','title':'中小学实验教学基本目录：初中物理68项','url':'https://jyt.hunan.gov.cn/sjyt/jyzbc/zbczcwj/syjx/202506/t20250605_33692362.html','publisher':'教育部教育技术与资源发展中心（中央电化教育馆）；湖南省教育厅转载','edition':'2023年发布，2025年官方转载','scope':'逐项核对初中物理1—68号实验教学要求，并区分教材条目与目录补充条目；不将此目录等同于教材所有演示。'},
 {'id':'physics-pep-edition','title':'人教版义务教育物理（八～九年级）新教材介绍','url':'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240925_1995627.html','publisher':'人民教育出版社','edition':'2024年9月','scope':'用于核验三册结构与新版栏目；页面直接访问受限，相关信息经官方检索摘要及教材目录交叉核对。'},
 {'id':'physics-standard-2022','title':'教育部2022年义务教育课程方案和课程标准发布通知','url':'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html','publisher':'教育部','edition':'2022年版','scope':'标准发布时间与官方附件入口，实验逐项实现以已核对教材和基本目录映射为依据。'},
 {'id':'physics-standard-2025','title':'义务教育物理课程标准日常修订版（2022年版2025年修订）公布页','url':'https://fxzx.qpedu.cn/jhzx/kcjs/kcbz/511641.htm','publisher':'上海市青浦区凤溪中学教育网站','edition':'2022年版2025年修订，2026年3月公布页','scope':'已核验2025日常修订版存在及名称；未逐字审校修订课标全本，不据此宣称覆盖全部修订差异。'}]
for source in sources:source['checked']='2026-10-31'
# Keep the activity-by-activity review separate from legacy model defaults.
import runpy
review=runpy.run_path(str(R/'physics-quality.py'))['apply_quality'](records,P)
review_by_id={item['id']:item for item in review}
sourceids={x['id'] for x in sources}
assert len(byid)==len(records)
for r in records:
 for c in r['controls']:
  if c['key']!='scenario':r['modelParams'].pop(c['key'],None)
  if 'options' not in c:
   value=c['value'];step=c['step'];lo=c['min']
   if abs((value-lo)/step-round((value-lo)/step))>1e-7:
    from decimal import Decimal
    places=max(-Decimal(str(v)).as_tuple().exponent for v in [value,step,lo])
    c['step']=min(step,10**(-places))
 assert set(r['sourceIds'])<=sourceids,(r['id'],r['sourceIds'])
 assert r['controls'],r['id']
 for c in r['controls']:
  if 'options' in c:assert c['value'] in [x['value'] for x in c['options']],(r['id'],c)
  else:assert c['min']<=c['value']<=c['max'],(r['id'],c)
# Keep explicit source verification separate from implementation relationships.
activities=[]
for book,f in [('八上','g8a-coverage.json'),('八下','g8b-coverage.json'),('九全','g9-activities.json')]:
 for a in json.loads((R/f).read_text()):
  a['book']=book
  if a.get('activityId') in ['phy-model-camera','phy-water-jet']:
   a['implementationId']=a['activityId'];a['implementationRelation']='primary'
  assert a['implementationId'] in byid,(book,a)
  implementation_review=review_by_id[a['implementationId']]
  a['implementationReview']={k:implementation_review[k] for k in ['status','sceneBehavior','limitations']}
  activities.append(a)
coverage={'checked':'2026-10-31','editionScope':'八上2024修订、八下2025春启用、九全2025修订；网站将九全分到9上/9下浏览。无独立人教版七年级物理。','standardScope':'确认2022年版2025年日常修订课标存在；未逐字审校全本修订差异。','method':'已核对活动文字和页码，重复操作与课后变式合并；实施映射不表示每一装置都进行了完整物理复现，具体数值边界见modelNote。','catalogCount':len(records),'textbookActivities':activities,'supplementIds':[r['id'] for r in records if r['sourceIds'][0]=='physics-ncet-2023'],'ncetMappingFile':'physics-ncet-mapping.json','baseline':json.loads((R/'physics-ncet-mapping.json').read_text()),'unverifiedTextbookAssignments':[]}
coverage['implementationAuditFile']='docs/review/physics.json'
coverage['implementationAuditStatus']='182项已逐项源码复核；此数为目录映射数，不是完整实验验收通过数。浏览器过程验收与尚缺操作逐项列明。'
coverage['needsImplementation']=[item['id'] for item in review if item['status']=='needs-implementation']
(R/'physics-coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2))
(R/'physics-final-records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
D.mkdir(exist_ok=True)
(D/'physics.js').write_text('/* SPDX-License-Identifier: AGPL-3.0-only */\nwindow.LAB_CATALOG=window.LAB_CATALOG||[];\nwindow.LAB_CATALOG.push(...'+json.dumps(records,ensure_ascii=False,indent=2)+');\n')
(D/'sources-physics.js').write_text('/* SPDX-License-Identifier: AGPL-3.0-only */\nwindow.LAB_SOURCES=window.LAB_SOURCES||[];\nwindow.LAB_SOURCES.push(...'+json.dumps(sources,ensure_ascii=False,indent=2)+');\n')
unsupported=[(r['id'],r['model'],r['modelParams']['scenario']) for r in records if r['modelParams']['scenario'] not in schema[r['model']]['scenarios']]
print('Wrote',len(records),'records;',len(activities),'textbook mappings;',len(sources),'sources. Scenarios not yet listed in base schema (extension solvers are audited separately):',unsupported)
