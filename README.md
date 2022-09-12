## 介绍

Snippet Cat 是一款 VSCODE 拓展,用于管理代码片段.


![介绍](https://cdn.yuelili.com/20220911070958.webp)

## 功能

- 片段管理,无限层级(文件/文件夹) 
- 两种视图:支持树状 所有文件平铺
- 支持同步(webdav/github/gitee)
- webdav只支持文本类型同步(为了加快同步速度)

## DONE

- 主体框架
- 两种视图
- webdav/github/gitee同步
- 用户设置
- 新建片段文件后缀 基于上一次新建
- 支持不同工作环境同步文件夹信息(  {机器1mac:片段路径1,机器2mac:片段路径2) 方便公司家里同步
- 优先显示文件夹
- 过滤(目前过滤.开头的文件)
- 文件夹拖拽
- 同步前自动备份

## DOING

- 搜索
- 排序

## 不重要

- 自定义过滤内容


## webdav 同步逻辑

上传:直接覆盖云端所有内容.如果本地没有的文件,但是云端有 => 云端的会被删除, 即使云端文件较新,也会覆盖云端!

下传:直接覆盖本地所有内容,如果云端没有的文件,但是本地有 => 本地的会被删除, 即使本地文件较新,也会覆盖本地!

本地云端都有,且修改日期一致,则跳过同步

## github同步

先初始化仓库(在本地打开git base操作)

```
echo "# snippets" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:你的git仓库
git push -u origin main
```

创建忽略设置文件 .gitignore (以下是忽略"点"开头的文件与文件夹)
```
.*
```

此后正常使用插件的上传和下载命令即可

自定义命令:vsc插件设置里 设置 pull 和 push命令(用 | 分割每行命令)

%time : 代表当前时间戳 yyyymmddHHMMSSms

%待续

