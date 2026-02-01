import re
from datetime import datetime
from pathlib import Path
from typing import Any, List, Dict, Tuple, Optional
from collections import defaultdict

from app import schemas
from app.log import logger
from app.plugins import _PluginBase
from app.core.config import settings


class DuplicateDetector(_PluginBase):
    # 插件名称
    plugin_name = "重复文件排查"
    # 插件描述
    plugin_desc = "检测媒体库中的重复文件,支持电影和剧集的智能识别。"
    # 插件图标
    plugin_icon = "clean.png"
    # 插件版本
    plugin_version = "1.0"
    # 插件作者
    plugin_author = "NEST"
    # 作者主页
    author_url = "https://github.com/4Nest/MoviePilot-Plugins"
    # 插件配置项ID前缀
    plugin_config_prefix = "duplicatedetector_"
    # 加载顺序
    plugin_order = 50
    # 可使用的用户级别
    auth_level = 2

    # 私有属性
    _enabled = False
    _onlyonce = False
    _scan_paths = ""
    _strm_library_path = None  # STRM文件路径
    _cloud_library_path = None  # 网盘挂载路径
    _cloud_storage = "local"  # 网盘存储类型
    _storagechain = None  # 存储管理链

    def init_plugin(self, config: dict = None):
        """初始化插件"""
        from app.chain.storage import StorageChain
        self._storagechain = StorageChain()

        if config:
            self._enabled = config.get("enabled")
            self._onlyonce = config.get("onlyonce")
            self._scan_paths = config.get("scan_paths") or ""
            self._file_extensions = config.get("file_extensions") or "strm,mkv,mp4,avi"
            self._scan_type = config.get("scan_type") or "auto"
            self._min_duplicate_count = int(config.get("min_duplicate_count") or 2)
            self._strm_library_path = config.get("strm_library_path") or ""
            self._cloud_library_path = config.get("cloud_library_path") or ""
            self._cloud_storage = config.get("cloud_storage") or "local"

        if self._enabled and self._onlyonce:
            # 立即运行一次
            logger.info("重复文件排查服务,立即运行一次")
            self.__run_detection()
            # 关闭一次性开关
            self._onlyonce = False
            self.update_config({
                "enabled": self._enabled,
                "onlyonce": False,
                "scan_paths": self._scan_paths,
                "file_extensions": self._file_extensions,
                "scan_type": self._scan_type,
                "min_duplicate_count": self._min_duplicate_count,
                "strm_library_path": self._strm_library_path,
                "cloud_library_path": self._cloud_library_path,
                "cloud_storage": self._cloud_storage
            })

    def get_state(self) -> bool:
        return self._enabled

    @staticmethod
    def get_command() -> List[Dict[str, Any]]:
        pass

    def get_api(self) -> List[Dict[str, Any]]:
        """
        获取插件API
        """
        return [
            {
                "path": "/delete_file",
                "endpoint": self.delete_file,
                "methods": ["GET"],
                "summary": "删除重复文件",
                "description": "删除指定的重复文件"
            }
        ]

    def get_service(self) -> List[Dict[str, Any]]:
        pass

    def get_form(self) -> Tuple[List[dict], Dict[str, Any]]:
        """拼装插件配置页面"""
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
                                    'md': 4
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
                                    'md': 4
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
                            },
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 4
                                },
                                'content': [
                                    {
                                        'component': 'VTextField',
                                        'props': {
                                            'model': 'min_duplicate_count',
                                            'label': '最小重复数',
                                            'placeholder': '2',
                                            'type': 'number'
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
                                            'model': 'file_extensions',
                                            'label': '文件后缀',
                                            'placeholder': 'strm,mkv,mp4,avi'
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
                                        'component': 'VSelect',
                                        'props': {
                                            'model': 'scan_type',
                                            'label': '扫描类型',
                                            'items': [
                                                {'title': '自动识别', 'value': 'auto'},
                                                {'title': '仅电影', 'value': 'movie'},
                                                {'title': '仅剧集', 'value': 'tv'},
                                            ]
                                        }
                                    }
                                ]
                            },
                            {
                                'component': 'VCol',
                                'props': {
                                    'cols': 12,
                                    'md': 4
                                },
                                'content': [
                                    {
                                        'component': 'VSelect',
                                        'props': {
                                            'model': 'cloud_storage',
                                            'label': '存储类型',
                                            'items': [
                                                {'title': 'Local/Rclone', 'value': 'local'},
                                                {'title': '115网盘', 'value': 'u115'},
                                                {'title': '123云盘', 'value': '123云盘'},
                                            ],
                                            'placeholder': '默认local'
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
                                        'component': 'VTextarea',
                                        'props': {
                                            'model': 'scan_paths',
                                            'label': '扫描路径',
                                            'rows': 5,
                                            'placeholder': '每一行一个路径,例如:\nY:/strm/Movie\nY:/strm/Anime'
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
                                            'model': 'strm_library_path',
                                            'label': 'STRM库路径',
                                            'placeholder': '例如 /media/strm'
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
                                            'model': 'cloud_library_path',
                                            'label': '网盘映射路径',
                                            'placeholder': '例如 /media'
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
                                            'text': '插件会扫描指定路径下的文件,检测基于目录名中的{tmdbid=xxxxx}或文件名解析。'
                                                    '电影:相同tmdbid视为重复;剧集:相同剧名+季集号视为重复。'
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
            "onlyonce": False,
            "scan_paths": "",
            "file_extensions": "strm,mkv,mp4,avi",
            "scan_type": "auto",
            "min_duplicate_count": 2,
            "strm_library_path": "",
            "cloud_library_path": "",
            "cloud_storage": "local"
        }

    def __extract_tmdbid(self, path_str: str) -> Optional[str]:
        """从路径中提取tmdbid"""
        match = re.search(r'\{tmdbid=(\d+)\}', path_str)
        return match.group(1) if match else None

    def __extract_season_episode(self, filename: str) -> Optional[Tuple[str, str]]:
        """从文件名中提取季集号"""
        match = re.search(r'S(\d+)E(\d+)', filename, re.IGNORECASE)
        if match:
            return match.group(1).zfill(2), match.group(2).zfill(2)
        return None

    def __extract_file_info(self, filename: str) -> Dict[str, str]:
        """从文件名提取详细信息"""
        info = {
            'resolution': '',
            'source': '',
            'codec': ''
        }
        
        # 提取分辨率
        res_match = re.search(r'(2160p|1080p|720p|480p)', filename, re.IGNORECASE)
        if res_match:
            info['resolution'] = res_match.group(1)
        
        # 提取来源
        source_match = re.search(r'(BluRay|WEB-DL|HDTV|WEBRip|BDRip)', filename, re.IGNORECASE)
        if source_match:
            info['source'] = source_match.group(1)
        
        # 提取编码
        codec_match = re.search(r'(x265|H\.?265|HEVC|x264|H\.?264|AVC)', filename, re.IGNORECASE)
        if codec_match:
            info['codec'] = codec_match.group(1)
        
        return info

    def __scan_files(self, scan_path: str, extensions: List[str]) -> List[Path]:
        """扫描指定路径下的文件"""
        files = []
        try:
            path = Path(scan_path)
            if not path.exists():
                logger.warning(f"扫描路径不存在:{scan_path}")
                return files
            
            for ext in extensions:
                ext = ext.strip()
                if ext.startswith('.'):
                    pattern = f"**/*{ext}"
                else:
                    pattern = f"**/*.{ext}"
                files.extend(path.rglob(pattern))
            
            logger.info(f"在 {scan_path} 中扫描到 {len(files)} 个文件")
        except Exception as e:
            logger.error(f"扫描文件失败:{str(e)}")
        
        return files

    def __detect_movie_duplicates(self, files: List[Path]) -> List[Dict]:
        """检测电影重复"""
        # 按tmdbid或(title, year)分组
        groups = defaultdict(list)
        
        for file_path in files:
            try:
                # 获取父目录(电影目录)
                parent_dir = file_path.parent.name
                
                # 优先提取tmdbid
                tmdbid = self.__extract_tmdbid(parent_dir)
                
                if tmdbid:
                    key = f"tmdb_{tmdbid}"
                else:
                    # 尝试从目录名提取title和year
                    year_match = re.search(r'\((\d{4})\)', parent_dir)
                    if year_match:
                        year = year_match.group(1)
                        title = re.sub(r'\s*\(\d{4}\).*', '', parent_dir).strip()
                        key = f"{title}_{year}"
                    else:
                        # 无法识别,跳过
                        continue
                
                file_info = self.__extract_file_info(file_path.name)
                file_size = file_path.stat().st_size / (1024 * 1024)  # MB
                
                groups[key].append({
                    'path': str(file_path),
                    'size': round(file_size, 2),
                    'resolution': file_info['resolution'],
                    'source': file_info['source'],
                    'codec': file_info['codec']
                })
            except Exception as e:
                logger.error(f"处理文件 {file_path} 失败:{str(e)}")
        
        # 筛选重复组
        duplicates = []
        for key, file_list in groups.items():
            if len(file_list) >= self._min_duplicate_count:
                # 提取信息
                tmdbid = key.split('_')[1] if key.startswith('tmdb_') else None
                
                # 从第一个文件的父目录提取标题和年份
                first_file = Path(file_list[0]['path'])
                parent_dir = first_file.parent.name
                
                year_match = re.search(r'\((\d{4})\)', parent_dir)
                year = year_match.group(1) if year_match else ''
                title = re.sub(r'\s*\(\d{4}\).*', '', parent_dir).strip()
                
                total_size = sum(f['size'] for f in file_list)
                
                duplicates.append({
                    'type': '电影',
                    'title': title,
                    'year': year,
                    'tmdbid': tmdbid,
                    'season': None,
                    'episode': None,
                    'count': len(file_list),
                    'total_size': round(total_size, 2),
                    'files': file_list
                })
        
        return duplicates

    def __detect_tv_duplicates(self, files: List[Path]) -> List[Dict]:
        """检测剧集重复"""
        # 第一步:按(tmdbid或剧名, season, episode)分组,找出重复集
        episode_groups = defaultdict(list)
        
        for file_path in files:
            try:
                # 提取季集号
                se_info = self.__extract_season_episode(file_path.name)
                if not se_info:
                    continue
                
                season, episode = se_info
                
                # 获取剧集目录(父目录的父目录)
                tv_dir = file_path.parent.parent.name
                
                # 提取tmdbid或剧名
                tmdbid = self.__extract_tmdbid(tv_dir)
                # season和episode已经是zfill(2)格式化的字符串,直接使用
                if tmdbid:
                    episode_key = f"tmdb_{tmdbid}_S{season}E{episode}"
                else:
                    # 从目录名提取剧名
                    title = re.sub(r'\s*\(\d{4}\).*', '', tv_dir).strip()
                    episode_key = f"{title}_S{season}E{episode}"
                
                file_info = self.__extract_file_info(file_path.name)
                file_size = file_path.stat().st_size / (1024 * 1024)  # MB
                
                episode_groups[episode_key].append({
                    'path': str(file_path),
                    'size': round(file_size, 2),
                    'resolution': file_info['resolution'],
                    'source': file_info['source'],
                    'codec': file_info['codec'],
                    'tv_dir': tv_dir,
                    'season': season,
                    'episode': episode,
                    'tmdbid': tmdbid
                })
            except Exception as e:
                logger.error(f"处理文件 {file_path} 失败:{str(e)}")
        
        # 第二步:过滤出有重复的集
        duplicate_episodes = {k: v for k, v in episode_groups.items() if len(v) >= self._min_duplicate_count}
        
        # 第三步:按剧集+季度合并,将同一季的重复集合并显示
        season_groups = defaultdict(lambda: {
            'episodes': set(),
            'files': [],
            'tmdbid': None,
            'title': None,
            'year': None,
            'season': None
        })
        
        for episode_key, file_list in duplicate_episodes.items():
            if not file_list:
                continue
            
            # 从第一个文件获取基本信息
            first_file = file_list[0]
            tv_dir = first_file['tv_dir']
            season = first_file['season']
            episode = first_file['episode']
            tmdbid = first_file.get('tmdbid')
            
            # 提取年份和标题
            year_match = re.search(r'\((\d{4})\)', tv_dir)
            year = year_match.group(1) if year_match else None
            title = re.sub(r'\s*\(\d{4}\).*', '', tv_dir).strip()
            
            # 按季分组的key (season是字符串,已经是02d格式)
            if tmdbid:
                season_key = f"tmdb_{tmdbid}_S{season}"
            else:
                season_key = f"{title}_S{season}"
            
            # 添加到季度组
            season_group = season_groups[season_key]
            season_group['tmdbid'] = tmdbid
            season_group['title'] = title
            season_group['year'] = year
            season_group['season'] = season
            season_group['episodes'].add(episode)
            season_group['files'].extend(file_list)
        
        # 第四步:转换为最终格式
        duplicates = []
        for season_key, group_data in season_groups.items():
            # 合并集号列表并排序 (episodes是字符串列表)
            episodes = sorted(list(group_data['episodes']))
            episode_str = ','.join([f"E{ep}" for ep in episodes])
            
            total_size = sum(f['size'] for f in group_data['files'])
            
            duplicates.append({
                'type': '剧集',
                'title': group_data['title'],
                'year': group_data['year'],
                'tmdbid': group_data['tmdbid'],
                'season': group_data['season'],
                'episode_str': episode_str,  # 显示用的集号字符串
                'episode_count': len(episodes),  # 重复集数
                'count': len(group_data['files']),  # 总文件数
                'total_size': round(total_size, 2),
                'files': group_data['files']
            })
        
        return duplicates

    def delete_file(self, file_path: str, apikey: str) -> schemas.Response:
        """
        删除文件API
        """
        # 验证API密钥
        if apikey != settings.API_TOKEN:
            return schemas.Response(success=False, message="API密钥错误")
        
        try:
            from pathlib import Path
            import os
            
            file = Path(file_path)
            if not file.exists():
                return schemas.Response(success=False, message="文件不存在")
            
            # 删除文件
            os.remove(file_path)
            logger.info(f"已删除文件: {file_path}")
            
            # 检查并删除空文件夹
            parent_dir = file.parent
            self.__remove_empty_dirs(parent_dir)
            
            # 删除了文件后,尝试同步删除网盘对应的文件
            self.__delete_cloud_file(file_path)
            
            # 更新缓存的检测结果
            result = self.get_data('detection_result')
            if result and result.get('duplicates'):
                updated = False
                for dup in result['duplicates']:
                    # 从文件列表中移除已删除的文件
                    original_count = len(dup['files'])
                    dup['files'] = [f for f in dup['files'] if f['path'] != file_path]
                    if len(dup['files']) < original_count:
                        # 更新统计信息
                        dup['count'] = len(dup['files'])
                        dup['total_size'] = round(sum(f['size'] for f in dup['files']), 2)
                        updated = True
                
                # 移除文件数小于最小重复数的组
                result['duplicates'] = [d for d in result['duplicates'] if d['count'] >= self._min_duplicate_count]
                
                if updated:
                    self.save_data('detection_result', result)
            
            return schemas.Response(success=True, message="文件删除成功")
        except Exception as e:
            logger.error(f"删除文件失败: {str(e)}")
            return schemas.Response(success=False, message=f"删除失败: {str(e)}")
    
    def __run_detection(self):
        """运行重复检测"""
        if not self._scan_paths:
            logger.warning("未配置扫描路径")
            return
        
        logger.info("开始重复文件扫描...")
        scan_paths = [p.strip() for p in self._scan_paths.split('\n') if p.strip()]
        extensions = [e.strip() for e in self._file_extensions.split(',') if e.strip()]
        
        all_duplicates = []
        
        for scan_path in scan_paths:
            logger.info(f"扫描路径:{scan_path}")
            files = self.__scan_files(scan_path, extensions)
            
            if not files:
                continue
            
            # 根据扫描类型执行检测
            if self._scan_type == 'movie':
                duplicates = self.__detect_movie_duplicates(files)
            elif self._scan_type == 'tv':
                duplicates = self.__detect_tv_duplicates(files)
            else:  # auto
                # 简单判断:如果路径包含Season字样,视为剧集
                tv_files = [f for f in files if 'Season' in str(f)]
                movie_files = [f for f in files if f not in tv_files]
                
                duplicates = []
                if movie_files:
                    duplicates.extend(self.__detect_movie_duplicates(movie_files))
                if tv_files:
                    duplicates.extend(self.__detect_tv_duplicates(tv_files))
            
            all_duplicates.extend(duplicates)
        
        # 保存结果
        result = {
            'scan_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'scan_paths': scan_paths,
            'duplicates': all_duplicates
        }
        self.save_data('detection_result', result)
        
        logger.info(f"重复文件扫描完成,发现 {len(all_duplicates)} 组重复文件")

    def get_page(self) -> List[dict]:
        """拼装插件详情页面"""
        result = self.get_data('detection_result')
        
        if not result:
            return [
                {
                    'component': 'div',
                    'text': '暂无数据,请先配置扫描路径并运行扫描',
                    'props': {
                        'class': 'text-center text-h6 text-grey pa-4',
                    }
                }
            ]
        
        duplicates = result.get('duplicates', [])
        scan_time = result.get('scan_time', '')
        scan_paths = result.get('scan_paths', [])
        
        if not duplicates:
            return [
                {
                    'component': 'VCard',
                    'props': {
                        'variant': 'tonal'
                    },
                    'content': [
                        {
                            'component': 'VCardText',
                            'props': {
                                'class': 'text-center'
                            },
                            'text': f'扫描时间: {scan_time}\n扫描路径: {", ".join(scan_paths)}\n\n✅ 未发现重复文件'
                        }
                    ]
                }
            ]
        
        # 统计信息
        movie_count = len([d for d in duplicates if d['type'] == '电影'])
        tv_count = len([d for d in duplicates if d['type'] == '剧集'])
        total_files = sum(d['count'] for d in duplicates)
        total_size = sum(d['total_size'] for d in duplicates)
        
        # 顶部统计卡片
        stat_cards = [
            {
                'component': 'VRow',
                'content': [
                    # 扫描时间
                    {
                        'component': 'VCol',
                        'props': {
                            'cols': 12,
                            'md': 3
                        },
                        'content': [
                            {
                                'component': 'VCard',
                                'props': {
                                    'variant': 'tonal',
                                    'color': 'primary'
                                },
                                'content': [
                                    {
                                        'component': 'VCardText',
                                        'props': {
                                            'class': 'd-flex align-center'
                                        },
                                        'content': [
                                            {
                                                'component': 'div',
                                                'content': [
                                                    {
                                                        'component': 'span',
                                                        'props': {
                                                            'class': 'text-caption'
                                                        },
                                                        'text': '扫描时间'
                                                    },
                                                    {
                                                        'component': 'div',
                                                        'props': {
                                                            'class': 'text-subtitle-2'
                                                        },
                                                        'text': scan_time
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    # 重复组数
                    {
                        'component': 'VCol',
                        'props': {
                            'cols': 12,
                            'md': 3
                        },
                        'content': [
                            {
                                'component': 'VCard',
                                'props': {
                                    'variant': 'tonal',
                                    'color': 'warning'
                                },
                                'content': [
                                    {
                                        'component': 'VCardText',
                                        'props': {
                                            'class': 'd-flex align-center'
                                        },
                                        'content': [
                                            {
                                                'component': 'div',
                                                'content': [
                                                    {
                                                        'component': 'span',
                                                        'props': {
                                                            'class': 'text-caption'
                                                        },
                                                        'text': '重复组数'
                                                    },
                                                    {
                                                        'component': 'div',
                                                        'props': {
                                                            'class': 'd-flex align-center flex-wrap'
                                                        },
                                                        'content': [
                                                            {
                                                                'component': 'span',
                                                                'props': {
                                                                    'class': 'text-h6'
                                                                },
                                                                'text': str(len(duplicates))
                                                            },
                                                            {
                                                                'component': 'span',
                                                                'props': {
                                                                    'class': 'text-caption ms-2'
                                                                },
                                                                'text': f'(电影:{movie_count} 剧集:{tv_count})'
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    # 重复文件数
                    {
                        'component': 'VCol',
                        'props': {
                            'cols': 12,
                            'md': 3
                        },
                        'content': [
                            {
                                'component': 'VCard',
                                'props': {
                                    'variant': 'tonal',
                                    'color': 'error'
                                },
                                'content': [
                                    {
                                        'component': 'VCardText',
                                        'props': {
                                            'class': 'd-flex align-center'
                                        },
                                        'content': [
                                            {
                                                'component': 'div',
                                                'content': [
                                                    {
                                                        'component': 'span',
                                                        'props': {
                                                            'class': 'text-caption'
                                                        },
                                                        'text': '重复文件数'
                                                    },
                                                    {
                                                        'component': 'div',
                                                        'props': {
                                                            'class': 'text-h6'
                                                        },
                                                        'text': str(total_files)
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    # 总大小
                    {
                        'component': 'VCol',
                        'props': {
                            'cols': 12,
                            'md': 3
                        },
                        'content': [
                            {
                                'component': 'VCard',
                                'props': {
                                    'variant': 'tonal',
                                    'color': 'info'
                                },
                                'content': [
                                    {
                                        'component': 'VCardText',
                                        'props': {
                                            'class': 'd-flex align-center'
                                        },
                                        'content': [
                                            {
                                                'component': 'div',
                                                'content': [
                                                    {
                                                        'component': 'span',
                                                        'props': {
                                                            'class': 'text-caption'
                                                        },
                                                        'text': '总大小'
                                                    },
                                                    {
                                                        'component': 'div',
                                                        'props': {
                                                            'class': 'text-h6'
                                                        },
                                                        'text': f'{total_size:.2f} MB'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
        
        
        
        # 重复文件列表
        duplicate_cards = []
        for dup in duplicates:
            # 构建标题
            title_chips = []
            if dup['type'] == '电影':
                title_icon = 'mdi-movie'
                title_text = f"{dup['title']}"
                if dup['year']:
                    title_text += f" ({dup['year']})"
            else:  # 剧集
                title_icon = 'mdi-television'
                title_text = f"{dup['title']}"
                if dup['year']:
                    title_text += f" ({dup['year']})"
                # 只显示季号,不显示集号列表
                title_text += f" - S{dup['season']}"
            
            # TMDB ID 徽章
            if dup['tmdbid']:
                title_chips.append({
                    'component': 'VChip',
                    'props': {
                        'size': 'small',
                        'color': 'secondary',
                        'variant': 'outlined',
                        'class': 'ms-2'
                    },
                    'text': f"TMDB: {dup['tmdbid']}"
                })
            
            # 重复数量徽章 - 对于剧集显示重复集数和总文件数
            if dup['type'] == '剧集':
                count_text = f'{dup["episode_count"]} 集 / {dup["count"]} 个文件'
            else:
                count_text = f'重复 {dup["count"]} 个'
            
            title_chips.append({
                'component': 'VChip',
                'props': {
                    'size': 'small',
                    'color': 'error',
                    'class': 'ms-2'
                },
                'text': count_text
            })
            
            # 文件列表
            file_items = []
            for idx, file_info in enumerate(dup['files']):
                # 构建文件信息标签
                chips = []
                if file_info.get('resolution'):
                    chips.append({
                        'component': 'VChip',
                        'props': {
                            'size': 'small',
                            'color': 'primary',
                            'class': 'ma-1'
                        },
                        'text': file_info['resolution']
                    })
                if file_info.get('source'):
                    chips.append({
                        'component': 'VChip',
                        'props': {
                            'size': 'small',
                            'color': 'success',
                            'class': 'ma-1'
                        },
                        'text': file_info['source']
                    })
                if file_info.get('codec'):
                    chips.append({
                        'component': 'VChip',
                        'props': {
                            'size': 'small',
                            'color': 'info',
                            'class': 'ma-1'
                        },
                        'text': file_info['codec']
                    })
                chips.append({
                    'component': 'VChip',
                    'props': {
                        'size': 'small',
                        'color': 'warning',
                        'class': 'ma-1'
                    },
                    'text': f"{file_info['size']} MB"
                })
                
                
                file_items.append({
                    'component': 'div',
                    'props': {
                        'class': 'pa-2 d-flex align-center'
                    },
                    'content': [
                        {
                            'component': 'div',
                            'props': {
                                'class': 'flex-grow-1'
                            },
                            'content': [
                                {
                                    'component': 'div',
                                    'props': {
                                        'class': 'd-flex align-center flex-wrap mb-1'
                                    },
                                    'content': [
                                        {
                                            'component': 'VIcon',
                                            'props': {
                                                'icon': 'mdi-file',
                                                'size': 'small',
                                                'class': 'me-2'
                                            }
                                        },
                                        {
                                            'component': 'span',
                                            'props': {
                                                'class': 'text-caption me-2'
                                            },
                                            'text': f"#{idx + 1}"
                                        },
                                        *chips
                                    ]
                                },
                                {
                                    'component': 'div',
                                    'props': {
                                        'class': 'text-caption text-grey ms-7'
                                    },
                                    'text': file_info['path']
                                }
                            ]
                        },
                        {
                            'component': 'VBtn',
                            'props': {
                                'size': 'small',
                                'color': 'error',
                                'variant': 'outlined',
                                'class': 'ms-2'
                            },
                            'text': '删除',
                            'events': {
                                'click': {
                                    'api': 'plugin/DuplicateDetector/delete_file',
                                    'method': 'get',
                                    'params': {
                                        'file_path': file_info['path'],
                                        'apikey': settings.API_TOKEN
                                    }
                                }
                            }
                        }
                    ]
                })
            
            
            
            duplicate_cards.append({
                'component': 'VCol',
                'props': {
                    'cols': 12
                },
                'content': [
                    {
                        'component': 'VCard',
                        'props': {
                            'variant': 'outlined'
                        },
                        'content': [
                            {
                                'component': 'VCardTitle',
                                'props': {
                                    'class': 'd-flex align-center flex-wrap'
                                },
                                'content': [
                                    {
                                        'component': 'VIcon',
                                        'props': {
                                            'icon': title_icon,
                                            'class': 'me-2',
                                            'color': 'warning'
                                        }
                                    },
                                    {
                                        'component': 'span',
                                        'text': title_text
                                    },
                                    *title_chips
                                ]
                            },
                            {
                                'component': 'VCardText',
                                'props': {
                                    'class': 'pa-0'
                                },
                                'content': [
                                    {
                                        'component': 'VExpansionPanels',
                                        'props': {
                                            'flat': True
                                        },
                                        'content': [
                                            {
                                                'component': 'VExpansionPanel',
                                                'content': [
                                                    {
                                                        'component': 'VExpansionPanelTitle',
                                                        'props': {
                                                            'class': 'text-subtitle-2'
                                                        },
                                                        'content': [
                                                            {
                                                                'component': 'div',
                                                                'props': {
                                                                    'class': 'd-flex align-center'
                                                                },
                                                                'content': [
                                                                    {
                                                                        'component': 'VIcon',
                                                                        'props': {
                                                                            'icon': 'mdi-file-multiple',
                                                                            'size': 'small',
                                                                            'class': 'me-2'
                                                                        }
                                                                    },
                                                                    {
                                                                        'component': 'span',
                                                                        'text': f'文件列表 ({dup["count"]} 个文件, {dup["total_size"]:.2f} MB)'
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        'component': 'VExpansionPanelText',
                                                        'content': file_items
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            })
        
        
        
        return [
            {
                'component': 'div',
                'content': [
                    *stat_cards,
                    {
                        'component': 'VRow',
                        'props': {
                            'class': 'mt-4'
                        },
                        'content': duplicate_cards
                    }
                ]
            }
        ]

    def stop_service(self):
        """退出插件"""
        pass
    def __delete_cloud_file(self, strm_path: str):
        """同步删除网盘文件"""
        if not self._strm_library_path or not self._cloud_library_path:
            return
            
        try:
            # 转换路径
            cloud_file = self.__convert_strm_to_cloud_path(strm_path)
            if cloud_file:
                logger.info(f"找到对应的网盘文件: {cloud_file}")
                import os
                from pathlib import Path
                
                # 删除文件
                if self._cloud_storage and self._cloud_storage != 'local':
                    try:
                        # 使用 StorageChain 删除
                        fileitem = self._storagechain.get_file_item(
                            storage=self._cloud_storage,
                            path=Path(cloud_file)
                        )
                        if fileitem:
                            self._storagechain.delete_media_file(fileitem=fileitem)
                            logger.info(f"已通过StorageChain({self._cloud_storage})删除网盘文件: {cloud_file}")
                            
                            # 删除空文件夹 (对于网盘如果是目录对象可能需要特殊处理, 这里先尝试用StorageChain操作? 
                            # samediasyncdel 中是 delete_file(fileitem) 如果是 dir
                            # 这里暂时不处理网盘空目录, 或者如果有本地挂载仍可用remove_empty_dirs)
                        else:
                            logger.warn(f"StorageChain未找到文件: {cloud_file}, 尝试使用本地删除")
                            if os.path.exists(cloud_file):
                                os.remove(cloud_file)
                                logger.info(f"已同步删除网盘文件: {cloud_file}")
                    except Exception as e:
                         logger.error(f"StorageChain删除失败: {e}, 尝试本地删除")
                         # 降级重试
                         if os.path.exists(cloud_file):
                            os.remove(cloud_file)
                            logger.info(f"已同步删除网盘文件: {cloud_file}")
                else:
                    # 本地删除
                    if os.path.exists(cloud_file):
                        os.remove(cloud_file)
                        logger.info(f"已同步删除网盘文件: {cloud_file}")
                    
                # 删除空文件夹(尝试本地操作,因为网盘通常也有本地挂载路径)
                self.__remove_empty_dirs(Path(cloud_file).parent)
        except Exception as e:
            logger.error(f"同步删除网盘文件失败: {str(e)}")

    def __convert_strm_to_cloud_path(self, strm_path: str) -> Optional[str]:
        """将strm文件路径转换为网盘路径"""
        if not strm_path.endswith('.strm'):
            return None
        
        # 规范化路径以确保能够正确替换
        strm_path = strm_path.replace('\\', '/')
        strm_lib = self._strm_library_path.replace('\\', '/')
        cloud_lib = self._cloud_library_path.replace('\\', '/')
        
        # 确保路径以/结尾,避免部分匹配错误
        if not strm_lib.endswith('/'):
            strm_lib += '/'
        if not cloud_lib.endswith('/'):
            cloud_lib += '/'
            
        # 路径替换
        if strm_path.startswith(strm_lib):
            cloud_path = strm_path.replace(strm_lib, cloud_lib, 1)
        else:
            logger.debug(f"路径不匹配: {strm_path} 不以 {strm_lib} 开头")
            return None
        
        # 移除.strm后缀,得到目标文件的基础路径(含文件名但不含后缀)
        cloud_path_without_ext = cloud_path[:-5]  # 移除.strm
        
        # 查找对应的媒体文件
        return self.__find_media_file(cloud_path_without_ext)

    def __find_media_file(self, base_path: str) -> Optional[str]:
        """查找实际的媒体文件(支持本地和StorageChain)"""
        from pathlib import Path
        
        try:
            base_path_obj = Path(base_path)
            parent = base_path_obj.parent
            target_stem = base_path_obj.name
            
            # 本地存储或未配置StorageChain
            if not self._cloud_storage or self._cloud_storage == 'local':
                if not parent.exists():
                    logger.debug(f"网盘父目录不存在(Local): {parent}")
                    return None
                    
                for file in parent.iterdir():
                    if file.is_file():
                        if file.stem == target_stem:
                            if file.suffix.lower() in ['.mkv', '.mp4', '.avi', '.ts', '.m2ts', '.iso', '.mov', '.wmv', '.flv']:
                                return str(file)
            else:
                # 使用 StorageChain 查找
                try:
                    # 获取父目录信息
                    parent_item = self._storagechain.get_file_item(
                        storage=self._cloud_storage,
                        path=parent
                    )
                    
                    if not parent_item:
                        logger.debug(f"网盘父目录不存在({self._cloud_storage}): {parent}")
                        return None

                    # 列出目录文件
                    files = self._storagechain.list_files(parent_item)
                    if not files:
                        logger.debug(f"目录为空: {parent}")
                        return None
                        
                    # 调试日志: 打印查找目标
                    # logger.debug(f"正在查找目标Stem: {target_stem} (目录: {parent})")

                    for item in files:
                        if not item:
                            continue
                            
                        # 获取文件名参数
                        item_basename = item.basename
                        item_ext = item.extension
                        
                        # StorageChain的basename行为可能不一致(有的含后缀,有的不含)
                        # 所以我们需要两种匹配方式:
                        
                        # 1. 尝试计算stem (假设basename含后缀)
                        item_stem = Path(item_basename).stem
                        
                        # 调试日志
                        # logger.debug(f"检查文件: {item_basename} (Stem: {item_stem}, Ext: {item_ext})")
                        
                        # 匹配逻辑:
                        # 规则1: basename 直接等于 target_stem (说明basename不含后缀,且匹配)
                        # 规则2: item_stem 等于 target_stem (说明basename含后缀,去除后缀后匹配)
                        
                        is_match = False
                        if item_basename == target_stem:
                            is_match = True
                        elif item_stem == target_stem:
                            is_match = True
                            
                        if is_match:
                            if not item_ext:
                                continue
                                
                            # 统一后缀格式(确保带点并小写)
                            if not item_ext.startswith('.'):
                                item_ext = '.' + item_ext
                            
                            if item_ext.lower() in ['.mkv', '.mp4', '.avi', '.ts', '.m2ts', '.iso', '.mov', '.wmv', '.flv']:
                                logger.info(f"找到匹配文件(StorageChain): {item.path}")
                                return str(item.path)
                            else:
                                logger.debug(f"文件名匹配但后缀不支持: {item_basename} ({item_ext})")
                                
                except Exception as e:
                    logger.error(f"StorageChain查找文件失败: {e}")
                    return None
            
            logger.debug(f"未在 {parent} 中找到名为 {target_stem} 的媒体文件")
            return None
            
        except Exception as e:
            logger.error(f"查找媒体文件出错: {e}")
            return None

    def __remove_empty_dirs(self, directory):
        """递归删除空文件夹"""
        try:
            from pathlib import Path
            if isinstance(directory, str):
                directory = Path(directory)
            
            # 仅处理本地路径的空文件夹删除
            # 如果是网盘路径且非local, 可能无法直接使用rmdir
            if self._cloud_storage and self._cloud_storage != 'local':
                # TODO: 实现StorageChain的空目录删除? 目前先跳过或者尝试调用API
                return

            if directory.exists() and not any(directory.iterdir()):
                directory.rmdir()
                logger.info(f"已删除空文件夹: {directory}")
                
                # 递归检查上级目录
                parent = directory.parent
                if parent.exists() and not any(parent.iterdir()):
                    self.__remove_empty_dirs(parent)
        except Exception as e:
            logger.warning(f"删除空文件夹时出错: {str(e)}")
