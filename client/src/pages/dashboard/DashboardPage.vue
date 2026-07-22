<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUsersStore } from '@stores/users.store';

const usersStore = useUsersStore();
const activeUsers = computed(() => usersStore.users.filter((user) => user.status === 'active').length);

onMounted(() => {
  if (usersStore.users.length === 0) {
    void usersStore.fetchUsers({ page: 1, limit: 20 });
  }
});
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <p class="text-sm font-semibold text-primary-600">Nihongo learning</p>
        <h1 class="page-title">Trang học của bạn</h1>
        <p class="page-subtitle">Lộ trình, ôn tập và thống kê học tập sẽ được triển khai từ dữ liệu Supabase.</p>
      </div>
    </header>

    <section class="grid gap-4 md:grid-cols-3">
      <article class="surface-card p-5">
        <i class="pi pi-book text-xl text-primary-500"></i>
        <p class="mt-5 text-sm font-medium text-surface-500">Bài học hôm nay</p>
        <p class="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50">Sắp có</p>
      </article>
      <article class="surface-card p-5">
        <i class="pi pi-refresh text-xl text-primary-500"></i>
        <p class="mt-5 text-sm font-medium text-surface-500">Từ cần ôn</p>
        <p class="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50">Sắp có</p>
      </article>
      <article class="surface-card p-5">
        <i class="pi pi-users text-xl text-primary-500"></i>
        <p class="mt-5 text-sm font-medium text-surface-500">Học viên đang hoạt động</p>
        <p class="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50">{{ activeUsers }}</p>
      </article>
    </section>

    <section class="surface-card p-6">
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50">Sẵn sàng cho lộ trình học tiếng Nhật</h2>
      <p class="mt-2 max-w-2xl leading-7 text-surface-600 dark:text-surface-300">
        Nội dung khóa học, bài học, câu hỏi và tiến độ cá nhân sẽ được xây dựng trên schema học tập mới.
      </p>
    </section>
  </div>
</template>
