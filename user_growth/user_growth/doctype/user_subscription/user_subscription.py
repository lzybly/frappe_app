# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class UserSubscription(Document):
    """用户服务开通/流失信息单据"""
    
    def validate(self):
        """数据校验"""
        if self.status == "已流失" and not self.churn_date:
            frappe.throw("流失状态必须填写流失日期")
        
        if self.churn_date and self.subscription_date:
            if self.churn_date < self.subscription_date:
                frappe.throw("流失日期不能早于开通日期")
