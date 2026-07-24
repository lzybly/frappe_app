# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import frappe
from frappe import _
from datetime import datetime, date
from dateutil.relativedelta import relativedelta


@frappe.whitelist()
def get_summary():
    """获取核心概览数据"""
    total = frappe.db.count("User Subscription")
    
    # 获取最后有数据的月份
    last_date = frappe.db.sql("""SELECT MAX(subscription_date) as d FROM `tabUser Subscription`""")[0][0]
    
    if last_date:
        month_start = last_date.strftime("%Y-%m-01")
        if last_date.month == 12:
            from datetime import date as dt_date
            month_end = dt_date(last_date.year + 1, 1, 1).isoformat()
        else:
            month_end = last_date.replace(month=last_date.month + 1, day=1).isoformat()
    else:
        month_start = "2026-01-01"
        month_end = "2026-07-01"
    
    new_this_month = frappe.db.count("User Subscription", {
        "subscription_date": ["between", (month_start, month_end)]
    })
    
    churned_this_month = frappe.db.count("User Subscription", {
        "status": "已流失",
        "churn_date": ["between", (month_start, month_end)]
    })
    
    churn_rate = round(churned_this_month / max(new_this_month, 1) * 100, 1)
    
    # 活跃用户
    active = frappe.db.count("User Subscription", {"status": ["!=", "已流失"]})
    
    return {
        "total_users": total,
        "active_users": active,
        "new_this_month": new_this_month,
        "churned_this_month": churned_this_month,
        "churn_rate": churn_rate,
    }


@frappe.whitelist()
def get_monthly_trend():
    """获取月度趋势数据"""
    data = frappe.db.sql("""
        SELECT 
            DATE_FORMAT(subscription_date, '%Y-%m') as month,
            COUNT(*) as new_users
        FROM `tabUser Subscription`
        WHERE subscription_date >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
        GROUP BY DATE_FORMAT(subscription_date, '%Y-%m')
        ORDER BY month ASC
    """, as_dict=True)
    
    churn_data = frappe.db.sql("""
        SELECT 
            DATE_FORMAT(churn_date, '%Y-%m') as month,
            COUNT(*) as churned_users
        FROM `tabUser Subscription`
        WHERE status = '已流失' AND churn_date >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
        GROUP BY DATE_FORMAT(churn_date, '%Y-%m')
        ORDER BY month ASC
    """, as_dict=True)
    
    churn_map = {d.month: d.churned_users for d in churn_data}
    
    result = []
    for d in data:
        result.append({
            "month": d.month,
            "new_users": d.new_users,
            "churned_users": churn_map.get(d.month, 0),
        })
    
    return result


@frappe.whitelist()
def get_plan_distribution():
    """获取服务类型分布（全部用户）"""
    data = frappe.db.sql("""
        SELECT plan_type, COUNT(*) as count
        FROM `tabUser Subscription`
        GROUP BY plan_type
        ORDER BY count DESC
    """, as_dict=True)
    return data


@frappe.whitelist()
def get_channel_distribution():
    """获取渠道分布"""
    data = frappe.db.sql("""
        SELECT channel, COUNT(*) as count
        FROM `tabUser Subscription`
        GROUP BY channel
        ORDER BY count DESC
    """, as_dict=True)
    return data


@frappe.whitelist()
def get_city_distribution():
    """获取城市分布"""
    data = frappe.db.sql("""
        SELECT city, COUNT(*) as count
        FROM `tabUser Subscription`
        GROUP BY city
        ORDER BY count DESC
        LIMIT 15
    """, as_dict=True)
    return data


@frappe.whitelist()
def get_report_data():
    """获取完整报表数据"""
    from datetime import datetime, date
    from dateutil.relativedelta import relativedelta
    
    start = datetime(2024, 7, 1)
    end = datetime(2026, 6, 1)
    
    months = []
    current = start
    while current <= end:
        months.append(current.strftime("%Y-%m"))
        current += relativedelta(months=1)
    
    result = []
    running = 0
    for month_str in months:
        y, m = map(int, month_str.split("-"))
        ms = f"{y}-{m:02d}-01"
        me = f"{y+1}-01-01" if m == 12 else f"{y}-{m+1:02d}-01"
        
        new_c = frappe.db.sql("SELECT COUNT(*) FROM `tabUser Subscription` WHERE subscription_date >= %s AND subscription_date < %s", (ms, me))[0][0]
        churn_c = frappe.db.sql("SELECT COUNT(*) FROM `tabUser Subscription` WHERE status='已流失' AND churn_date >= %s AND churn_date < %s", (ms, me))[0][0]
        total_c = frappe.db.sql("SELECT COUNT(*) FROM `tabUser Subscription` WHERE subscription_date < %s AND (status!='已流失' OR churn_date>=%s OR churn_date IS NULL)", (me, me))[0][0]
        running = total_c
        net = new_c - churn_c
        rate = f"{round(churn_c / max(new_c,1) * 100, 1)}%"
        result.append({"month": month_str, "new": new_c, "churn": churn_c, "net": net, "rate": rate, "total": total_c})
    
    return result
