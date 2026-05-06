<script setup lang="ts">
import { computed, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { watchDebounced } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import type { Employee, CreateEmployeeDto } from '@/types/employees.types';

const { t } = useI18n();

// Props / プロパティ定義
const props = defineProps<{
  mode: 'create' | 'edit';
  initialData?: Employee | null;
  loading?: boolean;
}>();

// Emits / イベント定義
const emit = defineEmits<{
  submit: [formData: CreateEmployeeDto];
  cancel: [];
}>();

// 今日の日付（入社日の最大値） / Today's date as max for hire date picker
const today = new Date();

// 部署オプション / Department options
const departmentOptions = computed(() => [
  { label: t('employees.departments.engineering'), value: 'engineering' },
  { label: t('employees.departments.hr'), value: 'hr' },
  { label: t('employees.departments.finance'), value: 'finance' },
  { label: t('employees.departments.marketing'), value: 'marketing' },
  { label: t('employees.departments.operations'), value: 'operations' },
]);

// 役職オプション / Position options
const positionOptions = computed(() => [
  { label: t('employees.positions.engineer'), value: 'engineer' },
  { label: t('employees.positions.senior_engineer'), value: 'senior_engineer' },
  { label: t('employees.positions.team_lead'), value: 'team_lead' },
  { label: t('employees.positions.manager'), value: 'manager' },
  { label: t('employees.positions.director'), value: 'director' },
  { label: t('employees.positions.analyst'), value: 'analyst' },
  { label: t('employees.positions.specialist'), value: 'specialist' },
  { label: t('employees.positions.intern'), value: 'intern' },
]);

// ステータスオプション / Status options
const statusOptions = computed(() => [
  { label: t('employees.statuses.active'), value: 'active' },
  { label: t('employees.statuses.inactive'), value: 'inactive' },
]);

// バリデーションスキーマ（i18nリアクティブ） / Validation schema reactive with i18n locale
const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      employee_code: z
        .string()
        .min(1, t('employees.employeeCodeRequired'))
        .regex(/^[A-Za-z0-9]{3,10}$/, t('employees.employeeCodeInvalid')),
      full_name: z
        .string()
        .min(1, t('employees.fullNameRequired'))
        .min(2, t('employees.fullNameMinLength'))
        .max(100, t('employees.fullNameMaxLength')),
      email: z
        .string()
        .min(1, t('employees.emailRequired'))
        .email(t('employees.emailInvalid')),
      phone: z.string().optional(),
      department: z.string().min(1),
      position: z.string().min(1),
      hire_date: z
        .date({ required_error: t('employees.hireDateRequired') })
        .max(today, t('employees.hireDateFuture')),
      salary: z.number().min(0, t('employees.salaryMin')),
      status: z.string().min(1),
    }),
  ),
);

// フォームセットアップ / VeeValidate form with Zod schema
const { defineField, handleSubmit, errors, setValues, validateField } = useForm({
  validationSchema,
  initialValues: {
    employee_code: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'engineering',
    position: 'engineer',
    hire_date: null as unknown as Date,
    salary: 0,
    status: 'active',
  },
});

// フィールド定義（自動バリデーション無効 → debounce で制御） / Disable auto-validation; watchers control when to validate
const [employeeCode] = defineField('employee_code', { validateOnModelUpdate: false });
const [fullName] = defineField('full_name', { validateOnModelUpdate: false });
const [email] = defineField('email', { validateOnModelUpdate: false });
const [phone] = defineField('phone', { validateOnModelUpdate: false });
const [department] = defineField('department');
const [position] = defineField('position');
const [hireDate] = defineField('hire_date');
const [salary] = defineField('salary');
const [status] = defineField('status');

// フィールド別デバウンスバリデーション / Per-field debounced validation
watchDebounced(employeeCode, () => validateField('employee_code'), { debounce: 400 });
watchDebounced(fullName, () => validateField('full_name'), { debounce: 400 });
watchDebounced(email, () => validateField('email'), { debounce: 400 });

// 初期データの設定（編集モード） / Populate form when initialData is provided (edit mode)
watch(
  () => props.initialData,
  (data) => {
    if (data) {
      setValues({
        employee_code: data.employee_code,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone ?? '',
        department: data.department,
        position: data.position,
        hire_date: new Date(data.hire_date),
        salary: data.salary,
        status: data.status,
      });
    }
  },
  { immediate: true },
);

// フォーム送信 / Submit — VeeValidate validates all fields first
const onSubmit = handleSubmit((values) => {
  emit('submit', {
    employee_code: values.employee_code.trim(),
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone: values.phone?.trim() || undefined,
    department: values.department as CreateEmployeeDto['department'],
    position: values.position as CreateEmployeeDto['position'],
    hire_date: values.hire_date instanceof Date
      ? values.hire_date.toISOString().split('T')[0]
      : values.hire_date,
    salary: values.salary,
    status: values.status as CreateEmployeeDto['status'],
  });
});
</script>

<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-4 max-w-lg">
    <!-- 社員コード / Employee code -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.employeeCode') }}
      </label>
      <InputText
        v-model="employeeCode"
        :placeholder="'EMP001'"
        :invalid="!!errors.employee_code"
        :disabled="mode === 'edit'"
      />
      <small v-if="errors.employee_code" class="text-red-500">{{ errors.employee_code }}</small>
    </div>

    <!-- 氏名 / Full name -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.fullName') }}
      </label>
      <InputText v-model="fullName" :invalid="!!errors.full_name" />
      <small v-if="errors.full_name" class="text-red-500">{{ errors.full_name }}</small>
    </div>

    <!-- メール / Email -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.email') }}
      </label>
      <InputText v-model="email" :invalid="!!errors.email" />
      <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
    </div>

    <!-- 電話番号 / Phone -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.phone') }}
      </label>
      <InputText v-model="phone" />
    </div>

    <!-- 部署 / Department -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.department') }}
      </label>
      <Select v-model="department" :options="departmentOptions" optionLabel="label" optionValue="value" />
    </div>

    <!-- 役職 / Position -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.position') }}
      </label>
      <Select v-model="position" :options="positionOptions" optionLabel="label" optionValue="value" />
    </div>

    <!-- 入社日 / Hire date -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.hireDate') }}
      </label>
      <DatePicker
        v-model="hireDate"
        :maxDate="today"
        dateFormat="dd/mm/yy"
        showButtonBar
        showIcon
        class="w-56"
        :invalid="!!errors.hire_date"
      />
      <small v-if="errors.hire_date" class="text-red-500">{{ errors.hire_date }}</small>
    </div>

    <!-- 給与 / Salary -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.salary') }}
      </label>
      <InputNumber
        v-model="salary"
        :min="0"
        :useGrouping="true"
        :invalid="!!errors.salary"
      />
      <small v-if="errors.salary" class="text-red-500">{{ errors.salary }}</small>
    </div>

    <!-- ステータス / Status -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('employees.status') }}
      </label>
      <Select v-model="status" :options="statusOptions" optionLabel="label" optionValue="value" />
    </div>

    <!-- ボタン群 / Action buttons -->
    <div class="flex gap-3 mt-2">
      <Button type="submit" :label="t('common.save')" :loading="loading" />
      <Button type="button" :label="t('common.cancel')" severity="secondary" outlined @click="emit('cancel')" />
    </div>
  </form>
</template>
