<!-- <template>
  <v-row justify="center">
    <v-dialog v-model="isOpen" persistent max-width="600px">     
      <v-card :class="{'rtl': isRTL}">
        <v-card-title :class="{'rtl': isRTL}">
          <span :class="{'rtl': isRTL}" class="headline primary--text">{{
            __('Create POS Opening Shift')
          }}</span>
        </v-card-title>
        <v-card-text>
          <v-container :class="{'rtl': isRTL}">
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  :items="companies"
                  :label="frappe._('Company')"
                  v-model="company"
                  required
                ></v-autocomplete>
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  :items="pos_profiles"
                  :label="frappe._('POS Profile')"
                  v-model="pos_profile"
                  required
                ></v-autocomplete>
              </v-col>
              <v-col cols="12">
                  <v-data-table
                    :headers="payments_methods_headers"
                    :items="payments_methods"
                    item-value="mode_of_payment"
                    return-object
                    class="elevation-1"
                    :items-per-page="itemsPerPage"
                    hide-default-footer
                  >
                    <template v-slot:[`item.amount`]="{ item }">
                      {{ currencySymbol(item.currency) }}
                      <v-text-field
                        v-model="item.amount"
                        :rules="[max25chars]"
                        :label="frappe._('Edit')"
                        single-line
                        counter
                        type="number"
                        @blur="item.editing = false"
                      ></v-text-field>
                    </template>
                  </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :class="{'rtl': isRTL}" color="error" dark @click="go_desk">Cancel</v-btn>
          <v-btn
            :class="{'rtl': isRTL}"
            color="success"
            :disabled="is_loading"
            dark
            @click="submit_dialog"
            >Submit</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { evntBus } from '../../bus';
import format from '../../format';

export default {
  mixins: [format],
  props: ['dialog'],
  setup(props) {
    const isRTL = ref(false);
    const isOpen = ref(props.dialog ? props.dialog : false);
    const dialog_data = ref({});
    const is_loading = ref(false);
    const companies = ref([]);
    const company = ref('');
    const pos_profiles_data = ref([]);
    const pos_profiles = ref([]);
    const pos_profile = ref('');
    const payments_method_data = ref([]);
    const payments_methods = ref([]);
    const payments_methods_headers = ref([
      {
        title: __('Mode of Payment'),
        align: 'start',
        sortable: false,
        key: 'mode_of_payment',
      },
      {
        title: __('Opening Amount'),
        key: 'amount',
        align: 'center',
        sortable: false,
      },
    ]);
    const itemsPerPage = ref(100);
    const max25chars = (v) => v.length <= 12 || 'Input too long!'; // TODO : should validate as number

    const close_opening_dialog = () => {
      evntBus.emit('close_opening_dialog');
    };

    const get_opening_dialog_data = () => {
      frappe.call({
        method: 'posawesome.posawesome.api.posapp.get_opening_dialog_data',
        args: {},
        callback: function (r) {
          if (r.message) {
            r.message.companies.forEach((element) => {
              companies.value.push(element.name);
            });
            company.value = companies.value[0];
            pos_profiles_data.value = r.message.pos_profiles_data;
            payments_method_data.value = r.message.payments_method;
          }
        },
      });
    };

    const submit_dialog = () => {
      if (!payments_methods.value.length || !company.value || !pos_profile.value) {
        return;
      }
      is_loading.value = true;
      frappe
        .call('posawesome.posawesome.api.posapp.create_opening_voucher', {
          pos_profile: pos_profile.value,
          company: company.value,
          balance_details: payments_methods.value,
        })
        .then((r) => {
          if (r.message) {
            evntBus.emit('register_pos_data', r.message);
            evntBus.emit('set_company', r.message.company);
            close_opening_dialog();
            is_loading.value = false;
          }
        });
    };

    const go_desk = () => {
      frappe.set_route('/');
      location.reload();
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

    watch(company, (val) => {
      pos_profiles.value = [];
      pos_profiles_data.value.forEach((element) => {
        if (element.company === val) {
          pos_profiles.value.push(element.name);
        }
      });
      pos_profile.value = pos_profiles.value.length ? pos_profiles.value[0] : '';
    });

    watch(pos_profile, (val) => {
      payments_methods.value = [];
      payments_method_data.value.forEach((element) => {
        if (element.parent === val) {
          payments_methods.value.push({
            mode_of_payment: element.mode_of_payment,
            amount: 0,
            currency: element.currency,
          });
        }
      });
    });

    onMounted(() => {
      get_opening_dialog_data();
      fetchUserLanguage();
    });

    return {
      isRTL,
      isOpen,
      dialog_data,
      is_loading,
      companies,
      company,
      pos_profiles_data,
      pos_profiles,
      pos_profile,
      payments_method_data,
      payments_methods,
      payments_methods_headers,
      itemsPerPage,
      max25chars,
      close_opening_dialog,
      submit_dialog,
      go_desk,
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
</style> -->

<template>
  <v-row justify="center">
    <v-dialog v-model="isOpen" persistent max-width="480px">
      <v-card class="custom-dialog">
        <v-card-title class="custom-title">
          <span>{{ __('Create POS Opening Shift') }}</span>
        </v-card-title>

        <v-card-text class="custom-body">
           <div class="custom-container">
            <v-row dense>
              <v-col cols="12">
                <v-autocomplete
                  :items="companies"
                  :label="frappe._('Company')"
                  v-model="company"
                  outlined
                  dense
                  variant="outlined"
                  density="compact"
                  color="primary"
                   hide-details="auto"
                  class="custom-field"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  :items="pos_profiles"
                  :label="frappe._('POS Profile')"
                  v-model="pos_profile"
                  outlined
                  dense
                  variant="outlined"
                  density="compact"
                  color="primary"
                  class="custom-field"
                  hide-details="auto"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12">
                <div class="table-header">
                    <div>{{ __('Mode of Payment') }}</div>
                    <div>{{ __('Opening Amount') }}</div>
                  </div>
                <div class="custom-table">                
                  <div
                    class="table-row"
                    v-for="(item, index) in payments_methods"
                    :key="index"
                  >
                    <div>{{ item.mode_of_payment }}</div>
                    <div class="input-cell">
                      <span class="currency-symbol">{{ currencySymbol(item.currency) }}</span>
                      <v-text-field
                        v-model="item.amount"
                        :rules="[max25chars]"
                        type="number"
                        dense
                        density="compact"
                        color="primary"                     
                        hide-details="auto"
                        variant="outlined"
                        class="amount-input custom-field"
                      ></v-text-field>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
            <br>
            <v-card-actions class="custom-actions">
              <v-spacer></v-spacer>
              <v-btn class="cancel-btn" @click="go_desk">Cancel</v-btn>
              <v-btn class="submit-btn" :loading="is_loading" @click="submit_dialog">Submit</v-btn>
            </v-card-actions>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<style scoped>
.custom-dialog {
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to right, #3b82f6, #6366f1);
  border-radius: 0px;
  border-radius: 40px 40px !important;
}
.v-dialog>.v-overlay__content>.v-card, .v-dialog>.v-overlay__content>form>.v-card {
    display: flex;
    flex-direction: column;
    border-radius: 0px;
    border-radius: 40px 40px;
}
.custom-title {
    background: linear-gradient(to right, #3b82f6, #6366f1);
    color: #fff;
    text-align: center;
    padding: 18px;
    font-size: 18px;
    font-weight: 600;
    border: 0px;
    border-color: transparent;
}
.custom-body {
    padding: 0px !important;
    border-radius: 0px;
    background: linear-gradient(to right, #3b82f6, #6366f1);
    border: 0px;
}
.custom-container {
    padding:24px;
    border-radius: 27px 0px;
    border-color: red;
    background: linear-gradient(135deg, rgb(238, 242, 247), rgb(255, 255, 255));
}
.custom-field {
  /* background: white; */
  border-radius: 10px;
  padding: 0 2px;
}
.custom-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  font-size: 14px;
  margin-top: 0px;
}
.input-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}
.currency-symbol {
  margin-right: 6px;
  font-size: 14px;
  color: #6b7280;
}
.amount-input {
  max-width: 100px;
  /* background-color: #f3f4f6; */
  border-radius: 6px;
  padding: 0 1px;
}
.custom-actions {
  background:linear-gradient(135deg, rgb(238, 242, 247), rgb(255, 255, 255));
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
}
.cancel-btn {
  background-color: #ef4444;
  color: white;
  border-radius: 999px;
  padding: 6px 18px;
  margin-right: 8px;
  font-weight: 500;
}
.submit-btn {
  background-color: #10b981;
  color: white;
  border-radius: 999px;
  padding: 6px 18px;
  font-weight: 500;
}
.custom-table {
    background-color: #fff;
    border-radius: 0 12px;
    padding: 0px 14px;
    display: flex;
    flex-direction: column;
    gap: 0px;
}
.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 6px;
  background: #ddedf9;
  border-radius: 10px 10px 0px 0px;
}
.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 1px 0;
}
/* .table-header {
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
} */
.table-row:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
}
.input-cell {
  display: flex;
  align-items: center;
}
.currency-symbol {
  margin-right: 6px;
  font-size: 14px;
  color: #6b7280;
}
.amount-input {
  max-width: 100px;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 0 4px;
}

</style>
<script>

import format from '../../format';
import { evntBus } from '../../bus';
export default {
  mixins: [format],
  props: ['dialog'],
  data() {
    return {
      isOpen: this.dialog ? this.dialog : false,
      dialog_data: {},
      is_loading: false,
      companies: [],
      company: '',
      pos_profiles_data: [],
      pos_profiles: [],
      pos_profile: '',
      payments_method_data: [],
      payments_methods: [],
      payments_methods_headers: [
        {
          title: __('Mode of Payment'),
          align: 'start',
          sortable: false,
          value: 'mode_of_payment',
        },
        {
          title: __('Opening Amount'),
          value: 'amount',
          align: 'center',
          sortable: false,
        },
      ],
      itemsPerPage: 100,
      max25chars: (v) => v.length <= 12 || 'Input too long!', // TODO : should validate as number
      pagination: {},
      snack: false, // TODO : need to remove
      snackColor: '', // TODO : need to remove
      snackText: '', // TODO : need to remove
    };
  },
  watch: {
    company(val) {
      this.pos_profiles = [];
      this.pos_profiles_data.forEach((element) => {
        if (element.company === val) {
          this.pos_profiles.push(element.name);
        }
        if (this.pos_profiles.length) {
          this.pos_profile = this.pos_profiles[0];
        } else {
          this.pos_profile = '';
        }
      });
    },
    pos_profile(val) {
      this.payments_methods = [];
      this.payments_method_data.forEach((element) => {
        if (element.parent === val) {
          this.payments_methods.push({
            mode_of_payment: element.mode_of_payment,
            amount: 0,
            currency: element.currency,
          });
        }
      });
    },
  },
  methods: {
    close_opening_dialog() {
      evntBus.emit('close_opening_dialog');
    },
    get_opening_dialog_data() {
      const vm = this;
      frappe.call({
        method: 'posawesome.posawesome.api.posapp.get_opening_dialog_data',
        args: {},
        callback: function (r) {
          if (r.message) {
            r.message.companies.forEach((element) => {
              vm.companies.push(element.name);
            });
            vm.company = vm.companies[0];
            vm.pos_profiles_data = r.message.pos_profiles_data;
            vm.payments_method_data = r.message.payments_method;
          }
        },
      });
    },
    submit_dialog() {
      if (!this.payments_methods.length || !this.company || !this.pos_profile) {
        return;
      }
      this.is_loading = true;
      var vm = this;
      return frappe
        .call('posawesome.posawesome.api.posapp.create_opening_voucher', {
          pos_profile: this.pos_profile,
          company: this.company,
          balance_details: this.payments_methods,
        })
        .then((r) => {
          if (r.message) {
            evntBus.emit('register_pos_data', r.message);
            evntBus.emit('set_company', r.message.company);
            vm.close_opening_dialog();
            is_loading = false;
          }
        });
    },
    go_desk() {
      frappe.set_route('/');
      location.reload();
    },
  },
  mounted: function () {
    this.get_opening_dialog_data();
  },
  beforeUnmount() {
    // Clean up event listeners if any were added
  },
};
</script>