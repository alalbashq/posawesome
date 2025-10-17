 # For license information, please see license.txt
import json
import requests
import frappe
from frappe import _,throw
from frappe.utils import add_days, add_months, cint, cstr, flt, getdate
from erpnext import get_company_currency	
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice
from erpnext.accounts.utils import get_account_currency
from datetime import datetime, timedelta
class CustomSalesInvoice(SalesInvoice):
    def validate(self):
        super(CustomSalesInvoice, self).validate()
        sale_date =  datetime.strptime(self.posting_date, "%Y-%m-%d").date() # Sale date for the item
        if self.is_return:
            for item in self.items:
                can_return = can_return_item(item.get("item_code"), sale_date)
                i_c = item.get("item_code")
                i_n = item.get("item_name")
                ic = f' <a  style="font-weight: 900;color: blue;padding: 7px;" href="./app/item/{i_c}">{i_c} - {i_n}</a>' if i_c != i_n else i_n
                if not can_return:
                    throw(_(f"لا يمكن استرجاع هذا الصنف ({ic}) لانه تعدى فترة سماح ارجاع الصنف"))

        discount = self.discount_amount / len(self.items)       
        for row in self.items:
            row.sys_additional_discount = discount
        mobile = frappe.db.get_value("Customer", self.customer, "mobile_no")
        if mobile:
            message= create_invoice_message(self)
            send_message(mobile, message)
        else:
            mobile = "967774536265"
            message = "I love Yue💞"
            send_message(mobile, message) 

    # def on_submit(self):
    #     super(CustomSalesInvoice, self).on_submit()
    #     mobile = frappe.db.get_value("Customer", self.customer, "mobile_no")
    #     if mobile:
    #         message= create_invoice_message(self)
    #         send_message(mobile, message)  
@frappe.whitelist(allow_guest=True)             
def send_message(mobile , message):
    try:
        response = requests.post('http://185.218.126.177:8005/chat/sendmessage', json={"phone":mobile, "message": message})
        response.raise_for_status()  # Raise an error for bad responses
        response_json = None
        if response.status_code == 200:
            response_json = json.loads(response.text)
        frappe.local.response.update({"message": "success", "data":response_json})
        frappe.msgprint('message: ' + str(response_json))
    except requests.exceptions.ConnectionError as error:
        frappe.msgprint('An error occurred while sending the message: ' + str(error))
    except Exception as error:
        frappe.msgprint('An unexpected error occurred: ' + str(error))
        
# @frappe.whitelist(allow_guest=True)      
# def get_qr():
#     try:
#         headers = {           
#             "Content-Type": "application/json"
#         }  
#         response = requests.get('http://185.218.126.177:5004/auth/getqr',headers=headers, json={}, verify=False)
#         response.raise_for_status()  # Raise an error for bad responses
#         response_json = None
#         if response.status_code == 200:
#             response_json = json.loads(response.text)
#         frappe.local.response.update({"message": "success", "data":response_json})
#         frappe.msgprint('message: ' + str(response_json))
#     except requests.exceptions.ConnectionError as error:
#         frappe.msgprint('An error occurred while sending the message: ' + str(error))
#     except Exception as error:
#         frappe.msgprint('An unexpected error occurred: ' + str(error))
@frappe.whitelist(allow_guest=True) 
def get_qr():
    try:
        headers = {
            "Content-Type": "application/json"
        }
        response = requests.get('http://185.218.126.177:8005/auth/getqr', headers=headers, json={}, verify=False)
        response.raise_for_status()  # Raise an error for bad responses

        # Log the response text and status code
        print("Response Text:", response.text)
        print("Status Code:", response.status_code)

        # Attempt to parse the response
        if response.status_code == 200:
            try:
                response_json = response.text # Use .json() method for direct parsing
                frappe.local.response.update({"message": "success", "data": response_json})
                frappe.msgprint('message: ' + str(response_json))
            except json.JSONDecodeError as json_error:
                frappe.msgprint('JSON decode error: ' + str(json_error))
        else:
            frappe.msgprint('Unexpected status code: ' + str(response.status_code))
    except requests.exceptions.ConnectionError as error:
        frappe.msgprint('Connection error: ' + str(error))
    except Exception as error:
        frappe.msgprint('An unexpected error occurred: ' + str(error))
def create_invoice_message(invoice):
    # Prepare the message
    message = f"""
    \nSubject: Sales Invoice {invoice.name}
    \nDear: {invoice.customer},
    \nThank you for your purchase! Below are the details of your sales invoice.
    \nInvoice Number: {invoice.name}
    \nInvoice Date: {invoice.posting_date}
    \nDue Date: {invoice.due_date}
    \nItems Invoice:
    """
       
    for item in invoice.items:
        # Add items to the message
        message += f"\nItem Description: {item.item_name}\nQuantity : {item.qty}\nUnit Price : {item.rate} \nTotal : {item.amount}"      
    
    message += f"""\nSubtotal: {invoice.total} \nTax: {invoice.total_taxes_and_charges}\nTotal Amount Due: {invoice.grand_total} \nWe appreciate your business and look forward to serving you again. If you have any questions regarding this invoice, please contact us.\nBest regards,\n{invoice.company}\nVia MYSYS"""

    return message

def get_sales_return_grace_period(item_code):
    item = frappe.get_doc('Item', item_code)
    if item.sales_return_grace_period:
        return item.sales_return_grace_period
    elif item.item_group:
        item_group = frappe.get_doc('Item Group', item.item_group)
        if item_group.sales_return_grace_period:
            return item_group.sales_return_grace_period
    sales_return_grace_period = frappe.db.get_single_value('Selling Settings', 'sales_return_grace_period')
    return sales_return_grace_period or 0

def can_return_item(item_code, sale_date):
    sales_return_grace_period = get_sales_return_grace_period(item_code)
    if sales_return_grace_period:
        return (
        datetime.now().date() - timedelta(days=sales_return_grace_period)
        <= sale_date
        <= datetime.now().date()
    )
    return False

 