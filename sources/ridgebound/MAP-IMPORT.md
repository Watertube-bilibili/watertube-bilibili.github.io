# 导入自定义地图

网页版和 Windows 原生版都可以从「地图」选择本地 ZIP。浏览器在本地读取文件，退出游戏后可以重新选择同一份 ZIP。加载失败时会留在当前地图。

## BeamNG.drive 地图

使用自己制作或有再使用许可的地图 ZIP。支持 `levels/<地图名>/` 中一个未旋转的 `TerrainBlock`、它引用的 v9 `.ter`、地表类型和 `SpawnSphere` 出生点。地图保持原来的水平米制比例和高度。地表会根据材质名称映射为山野之间的抓地类别，原版材质纹理、模型、森林、路桥物件和脚本不导入。原地洞位置仍保留实地，避免掉出地图。多个地形块和旧版 `.ter` 暂不支持。

`items.level.json` 可以在该地图目录下的子目录中，采用一行一个 JSON 对象。引擎从 `TerrainBlock` 读取 `terrainFile`、`squareSize`、`maxHeight` 和 `position`，按 `info.json` 的 `defaultSpawnPointName` 查找出生点，找不到时使用其他有效出生点或地图中心。

[BeamNG 地形格式](https://documentation.beamng.com/modding/levels/level_formats/terrain/) · [TerrainBlock](https://documentation.beamng.com/modding/levels/level_classes/terrainblock/) · [SpawnSphere](https://documentation.beamng.com/modding/levels/level_classes/spawn/)

## Ridgebound ZIP v1

ZIP 根目录含 `ridgebound-map.json` 与它指定的高度文件。障碍物可用带旋转的长方体，游戏使用同一组尺寸绘制模型和处理碰撞。将 `height` 设为 0.2 至 0.3 米可以做低障碍，用来测试悬挂和攀爬。

```json
{
  "version": 1,
  "name": "试车场",
  "width": 65,
  "depth": 65,
  "spacing": 2,
  "heightFile": "height.u16",
  "heightScale": 0.01,
  "baseHeight": 0,
  "surface": "grass",
  "spawn": {"x": 0, "z": -24, "yawDegrees": 0},
  "props": [
    {"type": "box", "x": 0, "z": -8, "width": 3.4, "height": 0.22, "depth": 2.4, "yawDegrees": 15}
  ]
}
```

高度文件以小端无符号整数保存，每个采样占 2 字节，共 `width × depth` 个采样。每一行按 x 从小到大排列，行序按 z 从小到大排列。地图中心是坐标原点，+z 为北，+x 为西。每个采样的高度等于 `baseHeight + 样本值 × heightScale`。也可以用 `maxHeight` 指定从 0 到 65535 的总高度范围。地图尺寸为 `(width - 1) × spacing` 米、`(depth - 1) × spacing` 米。

`spawn` 的 `yawDegrees` 默认为 0，也就是朝北。出生点要距边缘至少 4 米，附近须有安全净空。障碍物的 `bottomOffset` 默认为 0，也就是底面落在其中心点的地面高度。长宽高需要在 0.1 至 16 米之间。地表支持 `grass`、`trail`、`mud`、`rock`、`water`、`snow`、`ice`。

两个格式都限制 ZIP 为 128 MiB、网格每边最多 4096 个采样、地图每边 32 至 65536 米。只读取地图数据所需的文件，无需将 ZIP 解压到项目目录。自定义地图使用自由探索模式，不影响内置地图进度。

将上面的 JSON 存成当前目录的 `ridgebound-map.json`。以下命令可以生成一份全平地的 ZIP，用来试几何碰撞和导入流程。

```python
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

manifest = Path("ridgebound-map.json").read_bytes()
spec = json.loads(manifest)
with ZipFile("test-course.zip", "w", compression=ZIP_DEFLATED) as archive:
    archive.writestr("ridgebound-map.json", manifest)
    archive.writestr(spec["heightFile"], bytes(spec["width"] * spec["depth"] * 2))
```
