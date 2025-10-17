<template>
  <v-row justify="center">
    <v-dialog v-model="draftsDialog" max-width="900px">
      <v-card :class="{'rtl': isRTL}">
        <v-card-title  :class="{'rtl': isRTL}">
          <span class="headline primary--text"  :class="{'rtl': isRTL}">{{
            __('Select Hold Invoice')
          }}</span>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-container :class="{'rtl': isRTL}">
            <v-row no-gutters>
              <v-col cols="12" class="pa-1">

                <v-data-table
                  :headers="headers"
                  :items="dialog_data"
                  item-value="name"
                  class="elevation-1"
                >

                  <template v-slot:[`item.select`]="{ item }">
                    <v-btn
                      title="Select"
                      icon
                      @click="submit_dialog(item)"
                      style="width: 30px; height: 30px; margin-top: 5px;  margin-right: 20px;"
                    >
                      <v-icon style="font-size: 30px; color: #000;">mdi-check</v-icon>
                    </v-btn>
                  </template>

                  <template v-slot:[`item.posting_time`]="{ item }">
                    {{ item.posting_time.split('.')[0] }}
                  </template>
                  <template v-slot:[`item.grand_total`]="{ item }">
                    {{ currencySymbol(item.currency) }}
                    {{ formtCurrency(item.grand_total) }}
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions :class="{'rtl': isRTL}">
          <v-spacer></v-spacer>
          <v-btn :class="{'rtl': isRTL}" color="error" dark @click="close_dialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { evntBus } from '../../bus';
import format from '../../format';
export default {
  // props: ["draftsDialog"],
  mixins: [format],
  data: () => ({
    isRTL: false,
    draftsDialog: false,
    singleSelect: true,
    selected: [],
    dialog_data: {},
    headers: [
      { title: __("Select"), key: "select", align: "end" },
      {
        title: __('Customer'),
        key: 'customer_name',
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
        title: __('Time'),
        align: 'start',
        sortable: true,
        key: 'posting_time',
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
      this.draftsDialog = false;
    },


    submit_dialog(item) {
      evntBus.emit('load_invoice', item);
      this.draftsDialog = false;
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
    evntBus.on('open_drafts', (data) => {
      this.draftsDialog = true;
      this.dialog_data = data;
    });
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

