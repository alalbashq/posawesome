<template>
  <v-row :class="{'rtl': isRTL}" justify="center">
    <v-dialog :class="{'rtl': isRTL}" v-model="closingDialog" max-width="900px">
      <v-card :class="{'rtl': isRTL}">
        <v-card-title :class="{'rtl': isRTL}">
          <span :class="{'rtl': isRTL}" class="headline primary--text">{{ __('Closing POS Shift') }}</span>
        </v-card-title>
        <v-card-text :class="{'rtl': isRTL}" class="pa-0">
          <v-container :class="{'rtl': isRTL}">
            <v-row :class="{'rtl': isRTL}">
              <v-col cols="12" class="pa-1">
                <v-data-table
                  :headers="headers"
                  :items="dialog_data.payment_reconciliation"
                  item-value="mode_of_payment"
                  return-object
                  class="elevation-1"
                  :items-per-page="itemsPerPage"
                  hide-default-footer
                >
                  <template v-slot:[`item.closing_amount`]="{ item }">
                    {{ currencySymbol(pos_profile.currency) }}
                    <div v-if="item.editing">
                      <v-text-field
                        v-model="item.closing_amount"
                        :rules="[max25chars]"
                        :label="__('Edit')"
                        single-line
                        counter
                        type="number"
                        @blur="item.editing = false"
                      ></v-text-field>
                    </div>
                    <div v-else @click="item.editing = true">
                      {{ formtCurrency(item.closing_amount) }}
                    </div>
                  </template>
                  <template v-slot:[`item.difference`]="{ item }">
                    {{ currencySymbol(pos_profile.currency) }}
                    {{
                      (item.difference = formtCurrency(
                        item.expected_amount - item.closing_amount
                      ))
                    }}
                  </template>
                  <template v-slot:[`item.opening_amount`]="{ item }">
                    {{ currencySymbol(pos_profile.currency) }}
                    {{ formtCurrency(item.opening_amount) }}
                  </template>
                  <template v-slot:[`item.expected_amount`]="{ item }">
                    {{ currencySymbol(pos_profile.currency) }}
                    {{ formtCurrency(item.expected_amount) }}
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions :class="{'rtl': isRTL}">
          <v-spacer></v-spacer>
          <v-btn :class="{'rtl': isRTL}" color="error" dark @click="close_dialog">
            {{ __('Close') }}
          </v-btn>
          <v-btn :class="{'rtl': isRTL}" color="success" dark @click="submit_dialog">
            {{ __('Submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>


<script>
import { ref, onMounted } from 'vue';
import { evntBus } from '../../bus';
import format from '../../format';

export default {
  mixins: [format],
  setup() {
    const isRTL = ref(false);
    const closingDialog = ref(false);
    const itemsPerPage = ref(20);
    const dialog_data = ref({ payment_reconciliation: [] });
    const pos_profile = ref('');
    const headers = ref([
      {
        title: __('Mode of Payment'),
        key: 'mode_of_payment',
        align: 'start',
        sortable: true,
      },
      {
        title: __('Opening Amount'),
        align: 'end',
        sortable: true,
        key: 'opening_amount',
      },
      {
        title: __('Closing Amount'),
        key: 'closing_amount',
        align: 'end',
        sortable: true,
      },
    ]);
    const max25chars = (v) => v.length <= 20 || 'Input too long!';

    const close_dialog = () => {
      closingDialog.value = false;
    };

    const submit_dialog = () => {
      evntBus.emit('submit_closing_pos', dialog_data.value);
      closingDialog.value = false;
    };

    const fetchUserLanguage = () => {
      frappe.call({
        method: "frappe.client.get",
        args: { doctype: "User", name: frappe.session.user },
        callback: (response) => {
          if (response.message) {
            let userLang = response.message.language;
            applyDirection(userLang);
          }
        }
      });
    };

    const applyDirection = (lang) => {
      if (lang === "ar") {
        isRTL.value  = true;
        document.body.setAttribute("dir", "rtl");
        document.body.classList.add("rtl");
      } else {
        isRTL.value  = false;
        document.body.setAttribute("dir", "ltr");
        document.body.classList.remove("rtl");
      }
    };

    onMounted(() => {
      fetchUserLanguage();
      evntBus.on('open_ClosingDialog', (data) => {
        closingDialog.value = true;
        dialog_data.value = data;
      });
      evntBus.on('register_pos_profile', (data) => {
        pos_profile.value = data.pos_profile;
        if (!pos_profile.value.hide_expected_amount) {
          headers.value.push({
            title: __('Expected Amount'),
            key: 'expected_amount',
            align: 'end',
            sortable: false,
          });
          headers.value.push({
            title: __('Difference'),
            key: 'difference',
            align: 'end',
            sortable: false,
          });
        }
      });
    });

    return {
      isRTL,
      closingDialog,
      itemsPerPage,
      dialog_data,
      pos_profile,
      headers,
      max25chars,
      close_dialog,
      submit_dialog,
    };
  },
};
</script>

<style scoped>
.margen-top {
  margin-top: 0px;
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
