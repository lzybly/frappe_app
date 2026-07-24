# -*- coding: utf-8 -*-
"""
用户服务开通/流失 Mock 数据生成脚本
用法: bench --site yoursite run-script apps/user_growth/scripts/seed_data.py
"""
import frappe
import random
from datetime import date
from dateutil.relativedelta import relativedelta


def generate_mock_data():
    """生成 24 个月（2024.07-2026.06）约 700 条 Mock 数据"""
    random.seed(42)  # 固定种子，确保可复现

    customers = [("张三","杭州"),("李四","上海"),("王五","广州"),("赵六","深圳"),
        ("孙七","杭州"),("周八","成都"),("吴九","武汉"),("郑十","南京"),
        ("陈晓明","西安"),("林小红","重庆"),("黄大伟","苏州"),("刘美丽","天津"),
        ("杨建华","长沙"),("张伟","郑州"),("王芳","东莞"),("李娜","青岛"),
        ("刘洋","沈阳"),("陈静","宁波"),("杨磊","昆明"),("赵敏","大连"),
        ("黄伟","厦门"),("周杰","福州"),("吴秀英","合肥"),("郑小明","济南"),
        ("孙丽华","哈尔滨"),("唐国强","无锡"),("冯小刚","佛山"),("蒋雯丽","贵阳"),
        ("沈腾","温州"),("马丽","南宁")]
    cities = ["北京","上海","广州","深圳","杭州","成都","武汉","南京","西安",
        "重庆","苏州","天津","长沙","郑州","东莞","青岛","宁波","昆明",
        "厦门","福州","合肥","济南","贵阳","温州","南宁","无锡","佛山"]
    plans = ["基础版","专业版","企业版","旗舰版"]
    plan_weights = [0.35, 0.30, 0.25, 0.10]
    plan_prices = {"基础版":99, "专业版":299, "企业版":999, "旗舰版":2999}
    plan_churn = {"基础版":0.25, "专业版":0.15, "企业版":0.10, "旗舰版":0.05}
    channels = ["官网","应用商店","线下推广","合作伙伴","移动端推广"]
    channel_weights = [0.30, 0.25, 0.20, 0.15, 0.10]

    def md(y, m):
        return (date(y+1,1,1)-date(y,m,1)).days if m==12 else (date(y,m+1,1)-date(y,m,1)).days

    total = 0
    for mo in range(24):
        ym = date(2024,7,1)+relativedelta(months=mo)
        y, m = ym.year, ym.month
        base = 18 + int(mo*0.7)
        if m == 1: base = int(base*0.55)
        elif m == 2: base = int(base*0.65)
        elif m in (3,4): base = int(base*1.35)
        elif m in (6,7): base = int(base*1.25)
        elif m in (11,12): base = int(base*1.15)
        nc = max(8, base+random.randint(-5, 8))
        mdays = md(y, m)
        for _ in range(nc):
            c = random.choice(customers)
            plan = random.choices(plans, weights=plan_weights)[0]
            channel = random.choices(channels, weights=channel_weights)[0]
            city = random.choice(cities)
            dw = [0.10]*10+[0.08]*8+[0.05]*6+[0.03]*7
            sd = random.choices(range(1, mdays+1), weights=dw[:mdays])[0]
            sd_d = date(y, m, sd)
            will_churn = random.random() < plan_churn[plan]
            st = "已开通"
            cd = None
            if will_churn:
                ma = random.randint(2, 14)
                cd_d = sd_d+relativedelta(months=ma)
                if cd_d <= date(2026, 6, 30):
                    st = "已流失"
                    cmd = md(cd_d.year, cd_d.month)
                    cday = random.randint(max(18, cmd-5), cmd)
                    cd = date(cd_d.year, cd_d.month, cday)
            if cd:
                frappe.db.sql("INSERT INTO `tabUser Subscription`(name,customer_name,city,channel,plan_type,status,monthly_revenue,subscription_date,churn_date,owner) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,'Administrator')",
                    (f"US-{y}{m:02d}-{total+1:04d}", c[0], city, channel, plan, st, plan_prices[plan], sd_d, cd))
            else:
                frappe.db.sql("INSERT INTO `tabUser Subscription`(name,customer_name,city,channel,plan_type,status,monthly_revenue,subscription_date,owner) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,'Administrator')",
                    (f"US-{y}{m:02d}-{total+1:04d}", c[0], city, channel, plan, st, plan_prices[plan], sd_d))
            total += 1
    frappe.db.commit()
    return total


if __name__ == "__main__":
    total = generate_mock_data()
    print(f"完成！共导入 {total} 条记录")
