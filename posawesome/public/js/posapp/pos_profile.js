frappe.ui.form.on("POS Profile", {
    refresh: function (frm) {
      frm.fields_dict["custom_additional_warehouses"].grid.get_field("warehouse").get_query = function (doc, cdt, cdn) {
        let selected_warehouses = (doc.custom_additional_warehouses || []).map(row => row.warehouse);
        
        return {
          filters: {
            name: ["not in", [...selected_warehouses, doc.warehouse]]
          }
        };
      };
    }
  });