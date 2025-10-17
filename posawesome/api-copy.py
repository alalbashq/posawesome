import frappe
import frappe
import requests
import json
import re
from frappe import _
class ERPBot:
    def __init__(self, prompt, expected_token):
        self.prompt = prompt
        self.expected_token = expected_token
        self.data = None
    def ask_openai(self):
        #  "model": "meta-llama/llama-4-maverick:free",
        # ترسل الطلب إلى GPT - نفترض أنك تستخدم API خارجي
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers={
            "Authorization": "Bearer " + self.expected_token,
            "Content-Type": "application/json"
        }, json={           
            "model": "deepseek/deepseek-r1:free",
           "messages": [
                {
                "role": "system",
                "content": """أنت مساعد تطوير ERPNext. كل طلب يصلك يعني أنه طلب لإنشاء مستند أو تنفيذ دالة في نظام ERPNext باستخدام Frappe Framework. 
                رد دائمًا بجيسون فقط بدون شرح أو تعليقات. 
                - لا تكتب نصًا خارج الجيسون.
                - إذا كان الطلب غامض، افترض أفضل الاحتمالات المنطقية من بيئة ERPNext.
                - تأكد أن كل المفاتيح باللغة الإنجليزية والصيغة متوافقة مع JSON المعتمد في ERPNext.
                - عند الحاجة لإنشاء سجل، استخدم تنسيق {doctype, fields}.
                - إذا كان السؤال طلب دالة، أعد الجيسون مع طريقة التنفيذ المناسبة.
                هدفك الأساسي جعل الرد جاهز للنسخ والتنفيذ مباشرة في كود Frappe."""
                +'أنت مساعد ERPNext ذكي. عندما يطلب المستخدم إنشاء شيء، يجب أن ترد فقط بجيسون (JSON) خام بدون أي تنسيقات إضافية مثل ```json أو ``` أو أي رموز توضيحية. يجب أن يبدأ الرد مباشرة بـ { وينتهي بـ }. لا تشرح أو تضف تعليقات.'
                },
                {"role": "user", "content": self.prompt}
            ],
            "max_tokens": 3841,
        })
        response.raise_for_status()
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            self.data = data['choices'][0]['message']['content']
        else:
           self.data = data
      

    def create_doc_from_json(doctype, payload):
        try:
            meta = frappe.get_meta(doctype)
            allowed_fields = {df.fieldname for df in meta.fields if df.fieldtype not in ["Section Break", "Column Break"]}
            allowed_fields.update({"doctype", "name", "owner", "creation", "modified", "modified_by"})

            filtered_data = {key: value for key, value in payload.items() if key in allowed_fields}

            custom_fields = payload.get("custom_fields")
            if isinstance(custom_fields, dict):
                for key, value in custom_fields.items():
                    if key in allowed_fields:
                        filtered_data[key] = value

            doc = frappe.new_doc(doctype)
            doc.update(filtered_data)

            doc.flags.ignore_permissions = True
            doc.flags.ignore_mandatory = True

            doc.insert(ignore_permissions=True)
            frappe.db.commit()

            return {"success": True, "name": doc.name}

        except Exception as e:
            frappe.log_error(frappe.get_traceback(), "Auto Task Creator")
            return {"success": False, "error": str(e)}
        
    def validate_payload_for_doc_creation(payload):
        if not isinstance(payload, dict):
            return {"valid": False, "error": "Payload must be a dictionary"}

        doctype = payload.get("doctype")
        if not doctype:
            return {"valid": False, "error": "Missing 'doctype' in payload"}

        try:
            meta = frappe.get_meta(doctype)
        except frappe.DoesNotExistError:
            return {"valid": False, "error": f"Doctype '{doctype}' does not exist"}

        valid_fields = {df.fieldname for df in meta.fields if df.fieldtype not in ["Section Break", "Column Break"]}
        valid_fields.update({"doctype", "name", "owner", "creation", "modified", "modified_by"})

        invalid_fields = []
        for key in payload:
            if key not in valid_fields and key != "custom_fields":
                invalid_fields.append(key)

        if "custom_fields" in payload and isinstance(payload["custom_fields"], dict):
            for key in payload["custom_fields"]:
                if key not in valid_fields:
                    invalid_fields.append(key)

        if invalid_fields:
            return {"valid": False, "error": f"Invalid fields in payload: {', '.join(invalid_fields)}"}

        return {"valid": True}

@frappe.whitelist(allow_guest=True)
def ask_bot(prompt, api_token=None):
    """API لاستقبال الطلب وتنفيذه مع حماية التوكن"""

    expected_token = frappe.db.get_single_value("Bot Settings", "api_token")

    if not api_token or api_token != expected_token:
        frappe.throw("🔒 Access Denied: Invalid API Token.")

    bot = ERPBot(prompt,expected_token)
    bot.ask_openai()
    data = handle_bot_response(bot,bot.data)
    # try:
    #     data =  clean_json_string(bot.data)
    # except Exception as e:
    #     frappe.msgprint(str(e), "ERPBot Error")
         
    frappe.msgprint("{}".format(data))
    # valid = validate_payload_for_doc_creation(data)
    # if valid["valid"] == False:
    #      frappe.throw("valid: {}<br>data: {}".format(valid["error"], bot.data))
    # else:
    #     bot.create_doc_from_json(data["doctype"], data)
       
    return data

def validate_payload_for_doc_creation(payload):
    if not isinstance(payload, dict):
        return {"valid": False, "error": "Payload must be a dictionary"}

    doctype = payload.get("doctype")
    if not doctype:
        return {"valid": False, "error": "Missing 'doctype' in payload"}

    try:
        meta = frappe.get_meta(doctype)
    except frappe.DoesNotExistError:
        return {"valid": False, "error": f"Doctype '{doctype}' does not exist"}

    # valid_fields = {df.fieldname for df in meta.fields if df.fieldtype not in ["Section Break", "Column Break"]}
    # invalid_fields = [key for key in payload if key not in valid_fields and key not in ["doctype"]]

    # if invalid_fields:
    #     return {"valid": False, "error": f"Invalid fields in payload: {', '.join(invalid_fields)}"}

    return {"valid": True}


def clean_json_string(raw_text):
    """
    تنظيف النص الخام القادم من الردود بحيث يحذف علامات ```json و ```، ويعيده كـ dict جاهز.
    """
    if not isinstance(raw_text, str):
        raise ValueError("Input must be a string")
    
    # إزالة ```json أو ``` من البداية والنهاية
    cleaned = re.sub(r"^\s*```(?:json)?\s*", "", raw_text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON after cleaning: {e}")
    
    


def clean_bot_response(response_text):
    cleaned = re.sub(r'```[a-zA-Z]*', '', response_text)
    cleaned = cleaned.replace('```', '').strip()
    return cleaned

def handle_bot_response(bot, response_text):
    try:
        cleaned = clean_bot_response(response_text)
        data = json.loads(cleaned)
        
        # دعم حالة وجود fields داخل الداتا
        if "fields" in data and isinstance(data["fields"], dict):
            # دمج الداتا الأصلية مع الحقول مع الاحتفاظ بالdoctype
            payload = {
                "doctype": data.get("doctype"),
                **data["fields"]
            }
        elif "custom_fields" in data and isinstance(data["fields"], dict):
            payload = data
            payload.update(data["custom_fields"])
        else:
            payload = data

        validation = validate_payload_for_doc_creation(payload)
        if not validation.get("valid"):
            return {"success": False, "error": validation.get("error")}

        result = bot.create_doc_from_json(payload["doctype"], payload)
        return result

    except json.JSONDecodeError as e:
        frappe.log_error(f"JSON Decode Error: {str(e)}", "Auto Task Creator")
        return {"success": False, "error": "Invalid JSON format" + " - " + str(response_text)}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Auto Task Creator")
        return {"success": False, "error": str(e) + " - " + str(response_text)}


