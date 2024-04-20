## 介绍

Snippet Cat 是一款 VSCODE 拓展,用于管理代码片段. 当然你也可以拿来做笔记(相当于一个全局的文件夹)

![介绍](https://cdn.yuelili.com/20220912212928.webp)

## 功能

- 片段管理,无限层级(文件/文件夹)
- 两种视图:支持树状 所有文件平铺
- 支持同步(github/gitee)
- 函数大纲/markdown二级标题
- 一键储存代码片段
- 多语言支持

## 亮点

- 片段文件后缀 是基于上一次新建文件的后缀
- 支持不同工作环境同步文件夹信息,方便公司家里同步

## 无法安装?

请升级您的vscode到1.71,因为文件拖拽API是1.68才支持的

## 管理器视图

- 文件/文件夹增删改查
- 同步前自动备份

## 大纲视图

- 一键复制代码
- 单击标题 跳转到指定位置

## 一键储存代码

编辑区右键:保存代码片段,可以一键生成指定规则的代码片段到仓库

- 规则基于 src/rules/languageList.json(vscode官方提供)
- 如果没有您的语言 请pr
- 如果我的规则写错了 请pr

## 大纲书写规格

```txt
@start
@name:your function name
@description: your function description

...
your code
...

@end

```

markdown暂时只支持二级标题,而且不支持单击跳转,我不会写~

`## your title`

## 如何github同步

1. 打开你的存储文件夹

2. 先初始化仓库(在本地打开git base操作 / 在vscode里用git工具发布 ★推荐★)

```cmd
echo "# snippets" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:你的git仓库
git push -u origin main
```

3.创建忽略设置文件 .gitignore (以下是忽略"点"开头的文件与文件夹)

```cmd
.*
```

此后正常使用插件的上传和下载命令即可

自定义命令:VSCODE 插件设置里 设置 pull 和 push命令(用 | 分割每行命令)

%time : 代表当前时间戳 yyyymmddHHMMSSms

## DOING

- 搜索
- AST分析代码
