<script setup lang="ts">
/**
 * RetrievalSourceViewer — 引用ソースビューア
 * Displays collapsible source citations using PrimeVue Accordion
 */
import { useI18n } from 'vue-i18n';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import type { ChatSource } from '@/types/notebooklm.types';

// プロップス / Props
defineProps<{
  sources: ChatSource[];
}>();

const { t } = useI18n();
</script>

<template>
  <!-- ソースアコーディオン / Collapsible source list -->
  <Accordion class="mt-1">
    <AccordionPanel value="sources">
      <AccordionHeader>
        <span class="text-xs font-medium">{{ t('notebooklmChat.sources') }} ({{ sources.length }})</span>
      </AccordionHeader>
      <AccordionContent>
        <ul class="space-y-2">
          <li
            v-for="(source, index) in sources"
            :key="index"
            class="rounded border border-surface-200 p-2 text-xs dark:border-surface-600"
          >
            <!-- ファイル名 / Source filename -->
            <p class="font-semibold text-surface-700 dark:text-surface-200">{{ source.filename }}</p>
            <!-- スニペット / Text snippet -->
            <p class="mt-1 text-surface-500 dark:text-surface-400 line-clamp-3">{{ source.snippet }}</p>
          </li>
        </ul>
      </AccordionContent>
    </AccordionPanel>
  </Accordion>
</template>
