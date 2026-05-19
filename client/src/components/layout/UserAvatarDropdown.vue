<script setup lang="ts">
/**
 * UserAvatarDropdown component
 * アバタードロップダウンメニューコンポーネント
 * Displays user avatar/initials and a dropdown menu for profile navigation and logout.
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import Menu from 'primevue/menu';
import { useAuthStore } from '@/stores/auth.store';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

// メニュー参照 / Menu ref for PrimeVue popup
const menu = ref<InstanceType<typeof Menu>>();

/** Get initials from user name / ユーザー名から頭文字を取得 */
const initials = computed(() => {
  const name = user.value?.name ?? '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
});

/** Toggle menu popup / メニューポップアップをトグル */
function toggleMenu(event: Event): void {
  menu.value?.toggle(event);
}

/** Navigate to profile page / プロフィールページに遷移 */
function goToProfile(): void {
  router.push('/profile');
}

/** Logout and redirect / ログアウトしてリダイレクト */
function handleLogout(): void {
  authStore.logout();
  router.push('/login');
}

// メニューアイテム定義 / Menu items definition
const menuItems = computed(() => [
  {
    label: t('profile.myProfile'),
    icon: 'pi pi-user',
    command: goToProfile,
  },
  {
    separator: true,
  },
  {
    label: t('auth.logout'),
    icon: 'pi pi-sign-out',
    command: handleLogout,
  },
]);
</script>

<template>
  <!-- アバターボタン / Avatar button -->
  <button
    type="button"
    class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
    :aria-label="t('profile.myProfile')"
    @click="toggleMenu"
  >
    <!-- アバター画像またはイニシャル / Avatar image or initials -->
    <div class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-primary-500 text-white text-sm font-semibold shrink-0">
      <img v-if="user?.avatar" :src="user.avatar" alt="avatar" class="w-full h-full object-cover" />
      <span v-else>{{ initials }}</span>
    </div>

    <!-- ユーザー名とロール / User name and role -->
    <div class="text-right hidden sm:block">
      <p class="text-sm font-medium text-surface-700 dark:text-surface-200 leading-none">{{ user?.name }}</p>
      <p class="text-xs text-surface-400 capitalize leading-none mt-0.5">{{ user?.role }}</p>
    </div>

    <i class="pi pi-chevron-down text-xs text-surface-400 hidden sm:block"></i>
  </button>

  <!-- ドロップダウンメニュー / Dropdown menu -->
  <Menu ref="menu" :model="menuItems" popup />
</template>
