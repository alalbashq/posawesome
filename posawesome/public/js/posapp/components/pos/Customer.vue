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
      :custom-filter="universalFilter"
      :filter="universalFilter"
      :disabled="readonly"
      ref="customerAutocomplete"
      append-icon="mdi-plus"
      @click:append="new_customer"
      prepend-inner-icon="mdi-account-edit"
      @click:prepend-inner="edit_customer"
      @focus="e => e.target.select()"
    >
      <template #item="{ props, item }">
        <v-list-item v-bind="props">
          <v-list-item-title class="primary--text subtitle-1">
            
            <span v-if="displayPhone(item)">{{ displayPhone(item) }}</span>
          </v-list-item-title>
        </v-list-item>
      </template>

      <template #selection="{ item }">
        <span>
         
          <span v-if="displayPhone(item)">{{ displayPhone(item) }}</span>
        </span>
      </template>
    </v-autocomplete>

    <div class="mb-8">
      <UpdateCustomer />
    </div>
  </div>
</template>

<script>
import { evntBus } from '../../bus';
import UpdateCustomer from './UpdateCustomer.vue';

export default {
  components: { UpdateCustomer },

  data() {
    return {
      pos_profile: '',
      customers: [],
      customersnew: [],
      customer: '',
      readonly: false,
      customer_info: {},
    };
  },

  methods: {
    displayPhone(item) {
      const raw = item?.raw || item || {};
      return (
        raw.mobile_no ||
        raw.phone ||
        raw.mobile        
      );
    },

    normalizePhone(str) {
      if (!str) return '';
      let d = String(str).replace(/\D+/g, '');
      if (d.startsWith('00966')) d = d.slice(5);
      else if (d.startsWith('966')) d = d.slice(3);
      else if (d.startsWith('00')) d = d.slice(2);
      if (d.startsWith('0')) d = d.slice(1);
      return d;
    },

    universalFilter(...args) {
      if (args.length >= 3 && (args[2]?.raw !== undefined || typeof args[2] === 'object')) {
        const [, query, item] = args;
        const raw = item?.raw || item || {};
        return this._matchCustomer(raw, query);
      }
      if (args.length >= 2 && (args[0]?.customer_name !== undefined || args[0]?.name !== undefined)) {
        const [item, queryText] = args;
        const raw = item || {};
        return this._matchCustomer(raw, queryText);
      }
      return true;
    },

    _matchCustomer(raw, query) {
      const q = (query || '').toString().trim().toLowerCase();
      if (!q) return true;

      const qDigits = this.normalizePhone(q);
      if (qDigits) {
        const phones = [
          raw.mobile_no,
          raw.phone,
          raw.mobile,
          raw.whatsapp,
          raw.whats_app,
          raw.whatsApp,
        ].filter(Boolean);
        for (const ph of phones) {
          const p = this.normalizePhone(ph);
          if (!p) continue;
          if (p.includes(qDigits)) return true;
          const last9 = p.slice(-9);
          if (last9 && last9.includes(qDigits)) return true;
        }
      }

      const fields = [
        raw.customer_name,
        raw.tax_id,
        raw.email_id,
        raw.mobile_no,
        raw.phone,
        raw.mobile,
        raw.name,
      ]
        .filter(Boolean)
        .map(v => v.toString().toLowerCase());

      return fields.some(v => v.includes(q));
    },

    async get_customer_names() {
      try {
        const savedProfile = localStorage.getItem('pos_profile');
        const pos_profile = savedProfile ? JSON.parse(savedProfile) : null;
        if (!pos_profile || !pos_profile.name) {
          console.warn('[Customer.vue] POS Profile is missing or invalid.');
          return;
        }
        const response = await frappe.call({
          method: 'posawesome.posawesome.api.posapp.get_customer_names',
          args: { pos_profile: pos_profile.name },
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

    loadCustomersFromStorage() {
      const customers = localStorage.getItem('customer_storage');
      if (customers) {
        try {
          this.customers = JSON.parse(customers);
        } catch (error) {
          console.error('Error parsing customer data from localStorage:', error);
        }
      } else {
        console.warn('There is no customer data in localStorage.');
      }
    },
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

  created() {
    const savedProfile = localStorage.getItem('pos_profile');
    if (savedProfile) this.pos_profile = JSON.parse(savedProfile);

    evntBus.on('register_pos_profile', async (pos_profile) => {
      this.pos_profile = pos_profile;
      localStorage.setItem('pos_profile', JSON.stringify(pos_profile));
      await this.get_customer_names();
    });

    evntBus.on('payments_register_pos_profile', async (pos_profile) => {
      this.pos_profile = pos_profile;
      localStorage.setItem('pos_profile', JSON.stringify(pos_profile));
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
};
</script>
