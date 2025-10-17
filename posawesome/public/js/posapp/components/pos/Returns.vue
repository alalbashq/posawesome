<template>
  <v-row justify="center">
    <v-dialog v-model="invoicesDialog" max-width="800px" min-width="800px">
      <v-card >
        <v-card-title  :class="{'rtl': isRTL}">
          <span class="headline primary--text">{{ __('Select Return Invoice') }}</span>
        </v-card-title>
        <v-container :class="{'rtl': isRTL}">
          <v-row class="mb-4">
            <v-text-field
              @keyup.enter="search_invoices"
              :label="__('Enter Invoice ID or Customer Name')"
              hide-details
              v-model="invoice_name"
              density="compact"
              clearable
              class="mx-4"
              style="background-color: #fff; border: 1px soled #000;"
            ></v-text-field>
            <v-btn text class="mt-1 mr-2" @click="search_invoices" style="background-color: #000; color: #fff;">
              {{ __('Search') }}
            </v-btn>
          </v-row>
          <v-row>
            <v-col cols="12" class="pa-1" v-if="dialog_data">

              <v-data-table
                :headers="headers"
                :items="dialog_data"
                item-value="name"
                return-object
                class="elevation-1"
              >
                <template v-slot:[`item.grand_total`]="{ item }">
                  {{ currencySymbol(item.currency) }} {{ formtCurrency(item.grand_total) }}
                </template>

                <template v-slot:item.return="{ item }">
                  <v-btn
                    title="Return"
                    icon
                    @click="submit_dialog(item)"
                    style="width: 30px; height: 30px; background-color: #fff; margin-top: 5px;  margin-right: 20px;"
                  >
                    <v-icon style="font-size: 30px; color: #000;">mdi-refresh</v-icon>
                  </v-btn>
                </template>


                <template v-slot:item.print="{ item }">
                  <v-btn
                    title="Print"
                    icon
                    @click="load_print_page(item)"
                    style="width: 30px; height: 30px; background-color: #fff; margin-top: 5px;  margin-right: 20px;"
                  >
                    <v-icon style="font-size: 30px; color: #000;">mdi-printer</v-icon>
                  </v-btn>
                </template>

                
              </v-data-table>
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions class="mt-4">
          <v-spacer></v-spacer>
          <v-btn color="error mx-2" dark @click="close_dialog" style="padding: 10px;">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { evntBus } from '../../bus';
import format from '../../format';
export default {
  mixins: [format],
  data: () => ({
    isRTL: false,
    invoicesDialog: false,
    singleSelect: true,
    selected: [],
    dialog_data: '',
    company: '',
    invoice_name: '',
    headers: [
      { title: __("Return"), key: "return", align: "end" },
      { title: __("Print"), key: "print", align: "end" },
      {
        title: __('Customer'),
        key: 'customer',
        align: 'start',
        sortable: true,
      },
      {
        title: __('Date'),
        align: 'start',
        sortable: true,
        key: 'posting_date',
      },
      {
        title: __('Invoice'),
        key: 'name',
        align: 'start',
        sortable: true,
      },
      {
        title: __('Amount'),
        key: 'grand_total',
        align: 'end',
        sortable: false,
      },
    ],
  }),
  watch: {},
  methods: {
    close_dialog() {
      this.invoicesDialog = false;
    },
    search_invoices_by_enter(e) {
      if (e.keyCode === 13) {
        this.search_invoices();
      }
    },
    search_invoices() {
      const vm = this;
      frappe.call({
        method: 'posawesome.posawesome.api.posapp.search_invoices_for_return',
        args: {
          invoice_name: vm.invoice_name,
          company: vm.company,
        },
        async: false,
        callback: function (r) {
          if (r.message) {
            vm.dialog_data = r.message;
          }
        },
      });
    },

    submit_dialog(item) {
      const return_doc = item; 
      const invoice_doc = {};
      const items = [];

      return_doc.items.forEach((item) => {
          const new_item = { ...item };
          new_item.qty = item.qty * -1;
          new_item.stock_qty = item.stock_qty * -1;
          new_item.amount = item.amount * -1;
          items.push(new_item);
      });

      invoice_doc.items = items;
      invoice_doc.is_return = 1;
      invoice_doc.return_against = return_doc.name;
      invoice_doc.customer = return_doc.customer;

      const data = { invoice_doc, return_doc };

      evntBus.emit('load_return_invoice', data);

      this.invoicesDialog = false;
  },

  load_print_page(item) {
    // console.log("Print Items :" , item)
    const print_format = item.print_format || "Standard";
    const letter_head = item.letter_head || 0;
    const url =
      frappe.urllib.get_base_url() +
      "/printview?doctype=Sales%20Invoice&name=" +
      item.name + 
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
        // printWindow.close();
      },
      true
    );
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
        }
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

  mounted() {
    this.fetchUserLanguage();
  },

  created: function () {
    evntBus.on('open_returns', (data) => {
      this.invoicesDialog = true;
      this.company = data;
      this.invoice_name = '';
      this.dialog_data = '';
      this.selected = [];
    });
  },
};
</script>

<style scoped>
.v-btn--variant-elevated{
  box-shadow: none;
}
.v-btn--size-default {
  --v-btn-height: 0
}
.v-btn__underlay {
  background-color: #000; color: #fff; padding: 5px 10px;
}

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