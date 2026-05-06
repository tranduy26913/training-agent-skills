<script setup lang="ts">
import { shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useEmployeesStore } from '@/stores/employees.store';
import EmployeeForm from './components/EmployeeForm.vue';
import type { CreateEmployeeDto } from '@/types/employees.types';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const employeesStore = useEmployeesStore();

// 送信中フラグ / Submitting flag
const submitting = shallowRef(false);

// フォーム送信ハンドラ / Handle form submission
async function handleSubmit(formData: CreateEmployeeDto): Promise<void> {
  submitting.value = true;
  try {
    await employeesStore.createEmployee(formData);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('employees.createdSuccess'),
      life: 3000,
    });
    router.push({ name: 'EmployeeList' });
  } catch (error: any) {
    const detail = error.response?.status === 409
      ? t('employees.employeeCodeInvalid')
      : t('employees.createdError');
    toast.add({ severity: 'error', summary: t('common.error'), detail, life: 3000 });
  } finally {
    submitting.value = false;
  }
}

// キャンセルハンドラ / Navigate back to list
function handleCancel(): void {
  router.push({ name: 'EmployeeList' });
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-6">
      {{ t('employees.createEmployee') }}
    </h2>
    <EmployeeForm
      mode="create"
      :loading="submitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
