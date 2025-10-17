<template>
  <div> 
    <v-autocomplete
      :key="autocomplete_key"
      density="compact"
      clearable
      auto-select-first
      variant="outlined"
      color="primary"
      label="Customer"
      v-model="customer"
      :items="customers"
      item-title="title"
      item-value="value"
      bg-color="white"
      no-data-text="Customers not found"
      hide-details
      :customFilter="customFilter"
      :search-input.sync="search"
      :disabled="readonly"
      append-icon="mdi-plus"
      @click:append="new_customer"
      prepend-inner-icon="mdi-account-edit"
      @click:prepend-inner="edit_customer"
    >
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props">
          <v-list-item-subtitle v-if="item.raw.customer_name !== item.raw.name">
            <div v-html="`ID: ${item.raw.name}`"></div>
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="item.raw.tax_id">
            <div v-html="`TAX ID: ${item.raw.tax_id}`"></div>
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="item.raw.email_id">
            <div v-html="`Email: ${item.raw.email_id}`"></div>
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="item.raw.mobile_no">
            <div v-html="`Mobile No: ${item.raw.mobile_no}`"></div>
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="item.raw.primary_address">
            <div v-html="`Primary Address: ${item.raw.primary_address}`"></div>
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-autocomplete>

    <div class="mb-8">
      <UpdateCustomer />
    </div>
  </div>
</template>

<script>
import UpdateCustomer from './UpdateCustomer.vue';
import { debounce } from 'lodash';

export default {
  components: { UpdateCustomer },

  data() {
    return {
      pos_profile: '',
      customers: [],
      customer: '',
      readonly: false,
      customer_info: {},
      search: '',
      autocomplete_key: 0, // لإعادة بناء v-autocomplete عند الحاجة
    };
  },

  methods: {
    get_customer_names(search_text = '') {
      
      const vm = this;
      const localCustomers = localStorage.getItem('customer_storage');
      const hasLocalCustomers = localCustomers && JSON.parse(localCustomers).length > 0 && vm.pos_profile.posa_local_storage;
      console.log('get_customer_names', hasLocalCustomers, localCustomers);
      if (hasLocalCustomers) {
        let customersData = JSON.parse(localCustomers);

        if (!customersData[0].raw) {
          customersData = customersData.map(c => ({
            title: c.customer_name || c.name,
            value: c.name,
            raw: c,
          }));
        }

        if (search_text) {
          const search = search_text.toLowerCase();
          const filtered = customersData.filter(item => {
            const raw = item.raw || item;
            return (
              raw.customer_name?.toLowerCase().includes(search) ||
              raw.tax_id?.toLowerCase().includes(search) ||
              raw.email_id?.toLowerCase().includes(search) ||
              raw.mobile_no?.toLowerCase().includes(search) ||
              raw.name?.toLowerCase().includes(search)
            );
          });

          this.customers = filtered;
          this.autocomplete_key += 1;
          return;
        }

        this.customers = customersData;
        this.autocomplete_key += 1;
        return;
      }
      console.log('get_customer_names', hasLocalCustomers);
      frappe.call({
        method: 'posawesome.posawesome.api.posapp.get_customer_names',
        args: {
          pos_profile: this.pos_profile,
          search: search_text,
        },
        callback: function (r) {
          if (r.message) {
            vm.customers = r.message.map(c => ({
              title: c.customer_name || c.name,
              value: c.name,
              raw: c,
            }));
            if (!search_text) {
              localStorage.setItem('customer_storage', JSON.stringify(vm.customers));
            }
            console.log('vm.customers', vm.customers);
            vm.autocomplete_key += 1;
            
          }
        },
      });
    },

    new_customer() {
      this.eventBus.emit('open_update_customer', null);
    },

    edit_customer() {
      this.eventBus.emit('open_update_customer', this.customer_info);
    },

    customFilter(itemText, queryText, itemRow) {
      const item = itemRow.raw;
      const searchText = queryText.toLowerCase();
      return (
        item.customer_name?.toLowerCase().includes(searchText) ||
        item.tax_id?.toLowerCase().includes(searchText) ||
        item.email_id?.toLowerCase().includes(searchText) ||
        item.mobile_no?.toLowerCase().includes(searchText) ||
        item.name?.toLowerCase().includes(searchText)
      );
    },
  },
  mounted() {
    this.eventBus.on('register_pos_profile', (pos_profile) => {
      console.log('register_pos_profile_customer', pos_profile);
      this.pos_profile = pos_profile;
      this.get_customer_names();
    });
  },
  created() {
    this.debouncedFetch = debounce((query) => {
      this.get_customer_names(query);
    }, 300);

    this.eventBus.on('register_pos_profile', (pos_profile) => {
      console.log('register_pos_profile_customer', pos_profile);
      this.pos_profile = pos_profile;
      this.get_customer_names();
    });
    this.eventBus.on('uodate_custmer_after_refresh', (pos_profile) => {
      this.pos_profile = pos_profile;
      this.get_customer_names();
    });

    this.eventBus.on('set_customer', (customer) => {
      this.customer = customer;
    });

    this.eventBus.on('add_customer_to_list', (customer) => {
      this.customers = [
        ...this.customers,
        {
          title: customer.customer_name || customer.name,
          value: customer.name,
          raw: customer,
        },
      ];
      this.autocomplete_key += 1;
    });
  },

  watch: {
    customer() {
      this.eventBus.emit('update_customer', this.customer, this.pos_profile);
    },
    search(newText) {
      if (newText) {
        this.debouncedFetch(newText);
      } else {
        this.get_customer_names();
      }
    },
  },
};
</script>
