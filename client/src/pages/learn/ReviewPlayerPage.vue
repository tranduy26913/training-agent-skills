<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";
import { learnerApi } from "@services/learner.service";

const route = useRoute();
const router = useRouter();
const session = ref<any>();
const revealed = ref(false);
const current = computed(() => session.value?.current);
const ratings = [
  { label: "Quên", value: 0, severity: "danger" },
  { label: "Khó", value: 1, severity: "warn" },
  { label: "Tốt", value: 2, severity: "info" },
  { label: "Dễ", value: 3, severity: "success" },
] as const;

onMounted(async () => {
  session.value = await learnerApi.reviewSession(Number(route.params.id));
});

async function rate(rating: number): Promise<void> {
  session.value = await learnerApi.rateReview(
    session.value.id,
    current.value.id,
    rating,
  );
  revealed.value = false;
  if (!session.value.current) await router.push("/learn/review");
}
</script>

<template>
  <div v-if="session" class="mx-auto max-w-2xl page-stack">
    <div class="flex justify-between text-sm text-surface-500">
      <RouterLink to="/learn/review">Thoát</RouterLink>
      <b
        >{{ Math.min(session.currentIndex + 1, session.total) }}/{{
          session.total
        }}</b
      >
    </div>
    <Card class="min-h-[25rem]">
      <template #content>
        <div class="p-8 text-center">
          <p
            class="text-sm font-bold uppercase tracking-widest text-primary-600"
          >
            {{ revealed ? "Đáp án" : "Từ cần ôn" }}
          </p>
          <h1 v-if="current" class="mt-16 text-5xl font-extrabold">
            {{
              revealed ? current.vocabulary.meaningVi : current.vocabulary.kanji
            }}
          </h1>
          <p v-if="revealed && current" class="mt-5 text-lg text-surface-500">
            {{ current.vocabulary.hiragana }}
          </p>
        </div>
      </template>
    </Card>
    <Button
      v-if="!revealed"
      label="Hiện đáp án"
      class="w-full"
      @click="revealed = true"
    />
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Button
        v-for="item in ratings"
        :key="item.value"
        :label="item.label"
        :severity="item.severity"
        outlined
        @click="rate(item.value)"
      />
    </div>
  </div>
</template>
