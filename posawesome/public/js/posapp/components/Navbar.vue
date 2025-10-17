<template>
  <nav>
    <v-app-bar :class="{'rtl': isRTL}" app height="40">
      <v-list-item
        v-for="listItem in items"
        :key="listItem.text"
        @click="changePage(listItem.text)"
      >
        <v-icon style="font-size: 30px; margin-left: 20px; margin-right: 20px; padding: 0;" color="black" :title="listItem.text">{{ listItem.icon }}</v-icon>
      </v-list-item>



      <v-spacer></v-spacer>
      <v-btn
        icon
        variant="text"
        color="primary"
        :title="__('Go to Desk')"
        style="color: black !important;"
        @click="go_desk"
      >
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <!-- <v-btn
        icon
        variant="outlined"
        color="primary"
        :title="__('الاصناف الاكثر مبيعا')"
        style="color: black !important;"
        @click="go_desk"
      >
      الاصناف الاكثر مبيعا
      </v-btn>
      <v-btn
        icon        
        variant="outlined"
        color="primary"
        :title="__('الاصناف الاقل مبيعا')"
        style="color: black !important;"
        @click="go_desk"
      >     
        الاصناف الاقل مبيعا
      </v-btn> -->

      <v-btn style="cursor: unset" variant="text" color="black">
        <span right>{{ pos_profile.name }}</span>
      </v-btn>
      <div class="text-center">
        <v-menu offset="y">
          <template v-slot:activator="{ props }">
            <v-btn color="black" dark variant="text" v-bind="props">
              Menu
            </v-btn>
          </template>
          <v-card class="mx-auto" max-width="300" tile>
            <v-list density="compact" v-model="menu_item">


              
              <v-list-item
                @click="close_shift_dialog"
                v-if="!pos_profile.posa_hide_closing_shift && menu_item == 0"
              >
                <v-icon class="mr-2">mdi-content-save-move-outline</v-icon>
                <span>{{ __('Close Shift') }}</span>
              </v-list-item>



              <v-list-item
                @click="print_last_invoice"
                v-if="pos_profile.posa_allow_print_last_invoice && this.last_invoice"
              >
                <v-icon class="mr-2">mdi-printer</v-icon>
                <span>{{ __('Print Last Invoice') }}</span>
              </v-list-item>
              <v-divider class="my-0"></v-divider>
              <v-list-item @click="logOut">
                <v-icon class="mr-2">mdi-logout</v-icon>
                <span>{{ __('Logout') }}</span>
              </v-list-item>
              <v-list-item @click="go_about">
                <v-icon class="mr-2">mdi-information-outline</v-icon>
                <span>{{ __('About') }}</span>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </v-app-bar>

    <v-snackbar v-model="snack" :timeout="5000" :color="snackColor" top right>
      {{ snackText }}
    </v-snackbar>
    <v-dialog v-model="freeze" persistent max-width="290">
      <v-card>
        <v-card-title class="text-h5">{{ freezeTitle }}</v-card-title>
        <v-card-text>{{ freezeMsg }}</v-card-text>
      </v-card>
    </v-dialog>
  </nav>
</template>

<script>
import { evntBus } from '../bus';
import Payments from './pos/Payments.vue';
export default {
  components: {Payments},
  data() {
    return {
      isRTL: false,
      drawer: false,
      mini: true,
      item: 0,
      items: [{ text: 'POS', icon: 'mdi-network-pos' }],
      page: '',
      fav: true,
      menu: false,
      message: false,
      hints: true,
      menu_item: 0,
      snack: false,
      snackColor: '',
      snackText: '',
      company: 'POS Awesome',
      company_img: '/assets/erpnext/images/erpnext-logo.svg',
      pos_profile: '',
      freeze: false,
      freezeTitle: '',
      freezeMsg: '',
      last_invoice: '',
    };
  },
  methods: {
    changePage(key) {
      this.$emit('changePage', key);
    },
    
    go_desk() {
      frappe.set_route('/');
      location.reload();
    },

    go_about() {
      const win = window.open(
        'https://github.com/yrestom/POS-Awesome',
        '_blank'
      );
      win.focus();
    },
    close_shift_dialog() {
      evntBus.emit('open_closing_dialog');
    },
    show_mesage(data) {
      this.snack = true;
      this.snackColor = data.color;
      this.snackText = data.text;
    },
    logOut() {
      var me = this;
      me.logged_out = true;
      return frappe.call({
        method: 'logout',
        callback: function (r) {
          if (r.exc) {
            return;
          }
          frappe.set_route('/login');
          location.reload();
        },
      });
    },
    print_last_invoice() {
      if (!this.last_invoice) return;
      const print_format =
        this.pos_profile.print_format_for_online ||
        this.pos_profile.print_format;
      const letter_head = this.pos_profile.letter_head || 0;
      const url =
        frappe.urllib.get_base_url() +
        '/printview?doctype=Sales%20Invoice&name=' +
        this.last_invoice +
        '&trigger_print=1' +
        '&format=' +
        print_format +
        '&no_letterhead=' +
        letter_head;
      const printWindow = window.open(url, 'Print');
      printWindow.addEventListener(
        'load',
        function () {
          printWindow.print();
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
    }
  },
  mounted: function () {
    this.fetchUserLanguage();
  },

  created: function () {
    this.$nextTick(function () {
      evntBus.on('show_mesage', (data) => {
        this.show_mesage(data);
      });
      evntBus.on('set_company', (data) => {
        this.company = data.name;
        this.company_img = data.company_logo
          ? data.company_logo
          : this.company_img;
      });
      
      evntBus.on('register_pos_profile', (data) => {
        this.pos_profile = data.pos_profile;
        const payments = { text: 'Payments', icon: 'mdi-cash-register' };
        if (
          this.pos_profile.posa_use_pos_awesome_payments &&
          this.items.length !== 2
        ) {
          this.items.push(payments);
        }
      });
      
      evntBus.on('set_last_invoice', (data) => {
        this.last_invoice = data;
      });
      evntBus.on('freeze', (data) => {
        this.freeze = true;
        this.freezeTitle = data.title;
        this.freezeMsg = data.msg;
      });
      evntBus.on('unfreeze', () => {
        this.freeze = false;
        this.freezTitle = '';
        this.freezeMsg = '';
      });
    });
  },
};
</script>

<style scoped>
.margen-top {
  margin-top: 0px;
}

.rtl {
  direction: rtl;
}
</style>