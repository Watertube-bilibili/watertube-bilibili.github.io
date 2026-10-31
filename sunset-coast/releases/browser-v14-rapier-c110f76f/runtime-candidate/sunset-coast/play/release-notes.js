// Internal native compatibility constants retained; not product display/version or save-key migration.
export const CURRENT_RELEASE='2.0.0-beta.1';
export const RELEASE_CANDIDATE=true;
export const DISPLAY_RELEASE='日出 Rapier 更新 · 2026.10.31';
export const RELEASE_IS_PREVIEW=false;
export const RELEASE_ACK_VERSION='sunrise-browser-20261030';
export const RELEASE_HISTORY=[
  {
    "version": "2026.10.30",
    "date": "2026-10-30",
    "title": "日出正式更新 · 海岸与弧湾",
    "items": [
      "正常入口使用浏览器物理，不下载 Godot 原生包；海岸与弧湾分别保存完整玩家进度。旧版入口和旧存档保留，不自动迁移旧城坐标。",
      "保留当前支持的普通车辆；开放 MICA、EMBER、RIDGE 三款摩托及 Rocket 手动起降。真实沥青贴图与现有车辆模型保留；不代表全部车型重构完成。",
      "海岸外卖职业、相机与拍照、昼夜光照和武器功能纳入本轮；弧湾可探索，职业路线尚未适配。",
      "修复存档恢复后交互指向已移除旧车的问题；保护存档并发写入、启动失败及写入状态不确定的边界。",
      "飞机、机场新玩法、自动飞行特技、结构掉轮增强、自动驾驶和全车型重构尚未开放。真实手机性能与全部极端碰撞尚未完成验证。"
    ]
  }
];
