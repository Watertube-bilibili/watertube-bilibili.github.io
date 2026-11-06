# SUNRISE COAST：原城市 Rapier 发布

此版本把现有 `/sunset-coast/` 接到完整原城市的 Rapier 运行链。运行资源位于 `sunset-coast/rapier/play/`；不是 ESTUARY/CRESCENT 新地图替换，也没有启动独立 ULTRA 服务。

源码来源：已保留的原城候选 `1bddde626a0142cb3ee6f1ae71d4bd5782635e60`。发布准备从远端 `8dbbf2affb2d802377f49eebb0db3fb8f44d45a2` 开始，再纳入果冻项目新提交 `de7b49b9ab36356a48f1ddcdfdcf7e768a30084a`；本次只改变日出海岸入口、增加原城 Rapier 资源与本项目测试/说明。

## 内容与改动

- 原完整城市的道路、21 个地标、19 个出口、机场、山路、海滨与人口代码保留。数量是内容契约，不代表逐地点动态验收。
- 原 28 个车型 ID 保留，接入既有 `mica_scooter`、`ember_street`、`ridge_dual`；原模型不重做。
- 原 Godot 版本的六份 Quaternius CC0 人物 GLB、62 骨骼和七动画接回 Three.js，人物资源原样保留；Godot 原本承担物理，不是人物渲染器。
- 物理使用官方 `@dimforge/rapier3d` 0.21.0 JS/WASM。本地 `play/vendor/rapier/` 带原许可证；[依赖版本锁](../qa/rapier-full-release/rapier-vendor-lock.json)记录官方来源、包完整性、48 个运行文件的 SHA256 与必要 ESM 改动；没有隐式回退到 Godot 或自建平面物理。
- 本轮补齐原 Rocket 的智能越障、越障加转圈、自动跳坡/落地接管，以真实 Rapier 刚体受力执行；沿用气量、动作取消和实例身份。
- 原职业、Semi 货运、警察、RoboTaxi、路测职业、Pilot、手动 NC11 教练机和机场服务代码保留。外卖仍在已保留的新地图独立入口，未移植到原城市；没有挂一个不可玩的原城外卖按钮。

## 存档与旧版

`sunrise-coast:original-city-rapier:v1` 命名空间保持不变，此前 Rapier 候选进度可继续。选择旧存档后，将其原始 JSON 字节复制为新的 Rapier 槽及初始备份。原标准/Beta 槽、索引、活动指针与备份不写；保存后的扩展字段和车辆实例状态继续由原有事务修复保护。新旧进度各自继续，不能把包含摩托的新档自动降级写回旧版。

`sunset-coast/play/` 的旧 Godot 运行文件完全不改。旧首页精确保存在 [legacy.html](../sunset-coast/legacy.html)，SHA256 为 `69de82685513d4228b2ae71eab12673b27fd889307587b98ed011ad35fba53ad`。回滚只需用该文件恢复 `sunset-coast/index.html`；不回退整仓库，不清除新旧存档。旧 `?slot=…` 运行直链继续可用。v13/v14 和两个既有测试入口也保留。

## 验证口径

最终结果见 [本次结果](../qa/rapier-full-release/RESULTS.md)，可直接复跑的有限测试见 [运行说明](../qa/rapier-full-release/README.md)。旧原城候选历史回归、首次失败和浏览器原始记录保留在工程工作区，未把大量旧截图重复装入发布。

真实普通启动/键鼠流程与固定步功能验证分别记载。固定步验证仍使用实际 Game、Rapier 碰撞与原城市，但不等于普通帧率或完整 UI 路线验收。没有 iPhone/Safari 实机性能结果，也不承诺手机 FPS。长路线、全部职业全程、RoboTaxi 全程及所有道路组合并未穷举。

完整可达 JS+WASM 图的逐文件 gzip-9 比较通过 `qa/rapier-full-release/code-budget.mjs` 复现。它包括字面量懒加载分支，不把延后代码当消除；排除 GLB、纹理、字体、CSS 和 HTML，Godot PCK 另列，因此不是整游戏或实际网络下载量比较。
