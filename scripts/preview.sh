#!/usr/bin/env bash
# 启动本地静态预览服务器，并尝试打开默认浏览器。
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT=8770
OPEN_BROWSER=1

usage() {
  echo "用法: $0 [端口] [--no-open]" >&2
  echo "  端口       默认 8770" >&2
  echo "  --no-open  只启动服务器，不自动打开浏览器" >&2
  exit 2
}

for arg in "$@"; do
  case "$arg" in
    --no-open) OPEN_BROWSER=0 ;;
    ''|*[!0-9]*) usage ;;
    *) PORT="$arg" ;;
  esac
done

if (( PORT < 1 || PORT > 65535 )); then
  echo "端口无效：$PORT" >&2
  usage
fi

command -v node >/dev/null 2>&1 || {
  echo "未找到 node，请先安装 Node.js。" >&2
  exit 1
}

# 端口被占用时直接提示，避免 Node 打印堆栈。
if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  exec 3>&- 3<&-
  echo "端口 $PORT 已被占用，请换一个端口：$0 8771" >&2
  exit 1
fi

node scripts/preview-server.cjs "$PORT" &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

URL="http://127.0.0.1:$PORT/"
# 等待服务器就绪，最多约 5 秒。
for _ in $(seq 1 50); do
  if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
    exec 3>&- 3<&-
    break
  fi
  sleep 0.1
done

echo "USCoins 本地预览: $URL"
echo "按 Ctrl+C 停止服务器。"

if (( OPEN_BROWSER )); then
  if command -v wslview >/dev/null 2>&1; then
    wslview "$URL" >/dev/null 2>&1 || true
  elif command -v explorer.exe >/dev/null 2>&1; then
    explorer.exe "$URL" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 || true
  fi
fi

wait "$SERVER_PID"
