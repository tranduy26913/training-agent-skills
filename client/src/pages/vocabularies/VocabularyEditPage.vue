<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { useVocabulariesStore } from '@/stores/vocabularies.store';
import VocabularyInfoTab from './components/VocabularyInfoTab.vue';
import VocabularyAuditTab from './components/VocabularyAuditTab.vue';
import VocabularyAnalyticsTab from './components/VocabularyAnalyticsTab.vue';
import type { UpdateVocabularyDto } from './composables/useVocabularies';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const vocabStore = useVocabulariesStore();

// IDをルートパラメータから取得 / Get vocabulary ID from route params
const vocabId = computed(() => Number(route.params['id']));

// マウント時に語彙情報を読み込む / Load vocabulary data on mount
onMounted(async () => {
  const id = vocabId.value;
  if (!isNaN(id) && id > 0) {
    await Promise.all([
      vocabStore.fetchVocabulary(id),
      vocabStore.fetchAuditLogs(id),
      vocabStore.fetchSimpleList(),
    ]);
  }
});

// アンマウント時にクリア / Clear current vocabulary on unmount
onUnmounted(() => {
  vocabStore.clearCurrentVocabulary();
});

// フォーム送信ハンドラ / Handle update form submit
async function handleSubmit(dto: UpdateVocabularyDto): Promise<void> {
  try {
    await vocabStore.updateVocabulary(vocabId.value, dto);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('vocab.updatedSuccess'),
      life: 3000,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('vocab.deletedError'),
      life: 3000,
    });
  }
}

// キャンセルハンドラ / Cancel and navigate back to list
function handleCancel(): void {
  router.push({ name: 'VocabularyList' });
}

// レポート解決確認 / Confirm resolve report
function handleResolveReport(reportId: number): void {
  confirm.require({
    message: t('vocab.resolveConfirm', 'このレポートを解決済みにしますか？'),
    header: t('vocab.resolve'),
    icon: 'pi pi-check-circle',
    acceptClass: 'p-button-success',
    acceptLabel: t('common.yes'),
    rejectLabel: t('common.no'),
    accept: async () => {
      try {
        await vocabStore.resolveReport(reportId);
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('vocab.resolve'), life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.error'), life: 3000 });
      }
    },
  });
}

// レポート拒否確認 / Confirm reject report
function handleRejectReport(reportId: number): void {
  confirm.require({
    message: t('vocab.rejectConfirm', 'このレポートを拒否しますか？'),
    header: t('vocab.reject'),
    icon: 'pi pi-times-circle',
    acceptClass: 'p-button-danger',
    acceptLabel: t('common.yes'),
    rejectLabel: t('common.no'),
    accept: async () => {
      try {
        await vocabStore.rejectReport(reportId);
        toast.add({ severity: 'info', summary: t('common.success'), detail: t('vocab.reject'), life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.error'), life: 3000 });
      }
    },
  });
}

// VocabularyDetailのanalyticsを安全に取得 / Safely get analytics from detail
const analytics = computed(() => {
  const v = vocabStore.currentVocabulary as any;
  return v?.analytics ?? null;
});

// VocabularyDetailのreportsを安全に取得 / Safely get reports from detail
const reports = computed(() => {
  const v = vocabStore.currentVocabulary as any;
  return v?.reports ?? [];
});
</script>

<template>
  <div data-testid="vocab-edit-page">
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100">
        {{ t('vocab.editTitle') }}
      </h2>
    </div>

    <div class="card bg-surface-0 dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
      <Tabs value="0">
        <TabList>
          <Tab value="0">{{ t('vocab.info', 'Thông tin') }}</Tab>
          <Tab value="1">{{ t('vocab.audit', 'Audit') }}</Tab>
          <Tab value="2">{{ t('vocab.analytics', 'Analytics') }}</Tab>
        </TabList>

        <TabPanels>
          <!-- Tab 1: Info -->
          <TabPanel value="0">
            <VocabularyInfoTab
              mode="edit"
              :initial-data="vocabStore.currentVocabulary"
              :loading="vocabStore.loadingVocabulary"
              :vocabulary-options="vocabStore.simpleList"
              @submit="handleSubmit"
              @cancel="handleCancel"
            />
          </TabPanel>

          <!-- Tab 2: Audit -->
          <TabPanel value="1">
            <VocabularyAuditTab
              :vocabulary="vocabStore.currentVocabulary"
              :audit-logs="vocabStore.auditLogs"
              :reports="reports"
              :loading-logs="vocabStore.loadingVocabulary"
              :loading-reports="false"
              @resolve-report="handleResolveReport"
              @reject-report="handleRejectReport"
            />
          </TabPanel>

          <!-- Tab 3: Analytics -->
          <TabPanel value="2">
            <VocabularyAnalyticsTab
              :analytics="analytics"
              :loading="vocabStore.loadingVocabulary"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>
