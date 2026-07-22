<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";
import ProgressBar from "primevue/progressbar";
import { learnerApi } from "@services/learner.service";

const route = useRoute();
const router = useRouter();
const session = ref<any>();
const revealed = ref(false);
const current = computed(() => session.value?.current);

onMounted(async () => {
  session.value = await learnerApi.flashcard(Number(route.params.id));
  revealed.value = Boolean(current.value?.revealedAt);
});

async function continueCard(): Promise<void> {
  if (!current.value) {
    await learnerApi.completeFlashcards(Number(route.params.id));
    await router.push(`/learn/lessons/${session.value.lesson.id}`);
    return;
  }

  session.value = await learnerApi.reveal(session.value.id, current.value.id);
  revealed.value = false;
}
</script>

<template>
  <div v-if="session" class="mx-auto max-w-2xl page-stack">
    <div class="flex items-center justify-between text-sm text-surface-500">
      <RouterLink :to="`/learn/lessons/${session.lesson.id}`"
        ><i class="pi pi-times mr-1" />Thoát</RouterLink
      >
      <b
        >{{ Math.min(session.currentIndex + 1, session.total) }}/{{
          session.total
        }}</b
      >
    </div>
    <ProgressBar
      :value="
        session.total ? (session.currentIndex / session.total) * 100 : 100
      "
      :show-value="false"
      class="!h-2"
    />
    <Card class="min-h-[25rem]">
      <template #content>
        <div class="p-4 text-center sm:p-8">
          <p
            class="text-sm font-bold uppercase tracking-[.2em] text-primary-600"
          >
            {{ revealed ? "Nghĩa của từ" : "Hãy nhớ từ này" }}
          </p>
          <template v-if="current">
            <h1
              class="mt-12 text-5xl font-extrabold tracking-tight text-surface-950 dark:text-white sm:text-7xl"
            >
              {{
                revealed
                  ? current.vocabulary.meaningVi
                  : current.vocabulary.kanji
              }}
            </h1>
            <template v-if="revealed">
              <p class="mt-5 text-xl text-surface-500">
                {{ current.vocabulary.hiragana }} ·
                {{ current.vocabulary.romaji }}
              </p>
              <p
                v-if="current.vocabulary.example"
                class="mx-auto mt-10 max-w-md text-left text-sm leading-6 text-surface-600"
              >
                {{ current.vocabulary.example }}
              </p>
            </template>
          </template>
          <template v-else>
            <i class="pi pi-check-circle mt-16 text-6xl text-primary-500" />
            <h1 class="mt-5 text-3xl font-extrabold">Bạn đã hoàn thành!</h1>
          </template>
        </div>
      </template>
    </Card>
    <Button
      :label="
        revealed ? (current ? 'Từ tiếp theo' : 'Hoàn thành') : 'Hiện đáp án'
      "
      icon="pi pi-arrow-right"
      icon-pos="right"
      class="w-full"
      @click="revealed ? continueCard() : (revealed = true)"
    />
  </div>
</template>
