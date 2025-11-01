#\!/bin/bash
# 智搭医美APP启动脚本

APP_DIR="/root/claude/cqbcc-service/app"
LOG_FILE="/root/claude/cqbcc-service/app.log"
PORT=28188

# 检查并停止现有进程
PID=$(ps aux | grep "python3 -m http.server $PORT" | grep -v grep | awk '{print $2}')
if [ \! -z "$PID" ]; then
    echo "停止现有进程 (PID: $PID)..."
    kill $PID
    sleep 2
fi

# 启动应用
echo "启动应用 (端口: $PORT)..."
cd $APP_DIR
nohup python3 -m http.server $PORT > $LOG_FILE 2>&1 &

sleep 2

# 验证启动状态
NEW_PID=$(ps aux | grep "python3 -m http.server $PORT" | grep -v grep | awk '{print $2}')
if [ \! -z "$NEW_PID" ]; then
    echo "✅ 应用启动成功！"
    echo "   进程ID: $NEW_PID"
    echo "   访问地址: http://localhost:$PORT"
    echo "   日志文件: $LOG_FILE"
else
    echo "❌ 应用启动失败，请检查日志"
fi
