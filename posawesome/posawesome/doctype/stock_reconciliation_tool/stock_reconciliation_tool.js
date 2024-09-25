// Copyright (c) 2023, Youssef Restom and contributors
// For license information, please see license.txt

frappe.provide("erpnext.stock");
frappe.provide("erpnext.accounts.dimensions");

frappe.ui.form.on("Stock Reconciliation Tool", {
	onload: function (frm) {
		frm.add_fetch("item_code", "item_name", "item_name");
		if (frm.doc.is_group == false && frm.doc.parent_stock_reconciliation_tool) {
			frm.add_fetch("parent_stock_reconciliation_tool", "company", "company");
			frm.add_fetch("parent_stock_reconciliation_tool", "purpose", "purpose");
			frm.add_fetch("parent_stock_reconciliation_tool", "posting_date", "posting_date");
			frm.add_fetch("parent_stock_reconciliation_tool", "posting_time", "posting_time");
			frm.add_fetch("parent_stock_reconciliation_tool", "set_warehouse", "set_warehouse");
			frm.add_fetch("parent_stock_reconciliation_tool", "cost_center", "cost_center");
			frm.add_fetch("parent_stock_reconciliation_tool", "expense_account", "expense_account");
		}


		// end of life 
		frm.set_query("item_code", "items", function (doc, cdt, cdn) {
			return {
				query: "erpnext.controllers.queries.item_query",
				filters: {
					"is_stock_item": 1
				}
			}
		});
		frm.set_query("batch_no", "items", function (doc, cdt, cdn) {
			var item = locals[cdt][cdn];
			return {
				filters: {
					'item': item.item_code
				}
			};
		});
		frm.set_query("parent_stock_reconciliation_tool", function (frm) {
			return {
				filters: {
					'is_group': 1
				}
			};
		});

		if (frm.doc.company) {
			erpnext.queries.setup_queries(frm, "Warehouse", function () {
				return erpnext.queries.warehouse(frm.doc);
			});
		}

		if (!frm.doc.expense_account) {
			frm.trigger("set_expense_account");
		}

		erpnext.accounts.dimensions.setup_dimension_filters(frm, frm.doctype);
	},

	company: function (frm) {
		erpnext.accounts.dimensions.update_dimension(frm, frm.doctype);
	},

	refresh: function (frm) {
		if (frm.is_new()) {
			frm.set_df_property('items', 'reqd', 0);
		} else {
			frm.set_df_property('items', 'reqd', 1);
		}

		if (frm.doc.docstatus == 1 && frm.doc.is_group) {
			frm.add_custom_button(__('Make Stock Reconciliation'), function () {
				frappe.call({
					method: 'posawesome.posawesome.doctype.stock_reconciliation_tool.stock_reconciliation_tool.fetch_items',
					args: {
						parent: frm.docname
					},
					callback: function (r) {
						if (r.message) {
							var doc = frappe.model.sync(r.message)[0];
							frappe.set_route("Form", doc.doctype, doc.name);
						}
					}
				});
			});
		}
		if (frm.doc.is_group) {
			frm.add_custom_button(__('Make Child Stock Reconciliation Tool'), function () {
				var doc = frappe.model.get_new_doc("Stock Reconciliation Tool");
				doc["parent_stock_reconciliation_tool"] = frm.doc.name
				doc["purpose"] = frm.doc.purpose
				doc["set_warehouse"] = frm.doc.set_warehouse
				doc["posting_date"] = frm.doc.posting_date
				frappe.set_route("Form", doc.doctype, doc.name);
			});
		}
		if (frm.doc.docstatus < 1 && frm.doc.is_group) {
			frm.add_custom_button(__("Fetch Items from Warehouse"), function () {
				frm.events.get_items(frm);
			});
		}


		if (frm.doc.company) {
			frm.trigger("toggle_display_account_head");
		}
	},
	parent_stock_reconciliation_tool: (frm) => {
		frm.add_fetch("parent_stock_reconciliation_tool", "company", "company");
		frm.add_fetch("parent_stock_reconciliation_tool", "purpose", "purpose");
		frm.add_fetch("parent_stock_reconciliation_tool", "posting_date", "posting_date");
		frm.add_fetch("parent_stock_reconciliation_tool", "posting_time", "posting_time");
		frm.add_fetch("parent_stock_reconciliation_tool", "set_warehouse", "set_warehouse");
		frm.add_fetch("parent_stock_reconciliation_tool", "cost_center", "cost_center");
		frm.add_fetch("parent_stock_reconciliation_tool", "expense_account", "expense_account");
	},
	scan_barcode: function (frm) {
		frappe.require("assets/posawesome/js/stock_reconciliation_tool_barcodescan.js", () => {
			const barcode_scanner = new BarcodeScanner({frm:frm, play_fail_sound:"short_ocillator", play_success_sound: "AddItemFromScan"});
			barcode_scanner.process_scan();
		});

	},

	scan_mode: function (frm) {
		if (frm.doc.scan_mode) {
			frm.events.set_valuation_rate_and_qty_for_all_items(frm);
			frappe.show_alert({
				message: __("Scan mode enabled, existing quantity will not be fetched."),
				indicator: "green"
			});
		}
	},

	set_warehouse: function (frm) {
		let transaction_controller = new erpnext.TransactionController({ frm: frm });
		transaction_controller.autofill_warehouse(frm.doc.items, "warehouse", frm.doc.set_warehouse);
	},

	get_items: function (frm) {
		let fields = [
			{
				label: 'Warehouse',
				fieldname: 'warehouse',
				fieldtype: 'Link',
				options: 'Warehouse',
				reqd: 1,
				default: frm.doc.set_warehouse,
				"get_query": function () {
					return {
						"filters": {
							"company": frm.doc.company,
						}
					};
				}
			},
			{
				label: "Item Code",
				fieldname: "item_code",
				fieldtype: "Link",
				options: "Item",
				"get_query": function () {
					return {
						"filters": {
							"disabled": 0,
						}
					};
				}
			},
			{
				label: __("Ignore Empty Stock"),
				fieldname: "ignore_empty_stock",
				fieldtype: "Check"
			}
		];

		frappe.prompt(fields, function (data) {
			frappe.call({
				method: "posawesome.posawesome.doctype.stock_reconciliation_tool.stock_reconciliation_tool.get_items",
				args: {
					warehouse: data.warehouse,
					posting_date: frm.doc.posting_date,
					posting_time: frm.doc.posting_time,
					company: frm.doc.company,
					item_code: data.item_code,
					ignore_empty_stock: data.ignore_empty_stock
				},
				callback: function (r) {
					if (r.exc || !r.message || !r.message.length) return;

					frm.clear_table("items");

					r.message.forEach((row) => {
						let item = frm.add_child("items");
						$.extend(item, row);

						item.qty = 0;
						item.valuation_rate = item.valuation_rate || 0;
					});
					frm.refresh_field("items");
				}
			});
		}, __("Get Items"), __("Update"));
	},

	posting_date: function (frm) {
		// frm.trigger("set_valuation_rate_and_qty_for_all_items");
	},

	posting_time: function (frm) {
		// frm.trigger("set_valuation_rate_and_qty_for_all_items");
	},

	set_valuation_rate_and_qty_for_all_items: function (frm) {
		frm.doc.items.forEach(row => {
			frm.events.set_valuation_rate_and_qty(frm, row.doctype, row.name);
		});
	},

	set_valuation_rate_and_qty: function (frm, cdt, cdn) {
		var d = frappe.model.get_doc(cdt, cdn);

		if (d.item_code && d.warehouse) {
			frappe.call({
				method: "posawesome.posawesome.doctype.stock_reconciliation_tool.stock_reconciliation_tool.get_stock_balance_for",
				args: {
					item_code: d.item_code,
					warehouse: d.warehouse,
					posting_date: frm.doc.posting_date,
					posting_time: frm.doc.posting_time,
					batch_no: d.batch_no
				},
				callback: function (r) {
					const row = frappe.model.get_doc(cdt, cdn);
					if (!frm.doc.scan_mode) {
						frappe.model.set_value(cdt, cdn, "qty", 0);
					}
					frappe.model.set_value(cdt, cdn, "valuation_rate", r.message.rate);
					frappe.model.set_value(cdt, cdn, "current_qty", r.message.qty);
					frappe.model.set_value(cdt, cdn, "current_valuation_rate", r.message.rate);
					frappe.model.set_value(cdt, cdn, "current_amount", r.message.rate * r.message.qty);
					frappe.model.set_value(cdt, cdn, "amount", row.qty * row.valuation_rate);
					frappe.model.set_value(cdt, cdn, "current_serial_no", r.message.serial_nos);

					if (frm.doc.purpose == "Stock Reconciliation" && !frm.doc.scan_mode) {
						frappe.model.set_value(cdt, cdn, "serial_no", r.message.serial_nos);
					}
				}
			});
		}
	},

	set_amount_quantity: function (doc, cdt, cdn) {
		var d = frappe.model.get_doc(cdt, cdn);
		if (d.qty & d.valuation_rate) {
			frappe.model.set_value(cdt, cdn, "amount", flt(d.qty) * flt(d.valuation_rate));
			frappe.model.set_value(cdt, cdn, "quantity_difference", flt(d.qty) - flt(d.current_qty));
			frappe.model.set_value(cdt, cdn, "amount_difference", flt(d.amount) - flt(d.current_amount));
		}
	},
	company: function (frm) {
		frm.trigger("toggle_display_account_head");
	},
	toggle_display_account_head: function (frm) {
		frm.toggle_display(['expense_account', 'cost_center'],
			erpnext.is_perpetual_inventory_enabled(frm.doc.company));
	},
	purpose: function (frm) {
		frm.trigger("set_expense_account");
	},
 
});

frappe.ui.form.on("Stock Reconciliation Item Tool", {

	warehouse: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];
		if (child.batch_no && !frm.doc.scan_mode) {
			frappe.model.set_value(child.cdt, child.cdn, "batch_no", "");
		}

		frm.events.set_valuation_rate_and_qty(frm, cdt, cdn);
	},

	item_code: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];
		if (child.batch_no && !frm.doc.scan_mode) {
			frappe.model.set_value(cdt, cdn, "batch_no", "");
		}

		frm.events.set_valuation_rate_and_qty(frm, cdt, cdn);
	},

	batch_no: function (frm, cdt, cdn) {
		frm.events.set_valuation_rate_and_qty(frm, cdt, cdn);
	},

	qty: function (frm, cdt, cdn) {
		frm.events.set_amount_quantity(frm, cdt, cdn);
	},

	valuation_rate: function (frm, cdt, cdn) {
		frm.events.set_amount_quantity(frm, cdt, cdn);
	},

	serial_no: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];

		if (child.serial_no) {
			const serial_nos = child.serial_no.trim().split('\n');
			frappe.model.set_value(cdt, cdn, "qty", serial_nos.length);
		}
	},

	items_add: function (frm, cdt, cdn) {
		var item = frappe.get_doc(cdt, cdn);
		if (!item.warehouse && frm.doc.set_warehouse) {
			frappe.model.set_value(cdt, cdn, "warehouse", frm.doc.set_warehouse);
		}
	},

});

erpnext.stock.StockReconciliation = class StockReconciliation extends erpnext.stock.StockController {
	setup() {
		var me = this;

		this.setup_posting_date_time_check();

		if (me.frm.doc.company && erpnext.is_perpetual_inventory_enabled(me.frm.doc.company)) {
			this.frm.add_fetch("company", "cost_center", "cost_center");
		}
		this.frm.fields_dict["expense_account"].get_query = function () {
			if (erpnext.is_perpetual_inventory_enabled(me.frm.doc.company)) {
				return {
					"filters": {
						'company': me.frm.doc.company,
						"is_group": 0
					}
				}
			}
		}
		this.frm.fields_dict["cost_center"].get_query = function () {
			if (erpnext.is_perpetual_inventory_enabled(me.frm.doc.company)) {
				return {
					"filters": {
						'company': me.frm.doc.company,
						"is_group": 0
					}
				}
			}
		}
	}

	refresh() {
		if (this.frm.doc.docstatus > 0) {
			// this.show_stock_ledger();
			// if (erpnext.is_perpetual_inventory_enabled(this.frm.doc.company)) {
			// 	this.show_general_ledger();
			// }
		}
	}

};

cur_frm.cscript = new erpnext.stock.StockReconciliation({ frm: cur_frm });
