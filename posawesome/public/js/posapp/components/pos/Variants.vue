<template>
  <v-row :class="{'rtl': isRTL}" justify="center">
    <v-dialog :class="{'rtl': isRTL}" v-model="varaintsDialog" max-width="90%">
      <v-card :class="{'rtl': isRTL}" min-height="500px">
        <v-card-title :class="{'rtl': isRTL}">
          <span :class="{'rtl': isRTL}" class="headline primary--text">Select Item</span>
          <v-spacer></v-spacer>
          <v-btn :class="{'rtl': isRTL}" color="error" dark @click="close_dialog">Close</v-btn>
        </v-card-title>
        <v-card-text :class="{'rtl': isRTL}" class="pa-0">
          <v-container :class="{'rtl': isRTL}" v-if="parentItem">
            <div :class="{'rtl': isRTL}" v-for="attr in parentItem.attributes" :key="attr.attribute">
              <v-chip-group
                v-model="filters[attr.attribute]"
                active-class="green--text text--accent-4"
                column
              >
                <v-chip
                  v-for="value in attr.values"
                  :key="value.abbr"
                  :value="value.attribute_value"
                  variant="outlined"
                  label
                  @click="updateFiltredItems"
                >
                  {{ value.attribute_value }}
                </v-chip>
              </v-chip-group>
              <v-divider class="p-0 m-0"></v-divider>
            </div>
            <div :class="{'rtl': isRTL}">
              <v-row density="compact" class="overflow-y-auto" style="max-height: 500px">
                <v-col
                  v-for="(item, idx) in filterdItems"
                  :key="idx"
                  xl="3"
                  lg="3"
                  md="6"
                  sm="6"
                  cols="6"
                  min-height="100"
                >
                  <v-card hover="hover" @click="add_item(item)">
                    <v-img
                      :src="item.image || '/assets/posawesome/js/posapp/imgs/Box.png'"
                      class="white--text align-end"
                      gradient="to bottom, rgba(0,0,0,.2), rgba(0,0,0,.3)"
                      height="200px"
                    >
                      <v-card-text
                        v-text="item.item_name"
                        class="text-subtitle-2 px-1 pb-2"
                      ></v-card-text>
                    </v-img>
                    <v-card-text class="text--primary pa-1">
                      <div class="text-caption primary--text accent-3">
                        <div class="flex" style="display: flex;justify-content: space-between;">
                        <span>{{ item.rate || 0 }} {{ item.currency || '' }}</span> <span> الكمية المتاحة : {{item.actual_qty || 0}}</span>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { evntBus } from '../../bus';
export default {
  data: () => ({
    isRTL: false,
    varaintsDialog: false,
    parentItem: null,
    items: null,
    filters: {},
    filterdItems: [],
  }),

  computed: {
    variantsItems() {
      if (!this.parentItem) {
        return [];
      } else {
        return this.items.filter(
          (item) => item.variant_of == this.parentItem.item_code
        );
      }
    },
  },

  methods: {
    close_dialog() {
      this.varaintsDialog = false;
    },
    formtCurrency(value) {
      value = parseFloat(value);
      return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    updateFiltredItems() {
      this.$nextTick(function () {
        const values = [];
        Object.entries(this.filters).forEach(([key, value]) => {
          if (value) {
            values.push(value);
          }
        });

        if (!values.length) {
          this.filterdItems = this.variantsItems;
        } else {
          const itemsList = [];
          this.filterdItems = [];
          this.variantsItems.forEach((item) => {
            let apply = true;
            item.item_attributes.forEach((attr) => {
              if (
                this.filters[attr.attribute] &&
                this.filters[attr.attribute] != attr.attribute_value
              ) {
                apply = false;
              }
            });
            if (apply && !itemsList.includes(item.item_code)) {
              this.filterdItems.push(item);
              itemsList.push(item.item_code);
            }
          });
        }
      });
    },
    add_item(item) {
      evntBus.emit('add_item', item);
      this.close_dialog();
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
    // evntBus.on('open_variants_model', (item, items) => {
      // console.log("items from Variants file, created" , items);
    evntBus.on('open_variants_model', ({ item, items }) => {
      this.varaintsDialog = true;
      this.parentItem = item || null;
      this.items = items;
      this.filters = {};
      this.$nextTick(function () {
        this.filterdItems = this.variantsItems;
      });
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
