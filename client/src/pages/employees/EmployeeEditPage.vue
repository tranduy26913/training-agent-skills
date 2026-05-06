<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useEmployeesStore } from '@/stores/employees.store';
import EmployeeForm from './components/EmployeeForm.vue';
import type { CreateEmployeeDto } from '@/types/employees.types';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const employeesStore = useEmployeesStore();

// 送信中フラグ / Submitting flag
const submitting = shallowRef(false);

// 従業員ID取得 / Get employee ID from route params
const employeeId = Number(route.params.id);

// 初期データ読み込み / Load employee data on mount
onMounted(async () => {
  await employeesStore.fetchEmployee(employeeId);
});

// クリーンアップ / Clear current employee on unmount
onUnmounted(() => {
  employeesStore.clearCurrentEmployee();
});

// フォーム送信ハンドラ / Handle form submission
async function handleSubmit(formData: CreateEmployeeDto): Promise<void> {
  submitting.value = true;
  try {
    await employeesStore.updateEmployee(employeeId, formData);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('employees.updatedSuccess'),
      life: 3000,
    });
    router.push({ name: 'EmployeeList' });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('employees.updatedError'),
      life: 3000,
    });
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
      {{ t('employees.editEmployee') }}
    </h2>
    <EmployeeForm
      mode="edit"
      :initial-data="employeesStore.currentEmployee"
      :loading="submitting || employeesStore.loadingEmployee"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
