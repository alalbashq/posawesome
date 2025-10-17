<template>
  <div :class="{'rtl': isRTL}">
    <v-card
      :class="{'rtl': isRTL}"
      class="selection mx-auto grey lighten-5"
      style="max-height: 80vh; height: 80vh"
    >
      <v-card-title :class="{'rtl': isRTL}">
        <span :class="{'rtl': isRTL}" class="text-h6 primary--text">{{ __('Offers') }}</span>
      </v-card-title>
      <div :class="{'rtl': isRTL}" class="my-0 py-0 overflow-y-auto" style="max-height: 75vh">
        <v-data-table
          :headers="items_headers"
          :items="pos_offers"
          :single-expand="singleExpand"
          v-model:expanded="expanded"
          show-expand
          item-value="row_id"
          return-object
          class="elevation-1"
          :class="{'rtl': isRTL}"
          :items-per-page="itemsPerPage"
          hide-default-footer
        >
          <template #item.offer_applied="{ item }">
            <div style="width: 100%; height: 100%; display: flex; align-items: center;">
              <v-checkbox
                @click.stop="forceUpdateItem"
                v-model="item.offer_applied"
                class="ma-0 pa-0"
                density="compact"
                hide-details
                style="margin-inline-start: auto; margin-inline-end: auto;"
                :disabled="(item.offer == 'Give Product' &&
                            !item.give_item &&
                            (!offer.replace_cheapest_item || !offer.replace_item)) ||
                          (item.offer == 'Grand Total' &&
                            discount_percentage_offer_name &&
                            discount_percentage_offer_name != item.name)"
              ></v-checkbox>
            </div>
          </template>



          <template #expanded-row="{ item, columns }">
            <tr>
              <td :colspan="columns.length">
                <v-row class="mt-2">
                  <v-col v-if="item.description">
                    <div class="primary--text" v-html="handleNewLine(item.description)"></div>
                  </v-col>
                  <v-col v-if="item.offer == 'Give Product'">
                    <v-autocomplete
                      v-model="item.give_item"
                      :items="get_give_items(item)"
                      item-title="item_code"
                      variant="outlined"
                      density="compact"
                      color="primary"
                      :label="__('Give Item')"
                      :disabled="item.apply_type != 'Item Group' ||
                                item.replace_item ||
                                item.replace_cheapest_item"
                    ></v-autocomplete>
                  </v-col>
                </v-row>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>

    </v-card>

    <v-card
      :class="{'rtl': isRTL}"
      flat
      style="max-height: 11vh; height: 11vh"
      class="cards mb-0 mt-3 py-0"
    >
      <v-row :class="{'rtl': isRTL}" align="start" no-gutters>
        <v-col cols="12">
          <v-btn
            block
            class="pa-1"
            large
            color="primary"
            dark
            @click="back_to_invoice"
            style="background-color: black !important;"
            >{{ __('Back') }}</v-btn
          >
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import { evntBus } from '../../bus';
import format from '../../format';
export default {
  mixins: [format],
  data: () => ({
    isRTL: false,
    loading: false,
    pos_profile: '',
    pos_offers: [],
    allItems: [],
    discount_percentage_offer_name: null,
    itemsPerPage: 1000,
    expanded: [],
    singleExpand: true,
    items_headers: [
      { title: __('Name'), key: 'name', align: 'start' },
      { title: __('Apply On'), key: 'apply_on', align: 'start' },
      { title: __('Offer'), key: 'offer', align: 'start' },
      { title: __('Applied'), key: 'offer_applied', align: 'start' },
    ],
  }),

  computed: {
    offersCount() {
      return this.pos_offers.length;
    },
    appliedOffersCount() {
      return this.pos_offers.filter((el) => !!el.offer_applied).length;
    },
  },

  methods: {
    back_to_invoice() {
      evntBus.emit('show_offers', 'false');
    },
    forceUpdateItem() {
      let list_offers = [];
      list_offers = [...this.pos_offers];
      this.pos_offers = list_offers;
    },
    makeid(length) {
      let result = '';
      const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    },
    updatePosOffers(offers) {
      const toRemove = [];
      this.pos_offers.forEach((pos_offer) => {
        const offer = offers.find((offer) => offer.name === pos_offer.name);
        if (!offer) {
          toRemove.push(pos_offer.row_id);
        }
      });
      this.removeOffers(toRemove);
      offers.forEach((offer) => {
        const pos_offer = this.pos_offers.find(
          (pos_offer) => offer.name === pos_offer.name
        );
        if (pos_offer) {
          pos_offer.items = offer.items;
          if (
            pos_offer.offer === 'Grand Total' &&
            !this.discount_percentage_offer_name
          ) {
            pos_offer.offer_applied = !!pos_offer.auto;
          }
          if (
            offer.apply_on == 'Item Group' &&
            offer.apply_type == 'Item Group' &&
            offer.replace_cheapest_item
          ) {
            pos_offer.give_item = offer.give_item;
            pos_offer.apply_item_code = offer.apply_item_code;
          }
        } else {
          const newOffer = { ...offer };
          if (!offer.row_id) {
            newOffer.row_id = this.makeid(20);
          }
          if (offer.apply_type == 'Item Code') {
            newOffer.give_item = offer.apply_item_code || 'Nothing';
          }
          if (offer.offer_applied) {
            newOffer.offer_applied == !!offer.offer_applied;
          } else {
            if (
              offer.apply_type == 'Item Group' &&
              offer.offer == 'Give Product' &&
              !offer.replace_cheapest_item &&
              !offer.replace_item
            ) {
              newOffer.offer_applied = false;
            } else if (
              offer.offer === 'Grand Total' &&
              this.discount_percentage_offer_name
            ) {
              newOffer.offer_applied = false;
            } else {
              newOffer.offer_applied = !!offer.auto;
            }
          }
          if (newOffer.offer == 'Give Product' && !newOffer.give_item) {
            newOffer.give_item = this.get_give_items(newOffer)[0].item_code;
          }
          this.pos_offers.push(newOffer);
          evntBus.emit('show_mesage', {
            text: __('New Offer Available'),
            color: 'info',
          });
        }
      });
    },
    removeOffers(offers_id_list) {
      this.pos_offers = this.pos_offers.filter(
        (offer) => !offers_id_list.includes(offer.row_id)
      );
    },
    handelOffers() {
      const applyedOffers = this.pos_offers.filter(
        (offer) => offer.offer_applied
      );
      evntBus.emit('update_invoice_offers', applyedOffers);
    },
    handleNewLine(str) {
      if (str) {
        return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
      } else {
        return '';
      }
    },
    get_give_items(offer) {
      if (offer.apply_type == 'Item Code') {
        return [offer.apply_item_code];
      } else if (offer.apply_type == 'Item Group') {
        const items = this.allItems;
        let filterd_items = [];
        const filterd_items_1 = items.filter(
          (item) => item.item_group == offer.apply_item_group
        );
        if (offer.less_then > 0) {
          filterd_items = filterd_items_1.filter(
            (item) => item.rate < offer.less_then
          );
        } else {
          filterd_items = filterd_items_1;
        }
        return filterd_items;
      } else {
        return [];
      }
    },
    updateCounters() {
      evntBus.emit('update_offers_counters', {
        offersCount: this.offersCount,
        appliedOffersCount: this.appliedOffersCount,
      });
    },
    updatePosCoupuns() {
      const applyedOffers = this.pos_offers.filter(
        (offer) => offer.offer_applied && offer.coupon_based
      );
      evntBus.emit('update_pos_coupons', applyedOffers);
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

  watch: {
    pos_offers: {
      deep: true,
      handler(pos_offers) {
        this.handelOffers();
        this.updateCounters();
        this.updatePosCoupuns();
      },
    },
  },

  created: function () {
    this.$nextTick(function () {
      evntBus.on('register_pos_profile', (data) => {
        this.pos_profile = data.pos_profile;
      });
    });
    evntBus.on('update_customer', (customer) => {
      if (this.customer != customer) {
        this.offers = [];
      }
    });
    evntBus.on('update_pos_offers', (data) => {
      this.updatePosOffers(data);
    });
    evntBus.on('update_discount_percentage_offer_name', (data) => {
      this.discount_percentage_offer_name = data.value;
    });
    evntBus.on('set_all_items', (data) => {
      this.allItems = data;
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