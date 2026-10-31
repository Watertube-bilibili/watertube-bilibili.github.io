# 初中理化生实验室

水管同学的浏览器实验课件。延续早期 Flash 教学课件的视觉语言，使用现代浏览器直接运行，不需要安装 Flash。

按学科、年级学期和章节浏览物理、化学、生物实验；每个实验提供可调条件、原创 SVG 装置、观察数据、规范分析过程、操作步骤、常见考点、易错点、例题与资料来源。支持实验收藏、本地记录、CSV 导出和全屏演示。

- 在线课件：<https://watertube-bilibili.github.io/junior-physics-lab/>
- 项目入口：<https://watertube-bilibili.github.io/projects.html>
- 开源仓库：<https://github.com/Watertube-bilibili/watertube-bilibili.github.io/tree/main/sources/junior-physics-lab>

当前源码随现有 GitHub Pages 仓库公开。独立仓库 `junior-physics-lab` 尚待账号所有者创建；当前集成无新建仓库权限。两种发布方式使用同一套原创源码与 AGPL 许可。

## 教材与覆盖范围

本次整理包含 **356 项实验与探究**：物理182项、化学79项、生物95项。公开的2023年实验教学基本目录中，初中物理68项、化学35项、生物56项均有对应教学任务；学生实验、演示、观察、资料分析与拓展实践有明确类别。编号有映射并不等于屏幕可以替代实物操作，具体支持内容和证据边界见覆盖表。

依据人教版现行初中教材资料和教育部门公开实验目录核对。物理对应八年级上下册和九年级全一册；九年级上下学期是本站的学习分组。化学对应九年级上下册，生物对应七、八年级各册。正式学生实验、教师演示、小实验与拓展探究分开标注，不把旧版活动自动视为新版必做实验。

每个实验通过 `sourceIds` 关联公开资料。实际版本、栏目和核对范围见 `dist/catalog/sources-*.js` 与 `docs/coverage/`。本项目不提供出版社教材整本扫描件或第三方课件的复制品，不与人民教育出版社存在官方关联。

考试提示用于帮助理解实验方法与常见错误，不声称适用于全国统一的评分细则。各地范围和细则以当地教育部门公布内容为准。

## 科学模型

- **物理**：Godot 4.6.3 WebAssembly 运行时。小车等运动使用真实的 `RigidBody2D` 求解器；光线、电路、热学和静力学使用在 Godot 内实现的相应科学求解模型。页面不以 JavaScript 公式轨迹假冒刚体物理。
- **化学**：根据质量守恒、化学计量、反应条件、物质性质及明确的近似假设构建教学模型。模型值与真实实验测量分开说明。
- **生物**：结构观察、控制变量、统计与概念模型；示意性的生长、酶作用等过程不标作真实生物样本数据。
- **跨科物理计算**：化学中和温升、燃料效率，以及生物食物量热、眼的成像、尺下落反应时间，均实际调用 Godot 求解相应物理关系。化学计量和生物统计仍由各自学科模块负责。

模拟不能替代真实的测量、观察、调查、制作或受指导的实验操作。每个实验的模型范围和注意事项写在其页面内。

## 本地运行

无需前端构建工具。用静态服务器打开 `dist/`，不要直接双击 HTML：

```sh
python -m http.server 8000 --directory dist
```

访问 `http://localhost:8000`。现代浏览器需支持 WebAssembly、WebGL 2 和 `DecompressionStream`。Godot 使用单线程导出，无需 SharedArrayBuffer 或特殊跨域隔离头。

## 目录

```text
dist/                 可直接部署的静态网站
  catalog/            实验教学内容与资料索引
  modules/            各学科的模型适配和原创 SVG 场景
  engine/             Godot Web 导出及第三方许可
  assets/             原创图标
godot/                Godot 场景、物理/科学求解器、模型参数规范
tests/                内容一致性、科学模型和浏览器测试
docs/coverage/        已整理活动与教材、目录的对应关系
```

Godot 构建方式见 [godot/README.md](godot/README.md)。压缩的 WebAssembly 与运行时代码随部署目录提供；更新 Godot 源码后必须重新导出。

## 检查与发布

```sh
node tests/catalog-audit.js
node tests/chemistry-models.cjs
godot --headless --path godot --script ../tests/godot_domain.gd
godot --headless --path godot --script ../tests/godot_dynamics.gd
godot --headless --path godot --script ../tests/godot_extra.gd
godot --headless --path godot --script ../tests/godot_phase_materials.gd
```

在另一个终端启动上文的静态服务器后，可用 `python tests/platform_browser.py` 检查真实浏览器、Godot WebAssembly、各科全部目录默认值、SVG、收藏、记录、进度条与移动布局。需要 Python Playwright 和 Chromium；用 `CHROMIUM_PATH` 指定浏览器路径，`LAB_URL` 指定服务器地址，`LAB_TEST_OUTPUT` 指定测试截图与报告目录。结构与端点检查不能替代教材内容和模型适用范围的人工审读。

`dist/` 可直接放到 GitHub Pages 或任意静态主机的子目录，资源均使用相对路径。当前个人主页将它发布在 `/junior-physics-lab/`，项目卡位于 `projects.html`。发布时应同时保留可取得对应源码的入口、AGPL 文本，以及 Godot 的原有许可与第三方声明。

## 贡献与纠错

请在问题反馈中注明实验名称、教材版本或可靠资料链接、操作条件、实际观察到的界面结果，以及预期行为。修正科学内容时同时检查单位、定义、适用条件、边界情况和页面中的例题。

新增实验应提供完整教学内容与实际交互，不以只有标题的占位项目充数。教材章节名称、页码与版本变化需要有资料依据。原始来源仅用于核对，不要提交整本教材、付费课件或未经授权的图像。

## 许可证

本项目原创程序、教学文字和 SVG 采用 **GNU Affero General Public License v3.0 only（AGPL-3.0-only）**，详见 [LICENSE](LICENSE)。

分发本程序或其修改版时，应按许可证要求提供对应源码并保留许可声明。通过网络向用户提供修改版服务时，AGPL 第 13 条还要求向远程用户提供该修改版的对应源码。私人使用不产生向公众发布源码的一般义务；也不意味着与本项目无关的所有代码都必须公开。

Godot 和其依赖保持各自原有许可证，见 `dist/engine/LICENSE.txt`、`dist/engine/COPYRIGHT.txt`。教材及其他引用资料的著作权仍归原权利人；资料链接不改变其授权。
