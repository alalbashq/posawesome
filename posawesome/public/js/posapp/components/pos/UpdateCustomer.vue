<template>
  <v-row :class="{'rtl': isRTL}" justify="center">
    <v-dialog
      :class="{'rtl': isRTL}"
      v-model="customerDialog"
      max-width="600px"
      @click:outside="clear_customer"
    >
      <v-card :class="{'rtl': isRTL}">
        <v-card-title :class="{'rtl': isRTL}">
          <span :class="{'rtl': isRTL}" v-if="customer_id" class="headline primary--text">{{
            __('Update Customer')
          }}</span>
          <span :class="{'rtl': isRTL}" v-else class="headline primary--text">{{
            __('Create Customer')
          }}</span>
        </v-card-title>
        <v-card-text :class="{'rtl': isRTL}" class="pa-0">
          <v-container :class="{'rtl': isRTL}">
            <v-row :class="{'rtl': isRTL}">
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  variant="outlined"
                  color="primary"
                  :label="__('Customer Name') + ' *'"
                  hide-details
                  v-model="customer_name"
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  density="compact"
                  variant="outlined"
                  color="primary"
                  :label="__('Tax ID')"
                  hide-details
                  v-model="tax_id"
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  density="compact"
                  variant="outlined"
                  color="primary"
                  :label="__('Mobile No')"
                  hide-details
                  v-model="mobile_no"
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  density="compact"
                  variant="outlined"
                  color="primary"
                  :label="__('Email Id')"
                  hide-details
                  v-model="email_id"
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-select
                  density="compact"
                  variant="outlined"
                  label="Gender"
                  :items="genders"
                  v-model="gender"
                ></v-select>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  density="compact"
                  variant="outlined"
                  color="primary"
                  :label="__('Referral Code')"
                  hide-details
                  v-model="referral_code"
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <DatePicker
                  :placeholder="__('Birthday')"
                  type="date"
                  v-model="birthday"
                  model-type="format"
                  :enable-time-picker="false"
                  :format="'yyyy-MM-dd'"
                  :teleport="'body'"
                  auto-apply
                />

              </v-col>

              <v-col cols="6">
                <v-autocomplete
                  clearable
                  density="compact"
                  variant="outlined"
                  auto-select-first
                  color="primary"
                  :label="__('Customer Group')"
                  v-model="group"
                  :items="groups"
                  background-color="white"
                  :no-data-text="__('Group not found')"
                  hide-details
                >
                </v-autocomplete>
              </v-col>

              <v-col cols="6">
                <v-autocomplete
                  clearable
                  density="compact"
                  variant="outlined"
                  auto-select-first
                  color="primary"
                  :label="__('Territory')"
                  v-model="territory"
                  :items="territorys"
                  background-color="white"
                  :no-data-text="__('Territory not found')"
                  hide-details
                >
                </v-autocomplete>
              </v-col>

              <v-col cols="6" v-if="loyalty_program">
                <v-text-field
                  v-model="loyalty_program"
                  :label="__('Loyalty Program')"
                  density="compact"
                  variant="outlined"
                  readonly
                  hide-details
                ></v-text-field>
              </v-col>

              <v-col cols="6" v-if="loyalty_points">
                <v-text-field
                  v-model="loyalty_points"
                  :label="__('Loyalty Points')"
                  density="compact"
                  variant="outlined"
                  readonly
                  hide-details
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions :class="{'rtl': isRTL}">
          <v-spacer></v-spacer>
          <v-btn :class="{'rtl': isRTL}" color="error" dark @click="close_dialog">{{
            __('Close')
          }}</v-btn>
          <v-btn :class="{'rtl': isRTL}" color="success" dark @click="submit_dialog">{{
            __('Submit')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { evntBus } from '../../bus';
import DatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

export default {
  data: () => ({
    isRTL: false,
    customerDialog: false,
    pos_profile: '',
    customer_id: '',
    customer_name: '',
    tax_id: '',
    mobile_no: '',
    email_id: '',
    referral_code: '',
    birthday: null,
    birthday_menu: false,
    group: '',
    groups: [],
    territory: '',
    territorys: [],
    genders: [],
    customer_type: 'Individual',
    gender: '',
    loyalty_points: null,
    loyalty_program: null,
  }),
  components: {
    DatePicker
  },
  watch: {},
  methods: {
    close_dialog() {
      this.customerDialog = false;
      this.clear_customer();
    },
    clear_customer() {
      this.customer_name = '';
      this.tax_id = '';
      this.mobile_no = '';
      this.email_id = '';
      this.referral_code = '';
      this.birthday = '';
      this.group = frappe.defaults.get_user_default('Customer Group');
      this.territory = frappe.defaults.get_user_default('Territory');
      this.customer_id = '';
      this.customer_type = 'Individual';
      this.gender = '';
      this.loyalty_points = null;
      this.loyalty_program = null;
    },
    getCustomerGroups() {
      if (this.groups.length > 0) return;
      const vm = this;
      frappe.db
        .get_list('Customer Group', {
          fields: ['name'],
          filters: { is_group: 0 },
          limit: 1000,
          order_by: 'name',
        })
        .then((data) => {
          if (data.length > 0) {
            data.forEach((el) => {
              vm.groups.push(el.name);
            });
          }
        });
    },
    getCustomerTerritorys() {
      if (this.territorys.length > 0) return;
      const vm = this;
      frappe.db
        .get_list('Territory', {
          fields: ['name'],
          filters: { is_group: 0 },
          limit: 5000,
          order_by: 'name',
        })
        .then((data) => {
          if (data.length > 0) {
            data.forEach((el) => {
              vm.territorys.push(el.name);
            });
          }
        });
    },
    getGenders() {
      const vm = this;
      frappe.db
        .get_list('Gender', {
          fields: ['name'],
          page_length: 10,
        })
        .then((data) => {
          if (data.length > 0) {
            data.forEach((el) => {
              vm.genders.push(el.name);
            });
          }
        });
    },

    submit_dialog() {      
      if (!this.customer_name) {
        evntBus.emit('show_mesage', {
          text: __('Customer name is required.'),
          color: 'error',
        });
        return;
      }
      if (this.customer_name) {
        const vm = this;
        const args = {
          customer_id: this.customer_id,
          customer_name: this.customer_name,
          company: this.pos_profile.company,
          tax_id: this.tax_id,
          mobile_no: this.mobile_no,
          email_id: this.email_id,
          referral_code: this.referral_code,
          birthday: this.birthday,
          customer_group: this.group,
          territory: this.territory,
          customer_type: this.customer_type,
          gender: this.gender,
          method: this.customer_id ? 'update' : 'create',
          pos_profile_doc: this.pos_profile,
        };
        frappe.call({
          method: 'posawesome.posawesome.api.posapp.create_customer',
          args: args,
          callback: (r) => {
            if (!r.exc && r.message.name) {
              let text = __('Customer created successfully.');
              if (vm.customer_id) {
                text = __('Customer updated successfully.');
              }
              evntBus.emit('show_mesage', {
                text: text,
                color: 'success',
              });
              args.name = r.message.name;
              frappe.utils.play_sound('submit');
              evntBus.emit('add_customer_to_list', args);
              evntBus.emit('set_customer', r.message.name);
              evntBus.emit('fetch_customer_details');

              evntBus.emit('refresh_customer_list');
              
              this.close_dialog();
            } else {
              frappe.utils.play_sound('error');
              evntBus.emit('show_mesage', {
                text: __('Customer creation failed.'),
                color: 'error',
              });
            }
          },
        });
        this.customerDialog = false;
      }
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
      evntBus.on('open_update_customer', (data) => {
        this.customerDialog = true;
        if (data) {
          this.customer_name = data.customer_name;
          this.customer_id = data.name;
          this.tax_id = data.tax_id;
          this.mobile_no = data.mobile_no;
          this.email_id = data.email_id;
          this.referral_code = data.referral_code;
          this.birthday = data.birthday;
          this.group = data.customer_group;
          this.territory = data.territory;
          this.loyalty_points = data.loyalty_points;
          this.loyalty_program = data.loyalty_program;
          this.gender = data.gender;
        }
      });
      // evntBus.on('register_pos_profile', (data) => {
      //   this.pos_profile = data.pos_profile;
      // });


      evntBus.on('register_pos_profile', (data) => {
        this.pos_profile = data.pos_profile;
        localStorage.setItem('pos_profile', JSON.stringify(data.pos_profile));
      });

      const savedProfile = localStorage.getItem('pos_profile');
      if (savedProfile) {
        this.pos_profile = JSON.parse(savedProfile);
      }




      evntBus.on('payments_register_pos_profile', (data) => {
        this.pos_profile = data.pos_profile;
      });
      this.getCustomerGroups();
      this.getCustomerTerritorys();
      this.getGenders();
      // set default values for customer group and territory from user defaults
      this.group = frappe.defaults.get_user_default('Customer Group');
      this.territory = frappe.defaults.get_user_default('Territory');
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