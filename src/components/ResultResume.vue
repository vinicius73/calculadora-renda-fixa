<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import { useMoney } from '@/composables/useMoney'
import { useIRConfig } from '@/composables/useIRConfig'
import AppTooltip from '@/components/AppTooltip.vue'
import IRConfigModal from '@/components/IRConfigModal.vue'

const store = useCalculatorStore()
const { formatMoney } = useMoney()
const { enabled: irEnabled, applyIR } = useIRConfig()

const irModalOpen = ref(false)

// ── Simulation mode ─────────────────────────────────────────────

const simIR = computed(() => {
  const r = store.lastResult
  if (!r) return null
  return applyIR(r.value, r.accumulative, store.entry.period)
})

const simDisplayValue = computed(() => {
  const r = store.lastResult
  if (!r) return 0
  return simIR.value?.netValue ?? r.value
})

const simGrowthPct = computed(() => {
  const r = store.lastResult
  if (!r || r.accumulative === 0) return null
  return ((simDisplayValue.value / r.accumulative - 1) * 100).toFixed(2)
})

// ── Goal mode ────────────────────────────────────────────────────
// Fully reactive — does not depend on lastResult.
// The monthly table (lastResult) updates only when "Calcular" is clicked.

const goalBreakdown = computed(() => {
  if (!store.goalMode || store.goalTarget <= 0 || store.goalResult <= 0) return null

  const pmt = store.goalResult
  const totalInvested = store.entry.initialValue + pmt * store.entry.period
  const grossEarnings = store.goalTarget - totalInvested
  const { irAmount, netValue, irRate } = applyIR(
    store.goalTarget,
    totalInvested,
    store.entry.period,
  )

  return { pmt, totalInvested, grossEarnings, irAmount, netValue, irRate }
})

// ── Visibility ───────────────────────────────────────────────────

const showResults = computed(
  () => !!store.lastResult || (store.goalMode && store.goalTarget > 0 && store.goalResult > 0),
)
</script>

<template>
  <div v-if="showResults" class="result-resume">
    <!-- ── GOAL MODE ─────────────────────────────────────────── -->
    <template v-if="store.goalMode && goalBreakdown">
      <div class="result-header-row">
        <AppTooltip content="Aporte mensal necessário para atingir o patrimônio alvo no prazo informado">
          <div class="result-eyebrow eyebrow-label">
            Aporte Necessário
            <svg class="eyebrow-icon" width="10" height="10" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
              <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
              <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
            </svg>
          </div>
        </AppTooltip>

        <button
          type="button"
          class="ir-config-btn mono-text-ui-dense"
          :class="{ 'ir-active': irEnabled }"
          :title="irEnabled ? `IR ${goalBreakdown.irRate}% ativo — clique para configurar` : 'Configurar IR'"
          @click="irModalOpen = true"
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="2.5" stroke="currentColor" stroke-width="1.4" />
            <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <span v-if="irEnabled">IR {{ goalBreakdown.irRate }}%</span>
          <span v-else>IR</span>
        </button>
      </div>

      <div class="result-total-row">
        <div class="result-total">
          {{ formatMoney(goalBreakdown.pmt) }}
          <span class="result-total-unit mono-text-ui-dense">/mês</span>
        </div>
      </div>

      <div class="goal-context mono-text-ui-dense">
        para atingir {{ formatMoney(store.goalTarget) }} em {{ store.entry.period }} meses
      </div>

      <div class="result-rule" />

      <div class="result-breakdown" :class="{ 'has-ir': irEnabled && goalBreakdown.irAmount > 0 }">
        <div class="result-item">
          <span class="result-item-value mono-text-ui">
            {{ formatMoney(goalBreakdown.totalInvested) }}
          </span>
          <AppTooltip content="Soma de todos os aportes: aporte inicial + (aporte mensal × meses)">
            <span class="result-item-label">
              Total a Investir
              <svg class="label-icon" width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
                <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
                <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
              </svg>
            </span>
          </AppTooltip>
        </div>

        <div class="result-item">
          <span class="result-item-value mono-text-ui result-item-gain">
            {{ formatMoney(goalBreakdown.grossEarnings) }}
          </span>
          <AppTooltip content="Rendimento bruto esperado = Patrimônio alvo − Total a investir">
            <span class="result-item-label">
              Rendimento Esperado
              <svg class="label-icon" width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
                <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
                <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
              </svg>
            </span>
          </AppTooltip>
        </div>

        <Transition name="hint">
          <div v-if="irEnabled && goalBreakdown.irAmount > 0" class="result-item result-item-ir-row">
            <div class="result-item">
              <span class="result-item-value mono-text-ui result-item-deduction">
                −{{ formatMoney(goalBreakdown.irAmount) }}
              </span>
              <AppTooltip :content="`IR de ${goalBreakdown.irRate}% sobre o rendimento bruto`">
                <span class="result-item-label">
                  IR Descontado
                  <svg class="label-icon" width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                    <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
                    <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
                    <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
                  </svg>
                </span>
              </AppTooltip>
            </div>
            <div class="result-item">
              <span class="result-item-value mono-text-ui">
                {{ formatMoney(goalBreakdown.netValue) }}
              </span>
              <AppTooltip content="Patrimônio líquido após desconto do IR">
                <span class="result-item-label">
                  Patrimônio Líquido
                  <svg class="label-icon" width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                    <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
                    <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
                    <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
                  </svg>
                </span>
              </AppTooltip>
            </div>
          </div>
        </Transition>
      </div>
    </template>

    <!-- ── SIMULATION MODE ──────────────────────────────────── -->
    <template v-else-if="store.lastResult">
      <div class="result-header-row">
        <AppTooltip
          :content="
            irEnabled
              ? 'Patrimônio final após desconto do Imposto de Renda sobre o rendimento'
              : 'Valor total acumulado ao final do período = aportes + rendimentos'
          "
        >
          <div class="result-eyebrow eyebrow-label">
            {{ irEnabled ? 'Patrimônio Líquido' : 'Patrimônio Final' }}
            <svg class="eyebrow-icon" width="10" height="10" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
              <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
              <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
            </svg>
          </div>
        </AppTooltip>

        <button
          type="button"
          class="ir-config-btn mono-text-ui-dense"
          :class="{ 'ir-active': irEnabled }"
          :title="irEnabled ? `IR ${simIR?.irRate}% ativo — clique para configurar` : 'Configurar IR'"
          @click="irModalOpen = true"
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="2.5" stroke="currentColor" stroke-width="1.4" />
            <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <span v-if="irEnabled && simIR">IR {{ simIR.irRate }}%</span>
          <span v-else>IR</span>
        </button>
      </div>

      <div class="result-total-row">
        <div class="result-total">
          {{ formatMoney(simDisplayValue) }}
        </div>
        <AppTooltip
          v-if="simGrowthPct"
          content="Crescimento total = (Patrimônio ÷ Total Investido − 1) × 100"
        >
          <span class="result-growth mono-text-ui-dense">+{{ simGrowthPct }}%</span>
        </AppTooltip>
      </div>

      <Transition name="hint">
        <div v-if="irEnabled && simIR" class="result-gross-hint mono-text-ui-dense">
          bruto: {{ formatMoney(store.lastResult.value) }}
        </div>
      </Transition>

      <div class="result-rule" />

      <div class="result-breakdown" :class="{ 'has-ir': irEnabled && simIR && simIR.irAmount > 0 }">
        <div class="result-item">
          <span class="result-item-value mono-text-ui result-item-gain">
            {{ formatMoney(store.lastResult.tax) }}
          </span>
          <AppTooltip content="Juros acumulados ao longo do período = Patrimônio − Total Investido">
            <span class="result-item-label">
              Rendimento Bruto
              <svg class="label-icon" width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
                <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
                <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
              </svg>
            </span>
          </AppTooltip>
        </div>
        <div class="result-item">
          <span class="result-item-value mono-text-ui">
            {{ formatMoney(store.lastResult.accumulative) }}
          </span>
          <AppTooltip content="Soma de todos os aportes realizados (inicial + mensais × meses)">
            <span class="result-item-label">
              Total Investido
              <svg class="label-icon" width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
                <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
                <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
              </svg>
            </span>
          </AppTooltip>
        </div>
        <Transition name="hint">
          <div v-if="irEnabled && simIR && simIR.irAmount > 0" class="result-item result-item-ir">
            <span class="result-item-value mono-text-ui result-item-deduction">
              −{{ formatMoney(simIR.irAmount) }}
            </span>
            <AppTooltip :content="`IR de ${simIR.irRate}% aplicado sobre o rendimento bruto`">
              <span class="result-item-label">
                IR Descontado
                <svg class="label-icon" width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9" />
                  <line x1="5.5" y1="4.8" x2="5.5" y2="7.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
                  <circle cx="5.5" cy="3.2" r="0.55" fill="currentColor" />
                </svg>
              </span>
            </AppTooltip>
          </div>
        </Transition>
      </div>
    </template>
  </div>

  <IRConfigModal v-if="irModalOpen" @close="irModalOpen = false" />
</template>

<style scoped>
@reference "../assets/main.css";

.result-resume {
  @apply mb-12;
}

/* ── Header row ── */

.result-header-row {
  @apply mb-3 flex items-center gap-3;
}

.result-eyebrow {
  @apply inline-flex cursor-default items-center gap-[0.3rem] tracking-[0.2em];
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

.ir-config-btn {
  @apply ml-auto flex cursor-pointer items-center gap-[0.3rem] border-none bg-transparent px-2 py-[0.25rem] text-[0.58rem] uppercase tracking-[0.12em] transition-colors duration-150;
  color: var(--c-text-faint);
  border: 1px solid var(--c-border);
}

.ir-config-btn:hover {
  color: var(--c-text-secondary);
  border-color: var(--c-text-muted);
}

.ir-config-btn.ir-active {
  color: var(--c-gold);
  border-color: color-mix(in srgb, var(--c-gold) 40%, transparent);
  background: color-mix(in srgb, var(--c-gold) 8%, transparent);
}

/* ── Main value ── */

.result-total-row {
  @apply mb-2 flex items-baseline gap-4;
}

.result-total {
  @apply text-[clamp(2.25rem,4.5vw,3.75rem)] leading-none font-bold tracking-[-0.02em] transition-colors duration-200;
  font-family: 'Playfair Display', Georgia, serif;
  color: var(--c-gold-bright);
  animation: ember-pulse 3.5s ease-in-out infinite;
}

.result-total-unit {
  @apply text-[0.7rem] font-normal tracking-[0.04em] opacity-70;
  font-family: 'IBM Plex Mono', monospace;
}

.result-growth {
  @apply cursor-default whitespace-nowrap text-[0.75rem] font-medium;
  color: var(--c-green);
}

/* ── Goal context ── */

.goal-context {
  @apply mb-4 text-[0.65rem];
  color: var(--c-text-secondary);
}

/* ── Gross hint (sim mode with IR) ── */

.result-gross-hint {
  @apply mb-4 text-[0.65rem];
  color: var(--c-text-faint);
}

/* ── Rule ── */

.result-rule {
  @apply mb-6 h-px transition-colors duration-200;
  background: linear-gradient(to right, var(--c-rule-subtle), transparent);
}

/* Add spacing when no hint is shown above rule */
.result-resume:not(:has(.goal-context)):not(:has(.result-gross-hint)) .result-rule {
  @apply mt-6;
}

/* ── Breakdown ── */

.result-breakdown {
  @apply grid grid-cols-2 gap-6;
}

.result-item {
  @apply flex flex-col gap-[0.3rem];
}

/* IR row in sim mode */
.result-item-ir {
  @apply col-span-2 mt-1 border-t pt-3;
  border-color: var(--c-border);
}

/* IR row in goal mode: two items side by side */
.result-item-ir-row {
  @apply col-span-2 mt-1 grid grid-cols-2 gap-6 border-t pt-3;
  border-color: var(--c-border);
}

.result-item-value {
  @apply text-base font-medium tracking-[0.01em];
  color: var(--c-text-secondary);
}

.result-item-gain {
  color: var(--c-green);
}

.result-item-deduction {
  color: var(--c-text-muted);
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

/* ── Hint transition ── */

.hint-enter-active,
.hint-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
