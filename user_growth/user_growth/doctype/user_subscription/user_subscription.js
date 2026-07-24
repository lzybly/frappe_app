frappe.provide("frappe.ui.form");
frappe.ui.form.on("User Subscription", {
    refresh: function(frm) {
        // 状态变化时控制流失日期必填
        frm.set_df_property("churn_date", "reqd", frm.doc.status === "已流失");
    },
    status: function(frm) {
        frm.set_df_property("churn_date", "reqd", frm.doc.status === "已流失");
        if (frm.doc.status !== "已流失") {
            frm.set_value("churn_date", null);
        }
    }
});
