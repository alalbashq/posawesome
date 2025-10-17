<template>
  <div>
    <v-navigation-drawer v-model="drawer" :width="150" permanent height="auto"
      style="max-height: 90vh; height: 90vh; overflow-y: auto; background-color: #f9f9f9;">
      <v-list-item :title="frappe._('Item Group')" subtitle="Vuetify"></v-list-item>
      <v-divider></v-divider>
      <v-list density="compact">
        <v-list-item v-for="(group, index) in items_group" :key="index" @click="selectGroup(group)"
          class="hover:bg-gray-200 border-b border-gray-200">
          <v-list-item-title>{{ group }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-card class="selection mx-auto bg-grey-lighten-5 mt-3" style="max-height: 80vh; height: 80vh">
      <v-progress-linear :active="loading" :indeterminate="loading" absolute :location="top"
        color="info"></v-progress-linear>
      <v-row class="items px-2 py-1">
        <v-col class="pb-2 mb-2" cols="1" style="padding: 5px !important;">
          <v-btn icon @click="show_groups" class="bg-white" variant="outlined">
            <v-icon color="primary">mdi-menu</v-icon>
          </v-btn>

        </v-col>
        <v-col class="pb-0 mb-0">
          <v-text-field density="compact" clearable autofocus variant="outlined" color="primary"
            :label="frappe._('Search Items')" hint="Search by item code, serial number, batch no or barcode"
            bg-color="white" hide-details v-model="debounce_search" @keydown.esc="esc_event"
            @keydown.enter="search_onchange" ref="debounce_search"></v-text-field>
        </v-col>
        <v-col cols="3" class="pb-0 mb-2" v-if="pos_profile.posa_input_qty" style="padding: 5px !important;">
          <v-text-field density="compact" variant="outlined" color="primary" :label="frappe._('QTY')" bg-color="white"
            hide-details v-model.number="qty" type="number" @keydown.enter="enter_event"
            @keydown.esc="esc_event"></v-text-field>
        </v-col>
        <v-col cols="2" class="pb-0 mb-2" v-if="pos_profile.posa_new_line" style="padding: 5px !important;">
          <v-checkbox v-model="new_line" color="accent" value="true" label="NLine" density="compact"
            hide-details></v-checkbox>
        </v-col>
        <v-col cols="12" class="pt-0 mt-0">
          <div fluid class="items" v-if="items_view == 'card'">
            <v-row density="default" class="overflow-y-auto" style="max-height: 67vh">
              <v-col v-for="(item, idx) in filtered_items" :key="idx" xl="2" lg="3" md="6" sm="6" cols="6"
                style="padding: 10px 3px;">
                <v-card class="pa-0 product-card" elevation="5" hover @click="add_item(item)">
                  <div class="price-triangle"></div>
                  <div class="price-text">{{ currencySymbol(item.currency) || "" }}
                    {{ formatCurrency(item.rate) || 0 }}</div>
                  <v-img :src="item.image || '/assets/posawesome/js/posapp/components/pos/placeholder-image.png'"
                    class="text-white align-end" gradient="to bottom, rgba(0,0,0,0), rgba(0,0,0,0.4)"
                    height="100px"></v-img>

                  <v-card-text class="text-center text-caption font-weight-bold py-1 px-1"
                    style="max-height: 50px;min-height: 50px;">
                    {{ item.item_name }}
                  </v-card-text>

                  <v-progress-linear :model-value="stockPercentage(item)" height="10"
                    :color="stockBarColor(item.actual_qty)" rounded></v-progress-linear>
                </v-card>
                <v-btn @click="show_available_dialog(item)">عرض توفر العناصر</v-btn>
                
                <v-dialog :model-value="available_dialog === item.item_code" max-width="600" @update:model-value="available_dialog = null">
                  <v-card v-if="item" class="rounded-xl elevation-12">
                    <v-card-title
                      class="text-h5 font-weight-bold text-center justify-center py-4"
                    >
                      {{ item.name }}
                    </v-card-title>

                    <v-divider></v-divider>

                    <v-card-text>
                      <v-container>
                        <v-row align="center" justify="center">
                          <v-col cols="12" class="text-center">
                            <v-img
                              :src="item.image || '/assets/posawesome/js/posapp/components/pos/placeholder-image.png'"
                              max-width="150"
                              class="mx-auto mb-3"
                              v-if="item.image"
                            />
                            <v-icon v-else size="100" color="grey lighten-1"
                              >mdi-package-variant</v-icon
                            >
                            <div class="text-h6 mt-2">
                              Price:
                              <span class="text-primary font-weight-bold">{{ formatPrice(item.rate) }}</span
                              >
                            </div>
                          </v-col>
                        </v-row>

                        <v-row>
                          <v-col cols="12" class="text-subtitle-1">
                            <div>
                              <strong>Main Warehouse:</strong> {{ item.mainWarehouse }}
                            </div>
                            <div>
                              <strong>Available QTY:</strong>
                              <span class="text-success font-weight-bold"
                                >{{ item.availableQty }}</span
                              >
                            </div>
                          </v-col>
                        </v-row>

                        <v-divider class="my-4"></v-divider>

                        <v-row>
                          <v-col cols="12">
                            <div class="text-subtitle-1 font-weight-bold mb-2">
                              Additional Warehouse Availability
                            </div>
                            <v-simple-table dense>
                              <thead>
                                <tr>
                                  <th class="text-left">Warehouse</th>
                                  <th class="text-right">Quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr
                                  v-for="(qty, warehouse) in item.item_available"
                                  :key="warehouse"
                                >
                                  <td>{{ warehouse }}</td>
                                  <td 
                                    class="text-right"
                                    :class="{'text-error': qty === 0, 'font-weight-bold': qty > 0}"
                                  >
                                    {{ qty }}
                                  </td>
                                </tr>
                              </tbody>
                            </v-simple-table>
                            <div class="text-right mt-2 text-subtitle-2 font-weight-bold">
                              Total Quantity: {{ item.totalQty }}
                            </div>
                          </v-col>
                        </v-row>

                        <v-row justify="space-between" class="mt-4">
                          <v-btn color="success" @click="addToCart">Add to Cart</v-btn>
                          <v-btn color="secondary" @click="printDetails">Print</v-btn>
                          <v-btn color="info" @click="downloadPDF">Download PDF</v-btn>
                        </v-row>
                      </v-container>
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-actions class="justify-end px-4 pb-4">
                      <v-btn color="primary" variant="text" @click="available_dialog = null">Close</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-col>
            </v-row>

          </div>
          <div fluid class="items" v-if="items_view == 'list'">
            <div class="my-0 py-0 overflow-y-auto" style="max-height: 65vh">
              <v-data-table :headers="getItemsHeaders()" :items="filtered_items" item-key="item_code" item-value="item-"
                class="elevation-1" :items-per-page="itemsPerPage" hide-default-footer @click:row="click_item_row">
                <template v-slot:item.rate="{ item }">
                </template>
                <template v-slot:item.actual_qty="{ item }">
                  <span class="golden--text">{{
                    formatFloat(item.actual_qty)
                    }}</span>
                </template>
              </v-data-table>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>
    <v-card class="cards mb-0 mt-3 pa-2 bg-grey-lighten-5">
      <v-row no-gutters align="center" justify="center">
        <v-col cols="3" class="mt-1">
          <v-btn-toggle v-model="items_view" color="primary" group density="compact" rounded>
            <v-btn size="small" value="list">{{ __("List") }}</v-btn>
            <v-btn size="small" value="card">{{ __("Card") }}</v-btn>
          </v-btn-toggle>
        </v-col>
        <v-col cols="4" class="mt-2">
          <v-btn size="small" block color="primary" variant="text" @click="show_coupons">{{ couponsCount }} {{
            __("Coupons")
            }}</v-btn>
        </v-col>
        <v-col cols="5" class="mt-2">
          <v-btn size="small" block color="primary" variant="text" @click="show_offers">{{ offersCount }} {{
            __("Offers") }}
            : {{ appliedOffersCount }}
            {{ __("Applied") }}</v-btn>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>

import format from "../../format";
import _ from "lodash";
export default {
  mixins: [format],
  data: () => ({
    pos_profile: "",
    flags: {},
    items_view: "list",
    item_group: "ALL",
    loading: false,
    items_group: ["ALL"],
    items: [],
    search: "",
    first_search: "",
    itemsPerPage: 1000,
    offersCount: 0,
    appliedOffersCount: 0,
    couponsCount: 0,
    appliedCouponsCount: 0,
    customer_price_list: null,
    customer: null,
    new_line: false,
    qty: 1,
    drawer: true,
    mainWarehouse: "",
    mainWarehouse_qty: 0,
    mainWarehouse_qty_stock_uom: 0,
    available_dialog: null,
  }),

  watch: {
    filtered_items(new_value, old_value) {
      if (!this.pos_profile.pose_use_limit_search) {
        if (new_value.length != old_value.length) {
          this.update_items_details(new_value);
        }
      }
    },
    customer() {
      this.get_items();
    },
    new_line() {
      this.eventBus.emit("set_new_line", this.new_line);
    },
  },

  methods: {

  show_available_dialog(item = null) {
      if (!item) {
        this.available_dialog = null;
        return;
      }

      this.available_dialog = item.item_code;

      frappe.call({
        method: 'erpnext.stock.dashboard.item_dashboard.get_data',
        args: { item_code: item.item_code },
        callback: (r) => {
          if (r.message) {
            this.item_available = r.message;
            this.mainWarehouse = this.pos_profile.warehouse;
            const availableItems = this.item_available.filter(it => it.warehouse === this.mainWarehouse);
            this.mainWarehouse_qty = availableItems.length ? availableItems[0].actual_qty : 0;
            this.mainWarehouse_qty_stock_uom = availableItems.length ? availableItems[0].stock_uom : '';
          }
        }
      });
    },

    formatPrice(price) {
      return `$${parseFloat(price).toFixed(2)}`
    },
    stockPercentage(item) {
      const qty = parseFloat(item.actual_qty) || 0;
      if (qty >= 1000) return 100;
      return Math.min((qty / 1000) * 100, 100); // يفترض 1000 أعلى مخزون
    },
    stockBarColor(qty) {
      if (qty > 50) return 'green';
      if (qty > 20) return 'orange';
      return 'red';
    },
    show_offers() {
      this.eventBus.emit("show_offers", "true");
    },
    show_coupons() {
      this.eventBus.emit("show_coupons", "true");
    },
    show_groups() {
      this.drawer = !this.drawer;
    },
    get_items() {
      if (!this.pos_profile) {
        console.error("No POS Profile");
        return;
      }
      const vm = this;
      this.loading = true;
      let search = this.get_search(this.first_search);
      let gr = "";
      let sr = "";
      if (search) {
        sr = search;
      }
      if (vm.item_group != "ALL") {
        gr = vm.item_group.toLowerCase();
      }
      if (
        vm.pos_profile.posa_local_storage &&
        localStorage.items_storage &&
        !vm.pos_profile.pose_use_limit_search
      ) {
        vm.items = JSON.parse(localStorage.getItem("items_storage"));
        this.eventBus.emit("set_all_items", vm.items);
        vm.loading = false;
      }
      frappe.call({
        method: "posawesome.posawesome.api.posapp.get_items",
        args: {
          pos_profile: vm.pos_profile,
          price_list: vm.customer_price_list,
          item_group: gr,
          search_value: sr,
          customer: vm.customer,
        },
        callback: function (r) {
          if (r.message) {
            vm.items = r.message;
            vm.eventBus.emit("set_all_items", vm.items);
            vm.loading = false;
            console.info("Items Loaded");
            if (
              vm.pos_profile.posa_local_storage &&
              !vm.pos_profile.pose_use_limit_search
            ) {
              localStorage.setItem("items_storage", "");
              try {
                localStorage.setItem(
                  "items_storage",
                  JSON.stringify(r.message)
                );
              } catch (e) {
                console.error(e);
              }
            }
            if (vm.pos_profile.pose_use_limit_search) {
              vm.enter_event();
            }
          }
        },
      });
    },
    get_items_groups() {
      if (!this.pos_profile) {
        console.log("No POS Profile");
        return;
      }
      if (this.pos_profile.item_groups.length > 0) {
        this.pos_profile.item_groups.forEach((element) => {
          if (element.item_group !== "All Item Groups") {
            this.items_group.push(element.item_group);
          }
        });
      } else {
        const vm = this;
        frappe.call({
          method: "posawesome.posawesome.api.posapp.get_items_groups",
          args: {},
          callback: function (r) {
            if (r.message) {
              r.message.forEach((element) => {
                vm.items_group.push(element.name);
              });
            }
          },
        });
      }
    },
    getItemsHeaders() {
      const items_headers = [
        {
          title: __("Name"),
          align: "start",
          sortable: true,
          key: "item_name",
        },
        {
          title: __("Code"),
          align: "start",
          sortable: true,
          key: "item_code",
        },
        { title: __("Rate"), key: "rate", align: "start" },
        { title: __("Available QTY"), key: "actual_qty", align: "start" },
        { title: __("UOM"), key: "stock_uom", align: "start" },
      ];
      if (!this.pos_profile.posa_display_item_code) {
        items_headers.splice(1, 1);
      }

      return items_headers;
    },
    click_item_row(event, { item }) {
      this.add_item(item)
    },
    add_item(item) {
      item = { ...item };
      if (item.has_variants) {
        this.eventBus.emit("open_variants_model", item, this.items);
      } else {
        if (!item.qty || item.qty === 1) {
          item.qty = Math.abs(this.qty);
        }
        this.eventBus.emit("add_item", item);
        this.qty = 1;
      }
    },
    enter_event() {
      let match = false;
      if (!this.filtered_items.length || !this.first_search) {
        return;
      }
      const qty = this.get_item_qty(this.first_search);
      const new_item = { ...this.filtered_items[0] };
      new_item.qty = flt(qty);
      new_item.item_barcode.forEach((element) => {
        if (this.search == element.barcode) {
          new_item.uom = element.posa_uom;
          match = true;
        }
      });
      if (
        !new_item.to_set_serial_no &&
        new_item.has_serial_no &&
        this.pos_profile.posa_search_serial_no
      ) {
        new_item.serial_no_data.forEach((element) => {
          if (this.search && element.serial_no == this.search) {
            new_item.to_set_serial_no = this.first_search;
            match = true;
          }
        });
      }
      if (this.flags.serial_no) {
        new_item.to_set_serial_no = this.flags.serial_no;
      }
      if (
        !new_item.to_set_batch_no &&
        new_item.has_batch_no &&
        this.pos_profile.posa_search_batch_no
      ) {
        new_item.batch_no_data.forEach((element) => {
          if (this.search && element.batch_no == this.search) {
            new_item.to_set_batch_no = this.first_search;
            new_item.batch_no = this.first_search;
            match = true;
          }
        });
      }
      if (this.flags.batch_no) {
        new_item.to_set_batch_no = this.flags.batch_no;
      }
      if (match) {
        this.add_item(new_item);
        this.search = null;
        this.first_search = null;
        this.debounce_search = null;
        this.flags.serial_no = null;
        this.flags.batch_no = null;
        this.qty = 1;
        this.$refs.debounce_search.focus();
      }
    },
    selectGroup(group) {
      this.item_group = group;
      this.search_onchange();
    },
    search_onchange() {
      const vm = this;
      if (vm.pos_profile.pose_use_limit_search) {
        vm.get_items();
      } else {
        vm.enter_event();
      }
    },
    get_item_qty(first_search) {
      let scal_qty = Math.abs(this.qty);
      if (first_search.startsWith(this.pos_profile.posa_scale_barcode_start)) {
        let pesokg1 = first_search.substr(7, 5);
        let pesokg;
        if (pesokg1.startsWith("0000")) {
          pesokg = "0.00" + pesokg1.substr(4);
        } else if (pesokg1.startsWith("000")) {
          pesokg = "0.0" + pesokg1.substr(3);
        } else if (pesokg1.startsWith("00")) {
          pesokg = "0." + pesokg1.substr(2);
        } else if (pesokg1.startsWith("0")) {
          pesokg =
            pesokg1.substr(1, 1) + "." + pesokg1.substr(2, pesokg1.length);
        } else if (!pesokg1.startsWith("0")) {
          pesokg =
            pesokg1.substr(0, 2) + "." + pesokg1.substr(2, pesokg1.length);
        }
        scal_qty = pesokg;
      }
      return scal_qty;
    },
    get_search(first_search) {
      let search_term = "";
      if (
        first_search &&
        first_search.startsWith(this.pos_profile.posa_scale_barcode_start)
      ) {
        search_term = first_search.substr(0, 7);
      } else {
        search_term = first_search;
      }
      return search_term;
    },
    esc_event() {
      this.search = null;
      this.first_search = null;
      this.qty = 1;
      this.$refs.debounce_search.focus();
    },
    update_items_details(items) {
      // set debugger
      const vm = this;
      frappe.call({
        method: "posawesome.posawesome.api.posapp.get_items_details",
        args: {
          pos_profile: vm.pos_profile,
          items_data: items,
        },
        callback: function (r) {
          if (r.message) {
            items.forEach((item) => {
              const updated_item = r.message.find(
                (element) => element.item_code == item.item_code
              );
              item.actual_qty = updated_item.actual_qty;
              item.serial_no_data = updated_item.serial_no_data;
              item.batch_no_data = updated_item.batch_no_data;
              item.item_uoms = updated_item.item_uoms;
            });
          }
        },
      });
    },
    update_cur_items_details() {
      this.update_items_details(this.filtered_items);
    },
    scan_barcoud() {
      const vm = this;
      onScan.attachTo(document, {
        suffixKeyCodes: [],
        keyCodeMapper: function (oEvent) {
          oEvent.stopImmediatePropagation();
          return onScan.decodeKeyEvent(oEvent);
        },
        onScan: function (sCode) {
          setTimeout(() => {
            vm.trigger_onscan(sCode);
          }, 300);
        },
      });
    },
    trigger_onscan(sCode) {
      if (this.filtered_items.length == 0) {
        this.eventBus.emit("show_message", {
          title: `No Item has this barcode "${sCode}"`,
          color: "error",
        });
        frappe.utils.play_sound("error");
      } else {
        this.enter_event();
        this.debounce_search = null;
        this.search = null;
      }
    },
    generateWordCombinations(inputString) {
      const words = inputString.split(" ");
      const wordCount = words.length;
      const combinations = [];

      // Helper function to generate all permutations
      function permute(arr, m = []) {
        if (arr.length === 0) {
          combinations.push(m.join(" "));
        } else {
          for (let i = 0; i < arr.length; i++) {
            const current = arr.slice();
            const next = current.splice(i, 1);
            permute(current.slice(), m.concat(next));
          }
        }
      }

      permute(words);

      return combinations;
    },
  },

  computed: {
    totalQuantity() {
      return this.item_available.reduce((sum, item) => sum + item.actual_qty, 0);
    },
    filtered_items() {
      this.search = this.get_search(this.first_search);
      if (!this.pos_profile.pose_use_limit_search) {
        let filtred_list = [];
        let filtred_group_list = [];
        if (this.item_group != "ALL") {
          filtred_group_list = this.items.filter((item) =>
            item.item_group
              .toLowerCase()
              .includes(this.item_group.toLowerCase())
          );
        } else {
          filtred_group_list = this.items;
        }
        if (!this.search || this.search.length < 3) {
          if (
            this.pos_profile.posa_show_template_items &&
            this.pos_profile.posa_hide_variants_items
          ) {
            return (filtred_list = filtred_group_list
              .filter((item) => !item.variant_of)
              .slice(0, 50));
          } else {
            filtred_list = filtred_group_list.slice(0, 50);
            return filtred_list;
          }
        } else if (this.search) {
          filtred_list = filtred_group_list.filter((item) => {
            let found = false;
            for (let element of item.item_barcode) {
              if (element.barcode == this.search) {
                found = true;
                break;
              }
            }
            return found;
          });
          if (filtred_list.length == 0) {
            filtred_list = filtred_group_list.filter((item) =>
              item.item_code.toLowerCase().includes(this.search.toLowerCase())
            );
            if (filtred_list.length == 0) {
              const search_combinations = this.generateWordCombinations(
                this.search
              );
              filtred_list = filtred_group_list.filter((item) => {
                let found = false;
                for (let element of search_combinations) {
                  element = element.toLowerCase().trim();
                  let element_regex = new RegExp(
                    `.*${element.split("").join(".*")}.*`
                  );
                  if (element_regex.test(item.item_name.toLowerCase())) {
                    found = true;
                    break;
                  }
                }
                return found;
              });
            }
            if (
              filtred_list.length == 0 &&
              this.pos_profile.posa_search_serial_no
            ) {
              filtred_list = filtred_group_list.filter((item) => {
                let found = false;
                for (let element of item.serial_no_data) {
                  if (element.serial_no == this.search) {
                    found = true;
                    this.flags.serial_no = null;
                    this.flags.serial_no = this.search;
                    break;
                  }
                }
                return found;
              });
            }
            if (
              filtred_list.length == 0 &&
              this.pos_profile.posa_search_batch_no
            ) {
              filtred_list = filtred_group_list.filter((item) => {
                let found = false;
                for (let element of item.batch_no_data) {
                  if (element.batch_no == this.search) {
                    found = true;
                    this.flags.batch_no = null;
                    this.flags.batch_no = this.search;
                    break;
                  }
                }
                return found;
              });
            }
          }
        }
        if (
          this.pos_profile.posa_show_template_items &&
          this.pos_profile.posa_hide_variants_items
        ) {
          return filtred_list.filter((item) => !item.variant_of).slice(0, 50);
        } else {
          return filtred_list.slice(0, 50);
        }
      } else {

        return this.items.slice(0, 50);
      }
    },
    debounce_search: {
      get() {
        return this.first_search;
      },
      set: _.debounce(function (newValue) {
        this.first_search = newValue;
      }, 200),
    },
  },

  created: function () {
    this.$nextTick(function () { });
    this.eventBus.on("register_pos_profile", (data) => {
      this.pos_profile = data.pos_profile;
      this.get_items();
      this.get_items_groups();
      this.drawer = this.pos_profile.posa_close_item_group;
      this.items_view = this.pos_profile.posa_default_card_view
        ? "card"
        : "list";
    });
    this.eventBus.on("update_cur_items_details", () => {
      this.update_cur_items_details();
    });
    this.eventBus.on("update_offers_counters", (data) => {
      this.offersCount = data.offersCount;
      this.appliedOffersCount = data.appliedOffersCount;
    });
    this.eventBus.on("update_coupons_counters", (data) => {
      this.couponsCount = data.couponsCount;
      this.appliedCouponsCount = data.appliedCouponsCount;
    });
    this.eventBus.on("update_customer_price_list", (data) => {
      this.customer_price_list = data;
    });
    this.eventBus.on("update_customer", (data) => {
      this.customer = data;
    });
  },

  mounted() {
    this.scan_barcoud();
  },
};
</script>

<style scoped>
.price-triangle {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-top: 61px solid #000;
  border-right: 64px solid transparent;
  z-index: 10;
}

.price-text {
  position: absolute;
  top: 1px;
  left: 2px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  z-index: 11;
  width: 43px;
}

.v-progress-linear--rounded {
  border-radius: 0px;
}

.v-navigation-drawer {
  border-right: 1px solid #e0e0e0;
  /* إضافة حد */
}

.hover\:bg-gray-200:hover {
  background-color: #e0e0e0 !important;
  /* لون خلفية عند التمرير */
}
</style>
