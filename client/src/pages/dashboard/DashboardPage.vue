<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useProjectsStore } from '@stores/projects.store';
import { useUsersStore } from '@stores/users.store';

interface MetricCard {
  label: string;
  value: string;
  helper: string;
  trend: string;
  trendTone: 'success' | 'info' | 'warn';
  icon: string;
  iconClass: string;
}

interface MonthlyPoint {
  month: string;
  users: number;
  projects: number;
  scripts: number;
}

interface StatusPoint {
  label: string;
  value: number;
  colorClass: string;
}

interface ActivityItem {
  title: string;
  detail: string;
  time: string;
  icon: string;
  iconClass: string;
}

const projectsStore = useProjectsStore();
const usersStore = useUsersStore();

const mockMonthlyGrowth: MonthlyPoint[] = [
  { month: 'Jan', users: 34, projects: 8, scripts: 18 },
  { month: 'Feb', users: 46, projects: 14, scripts: 28 },
  { month: 'Mar', users: 58, projects: 20, scripts: 39 },
  { month: 'Apr', users: 76, projects: 26, scripts: 51 },
  { month: 'May', users: 92, projects: 34, scripts: 66 },
  { month: 'Jun', users: 118, projects: 43, scripts: 84 },
];

const mockScriptStatus: StatusPoint[] = [
  { label: 'Generated', value: 68, colorClass: 'bg-emerald-500' },
  { label: 'Draft', value: 22, colorClass: 'bg-amber-500' },
  { label: 'Needs review', value: 10, colorClass: 'bg-sky-500' },
];

const mockUsageByModule: StatusPoint[] = [
  { label: 'Projects', value: 42, colorClass: 'bg-indigo-500' },
  { label: 'Scripts', value: 34, colorClass: 'bg-cyan-500' },
  { label: 'Users', value: 16, colorClass: 'bg-rose-500' },
  { label: 'Settings', value: 8, colorClass: 'bg-slate-500' },
];

const mockRecentActivities: ActivityItem[] = [
  {
    title: 'New script generated',
    detail: 'Summer campaign storyboard completed by AI model.',
    time: '12 min ago',
    icon: 'pi pi-sparkles',
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    title: 'Project prompt updated',
    detail: 'Brand voice guidelines were refreshed for a project.',
    time: '48 min ago',
    icon: 'pi pi-file-edit',
    iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
  },
  {
    title: 'User permissions changed',
    detail: 'A moderator account was moved back to active status.',
    time: '2 hours ago',
    icon: 'pi pi-shield',
    iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
  },
  {
    title: 'Content quality reviewed',
    detail: 'Generated scene structure passed the internal checklist.',
    time: 'Yesterday',
    icon: 'pi pi-check-circle',
    iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
  },
];

const activeUsers = computed(() => usersStore.users.filter((user) => user.status === 'active').length);
const projectCount = computed(() => projectsStore.projects.length);
const totalUsers = computed(() => usersStore.totalUsers || usersStore.users.length);
const latestProject = computed(() => {
  return [...projectsStore.projects].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null;
});

const metricCards = computed<MetricCard[]>(() => [
  {
    label: 'Total users',
    value: formatNumber(totalUsers.value || 1248),
    helper: usersStore.users.length > 0 ? `${activeUsers.value} active users` : 'Mock fallback until API has summary data',
    trend: '+12.4%',
    trendTone: 'success',
    icon: 'pi pi-users',
    iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
  },
  {
    label: 'Projects',
    value: formatNumber(projectCount.value || 86),
    helper: latestProject.value ? `Latest: ${latestProject.value.name}` : 'Project count will use live data when loaded',
    trend: '+8.1%',
    trendTone: 'info',
    icon: 'pi pi-folder',
    iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  {
    label: 'Scripts generated',
    value: '3,482',
    helper: 'Mocked until a system-wide scripts endpoint exists',
    trend: '+21.7%',
    trendTone: 'success',
    icon: 'pi pi-file-edit',
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    label: 'AI success rate',
    value: '97.3%',
    helper: 'Based on generated mock telemetry',
    trend: '-1.2%',
    trendTone: 'warn',
    icon: 'pi pi-bolt',
    iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
  },
]);

const maxMonthlyValue = computed(() => {
  return Math.max(...mockMonthlyGrowth.flatMap((item) => [item.users, item.projects, item.scripts]));
});

const systemHealth = computed(() => [
  { label: 'API availability', value: '99.98%', width: 99, tone: 'bg-emerald-500' },
  { label: 'Queue throughput', value: '84%', width: 84, tone: 'bg-blue-500' },
  { label: 'Storage usage', value: '61%', width: 61, tone: 'bg-amber-500' },
]);

onMounted(() => {
  if (projectsStore.projects.length === 0) {
    projectsStore.fetchProjects();
  }

  if (usersStore.users.length === 0) {
    usersStore.fetchUsers({ page: 1, limit: 20 });
  }
});

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function barHeight(value: number): string {
  return `${Math.max((value / maxMonthlyValue.value) * 100, 8)}%`;
}

function trendClass(tone: MetricCard['trendTone']): string {
  if (tone === 'success') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
  if (tone === 'warn') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
  return 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300';
}
</script>

<template>
  <div class="page-stack">
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard overview</h1>
        <p class="page-subtitle">
          System snapshot with live counts where available and structured mock analytics for upcoming features.
        </p>
      </div>
      <div class="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-500 shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400">
        <i class="pi pi-database text-primary-500"></i>
        Hybrid live and mock data
      </div>
    </div>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in metricCards" :key="card.label" class="surface-card p-5">
        <div class="flex items-start justify-between gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" :class="card.iconClass">
            <i :class="card.icon" class="text-lg"></i>
          </span>
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="trendClass(card.trendTone)">
            {{ card.trend }}
          </span>
        </div>
        <p class="mt-5 text-sm font-medium text-surface-500 dark:text-surface-400">{{ card.label }}</p>
        <h2 class="mt-1 text-3xl font-extrabold tracking-tight text-surface-950 dark:text-surface-50">
          {{ card.value }}
        </h2>
        <p class="mt-2 line-clamp-2 text-sm leading-6 text-surface-500 dark:text-surface-400">
          {{ card.helper }}
        </p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
      <article class="surface-card p-5">
        <div class="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-surface-950 dark:text-surface-50">Growth trend</h2>
            <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">Monthly users, projects, and generated scripts.</p>
          </div>
          <span class="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
            Mock analytics
          </span>
        </div>

        <div class="h-72">
          <div class="grid h-full grid-cols-6 items-end gap-4 border-b border-surface-200 pb-8 dark:border-surface-800">
            <div v-for="point in mockMonthlyGrowth" :key="point.month" class="flex h-full flex-col justify-end gap-2">
              <div class="flex h-full items-end justify-center gap-1.5">
                <span class="w-3 rounded-t bg-blue-500" :style="{ height: barHeight(point.users) }"></span>
                <span class="w-3 rounded-t bg-indigo-500" :style="{ height: barHeight(point.projects) }"></span>
                <span class="w-3 rounded-t bg-emerald-500" :style="{ height: barHeight(point.scripts) }"></span>
              </div>
              <span class="text-center text-xs font-medium text-surface-500">{{ point.month }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-4 text-xs font-medium text-surface-500">
          <span class="inline-flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-blue-500"></i>Users</span>
          <span class="inline-flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-indigo-500"></i>Projects</span>
          <span class="inline-flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-emerald-500"></i>Scripts</span>
        </div>
      </article>

      <article class="surface-card p-5">
        <h2 class="text-lg font-bold text-surface-950 dark:text-surface-50">Script status</h2>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">Distribution prepared for future script analytics.</p>

        <div class="mt-6 space-y-5">
          <div v-for="item in mockScriptStatus" :key="item.label">
            <div class="mb-2 flex items-center justify-between text-sm">
              <span class="font-medium text-surface-700 dark:text-surface-200">{{ item.label }}</span>
              <span class="text-surface-500">{{ item.value }}%</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
              <span class="block h-full rounded-full" :class="item.colorClass" :style="{ width: `${item.value}%` }"></span>
            </div>
          </div>
        </div>

        <div class="mt-7 rounded-xl bg-surface-50 p-4 dark:bg-surface-800/70">
          <p class="text-sm font-semibold text-surface-900 dark:text-surface-50">Next data source</p>
          <p class="mt-1 text-sm leading-6 text-surface-500 dark:text-surface-400">
            Replace this block with aggregate status counts once the backend exposes a dashboard endpoint.
          </p>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <article class="surface-card p-5">
        <h2 class="text-lg font-bold text-surface-950 dark:text-surface-50">Recent activity</h2>
        <div class="mt-5 space-y-4">
          <div v-for="item in mockRecentActivities" :key="item.title" class="flex gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl" :class="item.iconClass">
              <i :class="item.icon"></i>
            </span>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p class="font-semibold text-surface-900 dark:text-surface-50">{{ item.title }}</p>
                <span class="text-xs text-surface-400">{{ item.time }}</span>
              </div>
              <p class="mt-1 text-sm leading-6 text-surface-500 dark:text-surface-400">{{ item.detail }}</p>
            </div>
          </div>
        </div>
      </article>

      <article class="surface-card p-5">
        <h2 class="text-lg font-bold text-surface-950 dark:text-surface-50">Module usage</h2>
        <div class="mt-5 space-y-4">
          <div v-for="item in mockUsageByModule" :key="item.label" class="flex items-center gap-3">
            <span class="h-3 w-3 shrink-0 rounded-full" :class="item.colorClass"></span>
            <span class="flex-1 text-sm font-medium text-surface-700 dark:text-surface-200">{{ item.label }}</span>
            <span class="text-sm font-bold text-surface-950 dark:text-surface-50">{{ item.value }}%</span>
          </div>
        </div>
        <div class="mt-6 flex h-4 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
          <span
            v-for="item in mockUsageByModule"
            :key="`${item.label}-bar`"
            class="h-full"
            :class="item.colorClass"
            :style="{ width: `${item.value}%` }"
          ></span>
        </div>
      </article>

      <article class="surface-card p-5">
        <h2 class="text-lg font-bold text-surface-950 dark:text-surface-50">System health</h2>
        <div class="mt-5 space-y-5">
          <div v-for="item in systemHealth" :key="item.label">
            <div class="mb-2 flex items-center justify-between text-sm">
              <span class="font-medium text-surface-700 dark:text-surface-200">{{ item.label }}</span>
              <span class="font-bold text-surface-950 dark:text-surface-50">{{ item.value }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
              <span class="block h-full rounded-full" :class="item.tone" :style="{ width: `${item.width}%` }"></span>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
