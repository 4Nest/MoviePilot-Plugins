# MoviePilot 第三方插件市场

个人维护的 MoviePilot 插件集合，适配 MoviePilot V2 / NEO 插件系统，默认通过 GitHub Release 压缩包分发。

## 安装方式

1. 在 MoviePilot 的 **设定 → 插件 → 插件市场** 中添加本仓库地址：
   ```
   https://github.com/4Nest/MoviePilot-Plugins
   ```
2. 刷新插件列表后，在市场中搜索并安装所需插件。

## 插件列表

| 插件 | 版本 | 说明 |
|------|------|------|
| [Emby 用户管理](plugins.v2/embyusermanager) | v1.2.4 | 管理 Emby 媒体服务器账号增删改查、登录准入黑白名单及用户订阅数据 |
| [保种删种管家](plugins.v2/seedcleaner) | v1.1.3 | 多维条件与正则清理规则、模拟干跑预览、磁盘低水位应急保盘，支持 qBittorrent 与 Transmission |
| [MediaVault 联动管家](plugins.v2/mediavaultbridge) | v1.1.0 | 联动 MediaVault (Muvyo)：115 上传失败自动清锁重传、入库精准 STRM 与刮削、删片联动清理、Emby 后处理与 115 分享链转存 |

## 目录结构

- `plugins.v2/`：插件运行时代码与编译后的联邦前端产物（`dist/`）
- `frontend/`：各插件 Vue 模块联邦前端工程源码
- `tests/`：插件后端逻辑与仓库元数据回归测试
