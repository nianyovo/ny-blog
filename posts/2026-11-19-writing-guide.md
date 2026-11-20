---
title: "手搓一座零依赖个人站：把赛博领地握在自己手里"
date: "2026-11-19"
category: "造物"
tags: ["独立站点", "极简架构"]
featured: true
private: false
cover: "uploads/desk-notebook.svg"
summary: "甩掉几百兆的 node_modules，只留纯文本、本地文件夹和自己写得懂的几百行代码。"
---

折腾过一圈现成框架和重型主题之后，最后还是决定自己动手写一个最干净的底座：没有打包器套娃，没有第三方图床焦虑，所有文字就是硬盘里的 `.md` 文件。

![](../uploads/evening-dusk.svg)

## 为什么偏爱零依赖

工具越薄，写的欲望就越不容易被配置磨掉。==真正值得留下来的只有内容本身==，而不是过两年就跑不起来的构建脚本。

- [x] 纯本地 Markdown 与图片管理
- [x] 黑胶白噪音与 Web Audio 实时合成
- [x] 极客终端与全站毫秒级检索
- [ ] 年底前写满十篇长文

> 少即是多，但克制不代表无聊——在克制的骨架里藏一点好玩的交互彩蛋，才是独立站最大的乐趣。

## 极简构建流

```bash
node blog.js dev     # 启动本地创作环境
node blog.js build   # 生成纯净静态产物 dist/
```
