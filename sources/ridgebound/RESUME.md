# 山野之间：暂停检查点（2026-11-04）

用户因额度要求立即暂停。继续前先读本文件，避免重复研究和重写。所有当前工作只保存本地，未 push、未发布。用户明确禁止 Sites，只放入 Watertube-bilibili/watertube-bilibili.github.io。当前分支 work，原始 main 为 c429589f7680b1684fe61fdd2049c43752ce0d16。

## 用户最终要求

原创名字「山野之间 / RIDGEBOUND」，参考 Over the Hill 的低多边形复古越野氛围；手机多点触控、绞盘、四驱低速挡；隐藏珠峰雪线地图特别滑，探索金币购买雪胎；Blender 精致车辆和真正车内视角、可动方向盘/仪表；Godot 游戏核心，四轮独立悬挂；按性能动态分块、前方预载、不得驶入透明未加载地面；小屋检查点免费维修、车身/轮胎/悬挂损伤；手柄、Windows 通用 DirectInput 力反馈方向盘及独立外接踏板，自主绑定油门/刹车；安装 Impeccable 设计 skill。

## 已落盘

- `ridgebound/`：完整可运行 Three.js 原型（当前 game.mjs/scene.mjs 仍为旧核心），森林/雪地、绞盘、金币180购买雪胎、4检查点解锁、存档、触屏等。
- `projects.html`：首张游戏入口卡已加。
- `sources/ridgebound/build_vehicle.py`、`cabin.py`、`ridge-rover.blend`：Blender4.3.2原创复古SUV与座舱；导出 `ridgebound/assets/ridge-rover.glb`。28730三角面，30网格，11材质，约2MB。已修正杆件方向和sRGB材质；Blender视觉验证通过。
- GLB节点：Body，Wheel_FL/FR/RL/RR（x±1.06,z±1.3,轮胎半径.64），SteeringWheel/SpeedNeedle/RPMNeedle绕本地Z轴。驾驶相机推荐(-.47,1.58,-.45)，FOV78，向下8度。
- `sources/ridgebound/godot/`：project.godot/main.tscn/export_presets.cfg/main.gd/physics.gd/terrain_math.gd/chunk_manager.gd 与模型副本。
- Godot物理：独立四角弹簧阻尼/车身升沉俯仰侧倾；车损 damage={body,tires,suspension}100为完好，影响动力/抓地/悬挂，repair恢复，18项独立测试通过。保存在godot/tests/test_physics.gd。
- ChunkTerrain：32米块，setup(region,initial_position=Vector3.ZERO)，启动实际出生点3×3，动态1–3圈，每帧最多一块，前方两块预载，旧块滞后卸载，LOD裙边，MultiMesh树石。独立Godot测试通过。必须_process真实dt调用update_stream，采纳位置前is_ready_at检查。
- `ridgebound/controllers.mjs`+UI：手柄/多设备轴按钮绑定、监听、反转、死区、校准、存档、震动、车损/维修UI。新模块尚未接入game.mjs，尚未完整浏览器验证。
- `.agents/skills/impeccable/`已安装官方4.8.0，来源commit 695cea5c6d1cbd420fc331375c7ef126a774e5f7；完整refs/scripts/license。已读技能、context已执行，detector已跑；既有小字/对比度仍待改善。不要重复context。

## 恢复后的优先工作（不是已完成）

1. 完成Godot整合：main.gd刚写，只做过导入；先parse/runtime检查。它使用simulation、ChunkTerrain和GLB。把chunks.setup(region)改为传入实际state出生点；存档恢复不能先建原点地块。增加低成本常驻远景地形作视觉保底，保留未就绪区域停车保护，避免背景透空。
2. 当前game.mjs仍加载Three.js；要改为Godot Web engine加载+JS桥，同时保留所有UI/金币/存档/绞盘标记/小地图。main.gd已定义window.ridgeboundInput、ridgeboundCommands队列、onRidgeState(state)、onRidgeReady。commands:start/reset/recover/gear/awd/tires/attach{id}/detach/camera/orbit/repair。snapshot带anchors投影sx/sy、streaming统计、damage、blocked、repairAvailable。
3. Godot4.6.3已安装。web_release/debug与web_nothreads_release/debug模板已通过HTTP Range安装并校验，路径 `/home/agent/.local/share/godot/export_templates/4.6.3.stable/`。GitHub Pages使用thread_support=false。export_presets.cfg输出应为仓库ridgebound/engine/ridgebound.html（检查相对层数）。执行导入要加--quit，避免编辑器留后台。
4. 集成createControllers({toast,onAction})：sample()含throttle/reverse/steer/brake/brakeValue/reel/clutch，updateFeedback(state)，openSettings()，status()。UI actions.controllerSettings应暂停后打开设置，repair对应T，手机视角入口已有。
5. 控制模块已知待修：updateFeedback共用lastFeedback，关闭普通震动时每帧更新时间可能抑制桥接扭矩发送，应拆分bridgeFeedback计时；手柄Start暂停后不能恢复（模态框屏蔽全部动作）；完整接入analog brakeValue并检查物理版本是否已采用。透传真实steer给反馈。
6. Windows力反馈桥尚未写源码或EXE，只有空目录。不要声称已实现。计划DirectInput8+localhost HTTP服务，兼容标准力反馈设备；真实硬件未验证。无MinGW，sudo不可用；可本地apt下载提取编译器。旧apt会话已无运行进程。
7. Windows桥协议已与控制器约定：127.0.0.1:8766，同源静态Web服务；GET /api/input、/api/devices返回{bridge:'ridgebound-directinput',version:1,devices:[{id,name,index,connected,forceFeedback,axes:[8个-1..1],buttons:[128个0/1],axisNames}],ffb:{available,armed,strength,status}}。POST /api/feedback {enabled,deviceId?,strength,steer,speed,slip,impact,suspension}。默认关闭、strength默认.35最多.6，500ms断流停力，退出恢复自动回中。UI已有本地轮询/发送草稿，未联测。
8. 最后统一测试桌面/390×844/844×390、座舱/悬挂/车损维修/分块边缘/手柄绑定/金币解锁。测试通过后再清理旧Three核心，写说明、打包Windows本地桥（如完成），commit并普通fast-forward push main（先查远端变化，禁止force）。目前没有线上可用新版，勿提供已发布假链接。

## 已有验证与工具

旧Three原型8项物理测试、完整森林雪地路线、绞盘距离缩短、金币240→60、刷新保留、解锁雪图，浏览器无JS错误；真实CDP多触摸方向+油门同时有效。新增Godot整合与新控制模块尚未做这些集成验证。

Godot物理测试命令：`godot --headless --path sources/ridgebound/godot --script tests/test_physics.gd`（可能先--editor --import --quit建立类缓存）。
浏览器QA：require('/opt/codex/cua_node/lib/node_modules/playwright')，chromium executablePath /usr/bin/chromium，flags --no-sandbox --enable-webgl --use-gl=angle --use-angle=swiftshader。不要装新浏览器。
旧预览8765服务器已停止。截图/额外QA脚本暂在/workspace/scratch/ridgebound-*；chunk独立测试在/workspace/scratch/chunk-qa。外观Blender图/workspace/scratch/ridge-rover-blender-render.png，座舱图/workspace/scratch/ridgebound-cabin.png。

官方参考：https://www.funselektor.com/overthehill 与 https://store.steampowered.com/app/2929250/over_the_hill/ 。素材全原创，无原游戏资产。首次错误初始化过一个无内容的Sites条目，但从未上传部署；用户禁止Sites，后续不可使用。
