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
  modelValue: { type: String, default: "" },   // القيمة الخارجة/الداخلة عبر v-model
  label:      { type: String, default: "رقم الجوال" },
  density:    { type: String, default: "compact" },
  color:      { type: String, default: "primary" },
  variant:    { type: String, default: "outlined" },
  required:   { type: Boolean, default: false },
  // local  : تُخرج الرقم المحلي كما كتبه المستخدم (SA/AE: 9 أرقام تبدأ بـ5)
  // whatsapp: تُخرج أرقام فقط مع كود الدولة بدون + (الافتراضي)
  // e164   : تُخرج +CC… (مثل +9665XXXXXXX)
  emitFormat: { type: String, default: "whatsapp" },
  // "cdn" لاستخدام flagcdn، أو "local" لاستخدام ملفاتك داخل /assets/posawesome/flags/
  flagSource: { type: String, default: "cdn" }
});

const emit = defineEmits(["update:modelValue", "valid", "update:country", "update:whats"]);

const GCC = [
  // أمثلة بدون صفر أولي
  { iso: "SA", name: "السعودية", flag: "sa", cc: "966", example: "مثال: 559443354", expectedLen: 9, pattern: /^5\d{8}$/ },
  { iso: "AE", name: "الإمارات", flag: "ae", cc: "971", example: "مثال: 501234567", expectedLen: 9, pattern: /^5\d{8}$/ },
  { iso: "KW", name: "الكويت",   flag: "kw", cc: "965", example: "مثال: 51234567",  expectedLen: 8, pattern: /^(5|6|9)\d{7}$/ },
  { iso: "QA", name: "قطر",      flag: "qa", cc: "974", example: "مثال: 33123456",  expectedLen: 8, pattern: /^(3|5|6|7)\d{7}$/ },
  { iso: "BH", name: "البحرين",  flag: "bh", cc: "973", example: "مثال: 33123456",  expectedLen: 8, pattern: /^(3|6)\d{7}$/ },
  { iso: "OM", name: "عُمان",    flag: "om", cc: "968", example: "مثال: 91234567",  expectedLen: 8, pattern: /^9\d{7}$/ },
];

const initializing = ref(true);
const selectedCountry = ref(GCC[0]);
const local           = ref(""); // الرقم المحلي بدون صفر

// ====== أعلام الدول (SVG + فول-باك محلي) ======
const flagSrc = (iso) => {
  const code = (iso || "").toLowerCase();
  if (props.flagSource === "local") {
    // ضع ملفاتك هنا: public/assets/posawesome/flags/sa.svg ...الخ
    return `/assets/posawesome/flags/${code}.svg`;
  }
  // SVG واضح ولا يعتمد على الخط (لا إيموجي)
  return `https://cdn.jsdelivr.net/npm/flag-icons/flags/4x3/${code}.svg`;
};

// جرّب CDN بديل ثم محلي إذا فشل التحميل
const onFlagError = (e, iso) => {
  const code = (iso || "").toLowerCase();
  const tried = e.target.getAttribute("data-tried") || "";
  if (!tried.includes("jsdelivr")) {
    e.target.setAttribute("data-tried", tried + "|jsdelivr");
    e.target.src = `https://cdn.jsdelivr.net/npm/flag-icons/flags/4x3/${code}.svg`;
    return;
  }
  // فول-باك محلي
  e.target.src = `/assets/posawesome/flags/${code}.svg`;
};

// ====== Helpers ======
const digits = (v) => (v || "").toString().replace(/\D+/g, "");
const expectedLen = computed(() => selectedCountry.value?.expectedLen || undefined);
const placeholder = computed(() => selectedCountry.value?.example || "");

// صحة/اكتمال الرقم حسب الدولة
const isComplete = computed(() => {
  const rx = selectedCountry.value?.pattern;
  return rx ? rx.test(local.value) : !!local.value;
});

// واتساب: cc + local (بدون +)
const whatsappDigits = computed(() => {
  if (!isComplete.value) return "";
  const cc = selectedCountry.value?.cc || "";
  return cc + local.value;
});

// ناتج v-model بحسب emitFormat
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

// تهيئة من قيمة موجودة أو تغيّر خارجي
onMounted(() => {
  rehydrateFromValue(props.modelValue);
  initializing.value = false;
});

watch(() => props.modelValue, (nv, ov) => {
  if (nv === ov) return;
  initializing.value = true;
  rehydrateFromValue(nv);
  initializing.value = false;
});

// —— دالة إعادة التحليل من قيمة (واتساب/محلي) —— //
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

    // دعم صيغ قديمة: 05xxxxxxxx → احذف الصفر
    if ((byCC.iso === "SA" || byCC.iso === "AE") && /^0?5\d{8}$/.test(rest)) {
      rest = rest.replace(/^0/, "");
    }

    if (byCC.expectedLen && rest.length > byCC.expectedLen) {
      rest = rest.slice(0, byCC.expectedLen);
    }
    local.value = rest;
    return;
  }

  // قيمة محلية: حدّد الدولة بالأنماط والأطوال
  for (const c of GCC) {
    let candidate = v;

    // SA/AE: 05xxxxxxxx → احذف الصفر إن وُجد
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

  // لم تُطابق أي دولة: خزّنها كما هي (سيظهر تحذير اكتمال)
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
  padding-inline: 6px !important; /* تضييق الحقل لأننا نعرض علماً فقط */
}
</style>
