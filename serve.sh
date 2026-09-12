#!/usr/bin/env bash
# =============================================================
#  酒店点评回复智能体 · 一键内网共享
#  用法:  ./serve.sh [端口]        默认端口 8899
#  效果:  同一局域网（同一个 WiFi / 公司网）的同事、手机、平板
#         打开终端里打印的地址即可使用，无需安装任何东西。
#  停止:  在终端按 Ctrl + C
# =============================================================
set -euo pipefail

PORT="${1:-8899}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

IP=""
for IFACE in en0 en1 en2; do
  CAND="$(ipconfig getifaddr "$IFACE" 2>/dev/null || true)"
  if [ -n "$CAND" ]; then IP="$CAND"; break; fi
done
if [ -z "$IP" ]; then
  IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
fi
[ -z "$IP" ] && IP="127.0.0.1"

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ 未找到 python3，请先安装 Python 3 后重试（macOS 可用 brew install python3）"
  exit 1
fi

cat <<EOF

  ┌──────────────────────────────────────────────────────────┐
  │  🏨 酒店点评回复智能体 · 已启动共享服务                   │
  └──────────────────────────────────────────────────────────┘

   本机访问 :  http://127.0.0.1:${PORT}/
   同事访问 :  http://${IP}:${PORT}/
   手机访问 :  http://${IP}:${PORT}/     （需与本机连同一个 WiFi）

   目录     :  ${DIR}
   端口     :  ${PORT}（被占用时改用 ./serve.sh 8900）
   停止服务 :  Ctrl + C

   提示：工具是纯前端页面，所有人打开的是同一份文件，
        但每人的门店配置与历史记录只保存在各自浏览器里。
        想让全店话术统一 → 打开「⚙️ 门店配置 → 导出 JSON」发给同事导入。

EOF

cd "$DIR"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
