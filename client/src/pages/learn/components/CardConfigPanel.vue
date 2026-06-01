<script setup lang="ts">
import Drawer from 'primevue/drawer';
import ToggleButton from 'primevue/togglebutton';
import SelectButton from 'primevue/selectbutton';
import type { CardConfig, FlipDirection } from '@/types/learn.types';

// カード設定パネル / Card display configuration panel
const visible = defineModel<boolean>('visible', { required: true });
const config = defineModel<CardConfig>('config', { required: true });

const flipOptions = [
  { label: '漢字 → 意味', value: 'kanji_to_meaning' as FlipDirection },
  { label: '意味 → 漢字', value: 'meaning_to_kanji' as FlipDirection },
];
</script>

<template>
  <Drawer v-model:visible="visible" header="カード設定 / Card Settings" position="right" style="width: 22rem;">
    <div class="flex flex-col gap-6 p-2">
      <!-- フリップ方向 / Flip direction -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold">フリップ方向 / Flip Direction</label>
        <SelectButton
          v-model="config.flipDirection"
          :options="flipOptions"
          option-label="label"
          option-value="value"
        />
      </div>

      <!-- 表面フィールド / Front face fields -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold">表面 / Front Fields</label>
        <div class="flex flex-col gap-2">
          <ToggleButton v-model="config.frontFields.kanji" on-label="漢字 表示" off-label="漢字 非表示" />
          <ToggleButton v-model="config.frontFields.hiragana" on-label="ひらがな 表示" off-label="ひらがな 非表示" />
          <ToggleButton v-model="config.frontFields.romaji" on-label="ローマ字 表示" off-label="ローマ字 非表示" />
          <ToggleButton v-model="config.frontFields.meaning_vi" on-label="意味 表示" off-label="意味 非表示" />
        </div>
      </div>

      <!-- 裏面フィールド / Back face fields -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold">裏面 / Back Fields</label>
        <div class="flex flex-col gap-2">
          <ToggleButton v-model="config.backFields.kanji" on-label="漢字 表示" off-label="漢字 非表示" />
          <ToggleButton v-model="config.backFields.hiragana" on-label="ひらがな 表示" off-label="ひらがな 非表示" />
          <ToggleButton v-model="config.backFields.romaji" on-label="ローマ字 表示" off-label="ローマ字 非表示" />
          <ToggleButton v-model="config.backFields.meaning_vi" on-label="意味 表示" off-label="意味 非表示" />
        </div>
      </div>
    </div>
  </Drawer>
</template>
