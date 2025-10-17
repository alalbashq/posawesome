<template>
  <div>
    <v-autocomplete
      density="compact"
      variant="outlined"
      color="primary"
      :label="__('Customer')"
      v-model="customer"
      :items="customers"
      item-title="customer_name"
      item-value="name"
      :filter="customFilter"
      :disabled="readonly"
      ref="customerAutocomplete"
      append-icon="mdi-plus"
      @click:append="new_customer"
      prepend-inner-icon="mdi-account-edit"
      @click:prepend-inner="edit_customer"
      @focus="e => e.target.select()"
    >
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props">
          <v-list-item-title class="primary--text subtitle-1">
            {{ item.customer_name || item.name }}
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-autocomplete>
    <div class="mb-8">
      <UpdateCustomer></UpdateCustomer>
    </div>
  </div>
</template>

<script>
import { evntBus } from '../../bus';
import UpdateCustomer from './UpdateCustomer.vue';
export default {
  data() {
    return {
    pos_profile: '',
    customers: [],
    customersnew: [],
    customer: '',
    readonly: false,
    customer_info: {},
  }},

  components: {
    UpdateCustomer,
  },

  methods: {

    async get_customer_names() {
      try {
        const savedProfile = localStorage.getItem('pos_profile');
        const pos_profile = savedProfile ? JSON.parse(savedProfile) : null;

        if (!pos_profile || !pos_profile.name) {
          console.warn('[Customer.vue] POS Profile is missing or invalid.');
          return;
        }

        const posProfileName = pos_profile.name;

        const response = await frappe.call({
          method: 'posawesome.posawesome.api.posapp.get_customer_names',
          args: {
            pos_profile: posProfileName,
          },
        });

        if (response.message) {
          this.customers = response.message;

          if (pos_profile.posa_local_storage) {
            localStorage.setItem('customer_storage', JSON.stringify(response.message));
          }
        }
      } catch (error) {
        console.error('[Customer.vue] Failed to fetch customers:', error);
      }
    },


    new_customer() {
      evntBus.emit('open_update_customer', null);
    },
    edit_customer() {
      evntBus.emit('open_update_customer', this.customer_info);
    },
    customFilter(item, queryText, itemText) {
      const textOne = item.customer_name ? item.customer_name.toLowerCase() : '';
      const textTwo = item.tax_id ? item.tax_id.toLowerCase() : '';
      const textThree = item.email_id ? item.email_id.toLowerCase() : '';
      const textFour = item.mobile_no ? item.mobile_no.toLowerCase() : '';
      const textFifth = item.name.toLowerCase();
      const searchText = queryText.toLowerCase();

      return (
        textOne.indexOf(searchText) > -1 ||
        textTwo.indexOf(searchText) > -1 ||
        textThree.indexOf(searchText) > -1 ||
        textFour.indexOf(searchText) > -1 ||
        textFifth.indexOf(searchText) > -1
      );
    },

    loadCustomersFromStorage() {
      const customers = localStorage.getItem("customer_storage");

      if (customers) {
          try {
              this.customers = JSON.parse(customers);
          } catch (error) {
              console.error("Error parsing customer data from localStorage:", error);
          }
      } else {
          console.warn("There is no customer data in localStorage.");
      }
    }

  },

  beforeMount() {
    this.loadCustomersFromStorage();
  },
  mounted() {
      this.get_customer_names(); 
  },
  activated() {
      this.loadCustomersFromStorage(); 
  },

  computed: {},
  
  created: async function () {
    const savedProfile = localStorage.getItem('pos_profile');
    if (savedProfile) {
      this.pos_profile = JSON.parse(savedProfile);
    }

    evntBus.on('register_pos_profile', async (pos_profile) => {
      this.pos_profile = pos_profile;
      localStorage.setItem('pos_profile', JSON.stringify(pos_profile));
      await this.get_customer_names();
    });

    evntBus.on('payments_register_pos_profile', async (pos_profile) => {
      this.pos_profile = pos_profile;
      localStorage.setItem('pos_profile', JSON.stringify(pos_profile));
      console.log("pos_profile loaded:", this.pos_profile);
      await this.get_customer_names(); 
    });

    evntBus.on('set_customer', (customer) => {
      this.customer = customer;
    });

    evntBus.on('add_customer_to_list', (customer) => {
      this.customers.push(customer);
    });

    evntBus.on('set_customer_readonly', (value) => {
      this.readonly = value;
    });

    evntBus.on('set_customer_info_to_edit', (data) => {
      this.customer_info = data;
    });

    evntBus.on('fetch_customer_details', async () => {
      await this.get_customer_names();
    });
  },



  watch: {
    customer() {
      evntBus.emit('update_customer', this.customer);
    },
  },

  // watch: {
  //   customers(newVal) {
  //     console.log("Customers updated:", newVal);
  //   },
  // },

};
</script>