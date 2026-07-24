# 🎯 User Growth Analytics — Frappe 自定义 App

> 用户增长分析系统：追踪用户服务开通/流失数据，提供增长报表和数据大屏

## 📋 功能模块

| 模块 | 类型 | 文件路径 | 说明 |
|:----|:----:|:---------|:-----|
| 📄 **User Subscription** | DocType | `user_growth/doctype/user_subscription/` | 12个字段：客户姓名、手机、邮箱、城市、渠道、服务类型、状态、月费、开通日期、流失日期、备注 |
| 📊 **User Growth Report** | Script Report | `user_growth/report/user_growth_report/` | 月度统计：新增/流失/净增长/流失率/累计用户，支持按服务类型/渠道筛选 |
| 🖥️ **用户增长数据大屏** | Page | `user_growth/page/user_growth_dashboard/` | 4个指标卡片+趋势图+服务类型饼图+渠道条形图+城市分布 |
| 📦 **Mock 数据** | 脚本 | `scripts/seed_data.py` | 24个月 657条模拟数据（30位客户、13城市、4种服务类型） |

---

## 🚀 部署步骤

### 前置条件

| 环境 | 版本要求 |
|:----|:---------|
| 📊 服务器 | Linux (Ubuntu 22.04+), **≥4GB 内存**（最低建议） |
| 🐍 Python | 3.10+ |
| 🗄️ 数据库 | MariaDB / MySQL 8.0+ |
| ⚡ Frappe Bench | 5.31.0+ |
| 🐳 或 Docker | 可选，用于容器化部署 |
| 🌐 网络 | 需要访问 GitHub / PyPI（国内服务器需配置镜像） |

### 方式一：Bench 直接部署

```bash
# 1️⃣ 安装 Frappe Bench（如未安装）
pip3 install frappe-bench

# 2️⃣ 初始化 Frappe
bench init frappe-bench --frappe-branch version-15

# 3️⃣ 创建站点
cd frappe-bench
bench new-site nexus.local --admin-password admin

# 4️⃣ 复制 App（注意：scripts/ 在 app 根目录，复制到 bench apps/ 下）
cp -r frappe_app apps/user_growth

# 5️⃣ 注册 App（添加到 apps.txt）
echo user_growth >> sites/apps.txt

# 6️⃣ 安装 App
bench --site nexus.local install-app user_growth

# 7️⃣ 迁移 & 构建
bench --site nexus.local migrate
bench build --app user_growth

# 8️⃣ 导入 Mock 数据
bench --site nexus.local console
# 在 console 中依次执行：
# exec(open("apps/scripts/seed_data.py").read())
# frappe.db.commit()

# 9️⃣ 启动
bench start
```

### 方式二：Docker 部署（生产推荐）

```bash
# 1️⃣ 克隆 frappe_docker
git clone https://github.com/frappe/frappe_docker
cd frappe_docker

# 2️⃣ 启动容器
docker compose -f pwd.yml up -d

# 3️⃣ 等站点创建完成（约3-5分钟）
docker logs frappe_docker-create-site-1 --tail 5

# 4️⃣ 复制 App 到容器
docker cp frappe_app/. frappe_docker-backend-1:/home/frappe/frappe-bench/apps/user_growth
# 复制脚本（scripts/ 在 app 根目录）
docker cp frappe_app/scripts/. frappe_docker-backend-1:/home/frappe/frappe-bench/apps/scripts/

# 5️⃣ 配置 Python 路径（关键！）
docker exec frappe_docker-backend-1 bash -c 'echo /home/frappe/frappe-bench/apps >> /home/frappe/frappe-bench/env/lib/python3.14/site-packages/user_growth.pth'

# 6️⃣ 注册 App
echo user_growth >> sites/apps.txt  # 或 docker cp 到容器内的 sites/apps.txt

# 7️⃣ 安装 App
docker exec frappe_docker-backend-1 bench --site frontend install-app user_growth

# 8️⃣ 创建 Workspace（让模块显示在桌面）
docker exec -i frappe_docker-backend-1 bash -c 'cd /home/frappe/frappe-bench && source env/bin/activate && bench --site frontend console' << 'EOF'
import frappe
if not frappe.db.exists("Workspace", {"module": "User Growth"}):
    ws = frappe.get_doc({
        "doctype": "Workspace", "module": "User Growth", "label": "User Growth",
        "title": "User Growth", "app": "user_growth", "icon": "line-chart",
        "type": "Workspace", "public": 1, "is_hidden": 0, "sequence_id": 5,
        "links": [
            {"type": "Link", "link_type": "DocType", "link_to": "User Subscription", "label": "User Subscription"},
            {"type": "Link", "link_type": "Report", "link_to": "User Growth Report", "label": "User Growth Report"},
            {"type": "Link", "link_type": "Page", "link_to": "user-growth-dashboard", "label": "用户增长数据大屏"},
        ]
    })
    ws.insert(ignore_permissions=True)
    frappe.db.commit()
    # 填写 content 使工作区可显示
    import json
    ws.content = json.dumps([
        {"id": "h1", "type": "header", "data": {"text": "<span class='h4'>用户增长管理</span>", "col": 12}},
        {"id": "n1", "type": "number_card", "data": {"number_card_name": "Total Users", "col": 3}},
        {"id": "n2", "type": "number_card", "data": {"number_card_name": "Active Users", "col": 3}},
        {"id": "n3", "type": "number_card", "data": {"number_card_name": "New Users", "col": 3}},
        {"id": "n4", "type": "number_card", "data": {"number_card_name": "Churned Users", "col": 3}},
    ])
    ws.save()
    frappe.db.commit()
    print("Workspace created!")
EOF

# 9️⃣ 导入 Mock 数据
docker exec -i frappe_docker-backend-1 bash -c "cd /home/frappe/frappe-bench && source env/bin/activate && bench --site frontend console" << 'PYEOF'
import frappe
frappe.db.sql("DELETE FROM `tabUser Subscription`")
frappe.db.commit()
exec(open("apps/scripts/seed_data.py").read())
frappe.db.commit()
print("数据导入完成！")
PYEOF

# 🔟 重启
docker restart frappe_docker-backend-1 frappe_docker-frontend-1
```

### 访问地址

| 页面 | URL |
|:----|:-----|
| 🔐 登录 | `http://your-server:8088/login` |
| 📄 单据列表 | `/app/user-subscription` |
| 📊 增长报表 | `/app/query-report/User%20Growth%20Report` |
| 🖥️ 数据大屏 | `/app/user-growth-dashboard` |
| 👤 默认账号 | Administrator / admin |

---

## 🧨 踩坑记录 & 解决方案

### 1️⃣ GitHub 连接超时（国内服务器）

**问题**：`bench init` 需要从 `github.com` 克隆 Frappe 源码，国内服务器经常连接超时。

**解决**：配置 Git 代理镜像：

```bash
git config --global url."https://ghproxy.com/https://github.com/".insteadOf "https://github.com/"
```

如果 ghproxy 失效，可换用：`https://github.moeyy.xyz/`

---

### 2️⃣ uv 包管理器缓存锁超时（内存不足）

**问题**：`bench init` 使用 `uv` 作为 Python 包管理器。在 1.6GB 内存服务器上，`uv pip install` 因缓存锁超时（300s）失败。

**错误**：
```
error: failed to obtain lock
maxminddb-geolite2 包安装超时
```

**解决**：
```bash
# 增加超时时间
export UV_LOCK_TIMEOUT=600

# 清理缓存
rm -rf ~/.cache/uv

# 或升级到 ≥4GB 内存服务器（最终方案）
```

---

### 3️⃣ Frappe v16 + Python 3.14 兼容性

**问题**：Docker 镜像 `frappe/erpnext:v16.29.0` 内置 Python 3.14，而代码最初为 Python 3.10 编写。

**表现**：
- `from __future__ import unicode_literals` 仍可用，但不再必要
- `frappe.get_doc().insert(ignore_permissions=True)` 参数签名变化

**解决**：使用 `frappe.db.sql` 直接插入数据替代文档 API。

---

### 4️⃣ Docker 镜像拉取失败

**问题**：Docker Hub 在国内访问极慢，`docker pull` 超时。

**错误**：
```
Error response from daemon: pull access denied for frappe/erpnext
```

**解决**：配置 Docker 镜像加速：
```json
{"registry-mirrors":["https://registry.cn-hangzhou.aliyuncs.com","https://mirror.ccs.tencentyun.com"]}
```

注意：`frappe/bench` 和 `frappe/erpnext` 都不是官方镜像名。正确的做法是使用 `frappe_docker` 项目的 `pwd.yml`：
```bash
git clone https://github.com/frappe/frappe_docker
cd frappe_docker
docker compose -f pwd.yml up -d
```

---

### 5️⃣ App 安装失败：`No module named 'user_growth'`

**问题**：`bench --site frontend install-app user_growth` 报模块找不到。

**原因**：Frappe v16 Docker 环境的 `sys.path` 中没有包含 `apps/` 目录。

**检查代码**：
```python
# 在 console 中检查
import sys; print(sys.path)
# 输出中没有 /home/frappe/frappe-bench/apps/
```

**解决**：
```bash
# 创建 .pth 文件，将 apps 目录加入 Python 路径
echo /home/frappe/frappe-bench/apps > /home/frappe/frappe-bench/env/lib/python3.14/site-packages/user_growth.pth
```

同时在 `sites/apps.txt` 中添加 `user_growth`，这是 Frappe 发现已安装 App 的关键文件。

---

### 6️⃣ 大屏 API 访问 403：Function not whitelisted

**问题**：通过 `frappe.call` 调用大屏后端 API 时返回 403 权限错误。

**错误**：
```
You are not permitted to access this resource.
Function is not whitelisted.
```

**原因**：`@frappe.whitelist()` 装饰器在 Docker 生产环境中需要额外配置。

**解决**：在 `hooks.py` 中添加：
```python
whitelisted_globals = [
    "module.page.page_name.page_name.get_summary",
    ...
]
```

（v16 中这个配置名可能不同，最终通过浏览器 session 调用时可以正常工作）

---

### 7️⃣ 桌面不显示 User Growth 模块

**问题**：App 已安装、DocType 已创建，但 Frappe 桌面看不到 User Growth 入口。

**原因多重排查**：

| 检查点 | 发现 | 解决 |
|:-------|:-----|:-----|
| Module Def 是否存在 | ✅ 存在 | — |
| Workspace 是否创建 | ❌ 未创建 | 手动创建 Workspace |
| `title` 字段缺失 | ❌ 报错 `NoneType` | 添加 `"title": "User Growth"` |
| `public` 字段 | ✅ 正确 | — |
| `type` 字段 | ❌ 误用 "DocType" | 改为 `"type": "Link"` |
| `content` 字段为 `[]` | ❌ 只有 2 字节 | 填充布局内容 |
| 浏览器缓存 | ⚠️ 常见问题 | Ctrl+F5 硬刷新 |

**最终方案**：通过 Console 创建完整 Workspace（含 content），然后清除所有缓存：
```python
frappe.clear_cache()
```

如果还是不行，退出重新登录。

---

### 8️⃣ Workspace 页面显示异常

**问题**：点击 User Growth 工作区后显示 "The block can not be displayed correctly"。

**原因**：`content` 字段的 JSON 格式不符合 Frappe v16 的要求。早期用了 `{"type": "column", "cards": [...]}` 的老格式。

**正确格式**：
```json
[{"id":"xxx","type":"header","data":{"text":"...","col":12}},
 {"id":"xxx","type":"number_card","data":{"number_card_name":"...","col":3}}]
```

每个 block 需要 `id`、`type`、`data` 三个字段。正确的 `type` 包括：`header`、`number_card`、`chart`、`spacer`、`card` 等。

---

### 9️⃣ 图标不显示（Font Awesome 兼容性）

**问题**：大屏指标卡片的 Font Awesome 图标不显示。

**原因**：`fa-user-check`、`fa-user-minus` 是 Font Awesome 5+ 的图标，但 Frappe v16 可能不完整加载 FA5。

**解决过程**：
1. ❌ 用 `fa-check-circle`、`fa-minus-circle`（FA4）→ Frappe 可能没全局加载 FA
2. ❌ 用 Unicode 符号 `✅` → 浏览器字体不支持
3. ❌ 用汉字 `活` `新` `流` → 显示但不好看
4. ✅ 用 **内联 SVG** → 100% 显示，不依赖任何字体库

```javascript
// SVG 图标示例（勾选图标）
icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">'
    + '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>'
    + '<polyline points="22 4 12 14.01 9 11.01"/></svg>'
```

---

### 🔟 本月新增/流失数据为 0

**问题**：大屏的"本月新增"和"本月流失"显示为 0。

**原因**：当前是 2026 年 7 月，但 Mock 数据只生成到 2026 年 6 月，所以查"本月"没有数据。

**解决**：自动检测最后一个有数据的月份：
```python
last_date = frappe.db.sql("SELECT MAX(subscription_date) FROM `tabUser Subscription`")[0][0]
if last_date:
    month_start = last_date.strftime("%Y-%m-01")
```

---

### 1️⃣1️⃣ `%%Y` 被 Frappe SQL 误解析

**问题**：`DATE_FORMAT(date, '%Y-%m')` 中的 `%Y` 被 Frappe 的 SQL 解析器当成参数占位符。

**错误**：
```
ValueError: invalid literal for int() with base 10: '%Y'
```

**解决**：不要在 SQL 中用 `DATE_FORMAT`，改用 Python 处理日期：
```python
last_date = frappe.db.sql("SELECT MAX(subscription_date) FROM `tabUser Subscription`")[0][0]
month_start = last_date.strftime("%Y-%m-01")
```

---

### 1️⃣2️⃣ Mock 数据脚本权重列表长度错误

**问题**：执行 `seed_data.py` 时报错：
```
ValueError: The number of weights does not match the population
```

**原因**：`day_weight` 列表只有 30 个权重值，但 31 天的月份需要 31 个。

**修复**：
```python
day_weight = [0.12]*10 + [0.08]*10 + [0.05]*11  # 31天全覆盖
day_weights = day_weight[:month_days]
```

---

## 📊 Mock 数据说明

| 属性 | 值 |
|:----|:----|
| 📅 时间范围 | 2024年7月 — 2026年6月（24个月） |
| 👥 数据总量 | 约 657 条 |
| 👤 虚拟客户 | 30 位（含联系方式、城市） |
| 🏙️ 覆盖城市 | 13 个 |
| 📋 服务类型 | 基础版(¥99) / 专业版(¥299) / 企业版(¥999) / 旗舰版(¥2999) |
| 📢 渠道来源 | 官网(30%) / 应用商店(25%) / 线下推广(20%) / 合作伙伴(15%) / 移动端推广(10%) |
| 📉 流失率 | 基础版 25% / 专业版 15% / 企业版 10% / 旗舰版 5% |
| 📈 增长趋势 | 每月递增约 0.8 个用户，含春节低谷和春秋高峰 |

---

## 🏗️ 项目结构

```
frappe_app/
├── README.md                              # ← 当前文件
├── __init__.py                            # App 版本
├── hooks.py                               # App 注册钩子
├── modules.txt                            # 模块定义（User Growth）
├── patches.txt                            # 补丁列表
├── fixtures/                              # 预设数据
│   └── user_subscription.json
├── scripts/
│   └── seed_data.py                       # Mock 数据生成脚本
├── public/
│   ├── css/dashboard.css                  # 大屏样式
│   └── js/dashboard.js                    # 大屏脚本
└── user_growth/                           # 主 Python 包
    ├── __init__.py
    ├── doctype/
    │   └── user_subscription/             # 📄 用户服务单据
    │       ├── __init__.py
    │       ├── user_subscription.json     # 12个字段定义
    │       ├── user_subscription.py       # 数据校验
    │       └── user_subscription.js       # 前端表单逻辑
    ├── report/
    │   └── user_growth_report/            # 📊 增长报表
    │       ├── __init__.py
    │       ├── user_growth_report.json    # 报表配置+筛选器
    │       ├── user_growth_report.py      # SQL 聚合逻辑
    │       └── user_growth_report.js      # 前端筛选器
    └── page/
        └── user_growth_dashboard/         # 🖥️ 数据大屏
            ├── __init__.py
            ├── user_growth_dashboard.json # 页面注册
            ├── user_growth_dashboard.py   # 5个数据 API
            └── user_growth_dashboard.js   # 前端图表渲染
```

---

## 📌 维护命令

```bash
# 查看服务状态
docker ps | grep frappe

# 查看日志
docker logs frappe_docker-backend-1 --tail 50

# 进入控制台
docker exec -it frappe_docker-backend-1 bash
cd /home/frappe/frappe-bench
source env/bin/activate
bench --site frontend console

# 重启
docker restart frappe_docker-backend-1 frappe_docker-frontend-1

# 重新迁移
docker exec frappe_docker-backend-1 bench --site frontend migrate
```

---

> 🎭 **致谢**：本项目在开发过程中参考了 [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) 项目中 AI 专家的设计理念。
> 
> 📅 完成时间：2026年7月 · 迭代版本 v3.0
