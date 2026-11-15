# 吹纸条：气流条件与连续形变

2026-11-15；基线主分支 `f69d74317a3d9737ae9469823f56b25fdc969b67`。
最近一次实验室提交 `1bd1899` 已完成滚摆反卷，本次不重复修改滚摆。
当前基线的吹纸条仍是两条固定 SVG 曲线，未发现已合并的同项修复。

## 实现与适用范围

`godot/blow_strip_solver.gd` 计算曲线，`dist/modules/physics/blow-strip.js` 只将引擎坐标映射到 SVG。目录采用专用 `pressure/blowStrip` 场景；原来的 `pressure/flow + variant=blow-strip` 调用保留兼容。其他流速与压强实验继续使用原来的求解器。

气流动压尺度为 `q=ρv²/2`。动压不能自动当作真实纸面压差，本模型另给未校准的教学系数 `Cp=0.05`，令等效竖直上举载荷为 `Cp·q·b`（N/m）。自重线载荷为 `ρ纸·b·h·g`。相减得到均布净载荷。

题设纸长0.16 m，宽0.025 m，厚0.12 mm，纸材密度800 kg/m³，等效杨氏模量3 GPa，`EI=Ebh³/12`。这些常数用于比较趋势，不是对某种真实纸张的标定结果。

纸条按不可伸长、均匀、平面弹性条处理，一端水平夹持、另一端自由，允许有限转角。48段的角度由弯曲能减外力功的极小值计算，保持每段长度不变，不以小挠度公式无限放大形变。若段长为ds、段中心角为θ_i，则无量纲能量为：

`U/(EI/ds) = θ_0² + 1/2 Σ(θ_i−θ_(i−1))² − |w|ds³/EI Σ(N−i−1/2)sinθ_i`。

夹持端到首段中心的距离为ds/2。采用负载方向一侧的 `0≤|θ|<π/2` 平衡分支，三对角牛顿法配合能量下降搜索。返回收敛状态和力矩残差；未收敛会报错，不会退回预设曲线。坐标单位为米，y向上。

零流速或零气体密度时上举载荷严格为零，实线与同一模型的自重下垂虚线重合，取消气流箭头。增加速度或密度后逐步改变当前平衡坐标；界面采用即时条件比较，不把调整后的两个平衡态之间的过程当作真实瞬态动画。

速度范围0～10 m/s，气体密度0～2 kg/m³；0密度仅是无介质零载荷对照。原来的1000 kg/m³液体上限不适用于吹气纸条。网页控件和Godot均限制边界；非法/非有限引擎输入回到默认值。密度与流速只决定本模型的等效载荷。

没有求解真实喷流、贴附、压力场随姿态变化、流固耦合、湍流、纸张颤振或两张纸靠近，也没有做真实器材实验、材料标定或位移测量。尤其大形变时真实气流载荷未必继续满足本等效均布载荷假设。

## 可复现检查

在 `sources/junior-physics-lab` 目录运行：

```sh
godot --headless --path godot --script ../tests/godot_blow_strip.gd
node tests/catalog-audit.js
godot --headless --path godot --script ../tests/godot_domain.gd
godot --headless --path godot --script ../tests/godot_extra.gd
godot --headless --path godot --script ../tests/godot_fluid_density_review.gd
godot --headless --path godot --script ../tests/godot_boundaries.gd
godot --headless --path godot --script ../tests/godot_rolling_pendulum.gd
```

Godot 4.6.3本机检查通过：吹纸条404组速度/密度全域条件，以及密度扫描、相同ρv²、小载荷Euler–Bernoulli独立极限、载荷反向、载荷平衡、24/48/96段网格加密和非法参数；合计42804项断言。48与96段端点位移差小于0.1 mm。原有目录356项、923组结构条件、3117个SVG状态，原有22项科学关系、882项流体/密度关系、606项静态边界检查和20组滚摆测试均通过。详见 [科学测试](blow-strip-science.json) 与 [原有测试结果](blow-strip-regressions.json)。这些数字是软件断言与条件数，不是真实实验验收数。

同一空气密度1.2 kg/m³下的模型示例：

| 流速m/s | 相对无气流端点抬升mm |
| ---: | ---: |
| 0 | 0 |
| 2 | 6.08 |
| 4 | 34.86 |
| 6 | 133.20 |
| 8 | 216.39 |
| 10 | 239.66 |

浏览器脚本使用实际导出的Godot WebAssembly、页面控件与SVG，没有替换成JavaScript物理公式：

```sh
python -m http.server 8767 --directory dist
# 另一终端，需要 Python Playwright 及可运行的 Chromium
python tests/blow-strip-browser.py
LAB_URL=http://127.0.0.1:8767/ python tests/platform_browser.py
```

本机Chromium受AF_UNIX套接字限制，无法启动；备用云浏览器连接本地服务被拒绝，故本机浏览器结果不标通过。新增 `.github/workflows/blow-strip-regression.yml` 在修复分支/PR运行相同科学检查、专项浏览器交互和整站356项真实引擎默认调用，并保存JSON、日志和截图。浏览器最终状态以该次CI报告为准。Firefox、真实iPhone和真实器材尚未验证。

## 导出与目录生成

目录修改保存在 `research/blow-strip-catalog.json`，由 `physics-quality.py` 合入；历史固定曲线的浏览器结果不会被重用为新模型的通过证据。

```sh
python research/compile-physics.py
python research/sync-engine-catalog-schema.py
godot --headless --path godot --editor --import --quit
godot --headless --path godot --export-pack Web ../dist/engine/lab.pck
python research/stamp-assets.py
```

本次以相同版本Godot 4.6.3重新导出项目PCK，沿用仓库原有官方4.6.3运行时JS/WASM（引擎本体未修改）。无须重新下载模板或替换引擎。分发目录 `/junior-physics-lab/` 同步对应的目录、模块、schema、PCK和资源版本。原有181项其他物理目录记录与基线逐项相等。
