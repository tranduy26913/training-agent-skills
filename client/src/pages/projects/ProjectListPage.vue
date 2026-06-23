<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectsStore } from '@stores/projects.store';
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
  <div class="p-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
        Quản lý Project
      </h1>
      <Button
        label="Tạo Project"
        icon="pi pi-plus"
        @click="handleCreateClick"
      />
    </div>

    <!-- Loading State -->
    <div
      v-if="store.loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="bg-surface-0 dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 p-4"
      >
        <Skeleton class="mb-3" height="20px" width="60%" />
        <Skeleton class="mb-2" height="14px" width="80%" />
        <Skeleton class="mb-2" height="14px" width="40%" />
        <Skeleton height="12px" width="30%" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="store.projects.length === 0"
      class="flex flex-col items-center justify-center py-16 text-surface-400 dark:text-surface-500"
    >
      <i class="pi pi-folder-open text-6xl mb-4"></i>
      <p class="text-lg mb-4">Chưa có Project nào</p>
      <Button
        label="Tạo Project"
        icon="pi pi-plus"
        @click="handleCreateClick"
      />
    </div>

    <!-- Card Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
