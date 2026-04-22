<script setup lang="ts">
import { computed, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { watchDebounced } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import type { User } from '../composables/useUsers';
import { useEmailValidation } from '@/composables/useEmailValidation';

const { t } = useI18n();

// Props / 繝励Ο繝代ユ繧｣螳夂ｾｩ
const props = defineProps<{
  mode: 'create' | 'edit';
  initialData?: User | null;
  loading?: boolean;
}>();

// Emits / 繧､繝吶Φ繝亥ｮ夂ｾｩ
const emit = defineEmits<{
  submit: [formData: { name: string; email: string; role: string; status: string; note: string; birthday: string }];
  cancel: [];
}>();

// 繝ｭ繝ｼ繝ｫ繧ｪ繝励す繝ｧ繝ｳ / Role options
const roleOptions = computed(() => [
  { label: t('users.roles.admin'), value: 'admin' },
  { label: t('users.roles.user'), value: 'user' },
  { label: t('users.roles.moderator'), value: 'moderator' },
]);

// 繧ｹ繝・・繧ｿ繧ｹ繧ｪ繝励す繝ｧ繝ｳ / Status options
const statusOptions = computed(() => [
  { label: t('users.statuses.active'), value: 'active' },
  { label: t('users.statuses.inactive'), value: 'inactive' },
  { label: t('users.statuses.suspended'), value: 'suspended' },
]);

// 莉頑律縺ｮ譌･莉假ｼ郁ｪ慕函譌･縺ｮ譛螟ｧ蛟､・・/ Today's date as max for birthday picker
const today = new Date();

// 繝舌Μ繝・・繧ｷ繝ｧ繝ｳ繧ｹ繧ｭ繝ｼ繝橸ｼ・18n繝ｪ繧｢繧ｯ繝・ぅ繝厄ｼ・/ Validation schema (reactive with i18n locale)
const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      name: z.string()
        .min(1, t('users.nameRequired'))
        .min(2, t('users.nameMinLength'))
        .max(50, t('users.nameMaxLength')),
      email: z.string()
        .min(1, t('users.emailRequired'))
        .email(t('users.emailInvalid')),
      role: z.string(),
      status: z.string(),
      note: z.string().max(500, t('users.noteMaxLength')),
      birthday: z.date().nullable().optional(),
    }),
  ),
);

// 繝輔か繝ｼ繝繧ｻ繝・ヨ繧｢繝・・ / VeeValidate form with Zod schema
const { defineField, handleSubmit, errors, setValues, validateField } = useForm({
  validationSchema,
  initialValues: {
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    note: '',
    birthday: null as Date | null,
  },
});

// 繝輔ぅ繝ｼ繝ｫ繝牙ｮ夂ｾｩ・郁・蜍輔ヰ繝ｪ繝・・繧ｷ繝ｧ繝ｳ辟｡蜉ｹ 竊・watchDebounced 縺ｧ蛻ｶ蠕｡・・/ Disable auto-validation; debounced watchers control when to validate
const [name] = defineField('name', { validateOnModelUpdate: false });
const [email] = defineField('email', { validateOnModelUpdate: false });
const [role] = defineField('role');
const [status] = defineField('status');
const [note] = defineField('note', { validateOnModelUpdate: false });
const [birthday] = defineField('birthday');

// 邱ｨ髮・凾縺ｮ髯､螟蜂D・医Γ繝ｼ繝ｫ驥崎､・メ繧ｧ繝・け逕ｨ・・/ Exclude current user ID for email duplicate check
const excludeId = computed(() =>
  props.mode === 'edit' ? props.initialData?.id : undefined,
);

// 繝｡繝ｼ繝ｫ驥崎､・メ繧ｧ繝・け・医し繝ｼ繝舌・蛛ｴ繝ｻ繝・ヰ繧ｦ繝ｳ繧ｹ莉倥″・・/ Server-side email duplicate check with debounce
// Use a computed to guarantee Ref<string> type compatibility with the composable
const emailString = computed(() => email.value ?? '');
const { isChecking: emailChecking, emailError: emailServerError } = useEmailValidation(
  emailString,
  excludeId,
);

// 繝輔ぅ繝ｼ繝ｫ繝牙挨繝・ヰ繧ｦ繝ｳ繧ｹ繝舌Μ繝・・繧ｷ繝ｧ繝ｳ / Per-field debounced validation 窶・each field is independent
watchDebounced(name, () => validateField('name'), { debounce: 400 });
watchDebounced(email, () => validateField('email'), { debounce: 400 });
watchDebounced(note, () => validateField('note'), { debounce: 400 });

// 蛻晄悄繝・・繧ｿ縺ｮ蜿肴丐 / Populate form fields when initialData is provided (edit mode)
watch(
  () => props.initialData,
  (data) => {
    if (data) {
      setValues({
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        note: data.note ?? '',
        birthday: data.birthday ? new Date(data.birthday) : null,
      });
    }
  },
  { immediate: true },
);

// 繝輔か繝ｼ繝騾∽ｿ｡ / Submit 窶・VeeValidate validates all fields before calling the callback
const onSubmit = handleSubmit((values) => {
  if (emailChecking.value || emailServerError.value) return;
  emit('submit', {
    name: values.name.trim(),
    email: values.email.trim(),
    role: values.role,
    status: values.status,
    note: (values.note ?? '').trim(),
    birthday: values.birthday instanceof Date ? values.birthday.toISOString().split('T')[0] : '',
  });
});

// 譌･莉倥ヵ繧ｩ繝ｼ繝槭ャ繝・/ Format date for display (edit mode read-only fields)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-4 max-w-lg">
    <!-- 蜷榊燕 / Name field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.name') }}</label>
      <InputText v-model="name" :placeholder="t('users.namePlaceholder')" :invalid="!!errors.name" />
      <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
    </div>

    <!-- 繝｡繝ｼ繝ｫ / Email field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.email') }}</label>
      <div class="relative">
        <InputText
          v-model="email"
          :placeholder="t('users.emailPlaceholder')"
          :invalid="!!errors.email || !!emailServerError"
          class="w-full"
        />
        <i v-if="emailChecking" class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
      </div>
      <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
      <small v-else-if="emailServerError" class="text-red-500">{{ t(`users.${emailServerError}`) }}</small>
      <small v-else-if="emailChecking" class="text-surface-400">{{ t('users.emailChecking') }}</small>
    </div>

    <!-- 繝ｭ繝ｼ繝ｫ / Role field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.role') }}</label>
      <Select v-model="role" :options="roleOptions" optionLabel="label" optionValue="value" />
    </div>

    <!-- 繧ｹ繝・・繧ｿ繧ｹ / Status field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.status') }}</label>
      <Select v-model="status" :options="statusOptions" optionLabel="label" optionValue="value" />
    </div>

    <!-- 繝｡繝｢ / Note field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.note') }}</label>
      <Textarea
        v-model="note"
        :placeholder="t('users.notePlaceholder')"
        :invalid="!!errors.note"
        rows="3"
        class="w-full"
      />
      <div class="flex justify-between">
        <small v-if="errors.note" class="text-red-500">{{ errors.note }}</small>
        <small class="text-surface-400 ml-auto">{{ (note ?? '').length }}/500</small>
      </div>
    </div>

    <!-- 隱慕函譌･ / Birthday field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.birthday') }}</label>
      <DatePicker
        v-model="birthday"
        :placeholder="t('users.birthdayPlaceholder')"
        :maxDate="today"
        dateFormat="dd/mm/yy"
        showButtonBar
        class="w-56"
        showIcon
      />
    </div>

    <!-- 繝昴う繝ｳ繝茨ｼ育ｷｨ髮・Δ繝ｼ繝峨・縺ｿ繝ｻ隱ｭ縺ｿ蜿悶ｊ蟆ら畑・・/ Points (edit mode only, read-only) -->
    <div v-if="mode === 'edit' && initialData" class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.points') }}</label>
      <InputText :modelValue="String(initialData.points)" disabled />
    </div>

    <!-- 菴懈・譌･・育ｷｨ髮・Δ繝ｼ繝峨・縺ｿ・・/ Created At (edit mode only) -->
    <div v-if="mode === 'edit' && initialData" class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.createdAt') }}</label>
      <InputText :modelValue="formatDate(initialData.created_at)" disabled />
    </div>

    <!-- 繝懊ち繝ｳ / Action buttons -->
    <div class="flex gap-3 mt-2">
      <Button
        type="submit"
        :label="mode === 'create' ? t('users.createUser') : t('users.updateUser')"
        icon="pi pi-check"
        :loading="loading"
        :disabled="loading || emailChecking || !!emailServerError"
      />
      <Button
        type="button"
        :label="t('common.cancel')"
        severity="secondary"
        outlined
        @click="emit('cancel')"
      />
    </div>
  </form>
</template>
