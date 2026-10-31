# 滚摆往返模型与验证

本次补全 `phy-rolling-pendulum` 的下降、最低点反卷上升和多次往返。原先仅下降的实现保留在Git历史：公开仓库提交 `6e5a540e1c67184a9a56cfbf5187566a160edfb1`；本次没有重写该历史提交或替换其他实验。

## 已核对的原实现

原模型不是原生绳关节，而是解析求约束反力，再交给同一Godot刚体分别积分平移和转动：两股绳的合张力为 `T=mgI/(I+mr²)`，合力为 `mg−T`，力矩为 `Tr`。首次下降满足 `a=g/(1+I/(mr²))`、`v=rω`，包含平动和转动动能。原程序在到达给定下降高度后结束。

新代码将滚摆拆到 `godot/rolling_pendulum_solver.gd` 和 `rolling_pendulum_body.gd`，其余装置继续使用原求解器。首次下降关系和其他装置回归测试保留。

## 绕线、转向与冲量

规定向下为正，绕线侧记为 `σ=±1`。每个连续支路满足：

```
v = σrω
y − y支路起点 = σr(θ − θ支路起点)
ma = mg − T
Iα = σTr
```

最低点只切换绕线侧。用新切点瞬时非弹性收紧的理想事件近似，关于新切点的角动量守恒给出：

```
q = (I − mr²)/(I + mr²)
v后 = −q v前
ω后 = q ω前
K后/K前 = q²
```

因此常见的 `I>mr²` 情况下，质心向上，而轴继续保持原来的旋转方向。上升顶点不切换绕线侧，也不执行下端冲量；向下的合力和相应转矩使两种速度自然过零后反向。

实际代码使用允许浮点约束误差的一般冲量投影：

```
J = (v前 − σ新 rω前)/(1/m + r²/I)
v后 = v前 − J/m
ω后 = ω前 + σ新 rJ/I
```

冲量通过Godot的 `apply_central_impulse`、`apply_torque_impulse` 施加。之后的位置与角度继续由刚体积分；没有倒放下降样本或按预绘曲线生成上升。最低点和顶点位于相邻实际积分样本之间，通过插值定位事件，消除端点越界；这是离散事件近似，不是对真实绳接触过程的连续求解。

`rollingStates` 包含位置、速度、连续转角、角速度、绕线侧和能量。底点保留同时间的冲量前后状态；SVG使用右连续取样，避免把速度跳变或瞬时损失插成缓慢过渡。

## 能量与边界

以最低点为重力势能零点：`U=mg(H−y)`、`K平=mv²/2`、`K转=Iω²/2`。每个下端事件单独累计 `K前−K后`，其余行程忽略摩擦与空气阻力。检查 `U+K平+K转+累计损失≈mgH`；数值余额误差单列，不计为物理耗散。

- `I<mr²`：不适用本反卷捕获模型，明确提示并禁用播放；不取绝对值强行生成回升。
- `I=mr²`：完全捕获停底极限，最终两种速度为零，以端点支承保持；不生成回升次数。
- 零释放高度：有限的静止状态。
- 预测回升小于0.1 µm或往返时间不足32个积分步：截停观察并报告分辨率限制，保留剩余动能；不伪称耗散或完成所选次数。
- 正常观察在选定的第1～5次回升顶点结束。该截点不代表真实滚摆永久停住。

## 已执行的验证

20组原生Godot运行检查首次下降、逐支路不打滑、底点角动量和冲量、能量损失、顶点转向、1/3/5次往返、质量/轴半径/惯量/高度边界、非有限输入、分辨率截停、全局引擎设置恢复和步长收敛。

默认条件 `m=0.3 kg、r=0.006 m、I=0.0002 kg·m²、H=0.5 m`：三次回升高度约为 `0.40215、0.32339、0.26000 m`。理想首次回升对照值 `q²H≈0.40278 m`。步长从 `1/960 s` 减半到 `1/1920 s` 后，最大能量余额误差由 `0.00562 J` 降至 `0.00259 J`；该误差没有归入绳收紧损失。

实际Web导出通过7组页面检查：真实引擎往返状态、暂停/继续、上升段画面与实际样本一致、分析与记录、改往返次数重新求解、无效参数禁播与恢复、重置和导航取消旧请求。另检查移动布局和零页面/请求异常。12个真实Godot状态的SVG检查覆盖6个事件后态、位移、转角、旋向、绕线侧、能量条和文字边界。整站356项默认调用及原有收藏、记录、导出流程回归通过。

结果：[科学关系](rolling-pendulum-science.json)、[实际网页](rolling-pendulum-browser.json)。

可复跑：

```sh
ROLLING_FIXTURE_PATH=/tmp/rolling-cases.json godot --headless --path godot --script ../tests/godot_rolling_pendulum.gd
ROLLING_FIXTURE_PATH=/tmp/rolling-cases.json python tests/rolling-pendulum-scenes.py
node tests/rolling-pendulum-renderer.cjs
godot --headless --path godot --script ../tests/godot_apparatus.gd
godot --headless --path godot --script ../tests/godot_apparatus_boundaries.gd
```

按 `godot/README.md` 导出新Web引擎，再启动静态服务器：

```sh
python -m http.server 8767 --directory dist
```

另一个终端执行：

```sh
LAB_URL=http://127.0.0.1:8767/ python tests/rolling-pendulum-browser.py
LAB_URL=http://127.0.0.1:8767/ python tests/platform_browser.py
```

## 当前环境未验证的部分

没有进行实物实验、绳弹性/松绳、有限冲击时长、接触应力、轴倾斜、摩擦与空气阻力的测量或参数标定。模型中由理想捕获得到的损失比例不能当作任意实物滚摆的实验数值。自动检查验证的是声明的模型关系和网页行为，不等同于完整实物实验验收。
