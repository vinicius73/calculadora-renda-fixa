<script setup lang="ts">
import { useOnline } from '@vueuse/core'
import { useTheme } from '@/composables/useTheme'
import AppTooltip from '@/components/AppTooltip.vue'

const online = useOnline()
const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <header class="app-header">
    <div class="header-inner layout-container">
      <div class="header-brand">
        <span class="status-dot" :class="online ? 'status-online' : 'status-offline'"></span>
        <h1 class="header-title">Renda Fixa</h1>
        <span class="header-divider"></span>
        <span class="header-sub">Calculadora de Juros Compostos</span>
      </div>
      <div class="header-actions">
        <div v-if="!online" class="offline-badge">
          <span>sem conexão</span>
        </div>
        <AppTooltip :content="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'">
          <button class="theme-toggle interactive-square-btn" @click="toggleTheme">
            <!-- Sun icon (shown in dark mode → click to go light) -->
            <svg
              v-if="isDark"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <!-- Moon icon (shown in light mode → click to go dark) -->
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </AppTooltip>
      </div>
    </div>
    <div class="header-rule layout-container"></div>
  </header>
</template>

<style scoped>
@reference "../assets/main.css";

.app-header {
  @apply px-8 pt-7;
}

.header-inner {
  @apply flex items-center justify-between pb-5;
}

.header-brand {
  @apply flex items-center gap-3.5;
}

.status-dot {
  @apply size-[7px] shrink-0 rounded-full;
}

.status-online {
  background: #4dcf8a;
  box-shadow: 0 0 8px rgba(77, 207, 138, 0.7);
}

.status-offline {
  background: #f87c3f;
  box-shadow: 0 0 8px rgba(248, 124, 63, 0.7);
}

.header-title {
  @apply text-[1.375rem] leading-none font-bold tracking-[-0.01em] transition-colors duration-200;
  font-family: 'Playfair Display', Georgia, serif;
  color: var(--c-text);
}

.header-divider {
  @apply h-4 w-px;
  background: var(--c-divider);
  @apply transition-colors duration-200;
}

.header-sub {
  @apply text-[0.6rem] font-medium uppercase tracking-[0.18em] transition-colors duration-200;
  color: var(--c-text-muted);
}

.header-actions {
  @apply flex items-center gap-3;
}

.offline-badge {
  @apply border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em];
  color: #f87c3f;
  border-color: rgba(248, 124, 63, 0.25);
}

.theme-toggle {
  @apply size-8;
}

.header-rule {
  @apply h-px;
  background: linear-gradient(to right, var(--c-gold) 0%, var(--c-rule-fade) 40%, transparent 100%);
  @apply transition-colors duration-200;
}

@media (max-width: 720px) {
  .app-header {
    @apply px-5 pt-5;
  }
}

@media (max-width: 480px) {
  .app-header {
    @apply px-4 pt-4;
  }

  .header-inner {
    @apply pb-4;
  }

  .header-sub,
  .header-divider {
    display: none;
  }

  .theme-toggle {
    @apply size-10;
  }
}
</style>
