<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useUiStore } from "@stores/ui.store";

const { t } = useI18n();
const uiStore = useUiStore();
const { accentColor, darkMode } = storeToRefs(uiStore);
const colors = [
  { id: "sky", label: "Xanh trời", className: "bg-sky-500" },
  { id: "violet", label: "Tím", className: "bg-violet-500" },
  { id: "emerald", label: "Lục", className: "bg-emerald-500" },
  { id: "rose", label: "Hồng", className: "bg-rose-500" },
] as const;
</script>

<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ t("settings.title") }}</h2>
        <p class="page-subtitle">{{ t("settings.overview") }}</p>
      </div>
    </div>
    <div class="surface-card max-w-2xl p-6 sm:p-8">
      <div class="flex items-center gap-3">
        <div
          class="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950"
        >
          <i class="pi pi-palette"></i>
        </div>
        <div>
          <h3 class="font-bold text-surface-900 dark:text-surface-50">
            Giao diện học tập
          </h3>
          <p class="text-sm text-surface-500">
            Chọn màu giúp bạn tập trung và thoải mái hơn.
          </p>
        </div>
      </div>
      <div
        class="mt-7 flex items-center justify-between rounded-xl border border-surface-200 p-4 dark:border-surface-700"
      >
        <div>
          <p class="font-medium text-surface-800 dark:text-surface-100">
            Chế độ tối
          </p>
          <p class="text-sm text-surface-500">
            Giảm chói mắt khi học buổi tối.
          </p>
        </div>
        <ToggleSwitch
          :model-value="darkMode"
          @update:model-value="uiStore.toggleDarkMode()"
        />
      </div>
      <fieldset class="mt-7">
        <legend class="font-medium text-surface-800 dark:text-surface-100">
          Màu chủ đạo
        </legend>
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            v-for="color in colors"
            :key="color.id"
            type="button"
            class="flex items-center gap-2 rounded-xl border p-3 text-left transition hover:border-primary-400"
            :class="
              accentColor === color.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                : 'border-surface-200 dark:border-surface-700'
            "
            @click="uiStore.setAccentColor(color.id)"
          >
            <span class="h-5 w-5 rounded-full" :class="color.className"></span
            ><span class="text-sm font-medium">{{ color.label }}</span>
          </button>
        </div>
      </fieldset>
    </div>
  </div>
</template>
