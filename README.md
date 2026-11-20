# 自留地 · 个人独立小站（零依赖本地优先版）

基于原生 Node.js 构建的零第三方依赖个人博客、日常动态（朝夕）、书影好物珍藏与 Typora 式沉浸写作台。没有繁杂的 `node_modules`，所有文章、照片、动态与配置都以纯文本或本地文件保存在当前文件夹中。

## 快速开始

- **双击启动**：直接双击文件夹根目录下的 **`启动博客.bat`**，会自动启动本地服务并在浏览器打开 `http://localhost:4321`。
- **命令行维护**：
  ```powershell
  node blog.js dev     # 启动本地预览与写作台 (http://localhost:4321 & http://localhost:4321/studio.html)
  node blog.js build   # 编译生成对外公开静态站到 dist/ 目录（自动物理隔离全部私密内容与私密图片）
  ```
  （亦可使用 `npm run dev` / `npm run build`）

## 目录结构

- `posts/`：所有文章与日记（标准 Markdown + Frontmatter，支持与本地编辑器双向同步）
- `data/`：`moments.json`（日常动态 / 朋友圈）与 `shelf.json`（影视 / 书籍 / 游戏 / 好物收藏）
- `uploads/`：本地图片、头像与媒体资源（私密内容独占的图片在打包 `dist/` 时会自动隔离不对外输出）
- `site.config.json`：站点信息、导航文案、个人简介与拍立得配置
- `src/`：核心源码（`markdown.js` 解析引擎、`templates.js` 页面模板、`styles.css`、`client.js`、`studio.css`、`studio.js`）
- `dist/`：编译生成的 100% 纯静态公开站点，可直接部署至 GitHub Pages / Cloudflare Pages / Vercel 或任意静态服务器
