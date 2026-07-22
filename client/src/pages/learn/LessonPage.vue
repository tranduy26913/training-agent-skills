<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";
import ProgressBar from "primevue/progressbar";
import Tag from "primevue/tag";
import { learnerApi } from "@services/learner.service";

const route = useRoute();
const router = useRouter();
const lesson = ref<Awaited<ReturnType<typeof learnerApi.lesson>>>();
const isStarting = ref(false);
const lessonId = computed(() => Number(route.params.id));

onMounted(async () => {
  lesson.value = await learnerApi.lesson(lessonId.value);
});

async function startFlashcards(): Promise<void> {
  isStarting.value = true;
  try {
    const session = await learnerApi.startFlashcards(lessonId.value);
    await router.push(`/learn/flashcards/${session.id}`);
  } finally {
    isStarting.value = false;
  }
}
</script>

<template>
  <div v-if="lesson" class="page-stack">
    <header class="page-header">
      <div>
        <RouterLink
          :to="`/learn/levels/${lesson.level}`"
          class="text-sm font-semibold text-primary-600"
        >
          <i class="pi pi-arrow-left mr-1" />{{ lesson.level }}
        </RouterLink>
        <h1 class="mt-2 page-title">{{ lesson.title }}</h1>
        <p class="page-subtitle">
          {{
            lesson.description ||
            "Xây nền từ vựng qua các thẻ học ngắn, dễ nhớ."
          }}
        </p>
      </div>
      <Button
        label="Học thẻ từ"
        icon="pi pi-play"
        :loading="isStarting"
        @click="startFlashcards"
      />
    </header>

    <Card>
      <template #title>Từ vựng của bài</template>
      <template #subtitle
        >{{ lesson.learned }}/{{ lesson.total }} từ đã ghi nhận</template
      >
      <template #content>
        <ProgressBar
          :value="
            Math.round((lesson.learned / Math.max(lesson.total, 1)) * 100)
          "
          :show-value="false"
          class="mb-5 !h-2"
        />
        <div class="space-y-2">
          <div
            v-for="word in lesson.vocabularies"
            :key="word.id"
            class="flex items-center gap-4 rounded-xl border border-surface-100 p-3 dark:border-surface-800"
          >
            <Tag
              :icon="word.learned ? 'pi pi-check' : 'pi pi-book'"
              :severity="word.learned ? 'success' : 'secondary'"
              rounded
            />
            <div class="min-w-0 flex-1">
              <p class="font-semibold">
                {{ word.kanji }}
                <span class="ml-1 text-sm font-normal text-surface-500">{{
                  word.hiragana
                }}</span>
              </p>
              <p class="text-sm text-surface-500">{{ word.meaningVi }}</p>
            </div>
            <i v-if="word.favorite" class="pi pi-heart-fill text-rose-500" />
          </div>
        </div>
      </template>
    </Card>
  </div>
  <Card v-else
    ><template #content
      ><p class="p-6 text-center text-surface-500">
        Đang tải bài học…
      </p></template
    ></Card
  >
</template>
