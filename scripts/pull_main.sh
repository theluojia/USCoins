#!/usr/bin/env bash
# 拉取远端 main；只允许快进，避免覆盖本地工作。
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ "$(git branch --show-current)" == "main" ]] || { echo "请先切换到 main 分支。" >&2; exit 1; }
if [[ -n "$(git status --porcelain)" ]]; then
  echo "工作区有未提交改动；请先处理后再同步。" >&2
  git status --short >&2
  exit 1
fi

git fetch --prune origin
read -r REMOTE_AHEAD LOCAL_AHEAD < <(git rev-list --left-right --count origin/main...main)
if (( LOCAL_AHEAD > 0 )); then
  echo "本地 main 有未推送提交；请先运行 scripts/push_main.sh。" >&2
  exit 1
fi
git merge --ff-only origin/main
echo "完成：本地 main 已与 origin/main 同步。"
