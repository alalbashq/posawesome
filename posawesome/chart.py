import json
import os

import frappe
from frappe.utils import cstr
from frappe.utils.nestedset import rebuild_tree
from unidecode import unidecode
from frappe.modules import scrub
from frappe import _


# get_export_chart_of_accounts from snd_wizard_settings.js
@frappe.whitelist()
def export_chart_of_accounts(app_name, company):

	acc = frappe._dict()
	accounts = frappe.db.sql(
		"""select name, account_number, parent_account, account_name, root_type, 
		report_type, lft, rgt, is_group, account_currency, account_type
		from `tabAccount` where company = %s and parent_account is null and is_group = 1 order by lft""", company,	
		as_dict=True,
	)
	acc.update({'country_code':'SND Yemen', 'name': 'SND Yemen {}'.format(app_name)})
	acc.setdefault('tree', {})
	for a in accounts:
		acc.tree.setdefault(a.account_name, {})
		acc.tree[a.account_name].update(get_childs(a.name, a.account_name))
		acc.tree[a.account_name].update({'root_type':a.root_type or "",'account_type': a.account_type or "", 
		'account_currency': a.account_currency or "", 'is_group':a.is_group or "", })
	
	folder_path = os.path.join(os.path.dirname(__file__), "verified")
	
	if not os.path.exists(folder_path):
		os.makedirs(folder_path)

	path = os.path.join(folder_path, "{}".format(scrub(app_name)) + ".json")
	with open(path, "w") as f:
		f.write(frappe.as_json(acc))

	return folder_path


def get_childs(name, account_name):
	# frappe.msgprint(frappe.as_json(name))
	parent_dic = frappe._dict()
	accounts = frappe.db.sql(
		"""select name, account_number, parent_account, account_name, root_type, 
		report_type, lft, rgt, is_group, account_currency, account_type 
		from `tabAccount` where parent_account=%s order by lft""",name , as_dict=True)
	for acc in accounts:
		acc_dic = frappe._dict()
		acc_dic.update({'account_number':acc.account_number or "", 'account_name':acc.account_name,  
		'account_type': acc.account_type or "", 'account_currency': acc.account_currency or "", 'is_group':acc.is_group or "", })
		if acc.is_group:
			acc_dic.update(get_childs(acc.name, acc.account_name))

		parent_dic.setdefault(acc.account_name, acc_dic)
	return parent_dic
