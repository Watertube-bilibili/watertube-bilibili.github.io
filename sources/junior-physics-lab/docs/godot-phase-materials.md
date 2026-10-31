# 相变材料求解器：依据、题设参数与边界

原创建模代码：`godot/phase_materials.gd`；AGPL-3.0-only。核对日期：2026-10-31。

这个模块通过 Godot 计算固液转变的分段比焓关系，或返回具体物质的定性条件判断。调用接口为 `solve(p: Dictionary) -> Dictionary`，不适用的情境返回空字典，让父求解器保留原有分支。结果中的 `solver` 为 `Godot scientific solver`。定性结果同时在顶层及 `values.qualitative` 标明 `true`，不生成虚构温度曲线。

## 固液转变的数值模型

| material | 相变规则 | 比热容 J/(kg·℃) | 相变能量 J/kg | 数据性质 |
| --- | --- | --- | --- | --- |
| water | 常压纯水/冰在 0 ℃ 转变 | 冰 2100，液水 4200 | 334000 | 常用课堂近似，非随温度变化的精密物性 |
| hypo | 海波理想晶体模型在 48 ℃ 转变 | 固、液均 2000 | 200000 | **比热与相变热均为本题指定系数**；48 ℃为课堂取整的相变温度 |
| wax | 指定样品在 50～60 ℃ 逐渐软化、熔化 | 固、液均 2000 | 区间额外吸热 180000 | **温区、比热与区间热量全部为题设**；不是所有石蜡的材料常数 |

海波是五水硫代硫酸钠。公开资料常列约 48～49 ℃；这里使用理想的 48 ℃ 平台以解释晶体相变，不能凭本模型认定某实际样品必定具有完全平坦的曲线。海波的过冷、结晶水变化等不在模型中。

石蜡是成分随样品变化的材料。此页指定一个有软化/熔化温区的混合样品，不宣称所有蜡材料在微观结构上都相同，更不把 50 ℃ 或 60 ℃ 称作石蜡通用固定熔点。

能量按照 `Q = Pt` 输入或移出。质量用 kg、功率用 W、时间用 s，热量单位为 J。固、液段采用 `Q = mcΔT`。晶体相变段采用 `Q = mL`。石蜡的区间额外热量均匀分配在 50～60 ℃，形成有效热容量较大的斜段，温度继续变化。

在固定熔点恰好作为初温时，必须明确初态：melting 从该温度的固态开始，freezing 从该温度的液态开始。输出 `fraction` 对晶体表示理想液相份额，对石蜡只表示该题设区间的模型进程。

数值分支仅讨论固液转变：水采用 -50～100 ℃、海波和石蜡采用 0～80 ℃ 的教学范围。超过能量范围时 `domainLimited=true`，曲线在最后适用时刻截停，`time` 是该有效时长，`requestedTime` 保留输入。剩余能量不被解释为未经建立的高温分解、燃烧或沸腾状态。初温越界则不生成温度曲线。

## 定性情境

| scenario | 参数 | 输出与限制 |
| --- | --- | --- |
| mixture | concentration（乙醇质量分数 %）、action、progress | 0% 给出常压纯水 0 ℃ 极限；含乙醇时只比较组成与冻结行为，不套纯水平台，不提供未输入的温度、相图或结冰率 |
| alcohol_cycle | action warming/cooling、progress | 解释酒精汽化/液化与袋鼓缩的联系；指出原有空气热胀冷缩也有影响，不由体积现象反算酒精质量 |
| condensation | ambient、surface、dewPoint，均 ℃ | 在通常未过饱和空气且瓶壁不低于 0 ℃ 的范围内，以瓶壁低于露点判断凝露条件；露点高于环境温度标为超出假设，低于 0 ℃ 的表面转交其他相变解释 |
| sublimation / deposition | material iodine/naphthalene、action heating/cooling、progress | 具体物质固气转变的观察与吸放热方向；不计算未经给定的蒸气压、时间或产率 |

`progress` 是示意阶段，不是实验时间或真实产物比例。酒精混合物的百分比只改变所讨论的组成，不能在缺少相图时直接预测一个精确凝固点。

冷瓶模型在瓶壁温度恰等于露点时不预测持续净凝结增长；这与露点作为气液平衡条件并不矛盾。它判断的是是否具备新增凝露条件，不能推断原有水滴已立即消失。水滴来源是周围空气；未使用 100 ℃蒸汽冷却曲线。

本模块不拦截水的 `deposition`，保留父求解器的冰霜场景；也不拦截原有 boiling、evaporation。

## 可核查的依据

- [FAO：Some useful facts about water and ice](https://www.fao.org/4/t0713e/T0713E0c.htm)。已读取水/冰性质表，列纯水凝固点 0 ℃、水比热约 1 kcal/(kg·℃)、冰约 0.5 kcal/(kg·℃)、熔化热约 80 kcal/kg。这里采用便于课堂计算的 SI 近似 4200、2100、334000；这些近似不应解释为全温区不变的精密数据。
- [PubChem：Sodium Thiosulfate Pentahydrate](https://pubchem.ncbi.nlm.nih.gov/compound/Sodium%20thiosulfate%2C%20pentahydrate)。搜索返回的 Melting Point 属性列出 48 ℃；直接页面访问触发验证码。只用于核对约 48 ℃的取值，不据此编造海波比热或相变热。
- [Sodium thiosulfate pentahydrate 产品规格](https://assets.thermofisher.com/chem-specs-pdf/retrievePdf?countryCode=kr&erp_type=KR_E1_LCD&rootSku=S475&sku=S475-12)。公开检索属性为 48.5 ℃，提示不同资料的取值与取整存在差别；教学模型的 48 ℃ 不标作精密测定值。
- [美国国家气象局：Dew Point/Ambient Temperature Sensor](https://www.weather.gov/asos/AmbientDewPointTemperature.html)。已读取正文关于冷镜降温至凝露、露点平衡及加热蒸发的说明，支持冷表面与露点比较。
- [英国气象局：Dew](https://weather.metoffice.gov.uk/learn-about/weather/types-of-weather/temperature/dew)。已核对表面冷却到露点时空气水蒸气形成水滴的原理；不用于推导凝结水质量。
- 乙醇袋、混合液凝固、碘固气转变的教材活动定位，沿用 `dist/catalog/sources-physics.js` 与对应物理覆盖表的现行教材证据；本模块没有添加未验证的乙醇相图数值或萘的物性常数。

上述来源支持基本事实；**题设系数和区间不冒充来源中的实验数据**。来源网站的原图和连续说明未复制到应用。

## 验证

```sh
godot --headless --path godot --script ../tests/godot_phase_materials.gd
```

测试使用实际 Godot 4.6.3，遍历 162 组材料、方向、质量、功率、时间组合，并验证冰/水的熔化与凝固能量、海波平台、石蜡非平台区间、超范围截停、无虚构酒精温度曲线、露点边界及父分支保留。
