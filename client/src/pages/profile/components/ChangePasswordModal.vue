<script setup lang="ts">
/**
 * ChangePasswordModal component.
 */
import { computed } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useI18n } from 'vue-i18n';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Password from 'primevue/password';
import { useProfile } from '@composables/useProfile';

const { t } = useI18n();
const { changePassword, loading } = useProfile();

// Props
const props = defineProps<{
  visible: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean];
  changed: [];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// Validation schema.
const validationSchema = computed(() =>
  toTypedSchema(
    z
      .object({
        currentPassword: z.string().min(1, t('profile.currentPassword')),
        newPassword: z.string().min(8, t('profile.passwordMinLength')),
        confirmPassword: z.string().min(1, t('profile.confirmPassword')),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: t('profile.passwordMismatch'),
        path: ['confirmPassword'],
      }),
  ),
);

const { defineField, handleSubmit, errors, resetForm, setFieldError } = useForm({
  validationSchema,
  initialValues: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
});

const [currentPassword] = defineField('currentPassword', { validateOnModelUpdate: false });
const [newPassword] = defineField('newPassword', { validateOnModelUpdate: false });
const [confirmPassword] = defineField('confirmPassword', { validateOnModelUpdate: false });

// Extract HTTP status from an unknown error, or null.
function getErrorStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { status?: number } }).response;
    return response?.status ?? null;
  }
  return null;
}

// Form submit handler.
const onSubmit = handleSubmit(async (values) => {
  try {
    await changePassword(values);
    resetForm();
    emit('changed');
    emit('update:visible', false);
  } catch (err: unknown) {
    // 401 means wrong current password.
    if (getErrorStatus(err) === 401) {
      setFieldError('currentPassword', t('profile.currentPasswordWrong'));
    }
  }
});

// Reset form on cancel.
function handleCancel(): void {
  resetForm();
  emit('update:visible', false);
}
</script>

<template>
  <!-- Change password dialog -->
  <Dialog
    v-model:visible="dialogVisible"
    :header="t('profile.changePassword')"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="w-full max-w-md"
    @hide="handleCancel"
  >
    <form class="flex flex-col gap-4 pt-2" @submit.prevent="onSubmit">
      <!-- Current password -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-surface-700 dark:text-surface-200">
          {{ t('profile.currentPassword') }}
        </label>
        <Password
          v-model="currentPassword"
          :feedback="false"
          toggle-mask
          fluid
          :invalid="!!errors.currentPassword"
          :placeholder="t('profile.currentPassword')"
        />
        <small v-if="errors.currentPassword" class="text-red-500 text-xs">{{ errors.currentPassword }}</small>
      </div>

      <!-- New password -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-surface-700 dark:text-surface-200">
          {{ t('profile.newPassword') }}
        </label>
        <Password
          v-model="newPassword"
          toggle-mask
          fluid
          :invalid="!!errors.newPassword"
          :placeholder="t('profile.newPassword')"
        />
        <small v-if="errors.newPassword" class="text-red-500 text-xs">{{ errors.newPassword }}</small>
      </div>

      <!-- Confirm password -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-surface-700 dark:text-surface-200">
          {{ t('profile.confirmPassword') }}
        </label>
        <Password
          v-model="confirmPassword"
          :feedback="false"
          toggle-mask
          fluid
          :invalid="!!errors.confirmPassword"
          :placeholder="t('profile.confirmPassword')"
        />
        <small v-if="errors.confirmPassword" class="text-red-500 text-xs">{{ errors.confirmPassword }}</small>
      </div>
    </form>

    <!-- Footer buttons -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="t('common.cancel')"
          severity="secondary"
          :disabled="loading"
          @click="handleCancel"
        />
        <Button
          :label="t('profile.changePassword')"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>