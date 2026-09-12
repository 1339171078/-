#!/bin/bash
# =============================================================
#  双击本文件即可打开「酒店点评回复智能体」
#  （用于 .html 默认打开程序损坏 / 双击没反应的情况）
# =============================================================
cd "$(dirname "$0")" || exit 1

TARGET="index.html"
[ -f "$TARGET" ] || { echo "❌ 找不到 index.html，请确认本文件与 index.html 在同一文件夹"; read -r -p "按回车关闭…"; exit 1; }

pick_browser() {
  for APP in "Google Chrome" "Microsoft Edge" "Firefox" "Arc" "Brave Browser"; do
    [ -d "/Applications/$APP.app" ] && { echo "$APP"; return; }
  done
  for P in "/System/Applications/Safari.app" "/Applications/Safari.app"; do
    [ -d "$P" ] && { echo "Safari"; return; }
  done
}

BROWSER="$(pick_browser)"
if [ -n "$BROWSER" ]; then
  echo "正在用 ${BROWSER} 打开工具…"
  open -a "$BROWSER" "$TARGET"
else
  echo "未找到常见浏览器，尝试用系统默认程序打开…"
  open "$TARGET"
fi
