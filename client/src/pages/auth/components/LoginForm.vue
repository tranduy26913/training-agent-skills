<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth.store';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

// ログイン処理 / Handle login submission
async function handleLogin(): Promise<void> {
  errorMessage.value = '';
  loading.value = true;

  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push('/dashboard');
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || t('auth.loginFailed');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin" class="space-y-6">
    <div>
      <label for="email" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
        {{ t('auth.email') }}
      </label>
      <InputText
        id="email"
        v-model="email"
        type="email"
        :placeholder="t('auth.emailPlaceholder')"
        class="w-full"
        :invalid="!!errorMessage"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
        {{ t('auth.password') }}
      </label>
      <Password
        id="password"
        v-model="password"
        :placeholder="t('auth.passwordPlaceholder')"
        :feedback="false"
        toggle-mask
        class="w-full"
        input-class="w-full"
        :invalid="!!errorMessage"
      />
    </div>

    <div v-if="errorMessage" class="text-red-500 text-sm">
      {{ errorMessage }}
    </div>

    <Button
      type="submit"
      :label="t('auth.loginButton')"
      class="w-full"
      :loading="loading"
    />
  </form>
</template>
