# 山野之间 · RIDGEBOUND

水管同学的原创浏览器越野游戏。采用 Godot 4.6 和 Blender，原始代码、模型、生成脚本及网页入口一并开源。这个目录是个人主页仓库中的独立项目，不包含其它项目的源码许可。

[进入游戏](https://watertube-bilibili.github.io/ridgebound/) · [返回项目页](https://watertube-bilibili.github.io/projects.html)

## 玩法

驾驶复古四驱车沿松风谷土路寻找四处检查点。泥地与陡坡可以使用四驱、低速挡和树木绞盘；碰撞会损伤车身、轮胎与悬挂，驶近路标旁的小屋可免费维修。

首次到达每个检查点获得60游戏金币，雪地胎售价180金币。完成山林路线后解锁「珠峰雪线」，不购买雪胎也能进入；普通胎在雪地与蓝冰上更容易打滑，碰撞和摔落照常造成车损。地图为原创虚构越野路线，不是珠峰真实道路测绘。没有真实货币支付。

金币、解锁和检查点只保存在当前浏览器。换浏览器或清除网站数据会移除这份进度。Windows本地桥地址与在线网站是不同的浏览器存储空间。

## 操作

| 操作 | 键盘 |
|---|---|
| 油门、倒车、转向 | W/S/A/D 或方向键 |
| 刹车 | 空格 |
| 四驱、低速挡 | X、L |
| 绞盘选择锚点 / 快速连接 | E，再按 E 或点场景锚点 |
| 收绳、释放 | 按住 F、Q |
| 跟随 / 高位 / 车内视角 | C |
| 返回检查点、小屋维修 | R、T |
| 暂停 | Esc |

手机提供多点触控按键，可同时转向和加油，也可同时收绳与加油。左舵座舱的方向盘和仪表随驾驶联动。手机车内视角默认收起绞盘面板，点击绞盘按钮展开；收起时停止收绳，不会断开已经连接的绳索。

控制器设置支持标准手柄、方向盘以及独立USB踏板。每项操作可分别选择设备、轴或按钮，设置反转、死区和有效行程。先按一下设备按钮，浏览器才能识别部分设备；设备能否通过Gamepad API暴露取决于驱动和浏览器。

普通网页可使用设备提供的震动能力。Windows方向盘真实扭矩反馈通过配套DirectInput本地桥接程序接入，详见 [Windows桥说明](windows-bridge/README.md)。兼容性以驱动和实机结果为准，不保证所有型号。未用真实方向盘测试的范围会在发行说明中明确标出。

## 项目结构

- `godot/`：游戏场景、地形、车辆物理、分块管理和测试。
- `ridge-rover.blend`：可编辑的车辆和座舱模型。
- `build_vehicle.py`、`cabin.py`：可重复生成模型的Blender脚本。
- `windows-bridge/`：Windows DirectInput输入/力反馈服务。
- `scripts/build-web.sh`：Godot网页导出。
- [`../../ridgebound/`](../../ridgebound/)：HTML界面、输入绑定、存档和已导出的Godot网页文件。

## 本地运行与构建

已导出的网页无需npm依赖。在仓库根目录执行：

```sh
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765/ridgebound/
```

源码构建需要 Godot 4.6.3 及对应 Web 导出模板。GitHub Pages使用无多线程模板，不依赖跨域隔离HTTP头。

```sh
bash sources/ridgebound/scripts/build-web.sh
```

构建脚本会在导出后运行 `scripts/prepare-web.py`，为 Godot 4.6.3 启动器添加读取已校验字节的入口，并生成带内容摘要的压缩引擎和游戏包。若手动使用编辑器导出，也必须运行此脚本。正常首次传输的引擎从37,700,666字节减为9,382,282字节，浏览器支持缓存时再次进入可直接读取本地副本。不支持解压或压缩包校验失败时，会自动回退标准WASM文件。

修改或重新生成模型（需要Blender4.3+）：

```sh
blender --background --python sources/ridgebound/build_vehicle.py
bash sources/ridgebound/scripts/build-web.sh
```

也可直接用Godot编辑器打开 `godot/project.godot`。网页界面独立于Godot场景，通过JSON桥传递输入、指令和状态。独立Godot编辑器运行主要用于场景和物理调试，完整UI请用网页导出验证。

```sh
godot --headless --editor --path sources/ridgebound/godot --import --quit
godot --headless --path sources/ridgebound/godot --script tests/test_physics.gd
```

分块以16米为单位，启动仅同步生成车身支撑范围内的1–4块地面，其余逐帧准备。地面与树石分为两个队列，先生成地面，再显示障碍物并同时启用碰撞；绞盘树也在显示后才可连接。若待显示的障碍物靠近车身，会延后到车辆驶离，避免突然生成造成车损。远山与检查点小屋保留为常驻地标。

加载邻域按实际帧耗时调整，并优先准备行驶前方；粗远景始终保留，未准备好精细地形时限制车辆继续进入。四轮悬挂为自定义弹簧阻尼车辆模拟，支持车身侧倾、俯仰和轮位独立起伏；座舱相机另行平滑，减轻正常驾驶时的抖动。

## 许可与致谢

本项目原创代码及生成的车辆/场景资产采用 [MIT许可](LICENSE)。其他网站项目不因本文件而变更许可。

Godot采用MIT许可，其第三方组件各有许可，随网页保留在 [`ridgebound/licenses/`](../../ridgebound/licenses/)。Blender用于创作模型，未重新分发Blender程序。项目安装的Impeccable设计技能采用Apache-2.0，见仓库 `.agents/skills/impeccable/`。

视觉与慢节奏越野玩法参考 [Funselektor 的 Over the Hill](https://www.funselektor.com/overthehill)，车辆、场景和界面均为本项目制作，与原游戏无隶属关系。
