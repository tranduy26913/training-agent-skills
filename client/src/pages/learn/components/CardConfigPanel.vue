<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Drawer from 'primevue/drawer';
import ToggleButton from 'primevue/togglebutton';
import SelectButton from 'primevue/selectbutton';
import type { CardConfig, FlipDirection } from '@/types/learn.types';

// カード設定パネル / Card display configuration panel
const visible = defineModel<boolean>('visible', { required: true });
const config = defineModel<CardConfig>('config', { required: true });

const { t } = useI18n();

const flipOptions = computed(() => [
  { label: t('learn.config.kanjiToMeaning'), value: 'kanji_to_meaning' as FlipDirection },
  { label: t('learn.config.meaningToKanji'), value: 'meaning_to_kanji' as FlipDirection },
]);
</script>

<template>
  <Drawer v-model:visible="visible" :header="t('learn.config.title')" position="right" style="width: 22rem;">
    <div class="flex flex-col gap-6 p-2">
      <!-- フリップ方向 / Flip direction -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold">{{ t('learn.config.flipDirection') }}</label>
        <SelectButton
          v-model="config.flipDirection"
          :options="flipOptions"
          option-label="label"
          option-value="value"
        />
      </div>

      <!-- 表面フィールド / Front face fields -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold">{{ t('learn.config.frontFields') }}</label>
        <div class="flex flex-col gap-2">
          <ToggleButton v-model="config.frontFields.kanji" :on-label="t('learn.config.showKanji')" :off-label="t('learn.config.hideKanji')" />
          <ToggleButton v-model="config.frontFields.hiragana" :on-label="t('learn.config.showHiragana')" :off-label="t('learn.config.hideHiragana')" />
          <ToggleButton v-model="config.frontFields.romaji" :on-label="t('learn.config.showRomaji')" :off-label="t('learn.config.hideRomaji')" />
          <ToggleButton v-model="config.frontFields.meaning_vi" :on-label="t('learn.config.showMeaning')" :off-label="t('learn.config.hideMeaning')" />
        </div>
      </div>

      <!-- 裏面フィールド / Back face fields -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold">{{ t('learn.config.backFields') }}</label>
        <div class="flex flex-col gap-2">
          <ToggleButton v-model="config.backFields.kanji" :on-label="t('learn.config.showKanji')" :off-label="t('learn.config.hideKanji')" />
          <ToggleButton v-model="config.backFields.hiragana" :on-label="t('learn.config.showHiragana')" :off-label="t('learn.config.hideHiragana')" />
          <ToggleButton v-model="config.backFields.romaji" :on-label="t('learn.config.showRomaji')" :off-label="t('learn.config.hideRomaji')" />
          <ToggleButton v-model="config.backFields.meaning_vi" :on-label="t('learn.config.showMeaning')" :off-label="t('learn.config.hideMeaning')" />
        </div>
      </div>
    </div>
  </Drawer>
</template>
