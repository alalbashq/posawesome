<template>
  <div>
    <v-row>
      <!-- <v-col
        cols="12"
        lg="3"
        v-if="lgAndUp"
        style="margin-top:18px"
      >
        <v-row density="compact" class="my-0 py-0 overflow-y-auto" style="max-height: 87vh; height: 87vh; overflow-x: hidden;">
          <v-col
            v-for="(item, index) in items_group"
            :key="index"
            cols="12"
            class="my-0 py-0 overflow-y-auto"
            style="overflow-x: hidden;"
          >
            <v-btn
              :class="{'black-btn': item_group === item}"
              outlined
              @click="handleGroupChange(item)"
              class="custom-btn"
              style="width: 200px; height: 50px; margin: 13px 0 0 0"
            >
              {{ item }}
            </v-btn>
          </v-col>
        </v-row>
      </v-col> -->

      <v-col cols="12" lg="3" v-if="lgAndUp" style="margin-top:18px;">
        <v-row
          class="overflow-y-auto"
          style="max-height: 87vh; height: 87vh; overflow-x: hidden; flex-direction: column; gap: 10px;"
        >
          <v-btn
            v-for="(item, index) in items_group"
            :key="index"
            :class="{ 'black-btn': item_group === item }"
            outlined
            @click="handleGroupChange(item)"
            block
            class="custom-btn"
            style="max-height: 50px; white-space: normal; line-height: 1.2;"
          >
            {{ item }}
          </v-btn>
        </v-row>
      </v-col>





      <!-- <v-col cols="9"> -->
      <v-col cols="12" lg="9">
        <v-card
          class="selection mx-auto grey lighten-5"
          style="max-height: 78.8vh; height: 78.8vh;"
        >
          <v-progress-linear
            :active="loading"
            :indeterminate="loading"
            absolute
            top
            color="black"
          ></v-progress-linear>
          <v-row class="items px-2 py-1">
            <v-col>
              <v-text-field
                density="compact"
                outlined
                clearable
                color="primary"
                hint="Search by item code, serial number, batch no or barcode"
                hide-details
                v-model="debounce_search"
                :placeholder="__('Search Items')"
                @keydown.esc="esc_event"
                @keydown.enter="search_onchange"
                ref="debounce_search"
                class="custom-search-field"
                style="margin-top: 2px;"
                :class="{ 'text-caption': mdAndDown }"
                @focus="e => e.target.select()"
              ></v-text-field>
            </v-col>


            <v-col cols="3" class="mb-4" v-if="pos_profile.posa_input_qty">
              <v-text-field
                density="compact"
                variant="outlined"
                color="primary"
                :label="__('QTY')"
                hide-details
                v-model.number="qty"
                type="number"
                @keydown.enter="enter_event"
                @keydown.esc="esc_event"
                style="margin-top: 15px;"
                :class="{ 'text-caption': mdAndDown }"
              ></v-text-field>
            </v-col>
            <v-col cols="2" class="mb-4" v-if="pos_profile.posa_new_line">
              <v-checkbox
                v-model="new_line"
                color="accent"
                value="true"
                label="NLine"
                density="compact"
                hide-details
                style="margin-top: 2px;"
                :class="{ 'text-caption': mdAndDown }"
              ></v-checkbox>
            </v-col>

            <v-row v-if="mdAndDown" class="mb-4 mx-1" style="max-height: 12vh; height: 12vh; overflow-x: hidden;">
              <v-col
                v-for="(item, index) in items_group"
                :key="index"
                cols="6"
                sm="4"
                class="my-1 py-0"
              >
                <v-btn
                  :class="{
                    'black-btn': item_group === item,
                    'text-caption': mdAndDown
                  }"
                  outlined
                  @click="handleGroupChange(item)"
                  class="custom-btn"
                  block
                  style="height: 40px;"
                >
                  {{ item }}
                </v-btn>
              </v-col>
            </v-row>

            <!-- Start Items Section -->
            <v-col cols="12" class="pt-0 mt-0">
              <div fluid class="items" v-if="items_view == 'card'">
                <v-row density="compact" class="overflow-y-auto" style="max-height: 67vh">
                  <v-col
                    v-for="(item, idx) in filtred_items"
                    :key="idx"
                    style="padding:5px"
                    xl="2" lg="3" md="6" sm="6" cols="6"
                    min-height="50"
                  >
                    <v-card hover="hover" @click="add_item(item)">
                      <v-img
                        :src="item.image || '/assets/posawesome/js/posapp/imgs/Box.png'"
                        :class="{'rtl': isRTL}"
                        class="white--text align-end"
                        color="#F7F7F7"
                        height="100px"
                        style="position: relative;"
                      >
                        <div :class="['triangle-badge', {'rtl': isRTL}]" @click.stop="openDialog(item)">
                          <div class="rate-container">
                            <span>{{ item.rate || 0 }}</span>
                            <span class="currency">{{ currencySymbol(item.currency) || "" }}</span>
                          </div>
                        </div>
                      </v-img>
                      
                      <v-card-text 
                        class="text--primary pa-1"
                        :style="{ borderBottom: `10px solid ${getBackgroundColor(item)}` }"
                      >
                        <div class="text-caption primary--text" style="font-size: 14px !important; font-weight: bold;">
                          {{ item.item_name }}
                        </div>
                      </v-card-text>

                    </v-card>
                  </v-col>
                </v-row>

                <v-dialog :class="{'rtl': isRTL}" v-model="dialog" max-width="500px">
                  <v-card>
                    <v-card-title class="text-h6">{{ selectedItem.item_name }}</v-card-title>
                    <v-card-text style="margin-bottom: 0; padding-bottom: 0;">
                      <v-img
                        :src="selectedItem.image || '/assets/posawesome/js/posapp/imgs/Box.png'"
                        height="160px"
                        contain
                      ></v-img>
                      
                      <div class="mt-3" style="display: flex; justify-content: space-between;">
                        <div>
                          <p><strong>{{ __('Main Warehouse') }}:</strong> {{ selectedItem.main_warehouse }}</p>
                          <p><strong>{{ __('Available QTY') }}:</strong> <span :style="{ color: selectedItem.actual_qty > 0 ? 'rgba(0, 230, 0, 1)' : 'rgba(255, 0, 0, 1)', fontSize: '17px', fontWeight: 'bold'}">{{ selectedItem.actual_qty }}</span></p>
                          <!-- <p><strong>المخزن الرئيسي:</strong> {{ selectedItem.main_warehouse }}</p>
                          <p><strong>الكمية المتاحة:</strong> <span :style="{ color: selectedItem.actual_qty > 0 ? 'rgba(0, 230, 0, 1)' : 'rgba(255, 0, 0, 1)', fontSize: '17px', fontWeight: 'bold'}">{{ selectedItem.actual_qty }}</span></p> -->
                        </div>
                        <div>
                          <p><strong>{{ __('Item Group') }}:</strong> {{ selectedItem.item_group }}</p>
                          <p><strong>{{ __('Price') }}:</strong> <span :style="{ color: 'blue', fontSize: '17px', fontWeight: 'bold', marginRight: '10px', marginLeft: '10px'}">{{ currencySymbol(selectedItem.currency) || "" }} {{ formtCurrency(selectedItem.rate) || 0 }}</span></p>
                        </div>
                      </div>

                      <h3>{{ __('Additional Warehouse Availability') }}</h3>

                      <v-table class="custom-table">
                        <tbody>
                          <tr v-for="(qty, wh) in selectedItem.additional_warehouses" :key="wh">
                            <td class="warehouse-column">{{ wh }}</td>
                            <td class="separator"></td>
                            <td class="quantity-column" :style="{ color: qty > 0 ? 'rgba(0, 230, 0, 1)' : 'rgba(255, 0, 0, 1)', fontSize: '17px', fontWeight: 'bold'}">{{ qty }}</td>
                            <td class="unit">{{ __('Unit') }}</td>
                          </tr>
                        </tbody>
                      </v-table>



                      <div style="display: ruby;">
                        <h3 style="margin-bottom: 0; margin-top: 20px;">{{ __('Total Quantity') }}: 
                          <span :style="{ color: selectedItem.total_qty > 0 ? 'rgba(0, 230, 0, 1)' : 'rgba(255, 0, 0, 1)'}">
                            {{ selectedItem.total_qty }}
                          </span>
                        </h3> 
                        <span style="margin-right: 10px; margin-left: 10px;">{{ __('Unit') }}</span>
                      </div>
                    </v-card-text>
                    
                    <v-card-actions>
                      <v-btn color="primary" @click="dialog = false">{{ __("Close") }}</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </div>



              <div fluid class="items" v-if="items_view == 'list'">
                <div class="my-0 py-0 overflow-y-auto" style="max-height: 65vh">
                    <v-data-table
                      :headers="getItmesHeaders()"
                      :items="filtred_items"
                      item-value="item_code"
                      return-object
                      class="elevation-1"
                      :items-per-page="itemsPerPage"
                      hide-default-footer
                      @click:row="add_item_table"
                    >
                      <template v-slot:item.rate="{ item }">
                        <span class="primary--text"
                          >{{ currencySymbol(item.currency) }}
                          {{ formtCurrency(item.rate) }}</span
                        >
                      </template>
                    </v-data-table>
                </div>
              </div>
            </v-col>
            <!-- Start Items Section -->

          </v-row>

        </v-card>

        <v-card class="cards mb-0 mt-2 pa-2 grey lighten-5">
          <v-row no-gutters align="center" justify="center">
            <v-col cols="4" class="mt-0 d-flex justify-center align-center">
              <v-btn-toggle
                v-model="items_view"
                color="black"
                group
                density="compact"
                rounded
              >
                <v-btn small value="list" class="custom-btn" :class="{ 'text-caption': mdAndDown }">
                  {{ __("List") }}
                </v-btn>
                <v-btn small value="card" class="custom-btn" :class="{ 'text-caption': mdAndDown }">
                  {{ __("Card") }}
                </v-btn>
              </v-btn-toggle>
            </v-col>
            <v-col cols="4" class="mt-0 d-flex justify-center align-center">
              <v-btn 
                small 
                style="height: 36px; padding-left: 25px; padding-right: 25px;" 
                @click="show_coupons"
                class="custom-btn"
                :class="{ 'text-caption': mdAndDown }"
              >
                {{ couponsCount }} {{ __("Coupons") }}
              </v-btn>
            </v-col>
            <v-col cols="4" class="mt-0 d-flex justify-center align-center">
              <v-btn
                small
                block
                class="custom-btn"
                style="height: 36px;"
                @click="show_offers"
                :class="{ 'text-caption': mdAndDown }"
              >
                {{ offersCount }} {{ __("Offers") }} : {{ appliedOffersCount }}
                {{ __("Applied") }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { useDisplay } from 'vuetify'
import { ref, onMounted, onBeforeUnmount } from "vue";
import { evntBus } from "../../bus";
import format from "../../format";
import _ from "lodash";
export default {
  mixins: [format],
  setup() {
    const { mdAndDown, lgAndUp } = useDisplay()
    return { mdAndDown, lgAndUp }
  },
  data: () => ({
    isRTL: false,
    dialog: false,
    selectedItem: {},
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
    fetched_batch_no: null,
  }),
  

  watch: {
    filtred_items(new_value, old_value) {
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
      evntBus.emit("set_new_line", this.new_line);
    },
  },

  methods: {

    getBackgroundColor(item) {
      if (item.actual_qty > 0) {
        return 'rgba(0, 230, 0, 0.3)';
      }

      const additionalStock = Object.values(item.additional_warehouses || {}).reduce((a, b) => a + b, 0);
      
      if (additionalStock > 0) {
        return 'rgba(255, 230, 0, 0.5)';
      }

      return 'rgba(255, 0, 0, 0.3)';
    },


    openDialog(item) {
      this.selectedItem = item;
      this.dialog = true;
    },

    
    handleGroupChange(item) {
      this.item_group = item;
      this.search_onchange(); 
    },

    
    show_offers() {
      evntBus.emit("show_offers", "true");
    },
    show_coupons() {
      evntBus.emit("show_coupons", "true");
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
        evntBus.emit("set_all_items", vm.items);
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
            evntBus.emit("set_all_items", vm.items);
            vm.loading = false;
            console.info("Items Loaded");

            vm.update_items_details(vm.items);

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

      const uniqueGroups = new Set();

      if (this.pos_profile.item_groups.length > 0) {
        this.pos_profile.item_groups.forEach((element) => {
          if (element.item_group !== "All Item Groups") {
            uniqueGroups.add(element.item_group);
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
                uniqueGroups.add(element.name);
              });
            }
            vm.items_group = ["ALL", ...Array.from(uniqueGroups)];
          },
        });
        return;
      }

      this.items_group = ["ALL", ...Array.from(uniqueGroups)];
    },




    getItmesHeaders() {
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
        { title: __("UOM"), key: "stock_uom", align: "start" },
        { title: __("Actual Qty"), key: "actual_qty", align: "start" },
        { title: __("Has Variants"), key: "has_variants", align: "start" },
      ];
      if (!this.pos_profile.posa_display_item_code) {
        items_headers.splice(1, 1);
      }

      return items_headers;
    },
    add_item_table(event, item){
      item = { ...item.item };
      if (item.has_variants) {
        evntBus.emit("open_variants_model", { item, items: this.items });
      } else {
        if (!item.qty || item.qty === 1) {
          item.qty = Math.abs(this.qty);
        }
        evntBus.emit("add_item", item);
        this.qty = 1;
      }
    },
    add_item(item) {
      item = { ...item };
      if (item.has_variants) {
        evntBus.emit("open_variants_model", { item, items: this.items });
      } else {
        if (!item.qty || item.qty === 1) {
          item.qty = Math.abs(this.qty);
        }
        evntBus.emit("add_item", item);
        this.qty = 1;
      }
    },

    enter_event() {
      let match = false;
      if (!this.filtred_items.length || !this.first_search) {
        return;
      }

      const qty = this.get_item_qty(this.first_search);
      const new_item = { ...this.filtred_items[0] };
      new_item.qty = flt(qty);

      let isBarcodeSearch = false;

      new_item.item_barcode.forEach((element) => {
        if (this.search == element.barcode) {
          new_item.uom = element.posa_uom;
          match = true;
          isBarcodeSearch = true;
          const matchingPrice = new_item.item_prices?.find(p => p.uom === element.posa_uom);
          if (matchingPrice && matchingPrice.price_list_rate) {
            new_item.rate = matchingPrice.price_list_rate;
          }
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

            frappe.call({
              method: "posawesome.posawesome.api.posapp.get_batch_no_by_serial",
              args: {
                serial_no: this.search,
              },
              callback: (r) => {
                if (r.message && r.message.batch_no) {
                  const fetched_batch_no = r.message.batch_no;

                  const filtered_item = {
                    ...new_item,
                    to_set_batch_no: fetched_batch_no,
                    batch_no: fetched_batch_no,
                    batch_no_data: new_item.batch_no_data.filter(
                      (batch) => batch.batch_no === fetched_batch_no
                    ),
                    serial_no_data: new_item.serial_no_data.filter(
                      (serial) => serial.serial_no === this.search
                    ),
                  };

                  this.$nextTick(() => {
                    const existingItem = this.items.find(
                      (item) =>
                        item.item_code === filtered_item.item_code &&
                        item.batch_no === fetched_batch_no
                    );

                    if (!existingItem) {
                      this.add_item(filtered_item);
                    } else {
                      console.log("Item already exist!");
                    }

                    this.reset_search_fields();
                  });
                }
              },
            });
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
        let existingItem;

        if (isBarcodeSearch) {
          existingItem = this.items.find(item => item.item_code === new_item.item_code);
        } else {
          existingItem = this.items.find(
            (item) =>
              item.item_code === new_item.item_code &&
              item.batch_no === new_item.batch_no
          );
        }


        if (!existingItem || isBarcodeSearch) {
          this.add_item(new_item);
        } else {
          console.log("This item is duplicate!");
        }

        this.reset_search_fields();
      }
    },

    reset_search_fields() {
      this.search = null;
      this.first_search = null;
      this.debounce_search = null;
      this.flags.serial_no = null;
      this.flags.batch_no = null;
      this.qty = 1;
      this.$refs.debounce_search.focus();
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
              if (updated_item) {
                item.main_warehouse = updated_item.main_warehouse; 
                item.actual_qty = updated_item.actual_qty;
                item.additional_warehouses = updated_item.additional_warehouses || {};
                item.total_qty = updated_item.total_qty || 0;
              }
            });
            vm.$forceUpdate();
          }
        },
      });
    },


    update_cur_items_details() {
      this.update_items_details(this.filtred_items);
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
      if (this.filtred_items.length == 0) {
        evntBus.emit("show_mesage", {
          text: `No Item has this barcode "${sCode}"`,
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

    fetchUserLanguage() {
      frappe.call({
        method: "frappe.client.get",
        args: { doctype: "User", name: frappe.session.user },
        callback: (response) => {
          if (response.message) {
            let userLang = response.message.language;
            this.applyDirection(userLang);
            // this.applyDirection("ar");
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

  computed: {
    formattedStockData() {
      return Object.entries(this.selectedItem.additional_stock_quantities || {}).map(
        ([warehouse, qty]) => ({
          warehouse,
          qty,
          unit: "units",
        })
      );
    },
    filtred_items() {
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
            return (filtred_list = filtred_group_list.slice(0, 50));
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
    this.$nextTick(function () {});
    evntBus.on("register_pos_profile", (data) => {
      this.pos_profile = data.pos_profile;
      this.get_items();
      this.get_items_groups();
      this.items_view = this.pos_profile.posa_default_card_view
        ? "card"
        : "list";
    });
    evntBus.on("update_cur_items_details", () => {
      this.update_cur_items_details();
    });
    evntBus.on("update_offers_counters", (data) => {
      this.offersCount = data.offersCount;
      this.appliedOffersCount = data.appliedOffersCount;
    });
    evntBus.on("update_coupons_counters", (data) => {
      this.couponsCount = data.couponsCount;
      this.appliedCouponsCount = data.appliedCouponsCount;
    });
    evntBus.on("update_customer_price_list", (data) => {
      this.customer_price_list = data;
    });
    evntBus.on("update_customer", (data) => {
      this.customer = data;
    });
  },

  mounted() {

    const savedProfile = localStorage.getItem('pos_profile');
    if (savedProfile) {
      this.pos_profile = JSON.parse(savedProfile);
    }

    this.fetchUserLanguage();

    evntBus.on("update_items", () => {
      this.update_items_details(this.items);
    });

    this.scan_barcoud();  

  },
};
</script>

<style scoped>
 ::v-deep(.v-field.v-field--appended.v-field--center-affix.v-field--variant-filled.v-theme--light.v-locale--is-ltr) {
  background-color: #fff !important;
  border: 1px solid #959393 !important;
  border-radius: 5px !important;
  height: 40px;
  text-align: center;
  margin-top: 7px;
}

::v-deep(.v-field__overlay) {
  background-color: #fff !important;
  border: 2px solid #2e2c2c !important;
  border-radius: 8px !important;
}

.custom-btn {
    background-color: #F4F4F4;
    color:#000;
    box-shadow: none;
  }

  .custom-btn:hover {
    background-color: #D9DADE; 
    color:#000;
    box-shadow: none;
  }

  .custom-btn:active {
    background-color: black !important;
  }
  .black-btn {
    background-color: black !important;
    color: white !important;
  }

.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.warehouse-column,
.unit,
.quantity-column {
  padding: 5px 10px;
}

.warehouse-column {
  width: 63%;
}

.quantity-column {
  width: 29.5%;
}

.unit {
  width: 7%;
}

.separator {
  width: 0.5%;
  min-width: 1px;
  max-width: 1px;
  background-color: black;
}



/* RTL Style */
.rtl {
  direction: rtl;
}

.rtl .warehouse-column {
  text-align: right;
  padding-right: 0;
  padding-left: 20px;
}

.rtl .quantity-column {
  text-align: right;
  padding-left: 0;
  padding-right: 20px;
}

.rtl .unit {
  text-align: right;
}

.rtl .separator {
  background-color: black;
}

/* Item Card Style */
.triangle-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 50px solid rgb(1, 1, 1);
  border-left: 50px solid transparent;
  display: flex;
  justify-content: right;
  text-align: right;
}

.rate-container {
  position: absolute;
  top: -53px;
  right: 3px;
  display: flex;
  flex-direction: column;
  align-items: end;
}

.rate-container span {
  color: white;
  font-size: 14px;
  font-weight: bold;
  transform: rotate(0deg);
}

.rtl .triangle-badge {
  right: auto;
  left: 0;
  border-left: none;
  border-right: 50px solid transparent;
  justify-content: left;
  text-align: left;
}

.rtl .rate-container {
  right: auto;
  left: 3px;
  align-items: end;
}

.rtl .rate-container span {
  color: white;
  font-size: 14px;
  font-weight: bold;
  transform: rotate(0deg);
}
</style>
