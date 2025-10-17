import frappe
from frappe import _
import json
import re
import requests

class ERPBot:
    def __init__(self, prompt, api_token):
        self.prompt = prompt
        self.api_token = api_token
        self.data = None

    def ask_openai(self):
        """استدعاء OpenRouter API مع الباراميترات اللازمة"""
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            },
            json={
                "model": "deepseek/deepseek-r1:free",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "أنت مساعد تطوير ERPNext. كل طلب يعني إنشاء مستند أو تنفيذ دالة في Frappe."
                            " رد دائمًا بجيسون فقط بدون شرح أو تعليقات. لا تكتب نصًا خارج الجيسون."
                            " لا تستخدم ```json أو أي علامات تنسيقية. هدفك إنشاء جيسون جاهز للتنفيذ."
                        )
                    },
                    {"role": "user", "content": self.prompt}
                ],
                "max_tokens": 3841
            }
        )
        response.raise_for_status()
        result = response.json()
        if "choices" in result and result["choices"]:
            self.data = result["choices"][0]["message"]["content"]
        else:
            frappe.throw(_("❌ Failed to get response from model".format(result)))
            self.data = None

    @staticmethod
    def clean_bot_response(response_text):
        """تنظيف الاستجابة من أكواد غير مرغوبة"""
        cleaned = re.sub(r'```[a-zA-Z]*', '', response_text)
        cleaned = cleaned.replace('```', '').strip()
        return cleaned

    @staticmethod
    def validate_payload(payload):
        if not isinstance(payload, dict):
            return {"valid": False, "error": "Payload must be a dictionary"}
        doctype = payload.get("doctype")
        if not doctype:
            return {"valid": False, "error": "Missing 'doctype' in payload"}
        try:
            frappe.get_meta(doctype)
        except frappe.DoesNotExistError:
            return {"valid": False, "error": f"Doctype '{doctype}' does not exist"}
        return {"valid": True}

    @staticmethod
    def create_doc(doctype, payload):
        """إنشاء مستند Frappe بناءً على الجيسون"""
        try:
            meta = frappe.get_meta(doctype)
            allowed_fields = {df.fieldname for df in meta.fields if df.fieldtype not in ["Section Break", "Column Break"]}
            allowed_fields.update({"doctype", "name", "owner", "creation", "modified", "modified_by"})

            doc_fields = {k: v for k, v in payload.items() if k in allowed_fields}

            # دمج custom_fields لو وجدت
            if "custom_fields" in payload and isinstance(payload["custom_fields"], dict):
                for k, v in payload["custom_fields"].items():
                    if k in allowed_fields:
                        doc_fields[k] = v

            doc = frappe.new_doc(doctype)
            doc.update(doc_fields)

            doc.flags.ignore_permissions = True
            doc.flags.ignore_mandatory = True

            doc.insert(ignore_permissions=True)
            frappe.db.commit()

            return {"success": True, "name": doc.name}
        except Exception as e:
            frappe.log_error(frappe.get_traceback(), "Auto Task Creator")
            return {"success": False, "error": str(e)}

    def handle_response(self):
        """معالجة الاستجابة من البوت وتحويلها إلى إنشاء مستند"""
        try:
            cleaned = self.clean_bot_response(self.data)
            payload = json.loads(cleaned)

            # دعم حالة fields داخل JSON
            if "fields" in payload and isinstance(payload["fields"], dict):
                payload = {
                    "doctype": payload.get("doctype"),
                    **payload["fields"]
                }

            validation = self.validate_payload(payload)
            if not validation.get("valid"):
                return {"success": False, "error": validation.get("error")}

            return self.create_doc(payload["doctype"], payload)

        except json.JSONDecodeError as e:
            frappe.log_error(f"JSON Decode Error: {str(e)}", "Auto Task Creator")
            return {"success": False, "error": f"Invalid JSON format - {str(e)}"}

        except Exception as e:
            frappe.log_error(frappe.get_traceback(), "Auto Task Creator")
            return {"success": False, "error": str(e)}

@frappe.whitelist(allow_guest=True)
def ask_bot(prompt, api_token=None):
    """نقطة دخول API - استدعاء البوت وتنفيذ الأوامر"""
    expected_token = frappe.db.get_single_value("Bot Settings", "api_token")

    if not api_token or api_token != expected_token:
        frappe.throw(_("🔒 Access Denied: Invalid API Token."))

    bot = ERPBot(prompt, expected_token)
    bot.ask_openai()
    if not bot.data:
        frappe.throw(_("❌ Failed to get response from model"))

    result = bot.handle_response()
    frappe.msgprint(f"📄 نتيجة التنفيذ: {result}")
    return result
