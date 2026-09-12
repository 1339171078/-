# 发布到 GitHub Pages · 手把手操作指引

> ✅ **已完成发布**：https://1339171078.github.io/hotel-review-agent/
> 仓库：https://github.com/1339171078/hotel-review-agent
> 本文档保留作为操作记录与后续维护参考。
>
> **后续更新方式**：把改好的文件提交到 `main` 分支（命令行 `git push`，或网页 Upload files），
> GitHub Actions 会自动重新发布，1 分钟左右生效，网址不变。
>
> ⚠️ 国内网络访问 github.com / github.io 较慢（首次打开可能 30 秒以上，偶有失败），属网络环境问题，刷新重试即可。

> 目标：拿到一个公网网址，手机、平板、同事的电脑打开就能用这个点评回复工具。
> 全程约 10 分钟，**不需要装任何软件、不需要敲命令**，只要一个免费 GitHub 账号。

---

## 第 0 步 · 注册 GitHub 账号（约 5 分钟）

1. 打开 **https://github.com/signup**（我已经帮你在 Safari 打开了）
2. 依次填写：

   | 填写项 | 说明 |
   | --- | --- |
   | Email | 常用邮箱，稍后会收到验证码 |
   | Password | 至少 8 位，需含数字和小写字母 |
   | Username | **想清楚再填**：英文/数字/连字符，它会成为你网址的一部分，例如 `yunqi-hotel` |
   | Country/Region | China |

3. 点 **Create account**
4. 输入邮箱收到的 **8 位验证码**
5. 完成拼图验证（CAPTCHA）
6. 计划选择 **Free**（免费版就够，不要选付费）
7. 若提示验证邮箱，去邮箱点确认链接

> 💡 **用户名可用性**：把你想用的用户名发给我，我可以立刻帮你查是否已被占用（不用等注册时才发现）。

---

## 第 1 步 · 创建仓库（约 1 分钟）

1. 打开 **https://github.com/new**
2. 填写：

   | 填写项 | 填什么 |
   | --- | --- |
   | Repository name | `hotel-review-agent` |
   | Description | 酒店点评回复智能体（可留空） |
   | 可见性 | 选 **Public** ⚠️ 必须公开，免费版才能开启 Pages |
   | Add a README file | ❌ 不勾 |
   | Add .gitignore | ❌ 不选 |
   | Choose a license | ❌ 不选 |

3. 点 **Create repository**

---

## 第 2 步 · 上传文件（约 2 分钟）

1. 在刚创建的仓库页面，点中间蓝色的 **uploading an existing file** 链接
2. 打开项目文件夹（我已帮你在访达里打开：`hotel-review-agent`）
3. 在访达里按 **⌘ + A** 全选，然后把文件**拖进浏览器的虚线框**
   - ⚠️ 不要拖 `.git` 文件夹（访达里默认是隐藏的，看不到就不用管）
   - ⚠️ 不要拖 `backup-launchservices-....plist`（那是你电脑的系统配置备份，与工具无关）
   - 需要上传的是这些：`index.html`、`README.md`、`sharing.md`、`serve.sh`、`samples.md`、`templates.md`、`system-prompt.md`、`agent-config.json`、`reply-tool.html`、`.gitignore`、`打开工具.command`、`共享给同事.command`
4. 等文件列表全部出现后，页面底部：
   - Commit message 填：`初始化：酒店点评回复智能体 v2`
   - 点 **Commit changes**

---

## 第 3 步 · 开启 GitHub Pages（约 1 分钟）

1. 在仓库页面点右上角 **Settings**
2. 左侧菜单中找到 **Pages**
3. **Source** 选 `Deploy from a branch`
4. **Branch** 选 `main`，右边的目录选 `/(root)`，点 **Save**
5. 等 1~2 分钟刷新页面，顶部会出现：

   ```
   Your site is live at https://<你的用户名>.github.io/hotel-review-agent/
   ```

---

## 第 4 步 · 把网址发给同事 🎉

- 公网网址：`https://<你的用户名>.github.io/hotel-review-agent/`
- 手机、平板、任何电脑、任何网络都能打开，无需安装
- 建议：把网址生成二维码贴在办公室/前台，同事扫码即用

---

## 后续更新工具

仓库页面 → **Add file** → **Upload files** → 把新的 `index.html` 拖进去覆盖 → **Commit changes**。
GitHub Pages 会在 1 分钟左右自动重新发布，网址不变。

---

## 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 打开网址是 404 | 刚开启 Pages 需要等 1~2 分钟；确认 Branch 选的是 `main`、目录选的是 `/(root)` |
| 打开是空白页 | 确认 `index.html` 在仓库**根目录**，不是被放进了子文件夹 |
| 上传时漏了文件 | 重复第 2 步补传即可，不会覆盖已有文件 |
| 想改成不公开 | GitHub Pages 免费版要求仓库公开；如需私有可考虑 Cloudflare Pages / Vercel |
| 想删掉重来 | 仓库 Settings → 拉到最下方 → Delete this repository |

---

## 备选方案 · 不用注册也能出公网网址（2 分钟）

如果你只是想**马上**给同事一个能打开的网址，可以先不注册 GitHub：

用 Cloudflare 临时隧道（Quick Tunnel）把本机已经跑起来的共享服务
（`http://127.0.0.1:8899`）发布到公网，会得到一个 https 网址，**无需任何账号**。

- ✅ 优点：2 分钟搞定、零注册、自带 https
- ⚠️ 缺点：**必须保持电脑开着且终端不关**；每次重启网址都会变；只适合临时/内部使用

需要的话直接跟我说，我帮你配好并把网址给你。

---

## 为什么不能由我直接上传？

发布到 GitHub 需要**你的账号身份**（注册时的邮箱验证码、拼图验证、登录态）。
这些安全环节必须由你本人在浏览器完成，任何工具都无法代劳。
你完成第 1 步（注册 + 授权）之后，剩下的我可以接手：配好密钥后，上传与后续更新我都能替你做。
