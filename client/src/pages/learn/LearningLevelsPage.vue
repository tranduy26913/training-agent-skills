<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import Button from "primevue/button";
import Card from "primevue/card";
import ProgressBar from "primevue/progressbar";
import Tag from "primevue/tag";
import { learnerApi, type LessonSummary } from "@services/learner.service";

const route = useRoute();
const { t } = useI18n();
const levels = ref<Awaited<ReturnType<typeof learnerApi.levels>>>([]);
const lessons = ref<LessonSummary[]>([]);
const isLoading = ref(false);

const selectedLevel = computed(() =>
  typeof route.params.level === "string" ? route.params.level : null,
);

async function load(): Promise<void> {
  isLoading.value = true;
  try {
    if (selectedLevel.value) {
      lessons.value = await learnerApi.lessons(selectedLevel.value);
    } else {
      levels.value = await learnerApi.levels();
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
watch(selectedLevel, load);
</script>

<template>
  <div class="page-stack">
    <header class="page-header">
      <div>
        <RouterLink
          v-if="selectedLevel"
          to="/learn/levels"
          class="text-sm font-semibold text-primary-600"
        >
          <i class="pi pi-arrow-left mr-1" />{{ t('learning.allLevels') }}
        </RouterLink>
        <p v-else class="text-sm font-semibold text-primary-600">
          {{ t('learning.personalPath') }}
        </p>
        <h1 class="mt-1 page-title">
          {{
            selectedLevel
              ? `${selectedLevel} · ${t('learning.lessons')}`
              : t('learning.title')
          }}
        </h1>
        <p class="page-subtitle">
          {{ t('learning.chooseLevel') }}
        </p>
      </div>
      <RouterLink to="/learn/review">
        <Button :label="t('learning.review')" icon="pi pi-refresh" />
      </RouterLink>
    </header>

    <div v-if="isLoading" class="surface-card p-8 text-center text-surface-500">
      {{ t('learning.loadingPath') }}
    </div>

    <section
      v-else-if="!selectedLevel"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <RouterLink
        v-for="item in levels"
        :key="item.level"
        :to="`/learn/levels/${item.level}`"
        class="block"
      >
        <Card class="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
          <template #content>
            <div class="flex items-start justify-between">
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-widest text-primary-600"
                >
                  JLPT
                </p>
                <h2 class="mt-1 text-2xl font-extrabold">{{ item.level }}</h2>
              </div>
              <i class="pi pi-arrow-right text-primary-500" />
            </div>
            <ProgressBar
              :value="item.progress"
              :show-value="false"
              class="mt-7 !h-2"
            />
            <p class="mt-3 text-sm text-surface-500">
              <b class="text-surface-800 dark:text-surface-100"
                >{{ item.learned }}/{{ item.total }}</b
              >
              {{ t('learning.learnedProgress', { learned: item.learned, total: item.total, lessons: item.lessonCount }) }}
            </p>
          </template>
        </Card>
      </RouterLink>
    </section>

    <section v-else class="space-y-3">
      <RouterLink
        v-for="lesson in lessons"
        :key="lesson.id"
        :to="`/learn/lessons/${lesson.id}`"
        class="block"
      >
        <Card class="transition hover:shadow-lg">
          <template #content>
            <div class="flex items-center gap-5">
              <Tag
                :value="String(lesson.position)"
                rounded
                class="!h-12 !min-w-12 !justify-center !text-base"
              />
              <div class="min-w-0 flex-1">
                <h2 class="font-bold text-surface-900 dark:text-surface-50">
                  {{ lesson.title }}
                </h2>
                <p class="mt-1 truncate text-sm text-surface-500">
                  {{
                    lesson.description || t('learning.essentialVocabulary')
                  }}
                </p>
                <ProgressBar
                  :value="lesson.progress"
                  :show-value="false"
                  class="mt-3 !h-1.5"
                />
              </div>
              <span class="text-sm font-semibold text-surface-500"
                >{{ lesson.learned }}/{{ lesson.total }}</span
              >
              <i class="pi pi-chevron-right text-primary-500" />
            </div>
          </template>
        </Card>
      </RouterLink>
      <Card v-if="!lessons.length">
        <template #content
          ><p class="py-5 text-center text-surface-500">
            {{ t('learning.noLessons') }}
          </p></template
        >
      </Card>
    </section>
  </div>
</template>
