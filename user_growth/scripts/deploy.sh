#!/bin/bash
# =====================================================
# user_growth Frappe App 部署脚本
# 在 Frappe Bench 环境中执行
# =====================================================

set -e

SITE="${1:-nexus.local}"
BENCH_PATH="${2:-/home/frappe/frappe-bench}"

echo "=========================================="
echo "  User Growth App 部署脚本"
echo "  目标站点: $SITE"
echo "  Bench路径: $BENCH_PATH"
echo "=========================================="

# 1. 复制 App 到 Bench
echo ""
echo "[1/5] 复制 App 到 Bench..."
APP_SRC="$(cd "$(dirname "$0")/.." && pwd)"
APP_DST="$BENCH_PATH/apps/user_growth"
if [ -d "$APP_DST" ]; then
    echo "  App 已存在，跳过复制"
else
    ln -sf "$APP_SRC" "$APP_DST" || cp -r "$APP_SRC" "$APP_DST"
    echo "  App 已复制到 $APP_DST"
fi

# 2. 安装 App
echo ""
echo "[2/5] 安装 App 到站点..."
cd "$BENCH_PATH"
bench --site "$SITE" install-app user_growth

# 3. 迁移数据库
echo ""
echo "[3/5] 迁移数据库..."
bench --site "$SITE" migrate

# 4. 生成 Mock 数据
echo ""
echo "[4/5] 生成 Mock 数据..."
bench --site "$SITE" run-script apps/user_growth/scripts/seed_data.py

# 5. 构建前端资源
echo ""
echo "[5/5] 构建前端..."
bench build --app user_growth

echo ""
echo "=========================================="
echo "  ✅ 部署完成！"
echo ""
echo "  访问地址: http://<your-server>:8000/app/user-growth-dashboard"
echo "  报表地址: http://<your-server>:8000/app/query-report/User%20Growth%20Report"
echo "  单据地址: http://<your-server>:8000/app/user-subscription"
echo "=========================================="
