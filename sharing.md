# 共享使用指南

工具是**纯前端单文件**（`index.html`），没有后端、没有数据库、不联网上报，所以"共享"有下面几种方式，按团队规模选一种即可。

---

## 一、三种共享方式对比

| 方式 | 适合场景 | 同事要做什么 | 数据是否互通 |
| --- | --- | --- | --- |
| **A. 直接发文件** | 1~3 人、临时用 | 双击打开 HTML | 各自独立，靠配置 JSON 统一话术 |
| **B. 内网一键共享**（推荐） | 门店/区域团队，同一 WiFi | 打开一个网址 | 各自独立，靠配置 JSON 统一话术 |
| **C. 部署到云端** | 多门店、随时随地用 | 打开一个网址 | 各自独立，靠配置 JSON 统一话术 |

> 重要：三种方式都**不保存点评原文到服务器**（工具没有后端）。每个人的"门店配置 + 历史记录"存在自己的浏览器里，因此团队统一话术的钥匙是——**门店配置导出的 JSON**。

> ✅ **本店已完成公网部署（方式 C）**：https://1339171078.github.io/hotel-review-agent/
> 仓库：https://github.com/1339171078/hotel-review-agent · `main` 分支推送后由 GitHub Actions 自动发布
>
> ⚠️ 国内网络访问 GitHub 较慢：首次打开可能 **30 秒以上**，偶有失败，刷新重试即可。
> 如果同事打不开或嫌慢，**优先用下面的方式 A（直接发文件）**——工具是单文件、离线可用、秒开，最稳。

---

## 二、方式 A：直接发文件（最简单）

把 `index.html` 通过企业微信 / 钉钉 / 邮件 / U 盘发给同事，双击用浏览器打开即可。零配置、离线可用。

> 如果对方双击 `index.html` **没反应**，通常是他的电脑把 `.html` 默认程序指向了一个已卸载的浏览器。
> 让他双击 `打开工具.command`（会自动挑一个已安装的浏览器），或右键 → 打开方式 → 选浏览器 → 勾选"始终以此方式打开"。

发给同事时建议一起发：

- `index.html` —— 工具本体（必需）
- `打开工具.command` —— 双击即用的启动器（推荐一起发，能规避上面的坑）
- `门店配置.json` —— 由工具「⚙️ 门店配置 → 导出 JSON」生成（统一店名/电话/落款/禁用词）
- `templates.md`、`samples.md` —— 话术库与示例，作为培训材料

> 注意：`.command` 是 macOS 的启动器，Windows 同事不需要它——Windows 上双击 `.html` 一般能直接用浏览器打开。

---

## 三、方式 B：内网一键共享（推荐给门店）

在同一 WiFi / 公司网络下，让同事和手机直接用浏览器访问。

### 1. 启动服务

```bash
cd hotel-review-agent
chmod +x serve.sh      # 仅首次需要
./serve.sh             # 默认端口 8899，可指定：./serve.sh 8900
```

终端会打印类似：

```
本机访问 :  http://127.0.0.1:8899/
同事访问 :  http://192.168.1.23:8899/
手机访问 :  http://192.168.1.23:8899/
```

把这个地址发到门店群即可，同事**无需安装任何软件**。停止服务按 `Ctrl + C`。

### 2. 手机访问

手机连同一个 WiFi，浏览器打开上面的地址。界面已适配手机，可当班时随手回复点评。

### 3. 长期共享（可选）

想让它开机自动可用，用 macOS 的 `launchd` 或 Linux 的 `systemd` 托管 `serve.sh`；或者直接用下面的方式 C。

### 常见问题

| 现象 | 处理 |
| --- | --- |
| 端口被占用 | 换端口：`./serve.sh 8900` |
| 同事打不开 | 确认在同一局域网；检查 macOS「系统设置 → 网络 → 防火墙」是否拦截；公司网络若隔离了设备互访（AP 隔离）需走方式 C |
| 手机打不开 | 确认手机连的是 WiFi 而不是蜂窝网络 |
| 关掉终端就断开 | 属于正常现象，服务随终端结束；需要常驻请用方式 C 或系统服务托管 |

---

## 四、方式 C：部署到云端（多门店 / 随时随地）

工具是静态页面，任何静态托管都能用，**没有任何构建步骤**。

### GitHub Pages

```bash
cd hotel-review-agent
git init && git add . && git commit -m "hotel review agent"
git branch -M main
git remote add origin git@github.com:<你的账号>/<仓库名>.git
git push -u origin main
# 仓库 Settings → Pages → Source 选 main 分支 / root → 保存
# 一分钟后访问：https://<你的账号>.github.io/<仓库名>/
```

### Vercel / Netlify（拖拽即可）

打开 vercel.com 或 app.netlify.com → 新建项目 → 把 `hotel-review-agent` 文件夹直接拖进去 → 得到公网网址。

### 企业内网 Nginx

```nginx
server {
    listen 80;
    server_name hotel-review.local;
    root /var/www/hotel-review-agent;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    # 工具是纯静态页，无需任何后端配置
}
```

### 钉钉 / 企业微信工作台

把上面的网址配成工作台应用或群机器人菜单，员工点一下就能用。

---

> 📝 工具默认不预填酒店名与电话，**两项都是选填**：留空时落款自动用「酒店管理团队」、
> 差评回复自动引导客人走平台私信，照样可以直接发布；填上后会记住在本机，导出配置 JSON 可让全店统一。

### 公开版的门店信息锁定

部署到公网后，网页会自动进入**锁定模式**：隐藏「⚙️ 门店配置」、酒店名称与电话输入框变为只读、
且不提供任何改写门店信息的入口——同事不会误改你们的店名和电话。

- **判定方式**：`file://`、`localhost`、内网 IP（`192.168.` / `10.` / `172.16-31.`）算"本机"，可自由编辑；其它地址一律锁定。
- **想让公开版自动带上店名/电话**：在本机填好 → 「门店配置 → 📋 复制锁定版配置」→ 把内容写入仓库根目录的 `site-config.json`，公开版打开即自动套用（仍然只读）。
- **公开版功能不受影响**：五维度诊断、三种语气、批量处理、导出 CSV/TXT、历史记录全部照常可用。

---

## 五、让全店话术统一：门店配置共享

工具里的门店配置（酒店名、客服电话、落款、默认语气、自定义禁用词）保存在**本机浏览器**，所以：

1. 店长/运营在一台电脑上打开工具 → 「⚙️ 门店配置」→ 填好 → **导出 JSON**；
2. 把 `酒店点评智能体-门店配置.json` 发到工作群；
3. 同事打开工具 → 「⚙️ 门店配置」→ **导入 JSON** → 全店话术、落款、禁用词一键对齐。

> 配置 JSON 只含门店信息，**不包含任何客人数据**，可以放心在群里传。

---

## 六、数据与隐私

| 项目 | 说明 |
| --- | --- |
| 是否上传数据 | ❌ 不上传。全部计算在浏览器本地完成 |
| 是否有后端/数据库 | ❌ 没有。部署时托管方只能看到静态文件 |
| 是否收集统计 | ❌ 没有埋点、没有第三方脚本、没有 CDN 依赖 |
| 数据存在哪 | 浏览器 `localStorage`（门店配置 + 最近 50 条历史） |
| 怎么清除 | 工具内「历史记录 → 清空」；或浏览器清除站点数据 |
| 客人隐私 | 点评原文仅在本机内存与本地存储中，导出 CSV/TXT 由使用者自行保管 |

> 合规提醒：公开回复中不要出现房号、客人姓名、手机号；工具的自查会提示，但最终仍需人工确认。

---

## 七、版本更新

工具升级时，**只需替换 `index.html`**：

- 门店配置与历史记录存在浏览器里，不会因为替换文件而丢失；
- 内网共享时，同事刷新页面即可拿到新版；
- 云端部署时，重新上传/推送即可。

当前版本功能见 `README.md`。

---

## 八、打不开怎么办（排障清单）

### 1. 双击 `index.html` 没反应 / 弹窗说找不到应用 ⭐ 最常见

**原因**：系统里 `.html` 的默认打开程序指向了一个**已经卸载的浏览器**（典型场景：以前装过 Chrome，后来卸载了）。此时双击任何网页文件都不会有反应，与工具本身无关。

**三步确认**（macOS）：

```bash
# 看 .html 现在被指派给谁
plutil -p ~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist | grep -A3 public.html

# 看这个程序还在不在（把 com.google.chrome 换成上面查到的值）
ls /Applications/Google\ Chrome.app 2>/dev/null || echo "Chrome 未安装 → 就是这个问题"
```

**解决办法（任选一种）**：

| 方法 | 操作 | 说明 |
| --- | --- | --- |
| ① 启动器（推荐） | 双击 `打开工具.command` | 自动在已安装的浏览器里打开，不受系统关联影响 |
| ② 右键指定 | 右键 `index.html` → 打开方式 → Safari → 勾选「始终以此方式打开」 | 一次性修好，以后双击即可 |
| ③ 终端修复 | 见下方命令 | 适合 IT 批量处理 |

```bash
# 方法③：把 .html 默认程序改回 Safari（先备份，再改，再刷新缓存）
PL=~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist
cp "$PL" ~/Desktop/launchservices-backup.plist
python3 - <<'PY'
import plistlib, pathlib
p = pathlib.Path.home()/"Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist"
d = plistlib.loads(p.read_bytes())
for h in d.get("LSHandlers", []):
    if h.get("LSHandlerContentType") == "public.html":
        h["LSHandlerRoleAll"] = "com.apple.Safari"
        h.pop("LSHandlerPreferredVersions", None)
p.write_bytes(plistlib.dumps(d))
print("已把 .html 默认程序改为 Safari")
PY
killall cfprefsd          # 让系统重新读取配置
open index.html           # 验证：现在应该能打开了
```

> 想改成别的浏览器，把 `com.apple.Safari` 换成对应 Bundle ID：Chrome `com.google.chrome`、Edge `com.microsoft.edgemac`、Firefox `org.mozilla.firefox`、Arc `company.thebrowser.Browser`。

### 2. 双击后用文本编辑器打开了一大堆代码

说明 `.html` 关联到了编辑器。右键 → 打开方式 → 选浏览器 → 勾选"始终以此方式打开"。

### 3. 页面能打开，但双击其它 `.command` 文件提示"无法打开"

`.command` 需要执行权限。在终端里执行一次：

```bash
cd hotel-review-agent && chmod +x *.command *.sh
```

### 4. 页面打开了但显示空白

- 确认文件完整（`index.html` 约 76 KB）。文件被邮件/微信压缩或截断时可能损坏，重新拷贝一次；
- 用 Safari / Chrome / Edge 打开，IE 与过旧的浏览器不支持（工具用到 `Blob`、`TextEncoder` 等标准 API）。

### 5. 同事打不开内网网址

见第三节常见问题：确认同一 WiFi、检查防火墙、公司网络 AP 隔离时改用云端部署（第四节）。
