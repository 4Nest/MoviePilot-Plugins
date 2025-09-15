import json
from typing import Any, List, Dict, Tuple, Optional
from datetime import datetime, timedelta

from app.core.config import settings
from app.log import logger
from app.plugins import _PluginBase
from app.schemas import NotificationType
from app.utils.http import RequestUtils


class BilibiliNotify(_PluginBase):
    # 插件名称
    plugin_name = "Bilibili番剧更新通知"
    # 插件描述
    plugin_desc = "监控Bilibili番剧更新，当有新番剧更新时发送通知。"
    # 插件图标
    plugin_icon = "Bilibili_A.png"
    # 插件版本
    plugin_version = "1.0"
    # 插件作者
    plugin_author = "NEST"
    # 作者主页
    author_url = "https://github.com/4Nest/MoviePilot-Plugins"
    # 插件配置项ID前缀
    plugin_config_prefix = "bilibilinotify_"
    # 加载顺序
    plugin_order = 10
    # 可使用的用户级别
    auth_level = 1

    # 私有属性
    _enabled = False
    _notify = False
    _cron = None
    _daily_cron = None
    _new_cron = None
    _run_once = False
    _types = []
    _history = []
    _clear_history = False

    def init_plugin(self, config: dict = None):
        # 停止现有任务
        self.stop_service()

        if config:
            self._enabled = config.get("enabled")
            self._notify = config.get("notify")
            self._cron = config.get("cron")
            self._daily_cron = config.get("daily_cron")
            self._new_cron = config.get("new_cron")
            self._run_once = config.get("run_once")
            self._types = config.get("types") or []
            self._history = config.get("history") or []
            self._clear_history = config.get("clear_history") or False
            
            # 如果需要清空历史记录
            if self._clear_history:
                self._history = []
                self._clear_history = False

        # 如果启用插件且设置了立即运行，执行一次检查
        if self._enabled and self._run_once:
            self._run_once = False
            self.__check_daily_update()
            self.__check_new_update()
            # 更新配置
            self.update_config({
                "enabled": self._enabled,
                "notify": self._notify,
                "cron": self._cron,
                "daily_cron": self._daily_cron,
                "new_cron": self._new_cron,
                "run_once": self._run_once,
                "types": self._types,
                "history": self._history,
                "clear_history": self._clear_history
            })

    def __check_daily_update(self):
        """
        检查Bilibili番剧当天更新
        """
        if not self._types:
            logger.warn("未选择任何类型，跳过检查")
            return

        # 获取今天的日期
        today = datetime.now().date()
        
        # 存储当天更新的剧集
        daily_updates = []
        
        # 遍历所有选择的类型
        for type_name in self._types:
            # 获取类型对应的ID
            type_id = self.__get_type_id(type_name)
            if not type_id:
                continue
                
            # 调用API获取更新信息
            updates = self.__get_timeline(type_id)
            if not updates:
                continue

            # 检查更新
            for day_data in updates:
                # 只检查今天的更新
                date_ts = day_data.get("date_ts")
                if not date_ts:
                    continue
                    
                # 将时间戳转换为日期
                update_date = datetime.fromtimestamp(date_ts).date()
                if update_date != today:
                    continue

                episodes = day_data.get("episodes", [])
                for episode in episodes:
                    # 添加到当天更新列表
                    daily_updates.append(episode)
                    logger.info(f"检测到当天番剧更新：{episode.get('title')} {episode.get('pub_index', '')}")

        # 如果有当天更新，发送汇总通知
        if daily_updates and self._notify:
            self.__send_daily_notify(daily_updates)
            
        # 更新配置
        self.update_config({
            "enabled": self._enabled,
            "notify": self._notify,
            "cron": self._cron,
            "daily_cron": self._daily_cron,
            "new_cron": self._new_cron,
            "run_once": self._run_once,
            "types": self._types,
            "history": self._history,
            "clear_history": self._clear_history
        })

    def __check_new_update(self):
        """
        检查Bilibili番剧新上架
        """
        if not self._types:
            logger.warn("未选择任何类型，跳过检查")
            return

        # 获取今天的日期
        today = datetime.now().date()
        
        # 遍历所有选择的类型
        for type_name in self._types:
            # 获取类型对应的ID
            type_id = self.__get_type_id(type_name)
            if not type_id:
                continue
                
            # 调用API获取更新信息
            updates = self.__get_timeline(type_id)
            if not updates:
                continue

            # 检查更新
            for day_data in updates:
                # 只检查今天及未来的更新
                date_ts = day_data.get("date_ts")
                if not date_ts:
                    continue
                    
                # 将时间戳转换为日期
                update_date = datetime.fromtimestamp(date_ts).date()
                if update_date < today:
                    continue

                day_of_week = day_data.get("day_of_week", "")
                episodes = day_data.get("episodes", [])
                for episode in episodes:
                    season_id = episode.get("season_id")
                    pub_index = episode.get("pub_index", "")
                    
                    # 只处理包含"第1话"且未通知过的更新
                    if "第1话" in pub_index and season_id not in self._history:
                        # 发送通知
                        if self._notify:
                            self.__send_notify(episode, day_of_week)
                            
                        # 添加到历史记录
                        self._history.append(season_id)
                        logger.info(f"检测到新番剧上架：{episode.get('title')} {pub_index}")

        # 限制历史记录数量，避免过大
        if len(self._history) > 100:
            self._history = self._history[-100:]
            
        # 更新配置
        self.update_config({
            "enabled": self._enabled,
            "notify": self._notify,
            "cron": self._cron,
            "daily_cron": self._daily_cron,
            "new_cron": self._new_cron,
            "run_once": self._run_once,
            "types": self._types,
            "history": self._history,
            "clear_history": self._clear_history
        })

    def __get_type_id(self, type_name: str) -> Optional[int]:
        """
        获取类型对应的ID
        """
        type_map = {
            "番剧": 1,
            "电影": 3,
            "国创": 4
        }
        return type_map.get(type_name)

    def __get_timeline(self, type_id: int) -> Optional[List[Dict]]:
        """
        获取时间线数据
        """
        try:
            # API URL
            url = "https://api.bilibili.com/pgc/web/timeline"
            
            # 请求参数
            params = {
                "types": type_id,
                "before": 0,  # 从今天开始
                "after": 7    # 到未来7天
            }
            
            # 发送请求
            resp = RequestUtils(
                headers={
                    "User-Agent": "Mozilla/5.0",
                    "Referer": "https://www.bilibili.com"
                }
            ).get_res(url, params=params)
            
            if resp and resp.status_code == 200:
                data = resp.json()
                if data.get("code") == 0:
                    return data.get("result")
                else:
                    logger.error(f"获取时间线失败：{data.get('message')}")
            else:
                logger.error(f"请求失败，状态码：{resp.status_code if resp else 'None'}")
        except Exception as e:
            logger.error(f"获取时间线异常：{str(e)}")
        
        return None

    def __send_notify(self, episode: Dict, day_of_week: str):
        """
        发送通知
        """
        title = episode.get("title", "")
        pub_index = episode.get("pub_index", "")
        pub_time = episode.get("pub_time", "")
        season_id = episode.get("season_id", "")
        cover = episode.get("cover", "")
        
        # 构造消息内容
        #message = f"【Bilibili上新】\n\n"
        message = f"\n番剧名称：{title}\n"
        message += f"更新集数：{pub_index}\n"
        week_map = {
            1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 7: "日"
        }
        day_of_week_str = week_map.get(day_of_week, "")
        message += f"更新时间：{pub_time} (星期{day_of_week_str})\n"
        message += f"直达链接：https://www.bilibili.com/bangumi/play/ss{season_id}"
        
        # 发送通知
        self.post_message(
            mtype=NotificationType.MediaServer,
            title="Bilibili上新",
            text=message,
            image=cover
        )

    def __send_daily_notify(self, episodes: List[Dict]):
        """
        发送当天更新汇总通知
        """
        if not episodes:
            return
            
        # 构造消息内容
        message = f""
        for episode in episodes:
            title = episode.get("title", "")
            pub_index = episode.get("pub_index", "")
            pub_time = episode.get("pub_time", "")
            message += f"《{title}》 {pub_index} {pub_time}\n"
            
        message += f"\n共{len(episodes)}部番剧更新"
        
        # 发送通知
        self.post_message(
            mtype=NotificationType.MediaServer,
            title="Bilibili番剧今日更新",
            text=message
        )

    def get_state(self) -> bool:
        return self._enabled

    @staticmethod
    def get_command() -> List[Dict[str, Any]]:
        pass

    def get_api(self) -> List[Dict[str, Any]]:
        pass

    def get_service(self) -> List[Dict[str, Any]]:
        """
        注册插件公共服务
        """
        services = []
        if self._enabled:
            from apscheduler.triggers.cron import CronTrigger
            
            # 注册当天更新检查服务
            if self._daily_cron:
                services.append({
                    "id": "BilibiliDailyNotify",
                    "name": "Bilibili番剧当天更新通知",
                    "trigger": CronTrigger.from_crontab(self._daily_cron),
                    "func": self.__check_daily_update,
                    "kwargs": {}
                })
            
            # 注册新上架检查服务
            if self._new_cron:
                services.append({
                    "id": "BilibiliNewNotify",
                    "name": "Bilibili番剧新上架通知",
                    "trigger": CronTrigger.from_crontab(self._new_cron),
                    "func": self.__check_new_update,
                    "kwargs": {}
                })
                
        return services

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
                                            'model': 'run_once',
                                            'label': '立即运行一次',
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
                                            'model': 'clear_history',
                                            'label': '清空历史记录',
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
                                        'component': 'VCronField',
                                        'props': {
                                            'model': 'daily_cron',
                                            'label': '当天更新检查周期',
                                            'placeholder': '5位cron表达式'
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
                                        'component': 'VCronField',
                                        'props': {
                                            'model': 'new_cron',
                                            'label': '新上架检查周期',
                                            'placeholder': '5位cron表达式'
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
                                    'cols': 12
                                },
                                'content': [
                                    {
                                        'component': 'VSelect',
                                        'props': {
                                            'multiple': True,
                                            'chips': True,
                                            'model': 'types',
                                            'label': '类型',
                                            'items': [
                                                {
                                                    "title": "番剧",
                                                    "value": "番剧"
                                                },
                                                {
                                                    "title": "电影",
                                                    "value": "电影"
                                                },
                                                {
                                                    "title": "国创",
                                                    "value": "国创"
                                                }
                                            ]
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
                                    'cols': 12
                                },
                                'content': [
                                    {
                                        'component': 'VAlert',
                                        'props': {
                                            'type': 'info',
                                            'variant': 'tonal',
                                            'text': '监控Bilibili番剧更新，当天更新检查会汇总当天所有更新的番剧发送一条通知，新上架检查会在检测到包含"第1话"关键词的更新时发送通知。支持选择番剧、电影、国创类型。'
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
            "notify": True,
            "cron": None,
            "daily_cron": "0 9 * * *",  # 默认每天9点执行当天更新检查
            "new_cron": "0 10 * * *",   # 默认每天10点执行新上架检查
            "run_once": False,
            "types": ["番剧"],
            "history": [],
            "clear_history": False
        }

    def get_page(self) -> List[dict]:
        pass

    def stop_service(self):
        """
        退出插件
        """
        pass