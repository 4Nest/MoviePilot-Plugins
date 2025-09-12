
import os
import time
from typing import Any, List, Dict, Tuple, Optional
from collections import defaultdict

from app.log import logger
from app.plugins import _PluginBase
from app.schemas import NotificationType
from app.chain.storage import StorageChain
from app.schemas.types import EventType
from app.core.event import eventmanager


class DuplicateFinder(_PluginBase):
    # 插件名称
    plugin_name = "重复文件查找"
    # 插件描述
    plugin_desc = "查找指定路径下同一文件夹中的重复文件，并通过MP发送通知"
    # 插件图标
    plugin_icon = "duplicate.png"
    # 插件版本
    plugin_version = "1.0"
    # 插件作者
    plugin_author = "NEST"
    # 作者主页
    author_url = "https://github.com/4Nest/MoviePilot-Plugins"
    # 插件配置项ID前缀
    plugin_config_prefix = "duplicatefinder_"
    # 加载顺序
    plugin_order = 99
    # 可使用的用户级别
    auth_level = 1

    # 私有属性
    _enabled = False
    _movie_path = ""
    _tv_path = ""
    _extensions = ""
    _notify = False
    _onlyonce = False
    _scan_types = []

    def init_plugin(self, config: dict = None):
        if config:
            self._enabled = config.get("enabled")
            self._movie_path = config.get("movie_path", "")
            self._tv_path = config.get("tv_path", "")
            self._extensions = config.get("extensions", "")
            self._notify = config.get("notify", False)
            self._onlyonce = config.get("onlyonce", False)
            self._scan_types = config.get("scan_types", [])

        # 如果启用了立即运行一次，执行查找
        if self._onlyonce:
            self._onlyonce = False
            self.update_config({
                "enabled": self._enabled,
                "movie_path": self._movie_path,
                "tv_path": self._tv_path,
                "extensions": self._extensions,
                "notify": self._notify,
                "onlyonce": self._onlyonce,
                "scan_types": self._scan_types
            })
            self.find_duplicates()

    def get_state(self) -> bool:
        return self._enabled

    @staticmethod
    def get_command() -> List[Dict[str, Any]]:
        """
        定义远程命令
        """
        return [{
            "cmd": "/duplicate_finder",
            "event": EventType.PluginAction,
            "desc": "查找重复文件",
            "category": "文件管理",
            "data": {
                "action": "duplicate_finder"
            }
        }]

    def get_api(self) -> List[Dict[str, Any]]:
        pass

    def get_service(self) -> List[Dict[str, Any]]:
        pass

    def get_form(self) -> Tuple[List[dict], Dict[str, Any]]:
        """
        拼装插件配置页面，需要返回两块数据：1、页面配置；2、数据结构
        """
        return [
            {
                'component': 'VForm',
                'content': [
                    {
                        'component': 'VRow',
                        'content': [
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 3
                                },
                                'content': [
                                    {
                                        'component': 'VSwitch',
                                        'props': {
                                            'model': 'enabled',
                                            'label': '启用插件',
                                        }
                                    }
                                ]
                            },
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 3
                                },
                                'content': [
                                    {
                                        'component': 'VSwitch',
                                        'props': {
                                            'model': 'notify',
                                            'label': '发送通知',
                                        }
                                    }
                                ]
                            },
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 3
                                },
                                'content': [
                                    {
                                        'component': 'VSwitch',
                                        'props': {
                                            'model': 'onlyonce',
                                            'label': '立即运行一次',
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'component': 'VRow',
                        'content': [
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 6
                                },
                                'content': [
                                    {
                                        'component': 'VSelect',
                                        'props': {
                                            'multiple': True,
                                            'chips': True,
                                            'model': 'scan_types',
                                            'label': '扫描类型',
                                            'items': [
                                                {
                                                    "title": "电影",
                                                    "value": "movie"
                                                },
                                                {
                                                    "title": "电视剧",
                                                    "value": "tv"
                                                }
                                            ]
                                        }
                                    }
                                ]
                            },
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 6
                                },
                                'content': [
                                    {
                                        'component': 'VTextField',
                                        'props': {
                                            'model': 'extensions',
                                            'label': '文件类型',
                                            'placeholder': 'mkv,strm 留空则使用默认类型'
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'component': 'VRow',
                        'content': [
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 6
                                },
                                'content': [
                                    {
                                        'component': 'VTextField',
                                        'props': {
                                            'model': 'movie_path',
                                            'label': '电影路径',
                                            'placeholder': '请输入电影路径地址'
                                        }
                                    }
                                ]
                            },
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 6
                                },
                                'content': [
                                    {
                                        'component': 'VTextField',
                                        'props': {
                                            'model': 'tv_path',
                                            'label': '电视剧路径',
                                            'placeholder': '请输入电视剧路径地址'
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'component': 'VRow',
                        'content': [
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                },
                                'content': [
                                    {
                                        'component': 'VAlert',
                                        'props': {
                                            'type': 'info',
                                            'variant': 'tonal',
                                            'text': '电影大于一个文件即重复，电视剧同一集算重复'
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ], {
            "enabled": False,
            "movie_path": "",
            "tv_path": "",
            "extensions": "",
            "notify": False,
            "onlyonce": False,
            "scan_types": []
        }

    def get_page(self) -> List[dict]:
        pass

    @eventmanager.register(EventType.PluginAction)
    def handle_plugin_action(self, event):
        """
        处理插件动作事件
        """
        if not self._enabled:
            return

        event_data = event.event_data
        if not event_data or event_data.get("action") != "duplicate_finder":
            return

        # 执行查找重复文件
        self.find_duplicates()

    def _send_message(self, message: str):
        """
        发送消息
        """
        if self._notify:
            self.post_message(
                mtype=NotificationType.SiteMessage,
                title="【重复文件查找】",
                text=message
            )
        else:
            logger.info(f"消息通知已关闭: {message}")

    def stop_service(self):
        pass

    def find_duplicates(self):
        """
        查找重复文件
        """
        logger.info("开始查找重复文件")
        
        # 解析文件类型
        extensions = []
        if self._extensions:
            extensions = [ext.strip().lower() for ext in self._extensions.split(",") if ext.strip()]
        else:
            # 默认文件类型
            extensions = ["strm", "mp4", "mkv"]
        logger.info(f"查找文件类型: {extensions}")

        # 查找电影重复文件
        movie_duplicates = {}
        if "movie" in self._scan_types:
            if self._movie_path and os.path.exists(self._movie_path):
                movie_duplicates = self._scan_for_movie_duplicates(self._movie_path, extensions)
            elif self._movie_path:
                logger.error(f"电影路径不存在: {self._movie_path}")
                self._send_message(f"电影路径不存在: {self._movie_path}")

        # 查找电视剧重复文件
        tv_duplicates = {}
        if "tv" in self._scan_types:
            if self._tv_path and os.path.exists(self._tv_path):
                tv_duplicates = self._scan_for_tv_duplicates(self._tv_path, extensions)
            elif self._tv_path:
                logger.error(f"电视剧路径不存在: {self._tv_path}")
                self._send_message(f"电视剧路径不存在: {self._tv_path}")

        # 合并结果
        all_duplicates = {}
        if movie_duplicates:
            all_duplicates.update(movie_duplicates)
        if tv_duplicates:
            all_duplicates.update(tv_duplicates)

        # 处理结果
        self._handle_results(all_duplicates)
        
        logger.info("查找重复文件完成")

    def _scan_for_movie_duplicates(self, path: str, extensions: List[str]) -> Dict[str, List[str]]:
        """
        扫描路径查找重复电影文件
        对于电影，同一个文件夹下有多个文件则属于重复
        """
        duplicates = defaultdict(list)

        try:
            # 遍历目录中的所有文件
            for root, dirs, files in os.walk(path):
                # 过滤出符合扩展名的文件
                filtered_files = []
                for file in files:
                    # 检查文件类型
                    ext = os.path.splitext(file)[1][1:].lower()
                    if ext in extensions:
                        filepath = os.path.join(root, file)
                        filtered_files.append(filepath)

                # 如果同一文件夹下有多个文件，则算作重复
                if len(filtered_files) > 1:
                    # 使用第一个文件名作为键，但包含所有重复文件路径
                    first_filename = os.path.basename(filtered_files[0])
                    duplicates[first_filename].extend(filtered_files)

        except Exception as e:
            logger.error(f"扫描电影路径时出错: {str(e)}")

        return duplicates

    def _scan_for_tv_duplicates(self, path: str, extensions: List[str]) -> Dict[str, List[str]]:
        """
        扫描路径查找重复电视剧文件
        对于电视剧，同一个文件夹下有两个相同S01E01格式的文件则属于重复
        """
        duplicates = defaultdict(list)
        # 电视剧集匹配正则表达式
        import re
        episode_pattern = re.compile(r'(?:[Ss]\d{1,2}[Ee]\d{1,4})')

        try:
            # 遍历目录中的所有文件
            for root, dirs, files in os.walk(path):
                # 按电视剧集分组
                episodes = defaultdict(list)
                for file in files:
                    # 检查文件类型
                    ext = os.path.splitext(file)[1][1:].lower()
                    if ext not in extensions:
                        continue

                    # 提取电视剧集信息
                    match = episode_pattern.search(file)
                    if match:
                        episode_key = match.group(0).upper()  # 转换为大写以便统一比较
                        filepath = os.path.join(root, file)
                        episodes[episode_key].append(filepath)

                # 查找重复电视剧集
                for episode_key, paths in episodes.items():
                    if len(paths) > 1:
                        duplicates[episode_key].extend(paths)

        except Exception as e:
            logger.error(f"扫描电视剧路径时出错: {str(e)}")

        return duplicates

    def _handle_results(self, duplicates: Dict[str, List[str]]):
        """
        处理查找结果
        """
        if not duplicates:
            message = "未找到重复文件"
            logger.info(message)
            self._send_message(message)
            return

        # 构造结果消息
        message = f"发现 {len(duplicates)} 处重复文件:\n\n"
        for filename, paths in duplicates.items():
            # 只显示文件夹路径
            folder_path = os.path.dirname(paths[0])
            message += f"- {folder_path}\n"

        logger.info(message)

        self._send_message(message)
