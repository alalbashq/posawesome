<template>
  <v-row justify="center">
    <v-dialog v-model="allinvoiceDialog" max-width="900px">
      <!-- <template v-slot:activator="{ on, attrs }">
          <v-btn color="primary" dark v-bind="attrs" v-on="on">Open Dialog</v-btn>
        </template>-->
      <v-card>
        <v-card-title>
          <span class="headline primary--text">{{ __("Select Invoice") }}</span>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-container>
            <v-row class="mb-4">
            <v-text-field
              color="primary"
              :label="frappe._('Invoice ID')"
              background-color="white"
              hide-details
              v-model="invoice_name"
              dense
              clearable
              class="mx-4"
            ></v-text-field>
            <v-btn
              text
              class="ml-2"
              color="primary"
              dark
              @click="search_invoices"
              >{{ __('Search') }}</v-btn
            >
          </v-row>
            <v-row no-gutters>
              <v-col cols="12" class="pa-1">
                <template>
                  <v-data-table
                    :headers="headers"
                    :items="dialog_data"
                    item-key="name"
                    class="elevation-1"                   
                    v-model="selected"
                  >
                    <template v-slot:item.posting_time="{ item }">
                      {{ item.posting_time.split(".")[0] }}
                    </template>
                    <template v-slot:item.grand_total="{ item }">
                      {{ currencySymbol(item.currency) }}
                      {{ formtCurrency(item.grand_total) }}
                    </template>

                    <template v-slot:item.actions="{ item }">
                      <v-icon
                        size="x-large"
                        class="me-2"
                        @click="load_print_page(item)"
                      >
                        mdi-printer
                      </v-icon>                       
                    </template>
                    <template v-slot:no-data>
                      <v-btn color="primary"  @click="reset_data"> Reset </v-btn>
                    </template>
                  </v-data-table>
                </template>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" dark @click="close_dialog">Close</v-btn>          
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { evntBus } from "../../bus";
import format from "../../format";
export default {
  // props: ["draftsDialog"],
  mixins: [format],
  data: () => ({
    allinvoiceDialog: false,
    singleSelect: false,
    pos_opening_shift:{},
    pos_profile:{},
    selected: [],
    dialog_data: {},
    invoice_name: '',
    company: '',
    profile: [],
    headers: [{
        text: __("Customer"),
        value: "customer_name",
        align: "start",
        sortable: true,
      },
      {
        text: __("Date"),
        align: "start",
        sortable: true,
        value: "posting_date",
      },
      {
        text: __("Time"),
        align: "start",
        sortable: true,
        value: "posting_time",
      },
      {
        text: __("Invoice"),
        value: "name",
        align: "start",
        sortable: true,
      },
      {
        text: __("Amount"),
        value: "grand_total",
        align: "end",
        sortable: false,
      },
      {
        text:"",
        value: "creation",
        align: "end",
        sortable: false,
      },
      { title: 'Actions', value: 'actions', sortable: false },
    ],
  }),
  watch: {},
  methods: {
    close_dialog() {      
      this.allinvoiceDialog = false;
    },
    search_invoices_by_enter(e) {
      if (e.keyCode === 13) {
        this.search_invoices();
      }
    },
    reset_data(){
      const vm = this;
      frappe.call({
        method: "posawesome.posawesome.api.posapp.get_all_invoices",
        args: {
          pos_opening_shift: vm.pos_opening_shift.name,
        },
        async: false,
        callback: function (r) {
          if (r.message) {
            vm.dialog_data = r.message;
          }
        },
      });
    },
    search_invoices() {
      const vm = this;
    if(vm.invoice_name){
      frappe.call({
        method: 'posawesome.posawesome.api.posapp.search_invoices_for_allinvoice',
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
    }else {
        const vm = this;
      frappe.call({
        method: "posawesome.posawesome.api.posapp.get_all_invoices",
        args: {
          pos_opening_shift: vm.pos_opening_shift.name,
        },
        async: false,
        callback: function (r) {
          if (r.message) {
            vm.dialog_data = r.message;
          }
        },
      });
      }
    },
    submit_dialog() {
      if (this.selected.length > 0) {
        evntBus.$emit("load_invoice", this.selected[0]);
        this.allinvoiceDialog = false;
      }
    },
    load_print_page(row) {
      console.log(row)
      frappe.call({
        method: "posawesome.posawesome.api.posapp.get_profile_details",
        args: {profile: row.pos_profile },
        async: true,
        callback: function (r) {
          if (!r.exc) {
           this.profile = r.message;
            console.log(r.message)
            
          }
        const print_format =        
        this.profile[0].print_format;
        const letter_head = this.profile[0].letter_head || 0;
        const url =
        frappe.urllib.get_base_url() +
        "/printview?doctype=Sales%20Invoice&name=" +
        row.name +
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
          // NOTE : uncomoent this to auto closing printing window
        },
        true
          );
          },
      });
      // const print_format =
      //   this.pos_profile.print_format_for_online ||
      //   this.pos_profile.print_format;
      // const letter_head = this.pos_profile.letter_head || 0;
      // const url =
      //   frappe.urllib.get_base_url() +
      //   "/printview?doctype=Sales%20Invoice&name=" +
      //   this.invoice_doc.name +
      //   "&trigger_print=1" +
      //   "&format=" +
      //   print_format +
      //   "&no_letterhead=" +
      //   letter_head;
      // const printWindow = window.open(url, "Print");
      // printWindow.addEventListener(
      //   "load",
      //   function () {
      //     printWindow.print();
      //     // printWindow.close();
      //     // NOTE : uncomoent this to auto closing printing window
      //   },
      //   true
      // );
    },
  },
  created: function () {
    evntBus.$on("open_allinvoice", (data,pos_profile,pos_opening_shift) => {
      this.allinvoiceDialog = true;
      this.dialog_data = data;
      this.pos_profile = pos_profile;
      this.pos_opening_shift = pos_opening_shift;
      this.company = pos_profile.company;
      this.invoice_name = '';
    });
  },
};
</script>
