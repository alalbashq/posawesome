# Copyright (c) 2023, Youssef Restom and contributors
# For license information, please see license.txt

# # import frappe
# from frappe.utils.nestedset import NestedSet

# class StockReconciliationTool(NestedSet):
# 	pass
# # Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# # License: GNU General Public License v3. See license.txt

from typing import Optional

import frappe
from frappe import _, bold, msgprint
from frappe.query_builder.functions import CombineDatetime, Sum
from frappe.utils import cint, cstr, flt

import erpnext
from erpnext.accounts.utils import get_company_default
from erpnext.controllers.stock_controller import StockController
from erpnext.stock.doctype.batch.batch import get_batch_qty
from erpnext.stock.doctype.serial_no.serial_no import get_serial_nos
from erpnext.stock.utils import get_stock_balance


class OpeningEntryAccountError(frappe.ValidationError):
	pass


class EmptyStockReconciliationItemsError(frappe.ValidationError):
	pass


class StockReconciliationTool(StockController):
	def __init__(self, *args, **kwargs):
		super(StockReconciliationTool, self).__init__(*args, **kwargs)
		self.head_row = ["Item Code", "Warehouse", "Quantity", "Valuation Rate"]

	def validate(self):pass	

	def on_submit(self):pass		

	def on_cancel(self):pass		

	def submit(self):pass		

	def cancel(self):
		pass

	def recalculate_current_qty(self, item_code, batch_no):
		from erpnext.stock.stock_ledger import get_valuation_rate

		sl_entries = []
		for row in self.items:
			if not (row.item_code == item_code and row.batch_no == batch_no):
				continue

			current_qty = get_batch_qty_for_stock_reco(
				item_code, row.warehouse, batch_no, self.posting_date, self.posting_time, self.name
			)

			precesion = row.precision("current_qty")
			if flt(current_qty, precesion) == flt(row.current_qty, precesion):
				continue

			val_rate = get_valuation_rate(
				item_code, row.warehouse, self.doctype, self.name, company=self.company, batch_no=batch_no
			)

			row.current_valuation_rate = val_rate
			if not row.current_qty and current_qty:
				sle = self.get_sle_for_items(row)
				sle.actual_qty = current_qty * -1
				sle.valuation_rate = val_rate
				sl_entries.append(sle)

			row.current_qty = current_qty
			row.db_set(
				{
					"current_qty": row.current_qty,
					"current_valuation_rate": row.current_valuation_rate,
					"current_amount": flt(row.current_qty * row.current_valuation_rate),
				}
			)

		if sl_entries:
			self.make_sl_entries(sl_entries)


def get_batch_qty_for_stock_reco(
	item_code, warehouse, batch_no, posting_date, posting_time, voucher_no
):
	ledger = frappe.qb.DocType("Stock Ledger Entry")

	query = (
		frappe.qb.from_(ledger)
		.select(
			Sum(ledger.actual_qty).as_("batch_qty"),
		)
		.where(
			(ledger.item_code == item_code)
			& (ledger.warehouse == warehouse)
			& (ledger.docstatus == 1)
			& (ledger.is_cancelled == 0)
			& (ledger.batch_no == batch_no)
			& (ledger.posting_date <= posting_date)
			& (
				CombineDatetime(ledger.posting_date, ledger.posting_time)
				<= CombineDatetime(posting_date, posting_time)
			)
			& (ledger.voucher_no != voucher_no)
		)
		.groupby(ledger.batch_no)
	)

	sle = query.run(as_dict=True)

	return flt(sle[0].batch_qty) if sle else 0


@frappe.whitelist()
def get_items(
	warehouse, posting_date, posting_time, company, item_code=None, ignore_empty_stock=False
):
	ignore_empty_stock = cint(ignore_empty_stock)
	items = [frappe._dict({"item_code": item_code, "warehouse": warehouse})]

	if not item_code:
		items = get_items_for_stock_reco(warehouse, company)

	res = []
	itemwise_batch_data = get_itemwise_batch(warehouse, posting_date, company, item_code)

	for d in items:
		if d.item_code in itemwise_batch_data:
			valuation_rate = get_stock_balance(
				d.item_code, d.warehouse, posting_date, posting_time, with_valuation_rate=True
			)[1]

			for row in itemwise_batch_data.get(d.item_code):
				if ignore_empty_stock and not row.qty:
					continue

				args = get_item_data(row, row.qty, valuation_rate)
				res.append(args)
		else:
			stock_bal = get_stock_balance(
				d.item_code,
				d.warehouse,
				posting_date,
				posting_time,
				with_valuation_rate=True,
				with_serial_no=cint(d.has_serial_no),
			)
			qty, valuation_rate, serial_no = (
				stock_bal[0],
				stock_bal[1],
				stock_bal[2] if cint(d.has_serial_no) else "",
			)

			if ignore_empty_stock and not stock_bal[0]:
				continue

			args = get_item_data(d, qty, valuation_rate, serial_no)

			res.append(args)

	return res


def get_items_for_stock_reco(warehouse, company):
	lft, rgt = frappe.db.get_value("Warehouse", warehouse, ["lft", "rgt"])
	items = frappe.db.sql(
		f"""
		select
			i.name as item_code, i.item_name, bin.warehouse as warehouse, i.has_serial_no, i.has_batch_no
		from
			`tabBin` bin, `tabItem` i
		where
			i.name = bin.item_code
			and IFNULL(i.disabled, 0) = 0
			and i.is_stock_item = 1
			and i.has_variants = 0
			and exists(
				select name from `tabWarehouse` where lft >= {lft} and rgt <= {rgt} and name = bin.warehouse
			)
	""",
		as_dict=1,
	)

	items += frappe.db.sql(
		"""
		select
			i.name as item_code, i.item_name, id.default_warehouse as warehouse, i.has_serial_no, i.has_batch_no
		from
			`tabItem` i, `tabItem Default` id
		where
			i.name = id.parent
			and exists(
				select name from `tabWarehouse` where lft >= %s and rgt <= %s and name=id.default_warehouse
			)
			and i.is_stock_item = 1
			and i.has_variants = 0
			and IFNULL(i.disabled, 0) = 0
			and id.company = %s
		group by i.name
	""",
		(lft, rgt, company),
		as_dict=1,
	)

	# remove duplicates
	# check if item-warehouse key extracted from each entry exists in set iw_keys
	# and update iw_keys
	iw_keys = set()
	items = [
		item
		for item in items
		if [
			(item.item_code, item.warehouse) not in iw_keys,
			iw_keys.add((item.item_code, item.warehouse)),
		][0]
	]

	return items


def get_item_data(row, qty, valuation_rate, serial_no=None):
	return {
		"item_code": row.item_code,
		"warehouse": row.warehouse,
		"qty": qty,
		"item_name": row.item_name,
		"valuation_rate": valuation_rate,
		"current_qty": qty,
		"current_valuation_rate": valuation_rate,
		"current_serial_no": serial_no,
		"serial_no": serial_no,
		"batch_no": row.get("batch_no"),
	}


def get_itemwise_batch(warehouse, posting_date, company, item_code=None):
	from erpnext.stock.report.batch_wise_balance_history.batch_wise_balance_history import execute

	itemwise_batch_data = {}

	filters = frappe._dict(
		{"warehouse": warehouse, "from_date": posting_date, "to_date": posting_date, "company": company}
	)

	if item_code:
		filters.item_code = item_code

	columns, data = execute(filters)

	for row in data:
		itemwise_batch_data.setdefault(row[0], []).append(
			frappe._dict(
				{
					"item_code": row[0],
					"warehouse": warehouse,
					"qty": row[8],
					"item_name": row[1],
					"batch_no": row[4],
				}
			)
		)

	return itemwise_batch_data


@frappe.whitelist()
def get_stock_balance_for(
	item_code: str,
	warehouse: str,
	posting_date,
	posting_time,
	batch_no: Optional[str] = None,
	with_valuation_rate: bool = True,
):
	frappe.has_permission("Stock Reconciliation", "write", throw=True)

	item_dict = frappe.get_cached_value(
		"Item", item_code, ["has_serial_no", "has_batch_no"], as_dict=1
	)

	if not item_dict:
		# In cases of data upload to Items table
		msg = _("Item {} does not exist.").format(item_code)
		frappe.throw(msg, title=_("Missing"))

	serial_nos = None
	has_serial_no = bool(item_dict.get("has_serial_no"))
	has_batch_no = bool(item_dict.get("has_batch_no"))

	if not batch_no and has_batch_no:
		# Not enough information to fetch data
		return {"qty": 0, "rate": 0, "serial_nos": None}

	# TODO: fetch only selected batch's values
	data = get_stock_balance(
		item_code,
		warehouse,
		posting_date,
		posting_time,
		with_valuation_rate=with_valuation_rate,
		with_serial_no=has_serial_no,
	)

	if has_serial_no:
		qty, rate, serial_nos = data
	else:
		qty, rate = data

	if item_dict.get("has_batch_no"):
		qty = (
			get_batch_qty(batch_no, warehouse, posting_date=posting_date, posting_time=posting_time) or 0
		)

	return {"qty": qty, "rate": rate, "serial_nos": serial_nos}


@frappe.whitelist()
def get_difference_account(purpose, company):
	if purpose == "Stock Reconciliation":
		account = get_company_default(company, "stock_adjustment_account")
	else:
		account = frappe.db.get_value(
			"Account", {"is_group": 0, "company": company, "account_type": "Temporary"}, "name"
		)

	return account

from frappe.utils.background_jobs import enqueue
@frappe.whitelist()
def fetch_items(parent):
	enqueue(make_sto_rec,queue="long",parent=parent)

def make_sto_rec(parent):
	if parent:
		
		items = frappe.db.sql(
			f"""
			select
				i.item_code, i.item_name, i.warehouse , sum(i.qty) qty
			from
				`tabStock Reconciliation Item Tool` i
			join
			 	`tabStock Reconciliation Tool` sr
			on 
				i.parent = sr.name
			where
				(sr.parent_stock_reconciliation_tool is not null  and sr.parent_stock_reconciliation_tool= '{parent}') or sr.name = '{parent}' 
			group by i.item_code				
		""",
			as_dict=1,
		)
		i = 0 
		if items:
			tar = frappe.get_doc("Stock Reconciliation Tool",parent)
			sur = frappe.new_doc("Stock Reconciliation")
			sur.company = tar.company
			sur.purpose = tar.purpose
			sur.posting_date = tar.posting_date
			sur.posting_time = tar.posting_time
			sur.set_warehouse = tar.set_warehouse
			sur.scan_mode = tar.scan_mode
			sur.expense_account = tar.expense_account
			sur.cost_center = tar.cost_center
			sur.set("items",items)
			sur.insert()
			frappe.publish_progress(i * 100 / len(items), title=_("Creating Stock Reconciliation..."))
			return sur
		else:
			frappe.throw("Items Is Empty")	
	return 0
