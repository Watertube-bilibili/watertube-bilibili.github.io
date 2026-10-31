# SPDX-License-Identifier: AGPL-3.0-only
"""Per-activity teaching-task review. Publication coverage is not a pass count."""
import json

def apply_quality(records, root):
    byid = {r['id'].removeprefix('phy-'): r for r in records}
    notes = {}
    for line in (root/'research/physics-review-notes.tsv').read_text().splitlines():
        if line and not line.startswith('#'):
            key, scene, limitation = line.split('|')
            assert key not in notes, key
            notes[key] = (scene, limitation)
    assert set(notes) == set(byid), (set(byid)-set(notes), set(notes)-set(byid))
    def number(key, label, unit, lo, hi, step, value, scene=False):
        c = dict(key=key, label=label, unit=unit, min=lo, max=hi, step=step, value=value)
        if scene: c['placement']='scene'
        return c
    def select(key, label, values, value, scene=False):
        c=dict(key=key,label=label,options=[dict(value=v,label=l) for v,l in values],value=value)
        if scene:c['placement']='scene'
        return c
    def set_controls(key, controls, scenario=None):
        r=byid[key];r['controls']=controls
        if scenario:r['modelParams']['scenario']=scenario
        return r
    def append(key, control):
        byid[key]['controls']=[c for c in byid[key]['controls'] if c['key']!=control['key']]+[control]
    amp=lambda: number('amplitude','拨动/振动幅度（相对量）','',0,10,.1,2,True)
    freq=lambda: number('frequency','声源频率','Hz',100,1500,10,440)
    set_controls('bottle-xylophone',[number('waterLevel','同一瓶子的加水量','%',0,100,5,40,True),amp()],'bottleStrike')
    set_controls('piston-flute',[number('length_cm','空气柱长度','cm',5,50,.5,20,True),amp()],'airColumn')
    set_controls('cup-telephone',[select('stringState','棉线状态',[('tight','绷紧'),('slack','松弛'),('pinched','捏住'),('broken','断开')],'tight',True),freq(),amp()],'telephone')
    set_controls('soundproof-room',[number('attenuation','振幅减弱系数（题设）','',0,1,.05,.3,True),freq(),amp()],'insulation')
    set_controls('coin-size',[number('diameter','待测圆形样品直径（教师设定）','cm',1,4,.1,2.5),select('method','测量方法',[('clamp','辅助夹测直径'),('rolling','滚一周测周长')],'clamp',True),number('left','左夹板位置','cm',0,10,.05,4.5,True),number('right','右夹板位置','cm',0,10,.05,8,True),number('rollTurns','无滑动滚动圈数','圈',0,1,.05,0,True)],'caliper')
    set_controls('balance-mass',[number('objectMass','物体质量（教师设定）','g',0,100,.1,37.6),number('weights','右盘砝码总质量','g',0,100,5,35,True),number('rider','游码读数','g',0,5,.1,0,True),number('zero','空盘零点偏移','g',-2,2,.1,0)],'balancePractice')
    set_controls('water-thermometer',[number('temperature','待测液体温度','℃',-10,100,1,35),select('immersion','玻璃泡位置',[('proper','浸入，不碰壁底'),('wall','碰到杯壁'),('bottom','碰到杯底'),('outside','离开液体')],'proper',True),select('eyeLevel','视线位置',[('high','高于液柱上端'),('level','与液柱上端相平'),('low','低于液柱上端')],'level',True),select('stable','示数状态',[(True,'已经稳定'),(False,'尚未稳定')],True)],'thermometerPractice')
    set_controls('homemade-thermometer',[number('volume','瓶中液体初始体积','mL',5,30,1,10),number('deltaT','温度变化','℃',-10,30,1,20),number('tubeArea','细管横截面积','mm²',1,10,.5,2,True),number('beta','体膨胀系数（题设）','1/℃',.0002,.0012,.0001,.0011)],'liquidExpansion')['model']='thermal'
    set_controls('infrared-heating',[select('position','实验温度计位置',[('red','红光区'),('outsideRed','红光外侧'),('shade','移入阴影')],'outsideRed',True),select('blocked','额外遮光片',[(False,'移开'),(True,'放入')],False,True),number('absorbedPower','红外区有效吸收功率（题设）','W',0,.1,.005,.06),number('time','照射时长','s',0,180,5,120),number('initial','两个探测器初温','℃',10,30,1,20)],'infraredCompare')
    set_controls('temperature-sensation',[select('stage','双手观察阶段',[('adapt','分别适应冷水和温热水'),('compare','两手同时放入同一盆温水')],'adapt',True)],'temperature')
    byid['temperature-sensation']['modelParams'].update(value=30,division=1,zero=0)
    set_controls('water-wave-analogy',[number('frequency','波源频率','Hz',.2,2,.1,1),number('amplitude_mm','浮标振动幅度','mm',0,5,.5,3),number('speed','水面波相速（题设）','m/s',.1,.5,.05,.2)],'surfaceWave')
    set_controls('freezing-mixture',[select('stage','查看题设观察',[('before','进入冷浴前'),('cooled','同一冷浴中的观察')],'before',True)],'mixtureObservation')
    byid['freezing-mixture']['kind']='资料分析'
    set_controls('kitchen-phase',[select('activity','观察内容',[('heating','加热水'),('lid','锅盖液化'),('cooling','关火冷却')],'heating',True),select('covered','锅盖状态',[(True,'加盖'),(False,'敞口')],True,True),number('mass','水质量','kg',.1,1,.1,.3),number('initial','初始水温','℃',20,95,1,80),number('power','加热功率','W',0,500,10,300),number('time','观察时间','s',0,600,10,300),number('ambient','环境温度','℃',10,30,1,20)],'kitchenHeat')['model']='thermal'
    append('evaporative-cooling',select('wet','表面条件',[(True,'湿润表面'),(False,'干燥对照')],True,True))
    append('evaporative-cooling',select('stage','观察阶段',[('before','蒸发前'),('after','蒸发后')],'before',True))
    set_controls('stopwatch-pulse-step',[number('count','实际数到的次数，未计数填0','次',0,200,1,0)],'time')
    byid['stopwatch-pulse-step']['modelParams'].update(value=0,zero=0,division=.01)
    for key in ['paper-thickness','paperclip-mass']:
        append(key,number('count','纸张数' if key=='paper-thickness' else '回形针个数','张' if key=='paper-thickness' else '个',1,200,1,100 if key=='paper-thickness' else 20,True))
    append('covered-lens',number('cover','不透光纸片遮挡比例','%',0,100,5,40,True))
    append('reflection-law',select('folded','右半纸板状态',[(False,'展开，共面'),(True,'向后折转')],False,True))
    append('model-camera',number('screenDistance','镜头到感光面距离','cm',2,120,1,30,True))
    append('two-force-balance',number('offset','两力作用线间距','cm',0,5,.5,0,True))
    append('two-force-balance',select('direction','两力方向',[(-1,'反向'),(1,'同向')],-1,True))
    append('plumb-level',number('tilt','待测支架倾角','°',-25,25,1,0,True))
    append('dropper-pressure',select('stage','胶头动作',[('squeeze','挤压排气'),('release','松手吸液')],'release',True))
    for key in ['suction-hole','inverted-water','magdeburg']:
        append(key,select('sealed','内部是否与外界通气',[(True,'密封并已排出部分气体'),(False,'通气，气压趋于相等')],True,True))
    append('lens-rays',select('scenario','透镜类型',[('convex','凸透镜'),('concave','凹透镜')],'convex',True))
    append('pendulum-period',number('mass','摆球质量','kg',.05,1,.05,.1))
    append('pendulum-period',number('angle','释放角度','°',2,45,1,10))
    set_controls('pendulum-lock',[
        number('length','摆长','m',.3,2,.05,1),number('mass','摆球质量','kg',.1,2,.1,.5),
        number('angle','无初速释放角','°',2,45,1,25)],'pendulum')
    byid['pendulum-lock']['modelParams'].update(gravity=9.8)
    set_controls('magnet-carts',[
        number('mass1','左车质量','kg',.1,2,.1,.5),number('mass2','右车质量','kg',.1,2,.1,.5),
        number('force','相互作用力（题设恒力）','N',0,2,.05,.5),number('duration','观察时长','s',.2,2,.1,1)],'interaction')
    set_controls('inertia-sheet',[number('mass','小球质量','kg',.02,1,.01,.1),number('height','球落到杯底的高度','m',.05,1,.05,.3)],'supportRemoval')
    set_controls('rolling-pendulum',[
        number('mass','滚摆质量','kg',.1,1,.05,.3),number('radius','绕线轴半径','m',.003,.015,.001,.006),
        number('inertia','绕轴转动惯量（题设）','kg·m²',.00002,.001,.00001,.0002),number('height','观察下降高度','m',.1,1,.05,.5)],'rollingPendulum')
    set_controls('kinetic-energy',[
        number('mass','球质量','kg',.02,.2,.01,.05),number('blockMass','木块质量','kg',.05,1,.05,.2),
        number('velocity','球的初速度','m/s',.2,2,.1,1),number('friction','地面滑动摩擦系数','',.1,.6,.05,.2)],'kineticImpact')
    set_controls('returning-can',[
        number('mass','等效运动质量','kg',.1,1,.05,.3),number('spring','等效弹性系数','N/m',.2,4,.1,1),
        number('velocity','从平衡位置释放的初速度','m/s',.1,1,.05,.5)],'elasticReturn')
    byid['returning-can']['modelNote']='把罐体与橡皮筋视为一维等效弹簧—质量系统，由 Godot 积分一个往返周期；不含滑动、橡皮筋非线性和耗散。说明储能与回返机制，不等同于任意自制回滚罐的精确运动。'
    byid['kinetic-energy']['modelNote']='采用两刚体完全非弹性碰撞：接触后以共同速度运动，再受相同滑动摩擦减速。先守恒总动量，碰撞机械能不守恒；木块滑移用于比较初始动能，只适用于本题设，不代替真实球块弹跳实验。'
    byid['magnet-carts']['modelNote']='两车受到等大反向的给定恒力，由 Godot 刚体积分位置和速度。力相等不代表加速度相等；没有按磁铁间距求真实磁力，题设恒力用于隔离相互作用与质量因素。'
    byid['inertia-sheet']['modelNote']='t=0 表示快速抽片已经完成，小球没有水平初速度，随后由 Godot 在重力下自由下落。没有模拟慢抽时纸片与球间的摩擦过程。'
    byid['pendulum-lock']['modelNote']='从给定角度无初速释放，摆动由 Godot 刚体与铰链求解；没有额外推力，忽略空气阻力。观察不能到达高于初始位置的状态，不能在放手时额外向前推。'
    for key in ['bottle-xylophone','piston-flute','cup-telephone','soundproof-room']:
        byid[key]['modelNote']=notes[key][1]
    append('electromagnetic-induction',select('closed','回路开关',[(True,'闭合'),(False,'断开')],True,True))
    append('hand-generator',select('rotationDirection','手柄转动方向',[(1,'正转'),(-1,'反转')],1,True))
    set_controls('dc-motor-project',[number('current','线圈电流','A',-2,2,.1,1),number('turns','线圈匝数','匝',20,200,10,100),select('core','铁芯',[('iron','有铁芯'),('air','无铁芯')],'iron')],'motor')
    set_controls('magnet-ball',[number('mass','小球质量','kg',.02,.2,.01,.05),number('velocity','水平初速度','m/s',0,1,.1,.5),select('placement','磁体位置',[('none','移开磁体'),('front','放在前方'),('side','放在旁侧')],'side',True),number('strength','吸力场强度（题设）','N',0,.2,.01,.04),number('duration','观察时长','s',.2,2,.1,1.2)],'magnetDeflection')
    set_controls('solar-fan',[number('power','照到电池板的光功率','W',0,5,.1,2),number('efficiency','光电转换效率','%',0,40,1,20),number('coverage','电池板受光比例','%',0,100,5,100,True)],'solarFan')
    set_controls('potential-height',[number('mass','落下物体质量','kg',.02,.2,.01,.05),number('height','释放高度','m',.05,1,.05,.3),number('resistance','材料阻力（题设恒力）','N',5,30,1,10)],'indentation')
    set_controls('funnel-ball',[select('blowing','吹气状态',[('on','向下吹气'),('off','停止吹气')],'off',True),number('speed','气流参考速度','m/s',0,20,1,8)],'flow')
    byid['funnel-ball']['modelParams']['density']=1.2
    set_controls('vacuum-phone',[select('medium','罩内介质',[('air','空气'),('vacuum','理想真空')],'air',True),select('sourceOn','外部发射信号',[(True,'开启'),(False,'关闭')],True,True),select('phoneSoundOn','手机铃声',[(True,'开启'),(False,'静音')],True)],'vacuumCompare')
    set_controls('spark-radio',[select('mode','发射电路状态',[('steady','稳恒电流'),('switching','迅速通断')],'switching',True),select('receiverOn','接收机',[(True,'接通'),(False,'关闭')],True,True)],'sparkCompare')
    set_controls('emwave-transmission',[number('frequency','发射频率','MHz',1,1000,1,100),select('sourceOn','发射端',[(True,'开启'),(False,'关闭')],True,True),select('receiverOn','接收端',[(True,'开启'),(False,'关闭')],True,True)],'radioTransmission')
    set_controls('diffuse-reflection',[number('angle','光束入射方向','°',0,60,1,30),number('roughness','局部法线起伏幅度','°',0,25,1,15,True)],'diffuse')
    set_controls('plane-mirror',[number('distance','物体到镜面距离','cm',10,60,1,30),number('height','物体高度','cm',2,10,.5,5),number('secondDistance','替代蜡烛到镜面距离','cm',10,60,1,25,True),select('screen','是否放光屏',[(False,'移开光屏'),(True,'放入光屏')],False,True),number('eyeHeight','观察点高度','cm',2,30,1,15)],'mirrorCompare')
    set_controls('prism-spectrum',[number('incidence','棱镜入射角','°',30,65,1,50),number('apex','棱镜顶角','°',50,65,1,60)],'prism')
    for key,typ in [('myopia-correction','myopia'),('hyperopia-correction','hyperopia')]:
        set_controls(key,[number('objectDistance','物体到眼镜距离','m',.25,5,.25,5 if typ=='myopia' else .25),number('correctionPower','矫正镜屈光度（题设）','D',-10,10,.25,0,True),select('withLens','是否戴矫正镜',[(False,'不戴镜'),(True,'戴镜')],False,True),number('eyePower','眼球等效屈光度（题设）','D',50,66,.5,62 if typ=='myopia' else 56)],'correctedEye')
        byid[key]['modelParams'].update(type=typ,retinaDistance=.017)
    set_controls('bottle-lens',[number('focal','水瓶水平等效焦距','cm',4,15,.5,8),number('distance','文字到水瓶距离','cm',2,20,.5,4)],'cylinder')
    set_controls('near-point',[number('observedDistance','第一次清晰观察距离','cm',5,50,1,15,True),select('clarity','本人观察文字是否清楚',[('clear','清楚，可记录'),('blurred','模糊，需移远')],'clear',True),number('trial2','第二次记录','cm',5,50,1,15),number('trial3','第三次记录','cm',5,50,1,16)],'nearPoint')['model']='measurement'
    byid['convex-imaging']['modelParams']['scenario']='imagingBench'
    append('convex-imaging',number('screenDistance','光屏到透镜距离','cm',2,120,1,25,True))
    # Playback is chosen by the teaching operation, never by the subject or engine name.
    playback={
        'pendulum-period':'释放摆球','incline-speed':'释放小车','sensor-speed':'播放运动','water-wave-analogy':'扰动水面','kitchen-phase':'观察温度与物态',
        'walking-speed':'开始行走','rubber-vibration':'拨动橡皮筋','vacuum-bell':'接通电铃',
        'ruler-pitch':'拨动钢尺','amplitude-ball':'敲击音叉','bottle-xylophone':'敲击瓶子',
        'piston-flute':'吹响活塞哨','speaker-candle':'接通扬声器',
        'ice-melting':'开始加热','melting-curves':'开始加热','boiling-water':'开始加热',
        'paper-pot':'开始加热','infrared-heating':'开始照射','magnet-ball':'释放小球',
        'magnet-carts':'同时释放两车','resistance-motion':'释放小车','inertia-sheet':'快速抽片',
        'sliding-friction':'匀速拉动','kinetic-energy':'释放小球','pendulum-lock':'无推力释放',
        'rolling-pendulum':'释放滚摆','returning-can':'推动后松手',
        'heat-capacity':'开始等功率加热','heat-capacity-sensor':'开始等功率加热',
        'gas-diffusion':'移开隔板','liquid-diffusion':'观察扩散','diffusion-temperature':'观察扩散',
        'compression-heating':'压缩气体','expansion-cooling':'释放气体',
        'rubbing-paper':'观察吸引','steam-work':'观察做功过程','simple-heat-engine':'观察做功过程',
        'joule-resistance':'开始通电加热','joule-current':'开始通电加热','solar-fan':'照亮电池板','potential-height':'释放物体',
        'electromagnetic-induction':'移动导体','hand-generator':'转动手柄',
        'dc-motor-project':'接通电动机','water-freezing':'开始冷却','heat-mass-temperature':'开始加热','spark-radio':'操作发射电路'}
    # A reviewed mapping is not a claim that every textbook procedure is complete.
    incomplete={'funnel-ball','saltwater-density','micro-hydrometer','shoe-pressure','bottle-barometer','blow-strip'}
    revised={
        'cold-water-reboil':('在倒置热烧瓶中改变给定气压，对照水温与沸点，沸腾条件满足时出现气泡。','气压由题设改变；没有联立求解瓶内凝结、冷水传热和压力随时间变化。'),
        'funnel-ball':('可选择停吹/向下吹气，观察倒置漏斗与球间气流路径；球由支架定位。','只支持定性路径与压差分析，未复现完整漏斗流场和稳定托球，不能用向上吹气的轴向阻力模型替代。'),
        'stopwatch-pulse-step':('手动开始、暂停、继续、记录停止和清零，真实经过时间与实际计数传给引擎。','使用performance.now计时；手动反应时间仍属于用户操作误差。默认计数0，不把示例次数当实测脉搏。'),
        'coin-size':('左右夹板独立移动，只有相切才接受直径；另有无滑动滚一周测周长。','硬币理想圆，滚动不打滑；刻度是模拟器读数，不能用屏幕物理尺寸替代测量。'),
        'water-wave-analogy':('圆形波前传播与固定位置浮标上下振动来自引擎时间状态。','相速为题设，忽略色散、反射和圆形波幅衰减；不能把水面波方向直接套用于空气声波。'),
        'temperature-sensation':('切换适应阶段与双手放入同一温水阶段，比较两手的不同感觉。','是定性温觉适应演示，不预测个人感觉强度或具体温差阈值。'),
        'homemade-thermometer':('Godot按液体体膨胀和细管截面积计算液面位移；管越细，位移越大。','体膨胀系数为指定温区题设，忽略瓶管自身热膨胀；自制装置仍需标准温度点标定。'),
        'water-thermometer':('可改变浸入位置、视线和稳定状态；错误操作不允许生成有效温度记录。','不虚构错误操作的固定偏高/偏低数值，未计算玻璃泡热惯性或杯壁温度分布。'),
        'balance-mass':('独立增加砝码和移动游码，指针随左右质量差改变；仅平衡时接受示数。','指针偏角为方向示意，不是天平灵敏度标定；零点偏移需要单独修正。'),
        'freezing-mixture':('查看同室温与同冷浴两阶段：题设中纯水出现冰、给定含酒精样品仍流动。','资料分析情境，不是任意酒精浓度的相图预测；没有捏造精确凝固点或凝固时间。'),
        'evaporative-cooling':('干湿对照与蒸发前后阶段改变温度计相对液柱，风速等条件影响蒸发趋势。','液柱仅作降温方向示意，无精确温差刻度；引擎未求真实失水量与冷却温度。'),
        'kitchen-phase':('加盖/敞口与加热/冷却操作进入Godot时步热量守恒，温度、汽化质量和锅盖水滴联动。','总热导是题设；不含锅体热容、冷却时蒸发与冷凝量。水耗尽即停止液态水计算。'),
        'infrared-heating':('移动温度计到红光、红光外侧或阴影，并加遮光片，与同初温遮光对照比较。','有效吸收功率是题设而非实测光谱；按能量关系求温升，忽略散热。'),
        'magnet-ball':('移开、前置、旁置磁体时实际二维刚体轨迹改变，旁置吸力使运动方向弯曲。','软化吸力场为题设，不代表真实磁铁定量规律；轨迹由Godot积分。'),
        'solar-fan':('受光比例、功率和效率进入电机转子动力学，遮光或零功率时没有光电驱动。','使用给定电机与负载近似，不把光功率直接当转速，也不预测任意自制风扇。'),
        'potential-height':('物体实际下落，进入材料后受给定阻力减速，比较最终压入深度。','材料阻力采用恒力题设，不是橡皮泥真实塑性本构。'),
        'spark-radio':('稳恒电流/迅速通断与接收机开关形成对照，瞬态响应按慢放包络显示。','包络为相对示意，火花不能等同于单一MHz正弦；未输出精确噪声级或场强。'),
        'vacuum-phone':('空气/真空可切换；罩内手机接收信号、扬声器振动和罩外听声三种状态分别显示。','理想对照忽略固体支架传声与罩体屏蔽；不模拟手机协议和实际声压。'),
        'emwave-transmission':('发射/接收开关直接改变信号状态，频率由引擎换算真空波长。','无屏蔽、匹配接收的工作原理示意，不计算真实无线覆盖距离或干扰。'),
        'rolling-pendulum':('实际刚体积分下降和反卷上升，最低点切换绳侧并记能损，顶点后自然再次下降。','绳收紧为瞬时捕获冲量近似；适用I≥mr²，未模拟有限弹性、张力峰值、空气阻力或轴摩擦。'),
        'kinetic-energy':('两个实际刚体碰撞后以共同速度滑动，改变球质量/速度比较木块滑移。','完全非弹性碰撞与恒滑动摩擦题设；碰撞机械能不守恒，不代替真实弹跳细节。'),
        'pendulum-lock':('从给定释放角无初速释放，铰链约束下摆动并比较所达高度。','理想摆忽略真实耗散；没有额外推力，不能在释放时人为推动。'),
        'returning-can':('一维等效弹簧—质量刚体系统实际减速、反向并返回。','回滚机制采用线性等效模型，不预测任意罐体内部结构或橡皮筋非线性。'),
        'magnet-carts':('两车在等大反向题设恒力下同时释放，实际位移和加速度随质量改变。','相互作用力给定且恒定，不按真实磁铁距离求磁力；力相等不代表加速度相等。'),
        'inertia-sheet':('快速抽板完成后，小球从零水平速度开始沿真实自由落体轨迹落下。','没有模拟慢抽时纸片摩擦带动小球；不引入不存在的惯性力。'),
        'rubbing-paper':('按声称的单个摩擦带电物体电荷判断吸引；charge1为0时纸屑静止，正负均能吸引。','相对电荷与极化为定性示意，不能由吸引轻小物体辨认电荷正负。'),
        'bottle-barometer':('能根据海拔比较给定标准大气压，瓶与细管目前仍是结构图。','液柱未随条件联动；尚缺密封气体体积、温度和内外压差共同决定液位的模型，不能作为完成的气压计观察操作。'),
        'blow-strip':('能比较气流速度与静压的题设数值，显示纸条受气流前后两种形状。','两个形状仍是固定示意，纸条没有随吹气条件更新；尚缺气流与纸条变形联动。'),
        'straw-spray':('停止吹气时不再显示液体上升箭头或水雾；有气流时显示喷雾原理示意。','未计算液柱吸起阈值、真实吸液高度、黏性和雾滴粒径，示意水雾不能用于量取流量。'),
    }
    for key,(scene,limitation) in revised.items():
        notes[key]=(scene,limitation)
        byid[key]['modelNote']=limitation
    fixed={
        'ruler-pitch':'专用可调伸出长度与拨动幅度，Godot悬臂梁位移与频率。',
        'steel-ruler-force':'专用作用点、方向与力值，Godot静态弯曲曲线。',
        'pendulum-period':'Godot重力控件已修复并加入质量/释放角度。',
        'paper-thickness':'加入纸张数并输出累积法平均值。','paperclip-mass':'加入计数并输出平均质量。',
        'covered-lens':'独立遮挡比例，并保持完整像和相对亮度。','reflection-law':'加入折转纸板操作。',
        'model-camera':'加入独立感光面位置和对焦比较。','two-force-balance':'加入作用线间距及同向/反向。',
        'plumb-level':'加入待测支架倾角，铅垂线保持竖直。',
        'dropper-pressure':'加入挤压/松手阶段。','suction-hole':'加入通气状态。','inverted-water':'加入通气状态。','magdeburg':'加入通气状态。',
        'lens-rays':'加入凸/凹透镜切换。','communicating-vessels':'液面随深度参数共同改变。',
        'torricelli':'汞柱随引擎大气压改变高度。','steelyard':'秤砣位置随力臂移动。',
        'water-light-guide':'不满足全反射时取消固定导光结论。',
        'hand-generator':'角度和指针使用引擎时间状态。','electromagnetic-induction':'导线位置与电动势按引擎时间状态。',
    }
    for key in ['rubber-vibration','vacuum-bell','amplitude-ball','bottle-xylophone','piston-flute','speaker-candle','cup-telephone','soundproof-room']:
        fixed[key]='声音装置独立绘制；器材、控件和Godot源信号联动，零幅度无伪振动。'
    for key in ['ice-melting','melting-curves','boiling-water','paper-pot','water-freezing']:
        fixed[key]='温度与物态使用引擎时间状态，不能只显示末态。'
    for key in ['magnet-carts','inertia-sheet','kinetic-energy','pendulum-lock','rolling-pendulum','returning-can']:
        fixed[key]='专用刚体/约束模型输出轨迹，画面读取实际状态，不再只有能量标签。'
    for key in revised:
        if key not in incomplete:fixed[key]=revised[key][0]
    for key in ['deformation','ammeter','voltmeter','digital-multimeter','compass-field','electromagnet-crane','fuse-comparison','solar-water','buoyancy-weighing','pulley-efficiency','lead-attraction','archimedes','buoyancy-factors','mass-volume','liquid-pressure','flow-pressure-sensors']:
        fixed[key]='独立专用模块增加本项关键器材操作；详见末尾合入的专项审查说明。'
    audit=[]
    for key,r in byid.items():
        mode='playback' if key in playback else 'live'
        scene, limitation=notes[key]
        reason=('该任务需要观察随时间演变的器材或物态；图形须使用模型过程。' if mode=='playback' else '改条件后直接比较当前读数、结构、受力或光路；阶段控件本身就是操作。')
        r['interaction']={'mode':mode,'reason':reason}
        if mode=='playback':r['interaction']['actionLabel']=playback[key]
        status='needs-implementation' if key in incomplete else 'fixed-awaiting-browser' if key in fixed else 'code-reviewed-awaiting-browser'
        r['implementationReview']={'status':status,'scope':scene,'limitation':limitation}
        if key in incomplete:
            # The visible scope must say what is missing, even if a numerical model exists.
            r['modelNote'] += ' 本项操作范围：'+limitation
        audit.append(dict(id=r['id'],mode=mode,purpose=r['objective'],controlsReviewed=[{'key':c['key'],'label':c['label'],'default':c['value']} for c in r['controls']],sceneBehavior=scene,limitations=[limitation],fixes=[fixed[key]] if key in fixed else ['按逐项教学目的区分即时操作与过程回放。'],status=status,evidence={'method':'逐项目录、Godot求解器及SVG分支静态复核；动画初筛另见interaction审计。','browser':'待最终引擎导出后的端到端复测，不以源码可运行视为通过。'}))
    # Root-owned ruler contracts are applied last, after all general defaults.
    for patch_file in ['ruler-catalog.json','electrical-review-catalog.json','deformation-review-catalog.json','physics-measurement-review-catalog.json','optics-review-catalog.json','fluid-density-review-catalog.json','rolling-pendulum-catalog.json']:
        patch_path=root/'research'/patch_file
        if not patch_path.exists():continue
        for fullid,patch in json.loads(patch_path.read_text()).items():
            byid[fullid.removeprefix('phy-')].update(patch)
    for a in audit:
        r=byid[a['id'].removeprefix('phy-')]
        review=r.get('implementationReview',{})
        a['purpose']=r['objective']
        a['mode']=r['interaction']['mode']
        a['controlsReviewed']=[{'key':c['key'],'label':c['label'],'default':c['value']} for c in r['controls']]
        a['sceneBehavior']=review.get('scope',a['sceneBehavior'])
        a['limitations']=[review.get('limitation',r['modelNote'])]
        if review.get('status')=='verified-with-limitations':
            a['status']='verified-in-isolation-awaiting-integration'
            a['evidence']['specialist']=review.get('evidence',{})
        elif review.get('status')=='implemented-pending-integration-test':
            a['status']='fixed-awaiting-browser'
            a['evidence']['specialist']=review.get('evidence',{})
        if r['id'] in {'phy-ammeter','phy-voltmeter','phy-digital-multimeter','phy-compass-field','phy-electromagnet-crane','phy-fuse-comparison','phy-solar-water','phy-deformation'}:
            a['limitations']=[r['modelNote']]
            a['sceneBehavior']=r['objective']+' 操作步骤：'+'；'.join(r['steps'])
        if r['id'] in {'phy-coin-size','phy-balance-mass','phy-water-thermometer','phy-homemade-thermometer','phy-infrared-heating','phy-kitchen-phase','phy-freezing-mixture','phy-water-wave-analogy','phy-vacuum-phone','phy-spark-radio','phy-emwave-transmission'}:
            a['status']='verified-in-isolation-awaiting-integration'
            a['evidence']['specialist']={'engine':'tests/godot_classroom_review.gd：27个关系与边界断言通过。','renderer':'tests/classroom-review-browser.py：16份真实Godot输出、64个渲染状态、137个断言通过，已目视3组截图。','scope':'独立场景验证；整站导出后需做完整UI联调。'}
    browser_path=root/'research/physics-browser-review.json'
    if browser_path.exists():
        smoke={x['id']:x for x in json.loads(browser_path.read_text())}
        for a in audit:
            if smoke.get(a['id'],{}).get('ok'):
                a['evidence']['browser']='真实Godot默认条件与0/.5/1三个阶段SVG已通过；不等于全部参数、全部操作或完整实物流程验收。'
                checked_statuses={'fixed-awaiting-browser':'fixed-browser-smoke-checked','code-reviewed-awaiting-browser':'code-reviewed-browser-smoke-checked','verified-in-isolation-awaiting-integration':'verified-in-isolation-and-browser-smoke-checked'}
                a['status']=checked_statuses.get(a['status'],a['status'])
    for a in audit:
        byid[a['id'].removeprefix('phy-')]['implementationReview'].update(status=a['status'],scope=a['sceneBehavior'],limitation=a['limitations'][0])
    reviewdir=root/'docs/review';reviewdir.mkdir(parents=True,exist_ok=True)
    (reviewdir/'physics.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
    return audit
