## 介绍

Snippet Cat 是一款 VSCODE 拓展,用于管理代码片段.

## 功能

- 片段管理,无限层级(文件/文件夹) 
- 两种视图:支持树状 所有文件平铺
- 支持同步(webdav/github/gitee)
- 只支持文本类型同步(为了加快同步速度)

## DONE

- 主体框架
- 两种视图
- webdav
- 插件用户设置
- 新建片段文件后缀 基于上一次新建
- 支持不同工作环境同步文件夹信息(  {机器1mac:片段路径1,机器2mac:片段路径2) 方便公司家里同步
- 优先显示文件夹

## DOING

- 搜索
- github/gitee同步
- 文件夹拖拽
<<<<<<< HEAD


## 版本更新

=> 0.0.1 测试中

   0.0.2 上架拓展市场
=======
- 增加备份文件夹
>>>>>>> f2e7b5ea70011a99e12a26c65eae330295e11796



## webdav 同步逻辑

上传:直接覆盖云端所有内容.如果本地没有的文件,但是云端有 => 云端的会被删除, 即使云端文件较新,也会覆盖云端!

下传:直接覆盖本地所有内容,如果云端没有的文件,但是本地有 => 本地的会被删除, 即使本地文件较新,也会覆盖本地!

本地云端都有,且修改日期一致,则跳过同步

<<<<<<< HEAD
## 

git init
初始化
git add .
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:Yuelioi/snippets.git
git push -u origin main

## 1 远程创建一个仓库,并在本地初始化

git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:Yuelioi/snippets.git
git push -u origin main

## 2 推送

git add .
git commit -m "2131"
git push -u origin main

## 2 异常推送

git branch dev
git add .
git commit -m "2131"
git checkout dev
git push origin dev
git checkout main
git merge dev
git push -u origin main
git branch -D dev

## 拉取

git pull origin
=======
## github同步

先初始化仓库

然后在vsc插件设置里 设置 pull 和 push命令(用 | 分割每行命令)
>>>>>>> f2e7b5ea70011a99e12a26c65eae330295e11796
