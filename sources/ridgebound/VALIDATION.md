# 验证记录

## 2026-11-05：启动、座舱与悬挂修正

- Godot针对回归共131项，0失败：分块45项、启动25项、场景集成30项、物理31项。覆盖16米地块、启动仅车身支撑的1–4块地面、先地面后树石、障碍物显示与碰撞同步、车旁物体延后出现、分块卸载，以及未加载边界处回滚全部车辆状态。
- Chromium真实Godot启动：正常只下载9,382,282字节的gzip引擎，不请求37,700,666字节的raw WASM；相同浏览器再次进入从CacheStorage读取，引擎网络下载为0字节。启动完成后可驾驶，无页面或Godot错误。本地非限速环境冷/热启动约1.75/1.26秒，仅用于验证流程，不能代表真实网络或手机加载时间。
- 三种独立浏览器容错验证均成功进入游戏：禁用DecompressionStream时使用raw WASM；CacheStorage.open抛错时仍正常加载gzip；压缩资源被篡改后校验拒绝，并回退raw WASM。
- 悬挂31项Godot测试通过，覆盖碰撞损伤、冷却、维修、破损慢行及完整山林/雪线路线。受控正常道路测试的车身垂向残差RMS由6.23厘米降至1.38厘米；25厘米扰动无过冲，约0.75秒稳定。相机另外限制并平滑俯仰、侧倾。
- Blender座舱改为左舵，方向盘、仪表、踏板及司机座椅位于车辆左侧；模型保持30个网格、28,730个三角形，无负缩放镜像文字。
- 手机绞盘界面在390×844和844×390布局下验证折叠/展开、pointercancel、持续油门时收起绞盘、重复F键抑制和重新进入座舱默认折叠；桌面保留完整面板。
- 最终Web导出通过真实Chromium集成验证：首次状态只有4块地面、0块树石，世界仅构建1次；随后树石与可选绞盘锚点出现。两种手机尺寸的实际Godot车内画面已截图检查。0金币、未购买雪胎也可从已解锁车库进入珠峰并驾驶，全程无页面/Godot错误。

## 2026-11-04：首版验证

本版本采用Godot 4.6.3单线程Web导出，Blender4.3.2制作车辆与座舱。实际引擎文件位于网站 `ridgebound/engine/`，网页不依赖Three.js或外部CDN。

## 已通过

- Godot无窗口回归：物理20项、分块26项、场景集成28项，共74项，0失败。涵盖两条完整路线、雪胎抓地、独立轮高与弹簧阻尼、车损及维修、模拟量刹车、左右转向、模型动画节点、存档出生地面、地块保留/预载/自适应与JSON状态传输。
- Chromium实际Godot Web：前进与右转，绞盘连接/收绳/释放，车内相机，原生PNG照片导出，雪地图加载、180金币购胎、重载后地图/金币/装备保留。检查点奖励通过生产回调的受控快照验证；实际完整路线在Godot物理测试中验证。
- 浏览器开发控制台：最终功能验收无JS/Godot运行错误。
- 桌面1280×800、手机390×844及844×390视觉检查：地面不透空，手机无黑边，HUD及主要触控按钮可用。手机输入通过模拟多点触屏验证；没有使用真实手机测试续航/温度/帧率。
- 控制器合成设备测试：标准手柄、跨设备油门与刹车、反向轴、死区和行程、设备重连索引变化、断连归零、损坏配置防护、暂停恢复。
- 本地桥接口模拟：普通震动关闭时仍可发送独立扭矩遥测；暂停和失去焦点后关闭反馈。
- Windows桥：x64交叉编译通过，仅依赖Windows系统DLL；解析、路径/Origin校验、轴归一化、力强度边界与关闭逻辑测试通过。
- 项目页：游戏入口与公开源码入口存在，沿用原网页卡片结构。

## 尚未验证的环境

没有在Windows运行桥接EXE，也没有连接真实方向盘/踏板验证驱动效果。通用DirectInput是适配目标，不是对所有品牌型号的兼容保证。首次使用保持低反馈强度，必要时F8停止效果。浏览器Gamepad API对具体USB设备的支持同样取决于驱动。

测试环境的浏览器使用SwiftShader软件渲染，性能数字不能代表用户显卡或手机。引擎会按实际帧耗降低3D渲染比例与地块邻域，HTML界面保持清晰。

## 重跑

```sh
godot --headless --editor --path sources/ridgebound/godot --import --quit
godot --headless --path sources/ridgebound/godot --script tests/test_physics.gd
godot --headless --path sources/ridgebound/godot --script tests/test_streaming.gd
godot --headless --path sources/ridgebound/godot --script tests/test_runtime.gd
g++ -std=c++17 -O2 sources/ridgebound/windows-bridge/tests/core_test.cpp -o /tmp/ridgebound-bridge-test
/tmp/ridgebound-bridge-test
```

Web导出或前端改动后，应重新生成WindowsZIP，确保网页和本地桥内的游戏版本一致。
