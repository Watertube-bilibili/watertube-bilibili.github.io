# 山野之间：Windows 方向盘桥接

这个 Windows x64 程序通过 DirectInput 8 读取方向盘、手柄和独立 USB 踏板，向兼容方向盘发送真正的弹簧回正、阻尼和恒定力效果。它同时在本机提供游戏文件，网页通过同源接口读取设备并发送路面与碰撞遥测。

它不是把手柄震动包装成方向盘力反馈。浏览器 Gamepad API 没有通用的扭矩输出接口，因此需要这个本地程序。适配目标是提供标准 DirectInput 力效果的 Windows 驱动；不是每款方向盘、转接器或驱动都公开这些接口。

## 开始

1. 安装方向盘厂家提供的 Windows 驱动，先在 Windows「设置 USB 游戏控制器」中检查转向与踏板行程。
2. 将完整 Windows ZIP 解压到一个文件夹。保留 `ridgebound-wheel-bridge.exe`、`Start-Ridgebound.bat` 和 `web/` 的相对位置。
3. 运行 `Start-Ridgebound.bat`。游戏会在 `http://127.0.0.1:8766/` 打开。本地页面和 GitHub 在线页面的存档分别保存在各自浏览器来源内。
4. 打开游戏的控制器设置，为转向、油门、刹车分别选择设备与轴；独立踏板无需和方向盘属于同一个 USB 设备。调整反向、死区和行程范围。
5. 力反馈默认关闭。先保持车速低、双手握住方向盘，再开启反馈；默认强度 35%，软件上限 60%。接口会显示效果是否真正启动，驱动不支持时显示错误，不伪装成功。

`F8` 立即停止所有力效果；必须在游戏设置中先关闭再开启反馈才能恢复。`Ctrl+C` 关闭桥接程序并恢复设备原来的自动回正与力反馈增益。关闭游戏标签页后，500 毫秒遥测看门狗会停止效果。每次下发的效果自身也只有 250 毫秒时长，必须持续刷新。

桥接仅监听 `127.0.0.1`，不开放局域网或公网。不要把这个端口转发到外网。不需要管理员身份。

## 设备兼容范围与验证状态

- 通用 DirectInput 游戏控制器：最多 8 轴、128 按钮，支持独立 USB 踏板和热插拔枚举。
- 兼容力反馈方向盘：优先使用硬件弹簧、阻尼和恒定力。没有弹簧但支持恒定力的驱动使用基于实际轮轴位置的回正力。
- 若设备仅提供厂商私有协议、XInput 震动或不完整的 DirectInput 驱动，不能保证输出方向盘扭矩。需要厂家适配。
- 已通过 Windows x64 交叉编译，解析器、路径与来源校验、反馈关闭及力强度边界测试；**没有连接真实 Windows 方向盘进行硬件测试**，也没有在 Windows 上运行该 EXE 验证驱动行为。
- 不同硬件的效果坐标和驱动表现可能不同。首次试用应从较低强度开始；出现异常时按 F8 停止并关闭反馈。
- 同一方向盘被其他赛车软件独占时，DirectInput 可能拒绝获取设备。关闭其他占用设备的软件后重试。

## 文件布局

```text
ridgebound-windows/
├── ridgebound-wheel-bridge.exe
├── Start-Ridgebound.bat
└── web/
    ├── index.html
    ├── controllers.mjs
    ├── engine/          # 同一份 Godot Web 导出
    └── ...
```

也可以执行：

```bat
ridgebound-wheel-bridge.exe --web-root "D:\Games\ridgebound\web"
ridgebound-wheel-bridge.exe --web-root "D:\Games\ridgebound\web" --no-browser
```

## 构建

Visual Studio 的 x64 Native Tools 命令提示符：

```bat
build-msvc.bat
```

MinGW-w64 GCC：

```sh
x86_64-w64-mingw32-g++ -std=c++17 -O2 -Wall -Wextra -Wpedantic -municode \
  -static -static-libgcc -static-libstdc++ bridge.cpp \
  -o ridgebound-wheel-bridge.exe -ldinput8 -ldxguid -lws2_32 -lole32 -lshell32 -luser32
```

或者使用 `cmake -S . -B build` 后 `cmake --build build --config Release`。

纯逻辑测试可在 Linux 或 Windows 上运行：

```sh
g++ -std=c++17 -O2 tests/core_test.cpp -o core_test
./core_test
```

## 本地 API

所有接口仅接受 `Host: 127.0.0.1:8766`。反馈 POST 还必须带同源 `Origin: http://127.0.0.1:8766` 与 `Content-Type: application/json`；不提供跨来源 CORS 授权。

- `GET /api/input`、`GET /api/devices`：`{bridge,version,devices,ffb}`。设备包含稳定的 `di:{GUID}` ID、名称、索引、连接状态、`forceFeedback` 能力、8 个归一化 `axes`（-1…1）、128 个 `buttons`（0/1）、`axisNames` 和 `axisAvailable`。
- `POST /api/feedback`：`{enabled,deviceId?,strength?,steer?,speed?,slip?,impact?,suspension?}`。`enabled` 必须是显式布尔值；`strength` 默认 0.35，上限 0.60；`speed` 单位为米/秒；其余强度归一化为 0…1，`steer` 为 -1…1。
- `ffb.available` 仅表示发现了兼容的执行器；`ffb.armed` 表示效果已创建且成功更新。失败详情在 `ffb.status`。

读取、HTTP 传输和设备反馈在独立线程运行；加载 WebAssembly 文件不会阻塞 500 毫秒看门狗。静态文件采用规范路径校验，拒绝路径穿越、设备路径与外部符号链接。`wasm` 使用 `application/wasm`。

源码采用 MIT 许可证，见 `LICENSE`。程序没有下载器、自动更新或远程遥测。
