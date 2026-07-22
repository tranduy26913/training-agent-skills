<script setup lang="ts">
import { onMounted, ref } from "vue";
import { learnerApi } from "@services/learner.service";
const dashboard = ref<any>();
onMounted(async () => {
  dashboard.value = await learnerApi.dashboard();
});
</script>
<template>
  <div v-if="dashboard" class="page-stack">
    <header class="page-header">
      <div>
        <p class="text-sm font-semibold text-primary-600">Nihongo learning</p>
        <h1 class="page-title">Tiến độ học của bạn</h1>
        <p class="page-subtitle">
          Một nhịp học nhẹ nhàng mỗi ngày sẽ tạo nên khác biệt lớn.
        </p>
      </div>
    </header>
    <section class="grid gap-4 md:grid-cols-3">
      <article class="surface-card p-5">
        <i class="pi pi-book text-xl text-primary-500" />
        <p class="mt-5 text-sm font-medium text-surface-500">
          Mục tiêu hôm nay
        </p>
        <p
          class="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50"
        >
          {{ dashboard.learnedToday }}/{{ dashboard.goal }}
        </p>
      </article>
      <article class="surface-card p-5">
        <i class="pi pi-refresh text-xl text-primary-500" />
        <p class="mt-5 text-sm font-medium text-surface-500">Từ cần ôn</p>
        <p
          class="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50"
        >
          {{ dashboard.due }}
        </p>
      </article>
      <article class="surface-card p-5">
        <i class="pi pi-chart-line text-xl text-primary-500" />
        <p class="mt-5 text-sm font-medium text-surface-500">Tổng từ đã học</p>
        <p
          class="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50"
        >
          {{
            dashboard.levels.reduce(
              (sum: number, level: any) => sum + level.learned,
              0,
            )
          }}
        </p>
      </article>
    </section>
    <section class="surface-card p-6">
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50">
        Tiếp tục ngay
      </h2>
      <p
        class="mt-2 max-w-2xl leading-7 text-surface-600 dark:text-surface-300"
      >
        {{
          dashboard.due
            ? `Bạn có ${dashboard.due} từ cần ôn hôm nay.`
            : "Hãy chọn một bài để học các từ mới."
        }}
      </p>
      <RouterLink
        :to="dashboard.nextAction.path"
        class="mt-5 inline-flex rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white"
        >{{ dashboard.due ? "Ôn tập ngay" : "Chọn bài học" }}
        <i class="pi pi-arrow-right ml-2"
      /></RouterLink>
    </section>
  </div>
  <div v-else class="surface-card p-8 text-center text-surface-500">
    Đang tải tiến độ…
  </div>
</template>
