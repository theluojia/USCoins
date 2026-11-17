# 项目脚本

在 WSL 的 `USCoins` 项目根目录运行。项目只有 `main` 分支。

## 本地预览

```bash
./scripts/preview.sh          # 默认 http://127.0.0.1:8770/
./scripts/preview.sh 8124     # 指定端口
```

脚本会启动静态服务器并尝试打开默认浏览器；按 Ctrl+C 停止。只启动服务器、不打开浏览器：

```bash
./scripts/preview.sh --no-open
```

## 提交并上传

```bash
./scripts/push_main.sh "feat: 简要说明"
```

脚本会先拉取远端状态，确认本地包含最新的 `origin/main`。已跟踪文件会自动纳入提交；遇到未跟踪的新文件时，可选择全部提交、逐个选择或全部忽略。确认后执行提交并推送 `main`。

自动确认模式只提交已跟踪文件，不自动提交未跟踪文件：

```bash
./scripts/push_main.sh "fix: 简要说明" --yes
```

## 下载并同步

```bash
./scripts/pull_main.sh
```

脚本只允许快进更新。如果工作区存在未提交修改，或本地有尚未推送的提交，会停止而不会覆盖文件。
