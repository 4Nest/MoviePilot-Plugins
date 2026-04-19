# MoviePilot 第三方插件市场

个人维护的 MoviePilot 插件集合，适配 MoviePilot V2 插件系统。

## 安装方式

1. 在 MoviePilot 的 **设定 → 插件 → 插件市场** 中添加本仓库地址：
   ```
   https://github.com/4Nest/MoviePilot-Plugins
   ```
2. 刷新插件列表后，在市场中搜索并安装所需插件。

## 插件列表

| 插件 | 版本 | 说明 |
|------|------|------|
| [媒体库封面生成](plugins.v2/mediacovergenerator) | v0.9.6 | 为 Emby/Jellyfin 媒体库生成动态/静态封面，支持 8 种风格、自定义字体与标题 |
| [Bilibili 番剧更新通知](plugins.v2/bilibilinotify) | v1.0 | 监控 Bilibili 番剧更新，新番上线时推送通知 |

---

### 媒体库封面生成 (MediaCoverGenerator)

**功能特性：**
- 支持 Emby / Jellyfin 媒体服务器
- 4 种静态封面风格 + 4 种动态封面风格（APNG/GIF）
- 自定义主标题/副标题内容、字体、字号、间距
- 支持手动指定图片源（与媒体库同名的文件夹）
- 自动从媒体项获取图片生成九宫格/全屏模糊等效果
- 支持定时任务自动更新封面
- 整理完成事件监听，自动更新对应媒体库封面

**风格预览：**

| 风格 | 类型 | 说明 |
|------|------|------|
| 风格 1 | 静态 | 单张大图 + 标题 |
| 风格 2 | 静态 | 九宫格拼图 |
| 风格 3 | 静态 | 多图拼接 + 标题 |
| 风格 4 | 静态 | 全屏模糊渐变 |
| 风格 1 | 动态 | 卡片翻转动画 |
| 风格 2 | 动态 | 帷幕切换动画 |
| 风格 3 | 动态 | 斜向滚动动画 |
| 风格 4 | 动态 | 全屏模糊渐变动画 |

**依赖：** `pillow>=11.0.0`

---

### Bilibili 番剧更新通知 (BilibiliNotify)

**功能特性：**
- 监控指定 Bilibili 番剧的更新状态
- 新番更新时通过 MoviePilot 通知渠道推送
- 支持自定义监控频率（Cron 表达式）
- 可配置通知类型与过滤规则

---

## 开发相关

本项目为个人自用插件集合，部分插件基于开源项目修改或适配。

- [MoviePilot 官方插件开发文档](https://wiki.movie-pilot.org/zh/plugindev)
- [MoviePilot 主仓库](https://github.com/jxxghp/MoviePilot)
