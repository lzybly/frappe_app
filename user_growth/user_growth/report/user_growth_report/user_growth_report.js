frappe.query_reports["User Growth Report"] = {
    "filters": [
        {
            "fieldname": "from_date",
            "label": __("起始月份"),
            "fieldtype": "Date",
            "default": "2024-07-01"
        },
        {
            "fieldname": "to_date",
            "label": __("截止月份"),
            "fieldtype": "Date",
            "default": "2026-06-01"
        },
        {
            "fieldname": "plan_type",
            "label": __("服务类型"),
            "fieldtype": "Select",
            "options": ["", "基础版", "专业版", "企业版", "旗舰版"]
        },
        {
            "fieldname": "channel",
            "label": __("来源渠道"),
            "fieldtype": "Select",
            "options": ["", "官网", "应用商店", "线下推广", "合作伙伴", "移动端推广"]
        }
    ],
    "onload": function() {
        function resize() {
            // 等待 DataTable 渲染完成
            var $scrollable = $(".dt-scrollable");
            if ($scrollable.length === 0 || $scrollable.width() < 100) {
                setTimeout(resize, 300);
                return;
            }
            var w = $scrollable.width() - 10;
            if (w < 200) w = 800;
            var pcts = [22, 15.5, 15.5, 15.5, 14, 15.5];
            // 计算各列像素宽度
            var widths = pcts.map(function(p) { return Math.round(w * p / 100); });
            
            // 设置表头列宽
            $(".dt-header .dt-row").each(function() {
                $(this).find(".dt-cell").each(function(i) {
                    if (i < widths.length) {
                        $(this).css({"width": widths[i] + "px", "flex": "none", "min-width": "60px"});
                    }
                });
            });
            // 设置数据行 - 逐行处理
            $(".dt-scrollable .dt-row").each(function() {
                $(this).find(".dt-cell").each(function(i) {
                    if (i < widths.length) {
                        $(this).css({"width": widths[i] + "px", "flex": "none", "min-width": "60px"});
                    }
                });
            });
            // 隐藏 filler
            $(".dt-cell--filler").remove();
            // 容器全宽
            $scrollable.css({"width": "100%", "overflow-x": "hidden"});
            $(".dt-scrollable .dt-table, .dt-header").css("width", "100%");
        }
        setTimeout(resize, 800);
        $(document).ajaxSuccess(function() { setTimeout(resize, 300); });
    }
};
