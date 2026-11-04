# 当前项目状态

已从暂停检查点55921bf继续完成Godot迁移。最终源码与构建说明见[README.md](README.md)，请以当前代码为准，不要恢复旧Three.js核心。

- 网页目录：`../../ridgebound/`；Godot源码：`godot/`。
- Blender可编辑模型和生成脚本位于本目录。
- 浏览器输入、手机操作和控制器绑定代码在网页目录。
- Windows方向盘本地桥源代码：`windows-bridge/`。已交叉编译，真实Windows/方向盘执行未验证。
- 网站与源码只在原GitHub项目，不使用Sites。

最新验证信息见[VALIDATION.md](VALIDATION.md)。重新构建Web后，运行 `python3 sources/ridgebound/scripts/package-windows.py` 更新Windows完整包，防止它与线上引擎版本不一致。
