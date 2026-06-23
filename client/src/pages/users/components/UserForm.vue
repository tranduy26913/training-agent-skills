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
import { useEmailValidation } from '@composables/useEmailValidation';

const { t } = useI18n();

// Props
const props = defineProps<{
  mode: 'create' | 'edit';
  initialData?: User | null;
  loading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  submit: [formData: { name: string; email: string; role: string; status: string; note: string; birthday: string }];
  cancel: [];
}>();

// Role options.
const roleOptions = computed(() => [
  { label: t('users.roles.admin'), value: 'admin' },
  { label: t('users.roles.user'), value: 'user' },
  { label: t('users.roles.moderator'), value: 'moderator' },
]);

// Status options.
const statusOptions = computed(() => [
  { label: t('users.statuses.active'), value: 'active' },
  { label: t('users.statuses.inactive'), value: 'inactive' },
  { label: t('users.statuses.suspended'), value: 'suspended' },
]);

// Today's date as max for the birthday picker.
const today = new Date();

// Validation schema (reactive with i18n locale).
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

// VeeValidate form with Zod schema.
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

// Field definitions  Edisable auto-validation; debounced watchers control when to validate.
const [name] = defineField('name', { validateOnModelUpdate: false });
const [email] = defineField('email', { validateOnModelUpdate: false });
const [role] = defineField('role');
const [status] = defineField('status');
const [note] = defineField('note', { validateOnModelUpdate: false });
const [birthday] = defineField('birthday');

// Exclude current user ID for the email duplicate check (edit mode).
const excludeId = computed(() =>
  props.mode === 'edit' ? props.initialData?.id : undefined,
);

// Server-side email duplicate check with debounce.
// Use a computed to guarantee Ref<string> type compatibility with the composable.
const emailString = computed(() => email.value ?? '');
const { isChecking: emailChecking, emailError: emailServerError } = useEmailValidation(
  emailString,
  excludeId,
);

// Per-field debounced validation  Eeach field is independent.
watchDebounced(name, () => validateField('name'), { debounce: 400 });
watchDebounced(email, () => validateField('email'), { debounce: 400 });
watchDebounced(note, () => validateField('note'), { debounce: 400 });

// Populate form fields when initialData is provided (edit mode).
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

// Submit  EVeeValidate validates all fields before calling the callback.
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

// Format date for display (edit mode read-only fields).
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
    <!-- Name field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.name') }}</label>
      <InputText v-model="name" :placeholder="t('users.namePlaceholder')" :invalid="!!errors.name" />
      <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
    </div>

    <!-- Email field -->
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

    <!-- Role field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.role') }}</label>
      <Select v-model="role" :options="roleOptions" optionLabel="label" optionValue="value" />
    </div>

    <!-- Status field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.status') }}</label>
      <Select v-model="status" :options="statusOptions" optionLabel="label" optionValue="value" />
    </div>

    <!-- Note field -->
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

    <!-- Birthday field -->
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

    <!-- Points (edit mode only, read-only) -->
    <div v-if="mode === 'edit' && initialData" class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.points') }}</label>
      <InputText :modelValue="String(initialData.points)" disabled />
    </div>

    <!-- Created At (edit mode only) -->
    <div v-if="mode === 'edit' && initialData" class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ t('users.createdAt') }}</label>
      <InputText :modelValue="formatDate(initialData.created_at)" disabled />
    </div>

    <!-- Action buttons -->
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