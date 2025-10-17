<template>
  <v-row justify="center">
    <v-dialog v-model="addressDialog" max-width="600px">
      <v-card :class="{'rtl': isRTL}">
        <v-card-title :class="{'rtl': isRTL}">
          <span :class="{'rtl': isRTL}" class="headline primary--text">{{
            __('Add New Address')
          }}</span>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-container :class="{'rtl': isRTL}">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  color="primary"
                  :label="__('Address Name')"
                  background-color="white"
                  hide-details
                  v-model="address.name"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  color="primary"
                  :label="__('Address Line 1')"
                  background-color="white"
                  hide-details
                  v-model="address.address_line1"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  color="primary"
                  :label="__('Address Line 2')"
                  background-color="white"
                  hide-details
                  v-model="address.address_line2"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="City"
                  density="compact"
                  color="primary"
                  background-color="white"
                  hide-details
                  v-model="address.city"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="State"
                  density="compact"
                  background-color="white"
                  hide-details
                  v-model="address.state"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
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
export default {
  data: () => ({
    isRTL: false,
    addressDialog: false,
    address: {},
    customer: '',
  }),

  methods: {
    close_dialog() {
      this.addressDialog = false;
    },

    submit_dialog() {
      const vm = this;
      this.address.customer = this.customer;
      this.address.doctype = 'Customer';
      frappe.call({
        method: 'posawesome.posawesome.api.posapp.make_address',
        args: {
          args: this.address,
        },
        callback: (r) => {
          if (!r.exc) {
            evntBus.emit('add_the_new_address', r.message);
            evntBus.emit('show_mesage', {
              text: 'Customer Address created successfully.',
              color: 'success',
            });
            vm.addressDialog = false;
            vm.customer = '';
            vm.address = {};
          }
        },
      });
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
    evntBus.on('open_new_address', (data) => {
      this.addressDialog = true;
      this.customer = data;
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
