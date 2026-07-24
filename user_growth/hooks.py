# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from frappe import _

app_name = "user_growth"
app_title = "User Growth Analytics"
app_publisher = "NEXUS"
app_description = "用户增长分析系统 — 追踪用户开通/流失数据"
app_icon = "fa fa-line-chart"
app_color = "#6c5ce7"
app_email = "admin@nexus.local"
app_license = "MIT"

# 模块定义
module_defs = [
    {
        "module_name": "User Growth",
        "app_name": "user_growth",
        "category": "Modules",
        "icon": "fa fa-line-chart",
        "color": "#6c5ce7",
        "type": "module",
    }
]

# DocType 列表
doctypes = [
    {"doctype": "User Subscription"},
]

# 预设数据（安装时自动导入）
fixtures = [
    {"doctype": "User Subscription"},
]

# Page JS（相对于 app 根目录）
page_js = {
    "user-growth-dashboard": "user_growth/page/user_growth_dashboard/user_growth_dashboard.js"
}

# 权限
permissions = [
    {
        "role": "System Manager",
        "doctype": "User Subscription",
        "read": 1, "write": 1, "create": 1, "delete": 1,
    },
    {
        "role": "System Manager",
        "doctype": "User Growth Report",
        "read": 1, "write": 1,
    },
]

# 安装后钩子——导入 Mock 数据
def after_install():
    """安装完成后自动导入 Mock 数据"""
    import frappe
    if frappe.db.count("User Subscription") > 0:
        return
    try:
        from user_growth.scripts.seed_data import generate_mock_data
        generate_mock_data()
        frappe.db.commit()
    except ImportError:
        pass
