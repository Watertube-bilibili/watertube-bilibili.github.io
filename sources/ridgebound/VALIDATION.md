# 验证记录 · 2026-11-04

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
