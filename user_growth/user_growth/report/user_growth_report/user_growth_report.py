# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import frappe
from frappe import _
from datetime import datetime, date
from dateutil.relativedelta import relativedelta


def execute(filters=None):
    return get_columns(), get_data(filters)


def get_columns():
    return [
        {"label": _("月份"), "fieldname": "month", "fieldtype": "Data"},
        {"label": _("新增用户"), "fieldname": "new_users", "fieldtype": "Int"},
        {"label": _("流失用户"), "fieldname": "churned_users", "fieldtype": "Int"},
        {"label": _("净增长"), "fieldname": "net_growth", "fieldtype": "Int"},
        {"label": _("流失率"), "fieldname": "churn_rate", "fieldtype": "Data"},
        {"label": _("累计用户"), "fieldname": "total_users", "fieldtype": "Int"},
    ]


def get_data(filters):
    if not filters:
        filters = {}
    from_date = filters.get("from_date") or "2024-07-01"
    to_date = filters.get("to_date") or "2026-06-01"
    
    start = datetime.strptime(from_date, "%Y-%m-%d")
    end = datetime.strptime(to_date, "%Y-%m-%d")
    
    months = []
    current = start
    while current <= end:
        months.append(current.strftime("%Y-%m"))
        current += relativedelta(months=1)
    
    data = []
    running_total = 0
    
    for month_str in months:
        year, month = map(int, month_str.split("-"))
        month_start = f"{year}-{month:02d}-01"
        month_end = f"{year+1}-01-01" if month == 12 else f"{year}-{month+1:02d}-01"
        
        new_count = frappe.db.sql("""SELECT COUNT(*) FROM `tabUser Subscription` 
            WHERE subscription_date >= %s AND subscription_date < %s""", 
            (month_start, month_end))[0][0]
        
        churn_count = frappe.db.sql("""SELECT COUNT(*) FROM `tabUser Subscription` 
            WHERE status = '已流失' AND churn_date >= %s AND churn_date < %s""",
            (month_start, month_end))[0][0]
        
        total_count = frappe.db.sql("""SELECT COUNT(*) FROM `tabUser Subscription` 
            WHERE subscription_date < %s AND (status != '已流失' OR churn_date >= %s OR churn_date IS NULL)""",
            (month_end, month_end))[0][0]
        
        running_total = total_count
        net = new_count - churn_count
        churn_rate = f"{round(churn_count / max(new_count, 1) * 100, 1)}%"
        
        data.append({
            "month": month_str,
            "new_users": new_count,
            "churned_users": churn_count,
            "net_growth": net,
            "churn_rate": churn_rate,
            "total_users": total_count,
        })
    
    return data
