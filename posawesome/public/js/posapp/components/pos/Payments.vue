<template>
  <div :class="{ 'rtl': isRTL }">
    <v-card :class="{ 'rtl': isRTL }" class="selection mx-auto grey lighten-5 pa-1"
      style="max-height: 76vh; height: 76vh">
      <v-progress-linear :active="loading" :indeterminate="loading" absolute top color="info"></v-progress-linear>
      <div :class="{ 'rtl': isRTL }" class="overflow-y-auto px-2 pt-2" style="max-height: 75vh">
        <v-row :class="{ 'rtl': isRTL }" v-if="invoice_doc" class="px-1 py-0">
          <v-col cols="7">
            <v-text-field variant="outlined" color="primary" :label="__('Paid Amount')" @focus="e => e.target.select()"
              background-color="white" hide-details :model-value="formtCurrency(total_payments)" readonly
              :prefix="currencySymbol(invoice_doc.currency)" density="compact" />
          </v-col>
          <v-col cols="5">
            <v-text-field variant="outlined" color="primary" :label="__(diff_lable)" @focus="e => e.target.select()"
              background-color="white" hide-details :model-value="formtCurrency(diff_payment)" readonly
              :prefix="currencySymbol(invoice_doc.currency)" density="compact" />
          </v-col>

          <v-col cols="7" v-if="diff_payment < 0 && !invoice_doc.is_return">
            <v-text-field variant="outlined" color="primary" :label="__('Paid Change')" @focus="e => e.target.select()"
              background-color="white" v-model="paid_change" @input="set_paid_change()"
              :prefix="currencySymbol(invoice_doc.currency)" :rules="paid_change_rules" density="compact" readonly
              type="number" />
          </v-col>

          <v-col cols="5" v-if="diff_payment < 0 && !invoice_doc.is_return">
            <v-text-field variant="outlined" color="primary" :label="__('Credit Change')"
              @focus="e => e.target.select()" background-color="white" hide-details
              :model-value="formtCurrency(credit_change)" readonly :prefix="currencySymbol(invoice_doc.currency)"
              density="compact" />
          </v-col>
        </v-row>
        <v-divider></v-divider>

        <div :class="{ 'rtl': isRTL }" v-if="is_cashback">
          <v-row class="pyments px-1 py-0" v-for="payment in invoice_doc.payments" :key="payment.name">
            <v-col cols="6" v-if="!is_mpesa_c2b_payment(payment)">
              <v-text-field density="compact" variant="outlined" color="primary" :label="__(payment.mode_of_payment)"
                background-color="white" hide-details :model-value="formtCurrency(payment.amount)"
                @change="setFormatedCurrency(payment, 'amount', null, true, $event)" :rules="[isNumber]"
                :prefix="currencySymbol(invoice_doc.currency)"
                @focus="e => { set_rest_amount(payment.idx); e.target.select(); }"
                :readonly="invoice_doc.is_return ? true : false" />
            </v-col>
            <v-col v-if="!is_mpesa_c2b_payment(payment)" :cols="6
              ? (payment.type != 'Phone' || payment.amount == 0 || !request_payment_field) &&
              !is_mpesa_c2b_payment(payment)
              : 3">
              <v-btn block color="primary" dark @click="set_full_amount(payment.idx)">
                {{ payment.mode_of_payment }}
              </v-btn>
            </v-col>
            <v-col v-if="is_mpesa_c2b_payment(payment)" :cols="12" class="pl-3">
              <v-btn block color="success" dark @click="mpesa_c2b_dialg(payment)">
                {{ __(`Get Payments ${payment.mode_of_payment}`) }}
              </v-btn>
            </v-col>
            <v-col v-if="payment.type == 'Phone' && payment.amount > 0 && request_payment_field" :cols="3" class="pl-1">
              <v-btn block color="success" dark :disabled="payment.amount == 0"
                @click="(phone_dialog = true), (payment.amount = flt(payment.amount, 0))">
                {{ __("Request") }}
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <v-row :class="{ 'rtl': isRTL }" class="pyments px-1 py-0"
          v-if="invoice_doc && available_pioints_amount > 0 && !invoice_doc.is_return">
          <v-col cols="7">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('Redeem Loyalty Points')"
              background-color="white" hide-details v-model="loyalty_amount" type="number"
              :prefix="currencySymbol(invoice_doc.currency)" />
          </v-col>
          <v-col cols="5">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('You can redeem upto')"
              background-color="white" hide-details :model-value="formtFloat(available_pioints_amount)"
              :prefix="currencySymbol(invoice_doc.currency)" disabled />
          </v-col>
        </v-row>

        <v-row :class="{ 'rtl': isRTL }" class="pyments px-1 py-0"
          v-if="invoice_doc && available_customer_credit > 0 && !invoice_doc.is_return && redeem_customer_credit">
          <v-col cols="7">
            <v-text-field density="compact" variant="outlined" disabled color="primary"
              :label="__('Redeemed Customer Credit')" background-color="white" hide-details
              v-model="redeemed_customer_credit" type="number" :prefix="currencySymbol(invoice_doc.currency)" />
          </v-col>
          <v-col cols="5">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('You can redeem credit upto')"
              background-color="white" hide-details :model-value="formtCurrency(available_customer_credit)"
              :prefix="currencySymbol(invoice_doc.currency)" disabled />
          </v-col>
        </v-row>
        <v-divider></v-divider>

        <v-row :class="{ 'rtl': isRTL }" class="px-1 py-0">
          <v-col cols="6">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('Net Total')"
              background-color="white" hide-details :model-value="formtCurrency(invoice_doc.net_total)" disabled
              :prefix="currencySymbol(invoice_doc.currency)" />
          </v-col>
          <v-col cols="6">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('Tax and Charges')"
              background-color="white" hide-details :model-value="formtCurrency(invoice_doc.total_taxes_and_charges)"
              disabled :prefix="currencySymbol(invoice_doc.currency)" />
          </v-col>
          <v-col cols="6">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('Total Amount')"
              background-color="white" hide-details :model-value="formtCurrency(invoice_doc.total)" disabled
              :prefix="currencySymbol(invoice_doc.currency)" />
          </v-col>
          <v-col cols="6">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('Discount Amount')"
              background-color="white" hide-details :model-value="formtCurrency(invoice_doc.discount_amount)" disabled
              :prefix="currencySymbol(invoice_doc.currency)" />
          </v-col>
          <v-col cols="6">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('Grand Total')"
              background-color="white" hide-details :model-value="formtCurrency(invoice_doc.grand_total)" disabled
              :prefix="currencySymbol(invoice_doc.currency)" />
          </v-col>
          <v-col v-if="invoice_doc.rounded_total" cols="6">
            <v-text-field density="compact" variant="outlined" color="primary" :label="__('Rounded Total')"
              background-color="white" hide-details :model-value="formtCurrency(invoice_doc.rounded_total)" disabled
              :prefix="currencySymbol(invoice_doc.currency)" />
          </v-col>

          <v-col cols="6" v-if="pos_profile.posa_allow_sales_order && invoiceType == 'Order'">
            <DatePicker :placeholder="__('Delivery Date')" type="date" model-type="format"
              v-model="invoice_doc.posa_delivery_date" :enable-time-picker="false" :format="'yyyy-MM-dd'"
              :teleport="'body'" auto-apply />
          </v-col>

          <v-col cols="12" v-if="invoice_doc.posa_delivery_date">
            <v-autocomplete density="compact" clearable auto-select-first variant="outlined" color="primary"
              :label="__('Address')" v-model="invoice_doc.shipping_address_name" :items="addresses"
              item-title="address_title" item-value="name" background-color="white" no-data-text="Address not found"
              hide-details :filter="addressFilter" append-icon="mdi-plus" @click:append="new_address">
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-title class="primary--text subtitle-1" v-html="item.address_title" />
                  <v-list-item-title v-html="item.address_line1" />
                  <v-list-item-subtitle v-if="item.custoaddress_line2mer_name" v-html="item.address_line2" />
                  <v-list-item-subtitle v-if="item.city" v-html="item.city" />
                  <v-list-item-subtitle v-if="item.state" v-html="item.state" />
                  <v-list-item-subtitle v-if="item.country" v-html="item.mobile_no" />
                  <v-list-item-subtitle v-if="item.address_type" v-html="item.address_type" />
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>

          <v-col cols="12" v-if="pos_profile.posa_display_additional_notes">
            <v-textarea class="pa-0" variant="outlined" density="compact" background-color="white" clearable
              color="primary" auto-grow rows="2" :label="__('Additional Notes')" v-model="invoice_doc.posa_notes"
              :model-value="invoice_doc.posa_notes" />
          </v-col>
        </v-row>

        <div :class="{ 'rtl': isRTL }" v-if="pos_profile.posa_allow_customer_purchase_order">
          <v-divider></v-divider>
          <v-row :class="{ 'rtl': isRTL }" class="px-1 py-0" justify="center" align="start">
            <v-col cols="6">
              <v-text-field v-model="invoice_doc.po_no" :label="__('Purchase Order')" variant="outlined"
                density="compact" background-color="white" clearable color="primary" hide-details />
            </v-col>
            <v-col cols="6">
              <v-menu ref="po_date_menu" v-model="po_date_menu" :close-on-content-click="false"
                transition="scale-transition">
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field v-model="invoice_doc.po_date" :label="__('Purchase Order Date')" readonly
                    variant="outlined" density="compact" hide-details v-bind="attrs" v-on="on" color="primary" />
                </template>
                <v-date-picker v-model="invoice_doc.po_date" no-title scrollable color="primary"
                  @input="po_date_menu = false" />
              </v-menu>
            </v-col>
          </v-row>
        </div>

        <v-divider></v-divider>

        <v-row :class="{ 'rtl': isRTL }" class="px-1 py-0" align="start" no-gutters>
          <v-col cols="6" v-if="pos_profile.posa_allow_write_off_change && diff_payment > 0 && !invoice_doc.is_return">
            <v-switch class="my-0 py-0" v-model="is_write_off_change" flat :label="__('Write Off Difference Amount')" />
          </v-col>
          <v-col cols="6" v-if="pos_profile.posa_allow_credit_sale && !invoice_doc.is_return">
            <v-switch v-model="is_credit_sale" variant="flat" :label="__('Is Credit Sale')" class="my-0 py-0" />
          </v-col>
          <v-col cols="6" v-if="invoice_doc.is_return && pos_profile.use_cashback">
            <v-switch v-model="is_cashback" flat :label="__('Is Cashback')" class="my-0 py-0" />
          </v-col>
          <v-col cols="6" v-if="is_credit_sale">
            <v-menu ref="date_menu" v-model="date_menu" :close-on-content-click="false" transition="scale-transition">
              <template v-slot:activator="{ props: { on, attrs } }">
                <v-text-field v-model="invoice_doc.due_date" :label="__('Due Date')" readonly variant="outlined"
                  density="compact" hide-details v-bind="attrs" v-on="on" color="primary" />
              </template>
              <v-date-picker v-model="invoice_doc.due_date" :no-title="true" scrollable color="primary" :min="frappe.datetime.now_date()
                " @update:model-value="date_menu = false" />
            </v-menu>
          </v-col>
          <v-col cols="6" v-if="!invoice_doc.is_return && pos_profile.use_customer_credit">
            <v-switch v-model="redeem_customer_credit" flat :label="__('Use Customer Credit')" class="my-0 py-0"
              @change="get_available_credit($event.target.value)" />
          </v-col>
        </v-row>

        <div :class="{ 'rtl': isRTL }"
          v-if="invoice_doc && available_customer_credit > 0 && !invoice_doc.is_return && redeem_customer_credit">
          <v-row v-for="(row, idx) in customer_credit_dict" :key="idx">
            <v-col cols="4">
              <div class="pa-2 py-3">{{ row.credit_origin }}</div>
            </v-col>
            <v-col cols="4">
              <v-text-field density="compact" variant="outlined" color="primary" :label="__('Available Credit')"
                background-color="white" hide-details :model-value="formtCurrency(row.total_credit)" disabled
                :prefix="currencySymbol(invoice_doc.currency)" />
            </v-col>
            <v-col cols="4">
              <v-text-field density="compact" variant="outlined" color="primary" :label="__('Redeem Credit')"
                background-color="white" hide-details type="number" v-model="row.credit_to_redeem"
                :prefix="currencySymbol(invoice_doc.currency)" />
            </v-col>
          </v-row>
        </div>

        <v-divider></v-divider>

        <v-row :class="{ 'rtl': isRTL }" class="pb-0 mb-2" align="start">
          <v-col cols="12">
            <v-autocomplete density="compact" clearable auto-select-first variant="outlined" color="primary"
              :label="__('Sales Person')" v-model="sales_person" :items="sales_persons" item-title="sales_person_name"
              item-value="name" background-color="white" :no-data-text="__('Sales Person not found')" hide-details
              :filter="salesPersonFilter" :disabled="readonly">
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-title class="primary--text subtitle-1" v-html="item.sales_person_name" />
                  <v-list-item-subtitle v-if="item.sales_person_name != item.name" v-html="`ID: ${item.name}`" />
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
      </div>
    </v-card>

    <v-card :class="{ 'rtl': isRTL }" flat class="cards mb-0 mt-3 py-0">
      <v-row :class="{ 'rtl': isRTL }" align="start" no-gutters>
        <v-col cols="6">
          <v-btn block large color="primary" dark @click="submit" :disabled="vaildatPayment">{{ __("Submit") }}</v-btn>
        </v-col>
        <v-col cols="6" class="pl-1">
          <v-btn block large color="success" dark @click="submit(undefined, false, true)" :disabled="vaildatPayment">
            {{ __("Submit & Print") }}
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-btn block class="mt-2 pa-1" large color="error" dark @click="back_to_invoice">
            {{ __("Cancel Payment") }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- تأكيد رقم الدفع الهاتفي -->
    <div :class="{ 'rtl': isRTL }">
      <v-dialog :class="{ 'rtl': isRTL }" v-model="phone_dialog" max-width="400px">
        <v-card :class="{ 'rtl': isRTL }">
          <v-card-title :class="{ 'rtl': isRTL }">
            <span :class="{ 'rtl': isRTL }" class="headline primary--text">{{ __("Confirm Mobile Number") }}</span>
          </v-card-title>
          <v-card-text :class="{ 'rtl': isRTL }" class="pa-0">
            <v-container :class="{ 'rtl': isRTL }">
              <v-text-field density="compact" variant="outlined" color="primary" :label="__('Mobile Number')"
                background-color="white" hide-details v-model="invoice_doc.contact_mobile" type="number" />
            </v-container>
          </v-card-text>
          <v-card-actions :class="{ 'rtl': isRTL }">
            <v-spacer></v-spacer>
            <v-btn :class="{ 'rtl': isRTL }" color="error" dark @click="phone_dialog = false">
              {{ __("Close") }}
            </v-btn>
            <v-btn :class="{ 'rtl': isRTL }" color="primary" dark @click="request_payment">
              {{ __("Request") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <!-- إدخال رقم واتساب مع تحقق صحة -->
    <div :class="{ 'rtl': isRTL }">
      <v-dialog :class="{ 'rtl': isRTL }" v-model="whastapp_mobile_dialog" max-width="700px" :key="dialogKey">
        <v-card :class="{ 'rtl': isRTL }">
          <v-card-title :class="{ 'rtl': isRTL }">
            <span :class="{ 'rtl': isRTL }" class="headline primary--text">
              {{ __("ادخل رقم الواتساب لارسال الفاتورة PDF") }}
            </span>
          </v-card-title>
          <v-card-text :class="{ 'rtl': isRTL }" class="pa-0">
            <v-container :class="{ 'rtl': isRTL }">
              <MobileGCCInput v-model="invoice_doc.contact_mobile" emitFormat="whatsapp" :label="__('Mobile Number')" :defaultCountry="defualt_country"
                density="compact" color="primary" variant="outlined" :required="true" @valid="whats_valid = $event"
                @update:whats="onWhatsUpdate" />
              <div v-if="invoice_doc.contact_mobile && !whats_valid" class="text-caption mt-1"
                style="color: var(--v-theme-error);">
                {{ __('Please enter a valid mobile number.') }}
              </div>
            </v-container>
          </v-card-text>
          <v-card-actions :class="{ 'rtl': isRTL }">
            <v-spacer></v-spacer>
            <v-btn :class="{ 'rtl': isRTL }" color="error" dark @click="whastapp_mobile_dialog = false">
              {{ __("Close") }}
            </v-btn>
            <v-btn :class="{ 'rtl': isRTL }" v-show="!pos_profile.mandatory_mobile_number_in_whatsapp_dialog"
              color="error" dark @click="ignoor_send_whastapp_mobile = true; whastapp_mobile_dialog = false; submit();">
              {{ __("تخطي الارسال") }}
            </v-btn>
            <v-btn :class="{ 'rtl': isRTL }" color="primary" dark
              :disabled="pos_profile.mandatory_mobile_number_in_whatsapp_dialog && !whats_valid"
              @click="whastapp_mobile_dialog = false; submit();">
              {{ __("Submit") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script>
import { evntBus } from "../../bus";
import format from "../../format";
import DatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import MobileGCCInput from "./MobileGCCInput.vue";

export default {
  mixins: [format],
  data: () => ({
    isRTL: false,
    loading: false,
    pos_profile: "",
    invoice_doc: "",
    loyalty_amount: 0,
    is_credit_sale: 0,
    is_write_off_change: 0,
    date_menu: false,
    po_date_menu: false,
    addresses: [],
    sales_persons: [],
    sales_person: "",
    paid_change: 0,
    order_delivery_date: false,
    paid_change_rules: [],
    is_return: false,
    is_cashback: true,
    redeem_customer_credit: false,
    customer_credit_dict: [],
    phone_dialog: false,
    whastapp_mobile_dialog: false,
    ignoor_send_whastapp_mobile: false,
    invoiceType: "Invoice",
    pos_settings: "",
    customer_info: "",
    mpesa_modes: [],
    readonly: false,
    prev_contact_mobile: "",
    // ✅ للتحقق من صحة رقم واتساب
    whats_valid: false,
    whats_digits: "",
    // ✅ مفتاح لإعادة تركيب الدايالوج
    dialogKey: 0,
    defualt_country: ""
  }),

  components: {
    DatePicker,
    MobileGCCInput,
  },

  methods: {
    onWhatsUpdate(newDigits) {
      // خزّن القيمة الجديدة (منسّقة: cc+local بدون +)
      this.whats_digits = newDigits;

      // لا نكمل لو ما عندنا زبون/فاتورة
      if (!this.invoice_doc || !this.invoice_doc.customer) return;

      // لا نكمل لو الرقم غير صالح بعد
      if (!this.whats_valid) return;

      // لو لم يتغيّر فعليًا عن السابق، تجاهل
      if ((newDigits || "") === (this.prev_contact_mobile || "")) return;

      // استدعِ الدالة فقط عند التغيّر
      frappe.call({
        method: "posawesome.posawesome.api.posapp.set_customer_info",
        args: {
          customer: this.invoice_doc.customer,
          fieldname: "mobile_no",
          value: newDigits, // صيغة whatsapp: أرقام فقط cc+local (بدون +)
        },
        callback: (r) => {
          // تحديث المرجع حتى لا نعيد الاتصال
          this.prev_contact_mobile = newDigits;
        },
        error: () => {
          evntBus.emit("show_mesage", { text: __("Failed to update mobile"), color: "error" });
        },
      });
    },

    back_to_invoice() {
      evntBus.emit("show_payment", "false");
      evntBus.emit("set_customer_readonly", false);
    },

    submit(event, payment_received = false, print = false) {
      const mandatory = !!this.pos_profile?.mandatory_mobile_number_in_whatsapp_dialog;
      const show_dialog_send_mobile_whatsapp =
        this.pos_profile?.show_dialog_send_mobile_whatsapp || this.pos_profile?.always_show_mobile_number_dialog;

      if (show_dialog_send_mobile_whatsapp) {
        // إلزامي: يجب رقم واتساب صالح
        if (mandatory) {
          if (!this.whats_valid) {
            // close → nextTick → open لضمان ظهور الدايالوج كل مرة
            this.whastapp_mobile_dialog = false;
            this.$nextTick(() => { this.whastapp_mobile_dialog = true; });
            evntBus.emit("show_mesage", { text: __("Please enter a valid mobile number."), color: "error" });
            frappe.utils.play_sound("error");
            return;
          }
        } else {
          // غير إلزامي: إن لم يوجد رقم صالح ولم يضغط المستخدم تخطي → افتح الدايالوج
          if (!this.ignoor_send_whastapp_mobile && (!this.invoice_doc?.contact_mobile || !this.whats_valid)) {
            this.whastapp_mobile_dialog = false;
            this.$nextTick(() => { this.whastapp_mobile_dialog = true; });
            return;
          }
        }

        // إعادة ضبط خيار التخطي بعد المرور مرة واحدة
        if (this.ignoor_send_whastapp_mobile) this.ignoor_send_whastapp_mobile = false;
      }

      if (!this.invoice_doc.is_return && this.total_payments < 0) {
        evntBus.emit("show_mesage", { text: `Payments not correct`, color: "error" });
        frappe.utils.play_sound("error");
        return;
      }

      // validate phone payment
      let phone_payment_is_valid = true;
      if (!payment_received) {
        this.invoice_doc.payments.forEach((payment) => {
          if (payment.type == "Phone" && ![0, "0", "", null, undefined].includes(payment.amount)) {
            phone_payment_is_valid = false;
          }
        });
        if (!phone_payment_is_valid) {
          evntBus.emit("show_mesage", {
            text: __("Please request phone payment or use other payment method"),
            color: "error",
          });
          frappe.utils.play_sound("error");
          console.error("phone payment not requested");
          return;
        }
      }

      if (
        !this.pos_profile.posa_allow_partial_payment &&
        this.total_payments < (this.invoice_doc.rounded_total || this.invoice_doc.grand_total)
      ) {
        evntBus.emit("show_mesage", { text: `The amount paid is not complete`, color: "error" });
        frappe.utils.play_sound("error");
        return;
      }

      if (this.pos_profile.posa_allow_partial_payment && !this.pos_profile.posa_allow_credit_sale && this.total_payments == 0) {
        evntBus.emit("show_mesage", { text: `Please enter the amount paid`, color: "error" });
        frappe.utils.play_sound("error");
        return;
      }

      if (!this.paid_change) this.paid_change = 0;

      if (this.paid_change > -this.diff_payment) {
        evntBus.emit("show_mesage", { text: `Paid change can not be greater than total change!`, color: "error" });
        frappe.utils.play_sound("error");
        return;
      }

      let total_change = this.flt(this.flt(this.paid_change) + this.flt(-this.credit_change));

      if (this.is_cashback && total_change != -this.diff_payment) {
        evntBus.emit("show_mesage", { text: `Error in change calculations!`, color: "error" });
        frappe.utils.play_sound("error");
        return;
      }

      let credit_calc_check = this.customer_credit_dict.filter((row) => {
        if (flt(row.credit_to_redeem)) return flt(row.credit_to_redeem) > flt(row.total_credit);
        else return false;
      });

      if (credit_calc_check.length > 0) {
        evntBus.emit("show_mesage", { text: `redeamed credit can not greater than its total.`, color: "error" });
        frappe.utils.play_sound("error");
        return;
      }

      if (
        !this.invoice_doc.is_return &&
        this.redeemed_customer_credit > (this.invoice_doc.rounded_total || this.invoice_doc.grand_total)
      ) {
        evntBus.emit("show_mesage", { text: `can not redeam customer credit more than invoice total`, color: "error" });
        frappe.utils.play_sound("error");
        return;
      }

      this.submit_invoice(print);
      this.customer_credit_dict = [];
      this.redeem_customer_credit = false;
      this.is_cashback = true;
      this.sales_person = "";

      evntBus.emit("new_invoice", "false");
      this.back_to_invoice();
    },

    submit_invoice(print) {
      let totalPayedAmount = 0;
      this.invoice_doc.payments.forEach((payment) => {
        payment.amount = flt(payment.amount);
        totalPayedAmount += payment.amount;
      });

      if (this.invoice_doc.is_return && totalPayedAmount == 0) {
        this.invoice_doc.is_pos = 0;
      }

      if (this.customer_credit_dict.length) {
        this.customer_credit_dict.forEach((row) => {
          row.credit_to_redeem = flt(row.credit_to_redeem);
        });
      }

      let data = {};
      data["total_change"] = !this.invoice_doc.is_return ? -this.diff_payment : 0;
      data["paid_change"] = !this.invoice_doc.is_return ? this.paid_change : 0;
      data["credit_change"] = -this.credit_change;
      data["redeemed_customer_credit"] = this.redeemed_customer_credit;
      data["customer_credit_dict"] = this.customer_credit_dict;
      data["is_cashback"] = this.is_cashback;

      const vm = this;
      frappe.call({
        method: "posawesome.posawesome.api.posapp.submit_invoice",
        args: { data: data, invoice: this.invoice_doc },
        async: true,
        callback: function (r) {
          if (r.message) {
            if (print) vm.load_print_page();
            evntBus.emit("set_last_invoice", vm.invoice_doc.name);
            evntBus.emit("show_mesage", { text: `Invoice ${r.message.name} is Submited`, color: "success" });
            evntBus.emit("update_items");
            frappe.utils.play_sound("submit");
            this.addresses = [];
            // (اختياري) إن أردت فتح الدايالوج بعد الاعتماد، اتركه؛ وإلا احذفه.
            // vm.whastapp_mobile_dialog = true;
            // vm.whats_valid = false;
          }
        },
      });
    },

    set_full_amount(idx) {
      this.invoice_doc.payments.forEach((payment) => {
        payment.amount = payment.idx == idx ? this.invoice_doc.rounded_total || this.invoice_doc.grand_total : 0;
      });
    },
    set_rest_amount(idx) {
      this.invoice_doc.payments.forEach((payment) => {
        if (payment.idx == idx && payment.amount == 0 && this.diff_payment > 0) {
          payment.amount = this.diff_payment;
        }
      });
    },
    clear_all_amounts() {
      this.invoice_doc.payments.forEach((payment) => {
        payment.amount = 0;
      });
    },

    load_print_page() {
      const print_format = this.pos_profile.print_format_for_online || this.pos_profile.print_format;
      const letter_head = this.pos_profile.letter_head || 0;
      const url =
        frappe.urllib.get_base_url() +
        "/printview?doctype=Sales%20Invoice&name=" +
        this.invoice_doc.name +
        "&trigger_print=1" +
        "&format=" +
        print_format +
        "&no_letterhead=" +
        letter_head;
      const printWindow = window.open(url, "Print");
      printWindow.addEventListener(
        "load",
        function () {
          printWindow.print();
        },
        true
      );
    },

    validate_due_date() {
      const today = frappe.datetime.now_date();
      const parse_today = Date.parse(today);
      const new_date = Date.parse(this.invoice_doc.due_date);
      if (new_date < parse_today) {
        setTimeout(() => {
          this.invoice_doc.due_date = today;
        }, 0);
      }
    },
    shortPay(e) {
      if (e.key === "x" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.submit();
      }
    },
    set_paid_change() {
      if (!this.paid_change) this.paid_change = 0;
      this.paid_change_rules = [];
      let change = -this.diff_payment;
      if (this.paid_change > change) {
        this.paid_change_rules = ["Paid change can not be greater than total change!"];
        this.credit_change = 0;
      }
    },
    get_available_credit(e) {
      this.clear_all_amounts();
      if (e) {
        frappe
          .call("posawesome.posawesome.api.posapp.get_available_credit", {
            customer: this.invoice_doc.customer,
            company: this.pos_profile.company,
          })
          .then((r) => {
            const data = r.message;
            if (data.length) {
              const amount = this.invoice_doc.rounded_total || this.invoice_doc.grand_total;
              let remainAmount = amount;
              data.forEach((row) => {
                if (remainAmount > 0) {
                  if (remainAmount >= row.total_credit) {
                    row.credit_to_redeem = row.total_credit;
                    remainAmount = remainAmount - row.total_credit;
                  } else {
                    row.credit_to_redeem = remainAmount;
                    remainAmount = 0;
                  }
                } else {
                  row.credit_to_redeem = 0;
                }
              });
              this.customer_credit_dict = data;
            } else {
              this.customer_credit_dict = [];
            }
          });
      } else {
        this.customer_credit_dict = [];
      }
    },
    get_addresses() {
      const vm = this;
      if (!vm.invoice_doc) return;
      frappe.call({
        method: "posawesome.posawesome.api.posapp.get_customer_addresses",
        args: { customer: vm.invoice_doc.customer },
        async: true,
        callback: function (r) {
          vm.addresses = !r.exc ? r.message : [];
        },
      });
    },
    addressFilter(item, queryText) {
      const textOne = item.address_title ? item.address_title.toLowerCase() : "";
      const textTwo = item.address_line1 ? item.address_line1.toLowerCase() : "";
      const textThree = item.address_line2 ? item.address_line2.toLowerCase() : "";
      const textFour = item.city ? item.city.toLowerCase() : "";
      const textFifth = item.name.toLowerCase();
      const searchText = queryText.toLowerCase();
      return (
        textOne.indexOf(searchText) > -1 ||
        textTwo.indexOf(searchText) > -1 ||
        textThree.indexOf(searchText) > -1 ||
        textFour.indexOf(searchText) > -1 ||
        textFifth.indexOf(searchText) > -1
      );
    },
    new_address() {
      evntBus.emit("open_new_address", this.invoice_doc.customer);
    },
    get_sales_person_names() {
      const vm = this;
      if (vm.pos_profile.posa_local_storage && localStorage.sales_persons_storage) {
        vm.sales_persons = JSON.parse(localStorage.getItem("sales_persons_storage"));
      }
      frappe.call({
        method: "posawesome.posawesome.api.posapp.get_sales_person_names",
        callback: function (r) {
          if (r.message) {
            vm.sales_persons = r.message;
            if (vm.pos_profile.posa_local_storage) {
              localStorage.setItem("sales_persons_storage", "");
              localStorage.setItem("sales_persons_storage", JSON.stringify(r.message));
            }
          }
        },
      });
    },
    salesPersonFilter(item, queryText) {
      const textOne = item.sales_person_name ? item.sales_person_name.toLowerCase() : "";
      const textTwo = item.name.toLowerCase();
      const searchText = queryText.toLowerCase();
      return textOne.indexOf(searchText) > -1 || textTwo.indexOf(searchText) > -1;
    },
    request_payment() {
      this.phone_dialog = false;
      const vm = this;
      if (!this.invoice_doc.contact_mobile) {
        evntBus.emit("show_mesage", { text: __(`Pleas Set Customer Mobile Number`), color: "error" });
        evntBus.emit("open_edit_customer");
        this.back_to_invoice();
        return;
      }
      evntBus.emit("freeze", { title: __(`Waiting for payment... `) });
      this.invoice_doc.payments.forEach((payment) => {
        payment.amount = flt(payment.amount);
      });
      let formData = { ...this.invoice_doc };
      formData["total_change"] = -this.diff_payment;
      formData["paid_change"] = this.paid_change;
      formData["credit_change"] = -this.credit_change;
      formData["redeemed_customer_credit"] = this.redeemed_customer_credit;
      formData["customer_credit_dict"] = this.customer_credit_dict;
      formData["is_cashback"] = this.is_cashback;

      frappe
        .call({
          method: "posawesome.posawesome.api.posapp.update_invoice",
          args: { data: formData },
          async: false,
          callback: function (r) {
            if (r.message) vm.invoice_doc = r.message;
          },
        })
        .then(() => {
          frappe
            .call({
              method: "posawesome.posawesome.api.posapp.create_payment_request",
              args: { doc: vm.invoice_doc },
            })
            .fail(() => {
              evntBus.emit("unfreeze");
              evntBus.emit("show_mesage", { text: __(`Payment request failed`), color: "error" });
            })
            .then(({ message }) => {
              const payment_request_name = message.name;
              setTimeout(() => {
                frappe.db.get_value("Payment Request", payment_request_name, ["status", "grand_total"]).then(({ message }) => {
                  if (message.status != "Paid") {
                    evntBus.emit("unfreeze");
                    evntBus.emit("show_mesage", {
                      text: __(`Payment Request took too long to respond. Please try requesting for payment again`),
                      color: "error",
                    });
                  } else {
                    evntBus.emit("unfreeze");
                    evntBus.emit("show_mesage", {
                      text: __("Payment of {0} received successfully.", [
                        vm.formtCurrency(message.grand_total, vm.invoice_doc.currency, 0),
                      ]),
                      color: "success",
                    });
                    frappe.db.get_doc("Sales Invoice", vm.invoice_doc.name).then((doc) => {
                      vm.invoice_doc = doc;
                      vm.submit(null, true);
                    });
                  }
                });
              }, 30000);
            });
        });
    },
    get_mpesa_modes() {
      const vm = this;
      frappe.call({
        method: "posawesome.posawesome.api.m_pesa.get_mpesa_mode_of_payment",
        args: { company: vm.pos_profile.company },
        async: true,
        callback: function (r) {
          vm.mpesa_modes = !r.exc ? r.message : [];
        },
      });
    },
    is_mpesa_c2b_payment(payment) {
      if (this.mpesa_modes.includes(payment.mode_of_payment) && payment.type == "Bank") {
        payment.amount = 0;
        return true;
      } else {
        return false;
      }
    },
    mpesa_c2b_dialg(payment) {
      const data = {
        company: this.pos_profile.company,
        mode_of_payment: payment.mode_of_payment,
        customer: this.invoice_doc.customer,
      };
      evntBus.emit("open_mpesa_payments", data);
    },
    set_mpesa_payment(payment) {
      this.pos_profile.use_customer_credit = 1;
      this.redeem_customer_credit = true;
      const invoiceAmount = this.invoice_doc.rounded_total || this.invoice_doc.grand_total;
      let amount = payment.unallocated_amount > invoiceAmount ? invoiceAmount : payment.unallocated_amount;
      if (amount < 0 || !amount) amount = 0;
      const advance = {
        type: "Advance",
        credit_origin: payment.name,
        total_credit: flt(payment.unallocated_amount),
        credit_to_redeem: flt(amount),
      };
      this.clear_all_amounts();
      this.customer_credit_dict.push(advance);
    },

    fetchUserLanguage() {
      frappe.call({
        method: "frappe.client.get",
        args: { doctype: "User", name: frappe.session.user },
        callback: (response) => {
          if (response.message) {
            let userLang = response.message.language;
            this.applyDirection(userLang);
          }
        },
      });
    },
    applyDirection(lang) {
      if (lang === "ar") {
        this.isRTL = true;
        document.body.setAttribute("dir", "rtl");
        document.body.classList.add("rtl");
      } else {
        this.isRTL = false;
        document.body.setAttribute("dir", "ltr");
        document.body.classList.remove("rtl");
      }
    },
  },

  computed: {
    total_payments() {
      let total = parseFloat(this.invoice_doc.loyalty_amount);
      if (this.invoice_doc && this.invoice_doc.payments) {
        this.invoice_doc.payments.forEach((payment) => {
          total += this.flt(payment.amount);
        });
      }
      total += this.flt(this.redeemed_customer_credit);
      if (!this.is_cashback) total = 0;
      return this.flt(total, this.currency_precision);
    },
    diff_payment() {
      let diff_payment = this.flt(
        (this.invoice_doc.rounded_total || this.invoice_doc.grand_total) - this.total_payments,
        this.currency_precision
      );
      this.paid_change = -diff_payment;
      return diff_payment;
    },
    credit_change() {
      let change = -this.diff_payment;
      if (this.paid_change > change) return 0;
      return this.flt(this.paid_change - change, this.currency_precision);
    },
    diff_lable() {
      return this.diff_payment < 0 ? "Change" : "To Be Paid";
    },
    available_pioints_amount() {
      let amount = 0;
      if (this.customer_info.loyalty_points) {
        amount = this.customer_info.loyalty_points * this.customer_info.conversion_factor;
      }
      return amount;
    },
    available_customer_credit() {
      let total = 0;
      this.customer_credit_dict.map((row) => (total += row.total_credit));
      return total;
    },
    redeemed_customer_credit() {
      let total = 0;
      this.customer_credit_dict.map((row) => {
        if (flt(row.credit_to_redeem)) total += flt(row.credit_to_redeem);
        else row.credit_to_redeem = 0;
      });
      return total;
    },
    vaildatPayment() {
      if (this.pos_profile.posa_allow_sales_order) {
        if (this.invoiceType == "Order" && !this.invoice_doc.posa_delivery_date) return true;
        else return false;
      } else {
        return false;
      }
    },
    request_payment_field() {
      let res = false;
      if (!this.pos_settings || this.pos_settings.invoice_fields.length == 0) res = false;
      else {
        this.pos_settings.invoice_fields.forEach((el) => {
          if (el.fieldtype == "Button" && el.fieldname == "request_for_payment") res = true;
        });
      }
      return res;
    },
  },

  mounted() {
    this.fetchUserLanguage();
    this.$nextTick(function () {
      evntBus.on("send_invoice_doc_payment",async (invoice_doc) => {
        this.invoice_doc = invoice_doc;
        this.prev_contact_mobile = (this.invoice_doc?.contact_mobile || "").toString();
        // ✅ إعادة تهيئة حالة الدايلوج لكل عملية
        this.whastapp_mobile_dialog = false;
        this.whats_valid = false;
        this.ignoor_send_whastapp_mobile = false;
        this.dialogKey++; // ✅ إعادة تركيب الدايالوج عند كل فاتورة

        const default_payment = this.invoice_doc.payments.find((payment) => payment.default == 1);
        this.is_credit_sale = 0;
        this.is_write_off_change = 0;
        if (default_payment && !invoice_doc.is_return) {
          default_payment.amount = this.flt(invoice_doc.rounded_total || invoice_doc.grand_total, this.currency_precision);
        }
        if (invoice_doc.is_return) {
          this.is_return = true;
          invoice_doc.payments.forEach((payment) => {
            payment.amount = 0;
            payment.base_amount = 0;
          });
        }
        this.loyalty_amount = 0;
        this.get_addresses();
        this.get_sales_person_names();
        if (this.pos_profile?.defualt_country) {
          var defualt_country = await frappe.db.get_value("Country", this.pos_profile?.defualt_country, "code");
          console.log(defualt_country)
          if (defualt_country?.message?.code)
            this.defualt_country = defualt_country?.message?.code.toLocaleUpperCase();
        }
      });
      evntBus.on("register_pos_profile", (data) => {
        this.pos_profile = data.pos_profile;
        this.get_mpesa_modes();
      });
      evntBus.on("add_the_new_address", (data) => {
        this.addresses.push(data);
        this.$forceUpdate();
      });
      evntBus.on("update_invoice_type", (data) => {
        this.invoiceType = data;
        if (this.invoice_doc && data != "Order") {
          this.invoice_doc.posa_delivery_date = null;
          this.invoice_doc.posa_notes = null;
          this.invoice_doc.shipping_address_name = null;
        }
      });
    });
    evntBus.on("update_customer", (customer) => {
      if (this.customer != customer) {
        this.customer_credit_dict = [];
        this.redeem_customer_credit = false;
        this.is_cashback = true;
      }
    });
    evntBus.on("set_pos_settings", (data) => {
      this.pos_settings = data;
    });
    evntBus.on("set_customer_info_to_edit", (data) => {
      this.customer_info = data;
    });
    evntBus.on("set_mpesa_payment", (data) => {
      this.set_mpesa_payment(data);
    });
  },
  created() {
    document.addEventListener("keydown", this.shortPay.bind(this));
  },
  beforeDestroy() {
    evntBus.off("send_invoice_doc_payment");
    evntBus.off("register_pos_profile");
    evntBus.off("add_the_new_address");
    evntBus.off("update_invoice_type");
    evntBus.off("update_customer");
    evntBus.off("set_pos_settings");
    evntBus.off("set_customer_info_to_edit");
    evntBus.off("update_invoice_coupons");
    evntBus.off("set_mpesa_payment");
  },
  destroyed() {
    document.removeEventListener("keydown", this.shortPay);
  },

  watch: {
    loyalty_amount(value) {
      if (value > this.available_pioints_amount) {
        this.invoice_doc.loyalty_amount = 0;
        this.invoice_doc.redeem_loyalty_points = 0;
        this.invoice_doc.loyalty_points = 0;
        evntBus.emit("show_mesage", {
          text: `Loyalty Amount can not be more then ${this.available_pioints_amount}`,
          color: "error",
        });
      } else {
        this.invoice_doc.loyalty_amount = this.flt(this.loyalty_amount);
        this.invoice_doc.redeem_loyalty_points = 1;
        this.invoice_doc.loyalty_points = this.flt(this.loyalty_amount) / this.customer_info.conversion_factor;
      }
    },
    is_credit_sale(value) {
      if (value == 1) {
        this.invoice_doc.payments.forEach((payment) => {
          payment.amount = 0;
          payment.base_amount = 0;
        });
      }
    },
    is_write_off_change(value) {
      if (value == 1) {
        this.invoice_doc.write_off_amount = this.diff_payment;
        this.invoice_doc.write_off_outstanding_amount_automatically = 1;
      } else {
        this.invoice_doc.write_off_amount = 0;
        this.invoice_doc.write_off_outstanding_amount_automatically = 0;
      }
    },
    redeemed_customer_credit(value) {
      if (value > this.available_customer_credit) {
        evntBus.emit("show_mesage", {
          text: `You can redeem customer credit upto ${this.available_customer_credit}`,
          color: "error",
        });
      }
    },
    sales_person() {
      if (this.sales_person) {
        this.invoice_doc.sales_team = [{ sales_person: this.sales_person, allocated_percentage: 100 }];
      } else {
        this.invoice_doc.sales_team = [];
      }
    },
  },
};
</script>

<style scoped>
.rtl {
  direction: rtl;
  text-align: right;
}

.rtl .v-navigation-drawer {
  left: auto !important;
  right: 0 !important;
}

.rtl .v-list {
  text-align: right;
}

.rtl .v-btn {
  float: left;
}
</style>
