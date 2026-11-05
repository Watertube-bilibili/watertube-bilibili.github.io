# 当前项目状态

已从暂停检查点55921bf继续完成Godot迁移。最终源码与构建说明见[README.md](README.md)，请以当前代码为准，不要恢复旧Three.js核心。

- 网页目录：`../../ridgebound/`；Godot源码：`godot/`。
- Blender可编辑模型和生成脚本位于本目录。
- 浏览器输入、手机操作和控制器绑定代码在网页目录。
- Windows方向盘本地桥源代码：`windows-bridge/`。已交叉编译，真实Windows/方向盘执行未验证。
- 网站与源码只在原GitHub项目，不使用Sites。

最新验证信息见[VALIDATION.md](VALIDATION.md)。重新构建Web后，运行 `python3 sources/ridgebound/scripts/package-windows.py` 更新Windows完整包，防止它与线上引擎版本不一致。

2026-11-05更新：16米地块按地面/树石分层加载；启动仅准备车身脚下地面，障碍物显示与碰撞同步启用。座舱改为左舵，手机绞盘可折叠，悬挂与车内相机减震已调整。`build-web.sh` 会自动运行 `prepare-web.py` 生成压缩资源并修补Godot启动器；手动导出后也必须执行，不能只覆盖原始engine文件。
