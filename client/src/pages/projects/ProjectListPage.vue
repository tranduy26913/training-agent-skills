<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectsStore } from '@stores/projects.store';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import ProjectCard from './components/ProjectCard.vue';
import ProjectFormDialog from './components/ProjectFormDialog.vue';
import ProjectDeleteDialog from './components/ProjectDeleteDialog.vue';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@apptypes/projects.types';

const router = useRouter();
const store = useProjectsStore();

// Dialog state
const showFormDialog = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const selectedProject = ref<Project | null>(null);
const showDeleteDialog = ref(false);
const deleteProjectName = ref('');
const deleteProjectId = ref<number | null>(null);

onMounted(async () => {
  await store.fetchProjects();
});

function handleCardClick(id: number) {
  router.push({ name: 'ProjectDetail', params: { id } });
}

function handleCreateClick() {
  formMode.value = 'create';
  selectedProject.value = null;
  showFormDialog.value = true;
}

function handleEditClick(id: number) {
  const project = store.projects.find((p) => p.id === id);
  if (!project) return;
  formMode.value = 'edit';
  selectedProject.value = project;
  showFormDialog.value = true;
}

function handleDeleteClick(id: number) {
  const project = store.projects.find((p) => p.id === id);
  if (!project) return;
  deleteProjectName.value = project.name;
  deleteProjectId.value = id;
  showDeleteDialog.value = true;
}

async function handleFormSaved(data: CreateProjectDto | UpdateProjectDto) {
  try {
    if (formMode.value === 'create') {
      await store.createProject(data as CreateProjectDto);
    } else if (selectedProject.value) {
      await store.updateProject(selectedProject.value.id, data as UpdateProjectDto);
    }
    showFormDialog.value = false;
    await store.fetchProjects();
  } catch {
    // Error handled by store
  }
}

function handleFormClosed() {
  showFormDialog.value = false;
}

async function handleDeleteConfirmed() {
  if (deleteProjectId.value === null) return;
  try {
    await store.deleteProject(deleteProjectId.value);
    showDeleteDialog.value = false;
    deleteProjectId.value = null;
  } catch {
    // Error handled by store
  }
}

function handleDeleteCancelled() {
  showDeleteDialog.value = false;
  deleteProjectId.value = null;
}
</script>

<template>
  <div class="page-stack">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('projects.list.pageTitle') }}</h1>
        <p class="page-subtitle">{{ $t('projects.title') }}</p>
      </div>
      <Button
        :label="$t('projects.list.createButton')"
        icon="pi pi-plus"
        @click="handleCreateClick"
      />
    </div>

    <!-- Keep the page structure stable while the global loading layer is visible. -->
    <div v-if="store.loading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <div v-for="i in 4" :key="i" class="surface-card p-5">
        <Skeleton class="mb-4" height="1.25rem" width="60%" />
        <Skeleton class="mb-2" height="0.875rem" width="85%" />
        <Skeleton class="mb-2" height="0.875rem" width="45%" />
        <Skeleton class="mt-8" height="0.75rem" width="30%" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!store.loading && store.projects.length === 0"
      class="surface-card flex flex-col items-center justify-center px-6 py-20 text-surface-400 dark:text-surface-500"
    >
      <i class="pi pi-folder-open text-6xl mb-4"></i>
      <p class="text-lg mb-4">{{ $t('projects.list.empty') }}</p>
      <Button
        :label="$t('projects.list.createButton')"
        icon="pi pi-plus"
        @click="handleCreateClick"
      />
    </div>

    <!-- Card Grid -->
    <div
      v-else-if="!store.loading"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      <ProjectCard
        v-for="project in store.projects"
        :key="project.id"
        :project="project"
        @click="handleCardClick"
        @edit="handleEditClick"
        @delete="handleDeleteClick"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <ProjectFormDialog
      :visible="showFormDialog"
      :mode="formMode"
      :project="selectedProject"
      @saved="handleFormSaved"
      @closed="handleFormClosed"
    />

    <!-- Delete Dialog -->
    <ProjectDeleteDialog
      :visible="showDeleteDialog"
      :project-name="deleteProjectName"
      @confirmed="handleDeleteConfirmed"
      @cancelled="handleDeleteCancelled"
    />
  </div>
</template>
