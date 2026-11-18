# 山野之间 · RIDGEBOUND

水管同学的原创越野驾驶游戏。开着四驱越野车或长轴 MPV 从松风谷出发，在山路上过石、涉泥，用绞盘脱困，到维修小屋整备。

[在线试玩](https://watertube-bilibili.github.io/ridgebound/index.html?v=summit-20261118) · [Android 10+ APK](https://watertube-bilibili.github.io/ridgebound/downloads/Ridgebound-Android.apk?v=summit-20261118) · [Windows 安装版](https://watertube-bilibili.github.io/ridgebound/downloads/Ridgebound-Setup-x64.exe?v=summit-20261118) · [Windows 便携版](https://watertube-bilibili.github.io/ridgebound/downloads/Ridgebound-Windows-x64.zip?v=summit-20261118)

## 获取源码

本源码库有自己的 Git 历史，包含 Godot 工程、网页界面、Blender 原稿和构建脚本。保存[源码包](https://watertube-bilibili.github.io/ridgebound/downloads/Ridgebound-source.bundle)后，可在下载目录执行以下命令。

```sh
git clone Ridgebound-source.bundle ridgebound
cd ridgebound
```

## 在本地运行

在 Godot 4.6.3 中打开 [project.godot](sources/ridgebound/godot/project.godot) 可以运行原生场景。构建网页版需要安装 Godot 4.6.3 的 Web 导出模板和 Python 3。在仓库根目录运行以下命令，然后打开 `http://localhost:8765/ridgebound/`。

```sh
bash sources/ridgebound/scripts/build-web.sh
python3 -m http.server 8765
```

[游戏操作与各平台构建](sources/ridgebound/README.md) · [地图模组格式](sources/ridgebound/MAP-IMPORT.md) · [Windows 方向盘与独立踏板](sources/ridgebound/windows-bridge/README.md)

原创代码、车型及场景素材采用 MIT 许可。[查看许可](LICENSE)
