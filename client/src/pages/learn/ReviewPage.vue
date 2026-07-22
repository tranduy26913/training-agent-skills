<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Button from "primevue/button";
import Card from "primevue/card";
import { learnerApi } from "@services/learner.service";

const router = useRouter();
const { t } = useI18n();
const summary = ref({ due: 0 });
const isStarting = ref(false);

onMounted(async () => {
  summary.value = await learnerApi.reviewSummary();
});

async function start(): Promise<void> {
  isStarting.value = true;
  try {
    const session = await learnerApi.startReview();
    await router.push(`/learn/review/${session.id}`);
  } finally {
    isStarting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl page-stack">
    <header>
      <p class="text-sm font-semibold text-primary-600">{{ t('learning.spacedReview') }}</p>
      <h1 class="page-title">{{ t('learning.reinforceMemory') }}</h1>
      <p class="page-subtitle">
        {{ t('learning.reviewDescription') }}
      </p>
    </header>

    <Card>
      <template #content>
        <div class="rounded-xl bg-primary-700 p-8 text-white sm:p-10">
          <p class="text-sm font-semibold text-primary-100">{{ t('learning.dueToday') }}</p>
          <p class="mt-2 text-5xl font-extrabold">{{ summary.due }}</p>
          <p class="mt-3 max-w-md text-sm leading-6 text-primary-100">
            {{ t('learning.reviewExplanation') }}
          </p>
          <Button
            :label="t('learning.startReview')"
            icon="pi pi-play"
            severity="secondary"
            class="mt-7"
            :loading="isStarting"
            :disabled="!summary.due"
            @click="start"
          />
        </div>
      </template>
    </Card>
  </div>
</template>
