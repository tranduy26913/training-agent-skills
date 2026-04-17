<script setup lang="ts">
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import type { User } from '../composables/useUsers';

// Props / プロパティ定義
const props = defineProps<{
  mode: 'create' | 'edit';
  initialData?: User | null;
  emailError?: string | null;
  loading?: boolean;
}>();

// Emits / イベント定義
const emit = defineEmits<{
  submit: [formData: { name: string; email: string; role: string; status: string }];
  cancel: [];
}>();

// フォーム状態 / Form state
const name = ref('');
const email = ref('');
const role = ref('user');
const status = ref('active');

// バリデーションエラー / Validation errors
const errors = ref<Record<string, string>>({});

// ロールオプション / Role options
const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
  { label: 'Moderator', value: 'moderator' },
];

// ステータスオプション / Status options
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

// 初期データの監視と反映 / Watch initialData and populate form fields
watch(
  () => props.initialData,
  (data) => {
    if (data) {
      name.value = data.name;
      email.value = data.email;
      role.value = data.role;
      status.value = data.status;
    }
  },
  { immediate: true },
);

// バリデーション / Validate form fields
function validate(): boolean {
  const newErrors: Record<string, string> = {};

  if (!name.value.trim()) {
    newErrors.name = 'Name is required';
  } else if (name.value.trim().length < 3) {
    newErrors.name = 'Name must be at least 3 characters';
  } else if (name.value.trim().length > 100) {
    newErrors.name = 'Name must be at most 100 characters';
  }

  if (!email.value.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    newErrors.email = 'Invalid email format';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
}

// 日付フォーマット / Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// フォーム送信 / Handle form submission
function handleSubmit(): void {
  if (!validate()) return;
  emit('submit', {
    name: name.value.trim(),
    email: email.value.trim(),
    role: role.value,
    status: status.value,
  });
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 max-w-lg">
    <!-- 名前 / Name field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Name</label>
      <InputText v-model="name" placeholder="Enter name" :invalid="!!errors.name" />
      <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
    </div>

    <!-- メール / Email field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Email</label>
      <InputText v-model="email" placeholder="Enter email" :invalid="!!errors.email || !!emailError" />
      <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
      <small v-else-if="emailError" class="text-red-500">{{ emailError }}</small>
    </div>

    <!-- ロール / Role field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Role</label>
      <Select
        v-model="role"
        :options="roleOptions"
        optionLabel="label"
        optionValue="value"
      />
    </div>

    <!-- ステータス / Status field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Status</label>
      <Select
        v-model="status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
      />
    </div>

    <!-- 作成日（編集モードのみ） / Created At (edit mode only) -->
    <div v-if="mode === 'edit' && initialData" class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">Created At</label>
      <InputText :modelValue="formatDate(initialData.created_at)" disabled />
    </div>

    <!-- ボタン / Action buttons -->
    <div class="flex gap-3 mt-2">
      <Button
        type="submit"
        :label="mode === 'create' ? 'Create User' : 'Update User'"
        icon="pi pi-check"
        :loading="loading"
        :disabled="loading"
      />
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        outlined
        @click="emit('cancel')"
      />
    </div>
  </form>
</template>
