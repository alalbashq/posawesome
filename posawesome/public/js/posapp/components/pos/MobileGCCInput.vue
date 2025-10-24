<template>
  <v-row class="align-center" dense>
    <!-- الدولة: علم فقط -->
    <v-col cols="12" md="2" class="d-flex align-center">
      <v-autocomplete
        v-model="selectedCountry"
        :items="GCC"
        item-title="name"
        return-object
        :density="density"
        :variant="variant"
        :color="color"      
        :menu-props="{ maxHeight: 320 }"
        class="w-flag-picker"
      >
        <!-- عناصر القائمة: علم + اسم -->
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :title="item.raw.name">
            <template #prepend>
              <img
                :src="flagSrc(item.raw.iso)"
                alt=""
                class="flag-img"
                loading="eager"
                decoding="sync"                
                @error="onFlagError($event, item.raw.iso)"
              />
            </template>
            <template #append>
              <span class="text-medium-emphasis">{{ item.raw.iso }}</span>
            </template>
          </v-list-item>
        </template>

        <!-- القيمة المختارة: علم فقط مع Tooltip -->
        <template #selection="{ item }">
          <v-tooltip :text="`الدولة: ${item.raw.name}`" location="bottom">
            <template #activator="{ props: tip }">
              <div v-bind="tip" class="flag-only" aria-label="Country">
                <img
                  :src="flagSrc(item.raw.iso)"
                  alt=""
                  class="flag-img"
                  loading="eager"
                  decoding="sync"                  
                  @error="onFlagError($event, item.raw.iso)"
                />
              </div>
            </template>
          </v-tooltip>
        </template>
      </v-autocomplete>
    </v-col>

    <!-- رقم الجوال (بدون صفر في البداية) -->
    <v-col cols="12" md="10">
      <v-text-field
        v-model="local"
        :density="density"
        :variant="variant"
        :color="color"
        type="tel"
        inputmode="numeric"
        :label="label"
        :placeholder="placeholder"
        hide-details="auto"
        :counter="expectedLen"
        :maxlength="expectedLen"
        :rules="[rules.req, rules.len, rules.byCountry]"
      />
      <div class="text-caption text-medium-emphasis mt-1" v-if="local">
        <div v-if="!isComplete" class="text-error">
          الرقم غير مكتمل/غير صحيح حسب تنسيق الدولة
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },   // v-model (whatsapp/local/e164 حسب emitFormat)
  label:      { type: String, default: "رقم الجوال" },
  density:    { type: String, default: "compact" },
  color:      { type: String, default: "primary" },
  variant:    { type: String, default: "outlined" },
  required:   { type: Boolean, default: false },
  emitFormat: { type: String, default: "whatsapp" }, // whatsapp | e164 | local
  flagSource: { type: String, default: "cdn" },

  // NEW: تعيين الدولة الافتراضية
  // يمكن تمرير "SA" أو "966" أو كائن من مصفوفة GCC { iso:'SA', ... }
  defaultCountry: { type: [String, Object], default: "SA" },

  // NEW: دعم v-model:country من الأب (لو رغبت بالتحكم الكامل)
  country: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "valid", "update:country", "update:whats"]);

const GCC = [
  { iso: "SA", name: "السعودية", flag: "sa", cc: "966", example: "مثال: 559443354", expectedLen: 9, pattern: /^5\d{8}$/ },
  { iso: "AE", name: "الإمارات", flag: "ae", cc: "971", example: "مثال: 501234567", expectedLen: 9, pattern: /^5\d{8}$/ },
  { iso: "KW", name: "الكويت",   flag: "kw", cc: "965", example: "مثال: 51234567",  expectedLen: 8, pattern: /^(5|6|9)\d{7}$/ },
  { iso: "QA", name: "قطر",      flag: "qa", cc: "974", example: "مثال: 33123456",  expectedLen: 8, pattern: /^(3|5|6|7)\d{7}$/ },
  { iso: "BH", name: "البحرين",  flag: "bh", cc: "973", example: "مثال: 33123456",  expectedLen: 8, pattern: /^(3|6)\d{7}$/ },
  { iso: "OM", name: "عُمان",    flag: "om", cc: "968", example: "مثال: 91234567",  expectedLen: 8, pattern: /^9\d{7}$/ },
];

// NEW: دالة تحلّ الدولة من ISO أو CC أو كائن
function resolveCountry(input) {
  if (!input) return null;
  if (typeof input === "object" && input.iso) {
    const iso = String(input.iso).toUpperCase();
    return GCC.find(c => c.iso === iso) || null;
  }
  const s = String(input).trim();
  // إذا كانت أرقام: نفترض أنها كود دولة (cc)
  if (/^\d+$/.test(s)) {
    return GCC.find(c => c.cc === s) || null;
  }
  // غير ذلك: ISO
  const iso = s.toUpperCase();
  return GCC.find(c => c.iso === iso) || null;
}

const initializing = ref(true);

// NEW: نختار الدولة من props.country ثم defaultCountry ثم SA
const initialCountry =
  resolveCountry(props.country) ||
  resolveCountry(props.defaultCountry) ||
  GCC[0];

const selectedCountry = ref(initialCountry);
const local           = ref(""); // الرقم المحلي بدون صفر

// ====== أعلام الدول ======
const flagSrc = (iso) => {
  const code = (iso || "").toLowerCase();
  if (props.flagSource === "local") return `/assets/posawesome/flags/${code}.svg`;
  return `https://cdn.jsdelivr.net/npm/flag-icons/flags/4x3/${code}.svg`;
};

const onFlagError = (e, iso) => {
  const code = (iso || "").toLowerCase();
  const tried = e.target.getAttribute("data-tried") || "";
  if (!tried.includes("jsdelivr")) {
    e.target.setAttribute("data-tried", tried + "|jsdelivr");
    e.target.src = `https://cdn.jsdelivr.net/npm/flag-icons/flags/4x3/${code}.svg`;
    return;
  }
  e.target.src = `/assets/posawesome/flags/${code}.svg`;
};

// ====== Helpers ======
const digits = (v) => (v || "").toString().replace(/\D+/g, "");
const expectedLen = computed(() => selectedCountry.value?.expectedLen || undefined);
const placeholder = computed(() => selectedCountry.value?.example || "");

const isComplete = computed(() => {
  const rx = selectedCountry.value?.pattern;
  return rx ? rx.test(local.value) : !!local.value;
});

const whatsappDigits = computed(() => {
  if (!isComplete.value) return "";
  const cc = selectedCountry.value?.cc || "";
  return cc + local.value;
});

const modelOut = computed(() => {
  if (props.emitFormat === "whatsapp") return isComplete.value ? whatsappDigits.value : "";
  if (props.emitFormat === "e164")     return isComplete.value ? ("+" + whatsappDigits.value) : "";
  return local.value; // local
});

// بث القيم للخارج
watch([modelOut, isComplete, selectedCountry, whatsappDigits], () => {
  emit("update:modelValue", modelOut.value);
  emit("valid", isComplete.value);
  emit("update:country", selectedCountry.value?.iso || "");
  emit("update:whats", whatsappDigits.value);
});

// ====== تهيئة ======
onMounted(() => {
  if (props.modelValue) {
    rehydrateFromValue(props.modelValue);
  } else {
    // NEW: بدون قيمة حالية، طبّق الدولة الافتراضية المحسوبة
    selectedCountry.value =
      resolveCountry(props.country) ||
      resolveCountry(props.defaultCountry) ||
      GCC[0];
    local.value = ""; // ينتظر إدخال المستخدم
  }
  initializing.value = false;
});

// NEW: لو تغيّرت قيمة country من الأب ولم يكتب المستخدم رقمًا بعد، غيّر الدولة
watch(() => props.country, (nv) => {
  const next = resolveCountry(nv);
  if (next && !local.value) {
    selectedCountry.value = next;
  }
});

// تزامن مع تغيّر modelValue الخارجي
watch(() => props.modelValue, (nv, ov) => {
  if (nv === ov) return;
  initializing.value = true;
  rehydrateFromValue(nv);
  initializing.value = false;
});

// —— إعادة التحليل من قيمة واردة —— //
function rehydrateFromValue(input) {
  let v = digits(input);
  if (!v) {
    local.value = "";
    return;
  }

  // إذا كانت القيمة واتساب (تبدأ بـ CC)
  const byCC = GCC.find(c => v.startsWith(c.cc));
  if (byCC) {
    selectedCountry.value = byCC;
    let rest = v.slice(byCC.cc.length);

    // SA/AE: دعم 05xxxxxxxx → احذف الصفر الأول
    if ((byCC.iso === "SA" || byCC.iso === "AE") && /^0?5\d{8}$/.test(rest)) {
      rest = rest.replace(/^0/, "");
    }

    if (byCC.expectedLen && rest.length > byCC.expectedLen) {
      rest = rest.slice(0, byCC.expectedLen);
    }
    local.value = rest;
    return;
  }

  // قيمة محلية: حاول الاستدلال بالدولة
  for (const c of GCC) {
    let candidate = v;

    // SA/AE: 05xxxxxxxx → احذف الصفر
    if ((c.iso === "SA" || c.iso === "AE") && /^0?5\d{8}$/.test(candidate)) {
      candidate = candidate.replace(/^0/, "");
    }

    if (c.pattern.test(candidate)) {
      selectedCountry.value = c;
      if (c.expectedLen && candidate.length > c.expectedLen) {
        candidate = candidate.slice(0, c.expectedLen);
      }
      local.value = candidate;
      return;
    }
  }

  // fallback
  local.value = v;
}

// قواعد Vuetify
const rules = {
  req:       () => (!props.required || !!local.value) || "Required",
  len:       () => (expectedLen.value ? local.value.length === expectedLen.value : true) || `يجب إدخال ${expectedLen.value} أرقام`,
  byCountry: () => isComplete.value || "رقم غير صحيح/غير مكتمل حسب تنسيق الدولة",
};
</script>

<style scoped>
.flag-img { width: 24px; height: 18px; display: block; object-fit: cover; }
.flag-only {
  width: 42px; height: 42px; border-radius: 999px;
  display: grid; place-items: center;
  border: 1px solid rgba(0,0,0,.08);
  background: var(--v-theme-surface);
}
.w-flag-picker :deep(.v-field__input) {
  padding-inline: 6px !important;
}
</style>
