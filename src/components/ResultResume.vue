<script setup lang="ts">
import { computed } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import { useMoney } from '@/composables/useMoney'
import AppTooltip from '@/components/AppTooltip.vue'

const store = useCalculatorStore()
const { formatMoney } = useMoney()

const growthPct = computed(() => {
  const r = store.lastResult
  if (!r || r.accumulative === 0) return null
  return ((r.value / r.accumulative - 1) * 100).toFixed(2)
})
</script>

<template>
  <div v-if="store.lastResult" class="result-resume">
    <AppTooltip content="Valor total acumulado ao final do período = aportes + rendimentos">
      <div class="result-eyebrow eyebrow-label">
        Patrimônio Final
        <svg
          class="eyebrow-icon"
          width="10"
          height="10"
          viewBox="0 0 11 11"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
          <line
            x1="5.5"
            y1="4.8"
            x2="5.5"
            y2="7.8"
            stroke="currentColor"
            stroke-width="1.1"
            stroke-linecap="round"
          />
          <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
        </svg>
      </div>
    </AppTooltip>

    <div class="result-total-row">
      <div class="result-total">
        {{ formatMoney(store.lastResult!.value) }}
      </div>
      <AppTooltip
        v-if="growthPct"
        content="Crescimento total = (Patrimônio Final ÷ Total Investido − 1) × 100"
      >
        <span class="result-growth mono-text-ui-dense">+{{ growthPct }}%</span>
      </AppTooltip>
    </div>

    <div class="result-rule"></div>

    <div class="result-breakdown">
      <div class="result-item">
        <span class="result-item-value mono-text-ui result-item-gain">
          {{ formatMoney(store.lastResult!.tax) }}
        </span>
        <AppTooltip content="Juros acumulados ao longo do período = Patrimônio − Total Investido">
          <span class="result-item-label">
            Rendimento Total
            <svg
              class="label-icon"
              width="9"
              height="9"
              viewBox="0 0 11 11"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
              <line
                x1="5.5"
                y1="4.8"
                x2="5.5"
                y2="7.8"
                stroke="currentColor"
                stroke-width="1.1"
                stroke-linecap="round"
              />
              <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
            </svg>
          </span>
        </AppTooltip>
      </div>
      <div class="result-item">
        <span class="result-item-value mono-text-ui">
          {{ formatMoney(store.lastResult!.accumulative) }}
        </span>
        <AppTooltip content="Soma de todos os aportes realizados (inicial + mensais × meses)">
          <span class="result-item-label">
            Total Investido
            <svg
              class="label-icon"
              width="9"
              height="9"
              viewBox="0 0 11 11"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
              <line
                x1="5.5"
                y1="4.8"
                x2="5.5"
                y2="7.8"
                stroke="currentColor"
                stroke-width="1.1"
                stroke-linecap="round"
              />
              <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
            </svg>
          </span>
        </AppTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../assets/main.css";

.result-resume {
  @apply mb-12;
}

.result-eyebrow {
  @apply mb-3 inline-flex cursor-default items-center gap-[0.3rem] tracking-[0.2em];
  color: var(--c-text-muted);
}

.result-eyebrow:hover {
  color: var(--c-text-secondary);
}

.eyebrow-icon {
  @apply shrink-0 opacity-50 transition-opacity duration-150;
}

.result-eyebrow:hover .eyebrow-icon {
  opacity: 0.9;
}

.result-total-row {
  @apply mb-6 flex items-baseline gap-4;
}

.result-total {
  @apply text-[clamp(2.25rem,4.5vw,3.75rem)] leading-none font-bold tracking-[-0.02em] transition-colors duration-200;
  font-family: 'Playfair Display', Georgia, serif;
  color: var(--c-gold-bright);
  animation: ember-pulse 3.5s ease-in-out infinite;
}

.result-growth {
  @apply cursor-default whitespace-nowrap text-[0.75rem] font-medium;
  color: var(--c-green);
}

.result-rule {
  @apply mb-6 h-px transition-colors duration-200;
  background: linear-gradient(to right, var(--c-rule-subtle), transparent);
}

.result-breakdown {
  @apply grid grid-cols-2 gap-6;
}

.result-item {
  @apply flex flex-col gap-[0.3rem];
}

.result-item-value {
  @apply text-base font-medium tracking-[0.01em];
  color: var(--c-text-secondary);
}

.result-item-gain {
  color: var(--c-green);
}

.result-item-label {
  @apply inline-flex cursor-default items-center gap-1 text-[0.58rem] uppercase tracking-[0.14em] transition-colors duration-200;
  color: var(--c-text-dim);
  font-family: 'DM Sans', system-ui, sans-serif;
}

.result-item-label:hover {
  color: var(--c-text-muted);
}

.label-icon {
  @apply shrink-0 opacity-[0.45] transition-opacity duration-150;
}

.result-item-label:hover .label-icon {
  opacity: 0.85;
}
</style>
