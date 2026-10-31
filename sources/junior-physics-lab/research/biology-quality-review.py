# SPDX-License-Identifier: AGPL-3.0-only
"""Author-reviewed interaction and implementation scope. Applied by biology-build.py.
These are per-activity semantic findings, not a generated claim of wet-lab equivalence.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
# Each line: id | actual supported observation/action | limits checked against the purpose.
OWN='''campus|植物和动物输入用于样方密度与记录图；修改面积立即重新计算|只统计输入的单一样方；不提供野外调查或自动物种鉴定
microscope|字母倒像，玻片位移方向相反；倍数按乘积改变图像比例，细调改变清晰度|光路、照明和粗准焦操作由步骤说明，网页不模拟真实机械装调
plant-cell|切换洋葱/黑藻、染色、目物镜与调焦；叶绿体仅在黑藻材料显示|支持材料结构对照，不支持亲手撕取、展平、盖片与排气泡
animal-cell|口腔细胞无壁，染色改变核的显著程度；放大和调焦立即响应|典型结构拼图，不是口腔采样或真实显微照片
cell-division|分裂前核、中期排列、分离期两组移动位置和两个新核/细胞板分别绘制；分裂次数计算2的幂|分裂次数是理论推算，不能把固定视野的12个示意框当实测细胞数
 tissues|上皮紧密排列、肌纤维、神经突起、结缔纤维和植物细胞分别显示|番茄组织示意简化，未完成取材制片；示意放大不是显微镜校准
paramecium|刺激在右侧；草履虫随过程向食物或避盐方向移动，无刺激不定向迁移|仅定性趋性模型；不预测真实分布，不是反射；棉纤维与取样操作由步骤说明
cell-model|动物/植物细胞结构切换，遗传信息重点圈选相应细胞核|观察现成模型与设计依据，不提供拖拽组装或真实模型材料制作
plants|藻体、苔藓、蕨类孢子囊群、松球果类别和花果结构区别显示|外形和关键繁殖结构示意，不能用于实际野外鉴定
seed-structure|菜豆子叶与玉米胚乳形态不同；剖面重点圈出胚|没有真实剖切操作；胚芽、胚轴和胚根未逐件可选，只作为整体胚示意
animal-groups|蚯蚓分节、缢蛏贝壳、蝗虫附肢、鱼鳍、蛙及兔形态分别显示|外部形态比较；未逐类展示内部呼吸器官，不等同完整解剖
bird|翼外形、放大羽毛、中空长骨和肺气囊重点分别显示|是结构与功能识图，不模拟飞行动力学；气囊图为位置关系
teeth|兔门齿/臼齿与狼犬齿轮廓区别显示|侧面牙列简图，不按真实齿式、牙数或咬合比例制作
microbe-distribution|取样来源与观察日作记录标签；菌落图按用户输入记录绘制|不根据洗手与否预设菌落数量；没有真实培养、鉴定或安全检测
bacteria|球、杆、螺旋形与无成形细胞核的DNA区域区别；重点圈选遗传区域|典型基本结构，不给所有细菌画上共有鞭毛/荚膜，也不鉴定菌种
fungi|酵母细胞与出芽、霉菌菌丝分支分别显示，倍数与调焦即时变化|霉菌图为菌丝/产孢结构概括，不对应所有真菌属的显微特征
fermentation|面包、酸奶、泡菜材料切换；菌种和温度条件用于过程定性判断|食品制作条件比较；没有真实培养或可食用成品，也不从外观判断安全
classification|植物按种子、动物按脊柱作第一层检索；按生境时显示容易混类的实例|支持分类依据比较，不提供全界检索表或完整物种分类树
resources|记录已确认、未定名类型和计划样方数，显示记录整理要求|记录设计与统计；没有现场调查、自动标牌生成或分类鉴定
yeast-compare|输入A/B各三次气体量，计算各组均值、差值和可比条件|数据需用户记录或题设；未从温度和菌种预测实测发酵量
pickle|输入第1/3/5日处理和对照浓度；表格与折线、同日差值即时更新|不预测亚硝酸盐曲线，不提供检测化学操作或食用安全判断
 yogurt|选择菌种、温度、对照、卫生和pH记录，解释凝乳与酸化条件|pH输入不是检测；凝乳图不等于成功、安全或可食用
pond|四种典型微小生物的形态分别显示；取样层只是记录来源，非物种预测|不是池塘水真实采样、活体录像或自动分类
cutting|扦插/嫁接方案切换，嫁接口贴合与失水状态可比较|没有成活计时或实际接口愈合；无效的扦插形成层条件需按适用范围解释
 egg|圈选壳、卵白、卵黄/胚盘、钝端气室并给功能说明|结构剖面识图，未模拟打开鸡卵或实际孵化
animal-development|家蚕、蝗虫、蛙的阶段形态分别绘制，选阶段突出对应状态|饲养装置方案见文字，未提供真实饲养环境或跨日生长预测
 gene-transfer|双亲基因分离到配子并形成四格组合；按行列标签正确计算子代基因型|只演示一对等位基因传递，未模拟完整减数分裂与多染色体独立分配
 dominance|双亲基因型直接更新组合方格和显隐性概率|完全显性单基因假设，不能推广至多基因性状或真实小样本固定比例
sex|次数与序列编号产生可复现的独立抽样记录；理论概率和合成频数分列|不是实际生育或人口统计；有限样本不保证1:1
variation|改变中心、分散度和样本量后显示合成逐项数据、均值和重叠散点|不是随机收集的真实花生；不能由外观或均值断定全部遗传原因
selection|播放按选择轮次替换群体构成，改变背景会改变既有颜色的存活权重|每一轮代表新群体，不是原个体变色；权重人为给定，未模拟真实捕食行为
 evolution|化石跨地层分布、前肢对应骨骼和分子比对示意切换|证据示意并非特定真实类群年代；分子序列为教学符号，不足推断完整谱系
biodiversity|输入记录物种/生境数并比较保护原生境与有限个体保存|只作方案评价，不把数量总和当作完整多样性指数
asexual|叶生新株、草履虫分裂、水螅出芽各阶段可选；末阶段新个体分离|阶段手选，不预测速度、成活率或保证后代完全不变异
 egg-pores|水温比较条件和已观察气泡记录分别输入并图示|气泡现象由用户输入，不是网页测量；不能用气泡数当气孔数
 traits|比较同物种同一性状与跨性状反例，并检查判断依据|人的眼睑只作外观比较，不据此推断简单显隐性、亲缘或基因型
 genetic-material|细胞核、成对染色体、DNA双链和高亮基因片段逐级切换；对数与条数一致|任意简化物种的结构图，不是人体核型；DNA层只放大一条代表DNA
karyotype|典型XX/XY与体细胞/配子条数对应，来源不符的Y配子明确报矛盾|只表示典型组成，不进行临床核型或性发育判断
origin-evidence|选择装置环节定位，区分产生简单有机物、制造生命和唯一路线三种断言|证据阅读模型；装置并非可运行放电实验，也不还原唯一地球历史
human-comparison|运动、颅骨、交流学习维度分别比较，并显示共同祖先分支关系|概括图不能据外貌判价值、完整谱系或现代猿到现代人的直线关系
species-register|两年度输入柱图、差值和统计口径检查|名录增加不等于野外个体增长，也不证明保护已全部成功
invasive-species|原生、外来、已证危害分别识别；传播方式和措施单独评价|不由模型判断某真实物种是否入侵，不授权放生、采集或治理
sexual-comparison|按物种切换典型体内/外环境，精卵分开、结合和受精卵三阶段有不同结构|不模拟真实受精动力学；所选典型材料不能概括所有鱼类等类群
transgene-evidence|教材情景的普通/导入基因材料和低温处理改变定性植株状态，混杂条件提示不可归因|题设分析，非任意基因功能预测、真实转基因操作或实测图
breeding|选择、杂交、诱变、转基因四种方法呈现不同方案步骤，并评价定向变异误解|方案比较，不模拟任何方法成功率或实际育种操作
sex-ratio-data|输入男女人数换算每100名女性对应男性数，区分人口与出生统计口径|不能当受精时XY概率或实际官方统计；分母零不生成虚假比值
evidence-reasoning|资料句按观察、解释、过度断言分别呈现并评价证据限度|原创课堂资料句，未引用最新科研实证或单一灭绝/迁徙答案
cell-comparison|典型细菌、真菌、叶肉、动物细胞切换；膜、核、细胞壁重点标示|典型模型不概括无核或其他特化细胞；真菌不按植物分类
'''
OWN={('bio-'+a.strip()):dict(sceneBehavior=b.strip(),limitations=c.strip()) for a,b,c in (line.split('|') for line in OWN.strip().splitlines())}
PLAYBACK={
'bio-paramecium':'刺激位置与草履虫位置随观察过程变化；无刺激对照不强制发生定向迁移。',
'bio-germination':'在具备条件的情景中依次显现胚根生长；缺必要条件时保留未萌发状态。',
'bio-photosynthesis-oxygen':'演示金鱼藻气泡向收集装置运动；仅是放气过程，不自动完成气体鉴定。',
'bio-seed-respiration':'显示温柱上升、气体通入并浑浊或木条检验的过程；对照不发生同样生命活动。',
'bio-fish-capillaries':'红细胞沿小动脉分支、毛细血管与小静脉汇合的连续线路运动，可慢放。',
'bio-circulation':'血流标记沿连接四个心腔的两条循环运动，肺和组织处改变所追踪气体的相对含量。',
'bio-reflex':'刺激信号先沿反射弧到达效应器，再发生腿部运动；中断只传播至相应断点。',
'bio-reaction':'尺按Godot自由下落轨迹移动，接尺手保持固定参考高度；结束距离来自输入记录。',
'bio-selection':'逐轮呈现由假定存活权重计算的新群体组成，不把个体主动变色作为自然选择。'}
TITLES={
'bio-germination-rate':'计算种子发芽率并分析检测记录',
'bio-microbe-distribution':'环境细菌和真菌检测：培养记录分析',
'bio-food-storage':'利用呼吸作用原理比较食物保存方案',
'bio-food-energy':'分析食物燃烧记录并计算水吸收的热量',
'bio-lung-capacity':'气球体积估算与肺活量测量方法',
'bio-reaction':'由落尺距离换算反应时间',
'bio-blood-pressure':'血压记录与测量姿势分析',
'bio-daphnia':'酒精对水蚤心率影响：对照记录分析',
'bio-woodlouse':'非生物因素对动物影响：实验方案设计',
'bio-first-aid':'药品说明信息与急救行动辨析',
'bio-firstaid-procedure':'成人心肺复苏与止血：流程辨析',
'bio-drug-prevention':'禁毒教育资料与情境判断',
'bio-fermentation':'比较发酵食品的制作条件',
'bio-acidrain':'分析酸雨探究的条件与发芽记录',
'bio-ecological-survey':'生态调查记录与校园绿化方案分析'}
SCENE_UPDATES={
'bio-root':'成熟区根毛、伸长区长细胞、分生区小密细胞和根冠可切选，底部给区域功能。',
'bio-mineral':'玉米长条叶和须根；第0天各条件同初始大小，随后日序选择的大小只是定性情景。',
'bio-flower':'选择雄蕊、雌蕊、子房时圈出相应结构；卵形胚珠在子房内部。',
'bio-leaf':'横切区分上表皮、栅栏/海绵叶肉、下表皮；两种视图均显示气孔开闭。',
'bio-transpiration':'两种袋边界分别只罩枝条/连同湿土；湿土组可有蒸发水，不能单独归因蒸腾。',
'bio-seed-respiration':'活种子条件可播放温柱上升、CO2通气浑浊加深、木条移向瓶口检验；煮熟对照无同样变化。',
'bio-food-storage':'食品类型与低温、干燥、密封、常规保存的方案卡及对应局限即时更新。',
'bio-digestion':'酶条件区分低温减慢、高温失活和无唾液酶；淀粉显色是足够处理条件下的理想比较。',
'bio-diet':'多样、单一和零食替代正餐显示不同餐盘；食品信息/过期状态同时显示。',
'bio-fish-capillaries':PLAYBACK['bio-fish-capillaries'],
'bio-heart':'四腔关系图，腔静脉/肺静脉进入心房，肺动脉/主动脉从心室发出，房室箭头与瓣膜重点。',
'bio-circulation':PLAYBACK['bio-circulation'],
'bio-blood-pressure':'袖带按正常/低于心脏位置移动，活动状态有干扰提示；读数完全来自输入。',
'bio-kidney':'结构尺度直接切换；肾单位以分支箭头区分留血、滤过、正常葡萄糖返血、水分流及尿素排出。',
'bio-eye':'近物发散光与较厚等效屈光结构、远物近平行光、前置矫正镜改变光线方向；焦点由Godot求解。',
'bio-reflex':PLAYBACK['bio-reflex'],
'bio-reaction':PLAYBACK['bio-reaction'],
'bio-muscle':'0度伸直，角度增大前臂屈曲；动作选项高亮相应主要肌群，参数直接可观察。',
'bio-hormone':'两组方案卡显示激素条件、饲料是否同时改变和独立重复材料数量。',
'bio-daphnia':'显示心脏位置和两组输入次数/时间/换算心率表，不播放与记录无关的心跳。',
'bio-infection':'传播途径情景卡及传染源/途径/易感人群干预重点相配；不预测感染风险。',
'bio-first-aid':'药品情景显示说明字段核对卡；倒地与止血情景显示人偶/敷料，行动作信息辨析。',
'bio-woodlouse':'起始左右等量布置，光/湿度条件可比较；没有自动生成趋性结果或越界移动。',
'bio-vegetation':'裸地和植被地各输入气温、湿度，即时比较差值；重复次数仅为调查计划。',
'bio-foodweb':'生产者连兔、蝗虫，后者连鸟与狐，形成交织关系；竞争和合作不是错误的捕食箭头。',
'bio-ecosystem':'显示组成与光照情景；不再按动物数大于植物数判断稳定，不认可空瓶是合理系统。',
'bio-firstaid-procedure':'直接选择流程步骤，核对观察重点、电话/AED或敷料提示；按压手只在相应教学步骤显示。'}
FIXES={
'bio-microscope':'取消图像倍率上限，图像线性比例与所示总倍数一致。',
'bio-cell-division':'分裂中期与分离期不再共用同一染色体图；末阶段显示两核和细胞板。',
'bio-cell-model':'动物细胞的核重点圈选位置纠正。',
'bio-bird':'羽毛和中空骨选项增加对应局部结构。',
'bio-egg':'每个结构选项圈选对应部位，避免只改底部文字。',
'bio-plants':'补被子植物花果与蕨类孢子囊群。',
'bio-classification':'用有实例的分类分支替换空泛框图。',
'bio-microbe-distribution':'取消根据洗手前后强制生成菌落数，增加用户菌落记录。',
'bio-gene-transfer':'修正配子组合方格行列索引，异型亲本组合与标签一致。',
'bio-dominance':'修正配子组合方格行列索引。',
'bio-genetic-material':'细胞层图中的染色体按成对绘制，与对数/条数计算一致。',
'bio-asexual':'独立新个体阶段与形成阶段在位置/分离状态上区分。',
'bio-sexual-comparison':'精卵分开、结合和受精卵分别绘制，不在受精卵内保留外部精子形态。',
'bio-breeding':'不同育种方法采用不同方案步骤，移除统一植株模板造成的名义控件。',
'bio-cell-comparison':'膜高亮贴合真实示意边界，不再高亮无关外框；增加细胞壁重点。',
'bio-campus':'零植物输入不再回退为默认数量；符号为教学记录图。',
'bio-mineral':'纠正SVG插值坐标缺分隔符造成的叶片消失；各组初始大小一致。',
'bio-plant-growth':'纠正共用植物SVG坐标缺分隔符造成的叶片丢失。',
'bio-lung':'纠正膈膜曲线坐标缺分隔符；补吸气/呼气方向箭头。',
'bio-lung-capacity':'纠正气球周长曲线坐标缺分隔符；题名不再暗示真实肺活量测量。',
'bio-fermentation':'纠正面团曲线坐标缺分隔符；只做条件比较。',
'bio-pond':'纠正眼虫轮廓曲线拼接的坐标缺分隔符。',
'bio-transpiration':'修正袋罩湿土被解释成隔绝土壤蒸发的反向含义。',
'bio-selection':'明确每轮代表下一代群体构成，不用个体变色解释选择。'}
# Explicit limitations retained after repair; none are converted to successful wet-lab claims.
LIMIT_UPDATES={
'bio-food-energy':'只输入记录并做量热计算，没有燃烧、温度采集或热效率测量；Godot负责相关热学量求解。',
'bio-lung-capacity':'只由输入周长估算近球形气球体积；不测肺活量，非球形时公式不适用。',
'bio-exhaled-co2':'直接比较等体积气体的定性检验情景；不模拟气液反应速率，也不由气泡数计算CO2浓度。',
'bio-photosynthesis-oxygen':'仅演示极端必要条件模型的放气；尚无气体鉴定操作、浓度或真实产气速率。',
'bio-photosynthesis-starch':'处理后的理想检验示意；暗处理不足时只能说明原有淀粉干扰，不能唯一预测显色。',
'bio-photosynthesis-co2':'密闭去CO2与对照的题设比较；不提供试剂操作、实时光合速率或唯一显色预测。',
'bio-kidney':'支持结构和成分去向识图；没有完整动态滤过路径、滤过率或个人肾功能判断。',
'bio-eye':'使用任意教学尺度的等效薄透镜和示意光路；近物包含调节，不换算个人屈光度或完整角膜/晶状体机制。',
'bio-human-reproduction':'当前仅支持器官关系与生殖细胞产生部位，不能演示受精、胚胎或分娩完整路径。',
'bio-body-model':'只显示器官位置与系统关系，不支持拖拽制作或连续物质运输。',
'bio-reaction':'输入一个距离后用Godot轨迹换算；记录编号不是多次测量，未提供真实用户反应计时测试。',
'bio-daphnia':'两组单次输入比较和心率换算；未模拟活体受酒精影响，也不能仅两条记录作因果结论。',
'bio-foodweb':'图示种间关系简化；合作情景中食物网扰动仅提示不适用，不推算合作或种群数变化。',
'bio-firstaid-procedure':'流程辨析与人偶示意；不评估真实手法、按压深度/质量，不替代正规训练。',
'bio-drug-prevention':'资料与情景判断，未举办真实参观或播放具体展览影片。',
'bio-woodlouse':'只审查起始等量与控制变量；最终两侧分布、重复与归纳须来自真实记录。'}
LIMIT_UPDATES.update({
'bio-root':'不是显微照片；细胞形态与大小仅区分区域特征，不能定量估计分裂率或生长速度。',
'bio-leaf':'横切与表皮是概略组织图；叶脉和气孔位置不按具体物种真实数量或比例。',
'bio-vegetation':'两地温湿度输入比较；没有真实温湿度采集或每次独立重复记录，计划次数不生成均值。',
'bio-heart':'支持四腔与主要血管连接、瓣膜方向的关系识图；不是实物解剖形状或心搏动力学模型。',
'bio-circulation':'支持四腔路径和肺/组织处气体交换方向；血流量、血压、时序和比例均未定量建模。',
'bio-first-aid':'说明信息核对与情境选择；不对应某个真实药品剂量，也不代替正规的急救手法训练。'
})
# Controls with changed interpretation are stated explicitly in the review.
CONTROL_UPDATES={
'bio-microbe-distribution':['sample：来源记录标签，不决定菌落多少','day：采样记录日序，不自动培养','colonies：输入菌落记录，驱动画面符号数'],
'bio-reaction':['distance：下落距离，Godot轨迹换算并决定尺终点','trial：记录编号；不声称自动收集重复测量'],
'bio-daphnia':['concentration：处理组浓度标签，不预测心搏次数','beats/controlBeats：处理/对照的输入计数','seconds：相同计数窗口，分别换算为次/min'],
'bio-vegetation':['openTemp/plantTemp：两地气温记录与温差','openHumidity/plantHumidity：两地相对湿度记录与百分点差','repeats：计划重复次数，不生成均值'],
'bio-foodweb':['relationship：捕食网络、共享资源竞争、合作示意','disturbance：捕食网络中的植物/捕食者减少；合作情景仅提示适用范围'],
'bio-kidney':['view：系统、器官、肾单位尺度直接切换','substance：成分去向说明始终更新；几何分流仅在肾单位尺度展示']}

CONTROL_UPDATES.update({
'bio-eye':['eye/correction：Godot求得的像距和前置矫正镜光路','distance：近物发散光与晶状体示意曲率调节；正常调节后仍落在视网膜'],
'bio-flower':['part：整体、雄蕊、雌蕊、子房的对应部位圈选及功能'],
'bio-leaf':['eyepiece/objective/focus：倍率与离焦','view：横切层次与表皮保卫细胞','stomata：两种视图均有开闭几何'],
'bio-circulation':['circuit：只追踪肺、体或两条连续循环','substance：标记随肺/组织交换改变相对含量颜色'],
'bio-blood-pressure':['systolic/diastolic：输入记录值','position：袖带相对心脏高度或活动干扰的画面变化'],
'bio-firstaid-procedure':['scenario：成人倒地与止血流程分别列出','step：直接选六步，电话/AED/响应部位/按压手/敷料重点相配'],
'bio-body-model':['system：消化、呼吸、循环、泌尿系统的器官位置','view：所选系统器官位置重点，未声称播放物质运输'],
'bio-ecosystem':['plants/animals：组成数量，不用简单数量比保证稳定','light：黑暗遮层、强光及升温风险、普通光照情景']
})

OWN_CONTROL_TEXT='''campus|plants：样方植物计数用于密度；animals：独立的动物记录；area：密度分母
microscope|eyepiece/objective：乘积总倍数与线性图像比例；focus：离焦模糊；shift：玻片与倒像反向移动
plant-cell|eyepiece/objective/focus：倍率和细调；specimen：洋葱与黑藻的叶绿体差别；stain：核的染色对比
animal-cell|eyepiece/objective/focus：倍率和细调；stain：核的染色对比，保持动物细胞无壁
tissues|tissue：五种组织形态与功能；zoom：整个组织示意的观察尺度
cell-division|phase：四种染色体/细胞板状态；cycles：理论细胞数2^n，不改固定视野计数
paramecium|stimulus：刺激物及迁移方向，无刺激无定向趋势；zoom：视野放大
cell-model|type：有无细胞壁及大液泡；view：整体或对应细胞核的圈选
plants|organism：类群外形与种子/孢子/花果等证据
seed-structure|seed：子叶与胚乳贮藏结构差异；view：胚所在部位重点
animal-groups|animal：外部形态与呼吸/运动特征说明，未声称完成解剖
bird|feature：翼、羽毛、中空骨、肺气囊的不同结构重点
teeth|animal：兔的门臼齿与狼犬齿轮廓比较
bacteria|shape：球杆螺旋外形；view：DNA区域重点，无成形核
fungi|specimen：酵母与霉菌形态；eyepiece/objective/focus：放大与离焦
fermentation|product：材料及菌种说明；temperature：适宜/冷/热条件判断；culture：是否具备所需培养物
classification|group：植物种子或动物脊柱的分类示例；criterion：关键结构与只按生境的反例
resources|identified：已确认记录数；unknown：单列未定名类型；plots：计划调查样方数，不自动鉴定
yeast-compare|a1/a2/a3和b1/b2/b3：两组独立输入读数及均值；samecondition：是否允许将差异联系到菌种
pickle|t1/t2/t3和c1/c2/c3：处理对照的三时点记录；day：选择同日比较；treatment：待控制的单一因素
 yogurt|culture/temperature：发酵必要条件；control：有无未接种对照；ph：酸度输入；hygiene：卫生设计检查
pond|organism：草履虫/衣藻/眼虫/水绵形态；sample：采样层记录；eyepiece/objective/focus：光学观察示意
cutting|method：扦插或嫁接装置；condition：适宜、失水或嫁接形成层未贴合；扦插下该选项明确无关
 egg|part：壳、卵白、卵黄胚盘、气室的精确重点圈选
animal-development|animal：家蚕、蝗虫、蛙的阶段差异；stage：所选发育阶段突出，不预测天数
 gene-transfer|parent1/parent2：两个亲本的等位基因，配子对应行列与子代组合
 dominance|parent1/parent2：基因型方格与完全显性理论概率
sex|trials：独立模拟次数；seed：可复现的抽样序列编号，不能指定性别结果
variation|meanA/meanB：合成样本中心；spread：样本散布；sample：样本量与逐项统计
selection|initial：既有变异比例；background：两色存活权重的假设；generations：逐代更新次数
 evolution|evidence：地层化石、同源结构、分子比对三类证据；不推算绝对年代
biodiversity|species/habitats：不同调查层次的记录；protection：原生境与有限个体保存范围
asexual|organism：营养、分裂、出芽三种方式；stage：形成及独立阶段分离状态
 egg-pores|water：温水/室温比较条件；observation：用户已观察到/未观察到气泡，不由温度生成假实测
 traits|pair：同一性状实例和跨性状反例；basis：判断依据是否核对同物种同项目
 genetic-material|level：细胞核到染色体、DNA和基因层级；pairs：简化体细胞对数和配子条数，DNA图仅代表一条
karyotype|combination：典型XX/XY；cell：二倍体或配子条数；gamete：配子性染色体，检查来源矛盾
origin-evidence|part：装置局部定位；claim：有机物、生命、唯一路线的证据边界
human-comparison|feature：运动/颅骨/交流学习；relationship：共同祖先分支与现代猿直接变人的错误解释
species-register|earlier/later：名录记录数量与差；sameScope：口径可比性；explanation：记录更新与过度恢复断言
invasive-species|status：原生/外来/已证危害；pathway：放生/运输/封闭管理；action：措施合法性和适用范围
sexual-comparison|animal：典型体内/体外受精情景；stage：精卵分开、结合与受精卵结构
transgene-evidence|group/temperature：给定材料与处理；controlled：其他因素改变是否导致混杂
breeding|method：四种方法不同流程；claim：变异筛选与因需要定向出现的误解
sex-ratio-data|male/female：统计分子分母；scope：常住人口与活产新生儿口径
 evidence-reasoning|case：灭绝或迁徙课堂资料；statement：事实、解释和过度推断的具体句子
cell-comparison|group：四种典型细胞结构；focus：膜、遗传区域、壁/叶绿体比较重点'''
OWN_CONTROLS={('bio-'+a.strip()):b.split('；') for a,b in (line.split('|') for line in OWN_CONTROL_TEXT.splitlines())}

def apply_quality(records):
    independent={a['id']:a for a in json.loads((ROOT/'research/biology-audit-independent.json').read_text())}
    assert len(OWN)==48 and len(independent)==47
    assert set(OWN)|set(independent)=={r['id'] for r in records}
    reviews=[]
    for r in records:
        id=r['id']; orig=r['title']; q=OWN.get(id) or independent[id]
        scene=SCENE_UPDATES.get(id,q['sceneBehavior']); limits=LIMIT_UPDATES.get(id,q['limitations'])
        mode='playback' if id in PLAYBACK else 'live'
        reason=PLAYBACK.get(id,'直接操作控件即可观察：'+scene)
        r['interaction']=dict(mode=mode,reason=reason)
        if mode=='playback':r['interaction']['actionLabel']={'bio-reaction':'松手观察落尺','bio-reflex':'观察信号传递','bio-selection':'观察逐代选择'}.get(id,'观察过程')
        r['implementationScope']=dict(supported=scene,limitations=limits)
        if id in TITLES:r['title']=TITLES[id]
        # Existing source mapping titles retain the actual textbook activity names.
        if id in TITLES:r['originalActivityTitle']=orig
        r['modelNote']+=' 本页实际支持：'+scene+' 限制：'+limits
        if id=='bio-microbe-distribution':r['controls'].append(dict(key='colonies',label='记录的菌落数量',min=0,max=50,value=12,step=1,unit='个'))
        if id=='bio-reaction':next(c for c in r['controls'] if c['key']=='trial')['label']='记录编号'
        if id=='bio-vegetation':
            r['controls']=[dict(key='openTemp',label='裸地气温记录',min=-10,max=45,value=29,step=.5,unit='℃'),dict(key='plantTemp',label='植被地气温记录',min=-10,max=45,value=27,step=.5,unit='℃')]+r['controls']
            next(c for c in r['controls'] if c['key']=='repeats')['label']='计划重复次数'
        if id=='bio-daphnia':r['controls'].insert(2,dict(key='controlBeats',label='0%对照心搏记录',min=0,max=100,value=32,step=1,unit='次'))
        if id in ['bio-human-reproduction','bio-body-model']:
            for c in r['controls']:
                if c['key']=='view':
                    for o in c['options']:
                        if o['value']=='detail':o['label']='生殖细胞产生部位' if id=='bio-human-reproduction' else '器官位置重点'
        if id=='bio-photosynthesis-oxygen':
            for c in r['controls']:
                if c['key']=='co2':
                    for o in c['options']:
                        if o['value']=='no':o['label']='缺乏（极端模型）'
        if id=='bio-lung-capacity':r['kind']='拓展探究'
        if id in TITLES and id not in ['bio-reaction','bio-lung-capacity']:r['kind']='拓展探究'
        if id=='bio-seed-respiration':r['modelNote']+=' 种子释放的气体经导管检验；木条画面只示意耗氧条件，真实点火由教师完成。'
        if id=='bio-stem-water':r['modelNote']+=' 横切导管环状分布采用典型双子叶植物茎示意，不能推广到所有植物茎。'
        if id=='bio-blood-smear':r['modelNote']+=' 成分切换只是教学突出，不是用真实玻片过滤掉其他血细胞。'
        if id=='bio-food-storage':r['modelNote']='保存方案的定性比较，不预测保存天数；呼吸、微生物和水分变化需分别考虑。 本页实际支持：'+scene+' 限制：'+limits
        if id=='bio-exhaled-co2':r['modelNote']='等量空气和呼出气体通入澄清石灰水的定性结果比较；不计算真实气体组成或反应速率。 '+limits
        fixes=[]
        if id in SCENE_UPDATES:fixes.append(SCENE_UPDATES[id])
        if id in FIXES:fixes.append(FIXES[id])
        if id in TITLES:fixes.append('题名和范围改为实际实现的观察、记录分析或方案辨析，教材活动原题保留在来源映射。')
        fixes.append('按任务性质设为'+('有实际阶段/位置变化的过程播放' if mode=='playback' else '直接观察或分析，取消统一开始等待'))
        controls=CONTROL_UPDATES.get(id,OWN_CONTROLS.get(id,q.get('controlsReviewed')))
        if not controls:controls=[c['key']+'（'+c['label']+'）：已核对其在此任务的选择、记录或观察作用；'+scene for c in r['controls']]
        reviews.append(dict(id=id,mode=mode,purpose=q.get('purpose',r['objective']),controlsReviewed=controls,sceneBehavior=scene,limitations=limits,fixes=fixes,status='reviewed-with-declared-scope',originalTitle=orig,currentTitle=r['title'],reviewMethod='逐项核对目录目标、simulate结果、render结构与控件；七下和八上另由独立智能体复核。非实物实验完成证明。'))
    out=ROOT/'docs/review/biology.json';out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
    return records
