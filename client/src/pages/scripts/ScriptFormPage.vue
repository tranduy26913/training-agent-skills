<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useScriptsStore } from '@stores/scripts.store';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Skeleton from 'primevue/skeleton';
import Textarea from 'primevue/textarea';
import type { CreateScriptDto, GenerateScriptDto, UpdateScriptDto } from '@apptypes/scripts.types';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useScriptsStore();

const projectId = Number(route.params.projectId);
const scriptId = computed(() => (route.params.scriptId ? Number(route.params.scriptId) : null));
const isEdit = computed(() => scriptId.value !== null);
const content = ref<string>('');
const vibeText = ref('');
const aiModel = ref('');

const form = reactive({
  title: '',
  idea: '',
  characterCount: 1,
  minScenes: 1,
});

const aiModelOptions = computed(() =>
  store.aiModels.flatMap((group) =>
    group.models.map((model) => ({
      label: `${group.provider} / ${model}`,
      value: model,
    })),
  ),
);

const vibe = computed(() =>
  vibeText.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
);

onMounted(async () => {
  if (!projectId) {
    router.push({ name: 'ProjectList' });
    return;
  }

  await store.fetchAiModels();
  if (aiModelOptions.value.length > 0) {
    aiModel.value = aiModelOptions.value[0].value;
  }

  if (scriptId.value !== null) {
    await store.fetchScript(scriptId.value);
    if (!store.currentScript) {
      router.push({ name: 'ScriptList', params: { projectId } });
      return;
    }
    form.title = store.currentScript.title;
    form.idea = store.currentScript.idea;
    form.characterCount = store.currentScript.characterCount;
    form.minScenes = store.currentScript.minScenes;
    vibeText.value = store.currentScript.vibe.join(', ');
    content.value = store.currentScript.content ?? '';
  }
});

onUnmounted(() => {
  store.clearCurrentScript();
});

function validateForm(requireModel = false): string | null {
  if (form.title.trim().length < 2) return 'Title must be at least 2 characters';
  if (form.idea.trim().length < 10) return 'Idea must be at least 10 characters';
  if (form.characterCount < 1 || form.characterCount > 20) return 'Character count must be 1-20';
  if (form.minScenes < 1 || form.minScenes > 50) return 'Minimum scenes must be 1-50';
  if (vibe.value.length === 0) return 'Add at least one vibe tag';
  if (requireModel && !aiModel.value) return 'Select an AI model';
  return null;
}

function validateContentJson(): string | null {
  const trimmed = content.value.trim();
  if (!trimmed) return null;

  try {
    JSON.parse(trimmed);
    return null;
  } catch {
    return 'Script content must be valid JSON';
  }
}

function showValidationError(detail: string): void {
  toast.add({ severity: 'warn', summary: 'Validation', detail, life: 3000 });
}

function buildGeneratePayload(): GenerateScriptDto {
  return {
    title: form.title.trim(),
    idea: form.idea.trim(),
    characterCount: form.characterCount,
    minScenes: form.minScenes,
    vibe: vibe.value,
    aiModel: aiModel.value,
  };
}

async function handleGenerate() {
  const error = validateForm(true);
  if (error) {
    showValidationError(error);
    return;
  }

  try {
    const result = await store.generateScript(buildGeneratePayload());
    content.value = result.content;
    toast.add({ severity: 'success', summary: 'Success', detail: 'Script generated', life: 3000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'Generate failed', life: 3000 });
  }
}

async function handleSave() {
  const error = validateForm(false);
  if (error) {
    showValidationError(error);
    return;
  }

  const contentError = validateContentJson();
  if (contentError) {
    showValidationError(contentError);
    return;
  }

  const normalizedContent = content.value.trim() || null;
  const data = {
    title: form.title.trim(),
    idea: form.idea.trim(),
    characterCount: form.characterCount,
    minScenes: form.minScenes,
    vibe: vibe.value,
    content: normalizedContent,
  };

  try {
    if (isEdit.value && scriptId.value !== null) {
      await store.updateScript(scriptId.value, data as UpdateScriptDto);
    } else {
      await store.createScript({ ...(data as CreateScriptDto), projectId });
    }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Script saved', life: 3000 });
    router.push({ name: 'ScriptList', params: { projectId } });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'Save failed', life: 3000 });
  }
}

function handleCancel() {
  router.push({ name: 'ScriptList', params: { projectId } });
}
</script>

<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <Button label="Back" icon="pi pi-arrow-left" class="p-button-text mb-3" @click="handleCancel" />
        <h1 class="page-title">{{ isEdit ? 'Edit script' : 'Create script' }}</h1>
        <p class="page-subtitle">Generate and save JSON script content</p>
      </div>
      <div class="flex gap-2">
        <Button label="Generate" icon="pi pi-sparkles" :loading="store.generating" @click="handleGenerate" />
        <Button label="Save" icon="pi pi-save" severity="success" @click="handleSave" />
      </div>
    </div>

    <div v-if="store.loading && isEdit" class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div class="surface-card p-5">
        <Skeleton height="2rem" class="mb-4" />
        <Skeleton height="8rem" />
      </div>
      <div class="surface-card p-5">
        <Skeleton height="20rem" />
      </div>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section class="surface-card p-5">
        <div class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-semibold">Title</label>
            <InputText v-model="form.title" class="w-full" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">Idea</label>
            <Textarea v-model="form.idea" class="w-full" rows="7" />
            <p class="mt-1 text-xs text-surface-500">{{ form.idea.length }}/5000</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold">Characters</label>
              <InputNumber v-model="form.characterCount" class="w-full" input-class="w-full" :min="1" :max="20" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold">Minimum scenes</label>
              <InputNumber v-model="form.minScenes" class="w-full" input-class="w-full" :min="1" :max="50" />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">Vibe tags</label>
            <InputText v-model="vibeText" class="w-full" placeholder="funny, warm, energetic" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">AI model</label>
            <Select
              v-model="aiModel"
              :options="aiModelOptions"
              option-label="label"
              option-value="value"
              class="w-full"
              placeholder="Select AI model"
            />
          </div>
        </div>
      </section>

      <section class="surface-card p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">Script JSON</h2>
          <span class="text-xs text-surface-500">{{ content.length }}/100000</span>
        </div>
        <Skeleton v-if="store.generating" height="28rem" />
        <Textarea
          v-else
          v-model="content"
          class="min-h-[28rem] w-full font-mono text-sm"
          placeholder="Generated JSON content appears here"
        />
      </section>
    </div>
  </div>
</template>
