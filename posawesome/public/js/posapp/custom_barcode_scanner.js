frappe.after_ajax(() => {
	if (!erpnext?.utils?.BarcodeScanner) return;

	const originalUpdateTable = erpnext.utils.BarcodeScanner.prototype.update_table;

	erpnext.utils.BarcodeScanner.prototype.update_table = function (data) {
		return new Promise((resolve, reject) => {
			let cur_grid = this.frm.fields_dict[this.items_table_name].grid;
			frappe.flags.trigger_from_barcode_scanner = true;

			const { item_code, barcode, batch_no, serial_no, uom } = data;

			let row = this.get_row_to_modify_on_scan(item_code, batch_no, uom, barcode);
			this.is_new_row = false;

			if (!row) {
				if (this.dont_allow_new_row) {
					this.show_alert(__("Maximum quantity scanned for item {0}.", [item_code]), "red");
					this.clean_up();
					this.play_fail_sound();
					reject();
					return;
				}
				this.is_new_row = true;

				row = frappe.model.add_child(this.frm.doc, cur_grid.doctype, this.items_table_name);
				this.frm.script_manager.trigger(`${this.items_table_name}_add`, row.doctype, row.name);
				this.frm.has_items = false;
			}

			if (this.is_duplicate_serial_no(row, serial_no)) {
				this.clean_up();
				reject();
				return;
			}

			frappe.run_serially([
				() => this.set_selector_trigger_flag(data),
				() => this.set_item(row, item_code, barcode, batch_no, serial_no).then((qty) => {
					this.show_scan_message(row.idx, row.item_code, qty);
				}),
				() => this.set_barcode_uom(row, uom),

				//  Custom: Fetch correct rate via your server-side method
				() => {
					return frappe.call({
						method: "posawesome.overrides.custom_barcode_scanner.get_barcode_uom_price",
						args: {
							item_code: row.item_code,
							uom: row.uom,
							price_list: this.frm.doc.selling_price_list,
							transaction_date: this.frm.doc.posting_date
						},
						callback: (r) => {
                           
                            if (r.message) {
                                frappe.model.set_value(row.doctype, row.name, "rate", r.message);
                            }
						}
					});
				},

				() => this.set_serial_no(row, serial_no),
				() => this.set_batch_no(row, batch_no),
				() => this.set_barcode(row, barcode),
				() => this.clean_up(),
				() => this.revert_selector_flag(),
				() => resolve(row),
			]);
		});
	};
});
