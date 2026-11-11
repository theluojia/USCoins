#!/usr/bin/env bash
# 提交当前 main 的改动并推送到远端 main。
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

usage() {
  echo "用法: $0 \"提交说明\" [--yes]" >&2
  echo "  --yes  跳过确认；未跟踪文件默认不提交" >&2
  exit 2
}

[[ $# -ge 1 && $# -le 2 ]] || usage
MESSAGE="$1"
AUTO_CONFIRM="${2:-}"
[[ -n "$MESSAGE" ]] || usage
[[ -z "$AUTO_CONFIRM" || "$AUTO_CONFIRM" == "--yes" ]] || usage
[[ "$(git branch --show-current)" == "main" ]] || { echo "请先切换到 main 分支。" >&2; exit 1; }

mapfile -d '' -t UNTRACKED_FILES < <(git ls-files --others --exclude-standard -z)
TRACKED_STATUS="$(git status --short --untracked-files=no)"
if [[ -z "$TRACKED_STATUS" && ${#UNTRACKED_FILES[@]} -eq 0 ]]; then
  echo "工作区没有可提交的改动。"
  exit 0
fi

git fetch --prune origin
git merge-base --is-ancestor origin/main main || {
  echo "本地 main 未包含远端最新提交；请先运行 scripts/pull_main.sh。" >&2
  exit 1
}

[[ -z "$TRACKED_STATUS" ]] || { echo "已跟踪文件的改动："; echo "$TRACKED_STATUS"; }
SELECTED_UNTRACKED=()
if (( ${#UNTRACKED_FILES[@]} > 0 )); then
  echo "发现未跟踪的新文件："
  printf '  %s\n' "${UNTRACKED_FILES[@]}"
  if [[ "$AUTO_CONFIRM" == "--yes" ]]; then
    echo "--yes 模式：未跟踪文件不纳入提交。"
  else
    read -r -p "新文件如何处理？[a]全部 / [s]逐个 / [n]忽略（默认 n）: " CHOICE || exit 0
    case "${CHOICE:-n}" in
      [Aa]) SELECTED_UNTRACKED=("${UNTRACKED_FILES[@]}") ;;
      [Ss])
        for file in "${UNTRACKED_FILES[@]}"; do
          read -r -p "提交 '$file'？[y/N] " ANSWER || exit 0
          [[ "$ANSWER" =~ ^[Yy]$ ]] && SELECTED_UNTRACKED+=("$file")
        done ;;
      [Nn]) ;;
      *) echo "无效选择，已取消。" >&2; exit 2 ;;
    esac
  fi
fi

if [[ -z "$TRACKED_STATUS" && ${#SELECTED_UNTRACKED[@]} -eq 0 ]]; then
  echo "没有选择需要提交的文件。"
  exit 0
fi

if [[ "$AUTO_CONFIRM" != "--yes" ]]; then
  read -r -p "确认提交并推送到 main？[y/N] " ANSWER || exit 0
  [[ "$ANSWER" =~ ^[Yy]$ ]] || { echo "已取消。"; exit 0; }
fi

git add -u
(( ${#SELECTED_UNTRACKED[@]} == 0 )) || git add -- "${SELECTED_UNTRACKED[@]}"
git diff --cached --check
git diff --cached --quiet && { echo "暂存区没有可提交的改动。"; exit 0; }
git commit -m "$MESSAGE"
git -c http.version=HTTP/1.1 push origin main
echo "完成：main 已提交并推送。"
