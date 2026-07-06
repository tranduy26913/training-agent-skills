<script setup lang="ts">
/**
 * ProfileForm component.
 * Handles avatar upload, editable fields (name, birthday, note, avatar),
 * and read-only fields (email, role).
 */
import { computed, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import type { AuthUser } from '@apptypes/auth.types';
import type { UpdateProfileDto } from '@apptypes/profile.types';

const { t } = useI18n();

// Props
const props = defineProps<{
  user: AuthUser;
  loading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  submit: [data: UpdateProfileDto];
}>();

// Today's date as max for the birthday picker.
const today = new Date();

// Validation schema.
const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      name: z
        .string()
        .min(2, t('profile.nameMinLength'))
        .max(100, t('profile.nameMaxLength')),
      birthday: z.date().nullable().optional(),
      note: z.string().max(500, t('profile.noteMaxLength')).optional(),
      avatar: z.string().optional(),
    }),
  ),
);

// Form setup.
const { defineField, handleSubmit, errors, setValues } = useForm({
  validationSchema,
  initialValues: {
    name: props.user.name,
    birthday: props.user.birthday ? new Date(props.user.birthday) : null as Date | null,
    note: props.user.note ?? '',
    avatar: props.user.avatar ?? '',
  },
});

const [name] = defineField('name', { validateOnModelUpdate: false });
const [birthday] = defineField('birthday');
const [note] = defineField('note', { validateOnModelUpdate: false });
const [avatar] = defineField('avatar');

// Re-initialize form when user prop changes.
watch(
  () => props.user,
  (newUser) => {
    setValues({
      name: newUser.name,
      birthday: newUser.birthday ? new Date(newUser.birthday) : null,
      note: newUser.note ?? '',
      avatar: newUser.avatar ?? '',
    });
  },
  { deep: true },
);

// Avatar preview computed.
const avatarPreview = computed(() => avatar.value || props.user.avatar || null);

// User initials for fallback.
const initials = computed(() => {
  const n = props.user.name ?? '';
  return n
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
});

// Handle avatar file selection.
function onAvatarChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // 2MB size check.
  if (file.size > 2 * 1024 * 1024) {
    alert(t('profile.avatarTooBig'));
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    avatar.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

// Form submit handler.
const onSubmit = handleSubmit((values) => {
  const dto: UpdateProfileDto = {
    name: values.name,
    birthday: values.birthday
      ? [
          values.birthday.getFullYear(),
          String(values.birthday.getMonth() + 1).padStart(2, '0'),
          String(values.birthday.getDate()).padStart(2, '0'),
        ].join('-')
      : undefined,
    note: values.note || undefined,
    avatar: values.avatar || undefined,
  };
  emit('submit', dto);
});

// Role badge severity.
function roleSeverity(role: string): string {
  if (role === 'admin') return 'danger';
  if (role === 'moderator') return 'warning';
  return 'info';
}
</script>

<template>
  <form class="surface-card flex flex-col gap-6 p-5 sm:p-7" @submit.prevent="onSubmit">
    <!-- Avatar section -->
    <div class="flex flex-col items-center gap-3">
      <!-- Avatar preview -->
      <div
        class="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-primary-500 text-white text-2xl font-semibold"
        data-testid="avatar-preview"
      >
        <img v-if="avatarPreview" :src="avatarPreview" alt="avatar" class="w-full h-full object-cover" />
        <span v-else>{{ initials }}</span>
      </div>

      <!-- File select button -->
      <label class="cursor-pointer">
        <span class="text-sm text-primary-500 hover:underline">{{ t('profile.avatar') }}</span>
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          data-testid="avatar-input"
          @change="onAvatarChange"
        />
      </label>
    </div>

    <!-- Name field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-200">
        {{ t('profile.name') }} <span class="text-red-500">*</span>
      </label>
      <InputText
        v-model="name"
        :invalid="!!errors.name"
        :placeholder="t('profile.name')"
        data-testid="profile-name"
        fluid
      />
      <small v-if="errors.name" class="text-red-500 text-xs">{{ errors.name }}</small>
    </div>

    <!-- Email (read-only) -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-200">{{ t('profile.email') }}</label>
      <InputText
        :model-value="user.email"
        :disabled="true"
        data-testid="profile-email"
        fluid
      />
    </div>

    <!-- Role (read-only badge) -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-200">{{ t('profile.role') }}</label>
      <div>
        <Badge
          :value="user.role"
          :severity="roleSeverity(user.role)"
          data-testid="profile-role"
        />
      </div>
    </div>

    <!-- Birthday field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-200">{{ t('profile.birthday') }}</label>
      <DatePicker
        v-model="birthday"
        :max-date="today"
        :placeholder="t('profile.birthdayPlaceholder')"
        show-icon
        data-testid="profile-birthday"
      />
    </div>

    <!-- Note field -->
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-surface-700 dark:text-surface-200">{{ t('profile.note') }}</label>
      <Textarea
        v-model="note"
        :invalid="!!errors.note"
        :placeholder="t('profile.notePlaceholder')"
        rows="3"
        fluid
        data-testid="profile-note"
      />
      <small v-if="errors.note" class="text-red-500 text-xs">{{ errors.note }}</small>
    </div>

    <!-- Submit button -->
    <div class="flex justify-end">
      <Button
        type="submit"
        :label="t('profile.saveChanges')"
        :loading="loading"
        data-testid="profile-save-btn"
      />
    </div>
  </form>
</template>
