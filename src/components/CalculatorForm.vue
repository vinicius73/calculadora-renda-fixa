<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useCalculatorStore } from '@/stores/calculator'
import AppTooltip from '@/components/AppTooltip.vue'
import { TaxPeriod, RateSource, toAnnualRate, toMonthlyRate } from '@/lib/taxRate'
import { useCalculatorUrlSync } from '@/composables/useCalculatorUrlSync'
import {
  INDEX_KEYS,
  DEFAULT_INDICES,
  calculateEffectiveAnnualRate,
  type IndexKey,
} from '@/lib/indices'
import { useIndices } from '@/composables/useIndices'
import InfoIcon from '@/components/InfoIcon.vue'

const store = useCalculatorStore()
const { entry, goalMode, goalTarget } = storeToRefs(store)

// ── Interest rate with period toggle ────────────────────────────

const taxPeriod = ref<TaxPeriod>(TaxPeriod.Annual)

const taxDisplay = computed({
  get(): number {
    const raw =
      taxPeriod.value === TaxPeriod.Monthly
        ? store.entry.monthlyTax
        : toAnnualRate(store.entry.monthlyTax)
    return parseFloat(raw.toFixed(10))
  },
  set(val: number) {
    if (isNaN(val)) return
    const monthly = taxPeriod.value === TaxPeriod.Monthly ? val : toMonthlyRate(val)
    store.setEntry({ monthlyTax: monthly })
  },
})

// Flips display mode; computed getter re-derives the equivalent rate automatically
function switchPeriod(period: TaxPeriod) {
  if (period === taxPeriod.value) return
  taxPeriod.value = period
}

// Equivalent rate shown as contextual hint below the field
const taxHint = computed(() => {
  if (isNaN(taxDisplay.value) || taxDisplay.value <= 0) return null
  if (taxPeriod.value === TaxPeriod.Monthly) {
    return `≡ ${toAnnualRate(taxDisplay.value).toFixed(2)}% ao ano`
  } else {
    return `≡ ${toMonthlyRate(taxDisplay.value).toFixed(4)}% ao mês`
  }
})

// ── Index rate mode ────────────────────────────────────────────

const rateSource = ref<RateSource>(RateSource.Fixed)
const selectedIndex = ref<IndexKey>('CDI')
const indexMultiplier = ref<number>(100)

useCalculatorUrlSync({ taxPeriod, rateSource, selectedIndex, indexMultiplier })

const editingIndexRate = ref(false)
const editableIndexRate = ref<number>(0)
const indexRateInputRef = ref<HTMLInputElement | null>(null)

const { indices, updateRate } = useIndices()

const currentIndexEntry = computed(() => indices.value[selectedIndex.value])

const indexEffectiveAnnualRate = computed(() =>
  calculateEffectiveAnnualRate(currentIndexEntry.value.annualRate, indexMultiplier.value),
)

const indexEffectiveHint = computed(() => {
  const annual = indexEffectiveAnnualRate.value
  if (isNaN(annual) || annual <= 0) return null
  const monthly = toMonthlyRate(annual)
  return `≡ ${monthly.toFixed(4)}% a.m. / ${annual.toFixed(2)}% a.a. (efetivo)`
})

// Sync effective rate to store whenever index mode inputs change
watch([indexEffectiveAnnualRate, rateSource], ([annual, source]) => {
  if (source !== RateSource.Index || isNaN(annual) || annual <= 0) return
  const next = toMonthlyRate(annual)
  if (Math.abs(next - store.entry.monthlyTax) < 0.0001) return
  store.setEntry({ monthlyTax: next })
})

function setRateSource(source: RateSource) {
  rateSource.value = source
  // When switching to index mode, immediately apply effective rate to store
  if (source === RateSource.Index) {
    const annual = indexEffectiveAnnualRate.value
    if (!isNaN(annual) && annual > 0) {
      store.setEntry({ monthlyTax: toMonthlyRate(annual) })
    }
  }
}

function startEditIndexRate() {
  editableIndexRate.value = currentIndexEntry.value.annualRate
  editingIndexRate.value = true
  nextTick(() => indexRateInputRef.value?.focus())
}

function saveIndexRate() {
  updateRate(selectedIndex.value, editableIndexRate.value)
  editingIndexRate.value = false
}

function cancelEditIndexRate() {
  editingIndexRate.value = false
}

// Detects if user manually overrode the current index base rate
const isCurrentIndexCustom = computed(() => {
  const defaultRate = DEFAULT_INDICES[selectedIndex.value].annualRate
  return Math.abs(currentIndexEntry.value.annualRate - defaultRate) > 0.0001
})

function resetCurrentIndex() {
  updateRate(selectedIndex.value, DEFAULT_INDICES[selectedIndex.value].annualRate)
}
</script>

<template>
  <div class="form-wrap">
    <div class="form-eyebrow">
      <span class="form-tag eyebrow-label">Parâmetros</span>
      <div class="mode-toggle" role="group" aria-label="Modo de cálculo">
        <button
          type="button"
          class="mode-btn mono-text-ui-dense"
          :class="{ 'mode-active': !goalMode }"
          @click="goalMode = false"
        >
          Simular
        </button>
        <button
          type="button"
          class="mode-btn mono-text-ui-dense"
          :class="{ 'mode-active': goalMode }"
          @click="goalMode = true"
        >
          Meta
        </button>
      </div>
    </div>

    <div class="form-fields">
      <div class="field">
        <div class="field-label-row">
          <span class="field-label">Aporte inicial</span>
          <AppTooltip content="Valor aplicado no início do investimento">
            <span class="info-icon" tabindex="-1" aria-label="Ajuda">
              <InfoIcon />
            </span>
          </AppTooltip>
        </div>
        <label class="field-input-row">
          <span class="field-affix mono-text-ui-dense">R$</span>
          <input v-model.number="entry.initialValue" inputmode="numeric" type="number" min="0" />
        </label>
      </div>

      <!-- Aporte mensal (modo simular) / Patrimônio alvo (modo meta) -->
      <div class="field">
        <div class="field-label-row">
          <span class="field-label">{{ goalMode ? 'Patrimônio Alvo' : 'Aporte mensal' }}</span>
          <AppTooltip
            :content="
              goalMode
                ? 'Valor que deseja acumular ao final do período'
                : 'Valor adicionado ao investimento todo mês'
            "
          >
            <span class="info-icon" tabindex="-1" aria-label="Ajuda">
              <InfoIcon />
            </span>
          </AppTooltip>
        </div>
        <label class="field-input-row">
          <span class="field-affix mono-text-ui-dense">R$</span>
          <input
            v-if="goalMode"
            v-model.number="goalTarget"
            inputmode="numeric"
            type="number"
            min="0"
          />
          <input
            v-else
            v-model.number="entry.monthlyValue"
            inputmode="numeric"
            type="number"
            min="0"
          />
        </label>
      </div>

      <!-- ── Interest rate ── -->
      <div class="field rate-field">
        <!-- Header row: label + source tabs -->
        <div class="rate-header">
          <div class="field-label-row">
            <span class="field-label">Taxa de Juros</span>
            <AppTooltip
              content="Taxa de retorno do investimento. Use taxa fixa ou calcule com base em um índice (CDI, Selic, IPCA)"
            >
              <span class="info-icon" tabindex="-1" aria-label="Ajuda">
                <InfoIcon />
              </span>
            </AppTooltip>
          </div>
          <div class="rate-source-tabs" role="group" aria-label="Fonte da taxa">
            <button
              type="button"
              class="rst-tab mono-text-ui-dense"
              :class="{ 'rst-active': rateSource === RateSource.Fixed }"
              @click="setRateSource(RateSource.Fixed)"
            >
              Fixa
            </button>
            <button
              type="button"
              class="rst-tab mono-text-ui-dense"
              :class="{ 'rst-active': rateSource === RateSource.Index }"
              @click="setRateSource(RateSource.Index)"
            >
              % Índice
            </button>
          </div>
        </div>

        <!-- Fixed rate -->
        <template v-if="rateSource === RateSource.Fixed">
          <label class="field-input-row">
            <input
              v-model.number="taxDisplay"
              inputmode="decimal"
              type="number"
              step="any"
              min="0"
            />
            <span class="field-affix mono-text-ui-dense">%</span>
            <div class="period-toggle" role="group" aria-label="Período da taxa">
              <button
                type="button"
                class="period-btn mono-text-ui-dense"
                :class="{ 'period-active': taxPeriod === TaxPeriod.Monthly }"
                @click="switchPeriod(TaxPeriod.Monthly)"
              >
                a.m.
              </button>
              <button
                type="button"
                class="period-btn mono-text-ui-dense"
                :class="{ 'period-active': taxPeriod === TaxPeriod.Annual }"
                @click="switchPeriod(TaxPeriod.Annual)"
              >
                a.a.
              </button>
            </div>
          </label>
          <Transition name="hint">
            <span v-if="taxHint" class="tax-hint mono-text-ui">{{ taxHint }}</span>
          </Transition>
        </template>

        <!-- Index rate mode -->
        <template v-else>
          <!-- Index selector chips -->
          <div class="index-chips" role="group" aria-label="Índice de referência">
            <button
              v-for="key in INDEX_KEYS"
              :key="key"
              type="button"
              class="index-chip"
              :class="{ 'chip-active': selectedIndex === key }"
              @click="selectedIndex = key"
            >
              <span class="chip-name mono-text-ui-dense">{{ indices[key].label }}</span>
              <span class="chip-rate mono-text-ui-dense"
                >{{ indices[key].annualRate.toFixed(2) }}%</span
              >
            </button>
          </div>

          <!-- Multiplier formula: CDI × ___% = X% a.a. -->
          <div class="index-formula-row">
            <span class="formula-label mono-text-ui-dense">{{ currentIndexEntry.label }}</span>
            <span class="formula-op mono-text-ui-dense">×</span>
            <label class="formula-input-wrap">
              <input
                v-model.number="indexMultiplier"
                inputmode="decimal"
                type="number"
                step="any"
                min="0"
                class="formula-input mono-text-ui-dense"
              />
              <span class="formula-pct mono-text-ui-dense">%</span>
            </label>
            <span class="formula-eq mono-text-ui-dense">=</span>
            <span class="formula-result mono-text-ui-dense">
              {{ indexEffectiveAnnualRate.toFixed(2) }}% a.a.
            </span>
          </div>

          <!-- Base rate info with inline edit -->
          <div class="index-base-row">
            <span class="index-base-label mono-text-ui-dense">base:</span>
            <template v-if="!editingIndexRate">
              <button
                type="button"
                class="index-rate-btn mono-text-ui-dense"
                title="Clique para editar a taxa base"
                @click="startEditIndexRate"
              >
                {{ currentIndexEntry.annualRate.toFixed(2) }}% a.a.
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path
                    d="M7 1.5l1.5 1.5L3 8.5H1.5V7L7 1.5z"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <template v-if="isCurrentIndexCustom">
                <span class="index-custom-tag mono-text-ui-dense">editado</span>
                <button
                  type="button"
                  class="index-reset-btn"
                  title="Restaurar valor padrão"
                  @click="resetCurrentIndex"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path
                      d="M10 6a4 4 0 1 1-1.17-2.83M10 2v3H7"
                      stroke="currentColor"
                      stroke-width="1.3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </template>
              <span v-else class="index-ref mono-text-ui-dense">{{
                currentIndexEntry.reference
              }}</span>
            </template>
            <template v-else>
              <input
                ref="indexRateInputRef"
                v-model.number="editableIndexRate"
                type="number"
                inputmode="decimal"
                step="any"
                class="index-rate-edit-input mono-text-ui-dense"
                @blur="saveIndexRate"
                @keydown.enter="saveIndexRate"
                @keydown.escape="cancelEditIndexRate"
              />
              <span class="field-affix mono-text-ui-dense">% a.a.</span>
              <span class="index-edit-hint mono-text-ui-dense">↵ · esc</span>
            </template>
          </div>

          <Transition name="hint">
            <span v-if="indexEffectiveHint" class="tax-hint mono-text-ui">
              {{ indexEffectiveHint }}
            </span>
          </Transition>
        </template>
      </div>

      <div class="field">
        <div class="field-label-row">
          <span class="field-label">Período</span>
          <AppTooltip content="Duração total do investimento em meses">
            <span class="info-icon" tabindex="-1" aria-label="Ajuda">
              <InfoIcon />
            </span>
          </AppTooltip>
        </div>
        <label class="field-input-row">
          <input v-model.number="entry.period" inputmode="numeric" type="number" />
          <span class="field-affix field-suffix mono-text-ui-dense">meses</span>
        </label>
      </div>
    </div>

    <button class="calc-btn" @click="store.calculate()">
      <span>Calcular</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M2 7h10M8 3l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
@reference "../assets/main.css";

.form-wrap {
  @apply flex flex-col;
}

.form-eyebrow {
  @apply mb-9 flex items-center gap-3;
}

/* ── Mode toggle (Simular / Meta) ── */

.mode-toggle {
  @apply ml-auto flex shrink-0;
}

.mode-btn {
  @apply w-auto cursor-pointer border px-[0.5rem] py-[0.22rem] text-[0.58rem] leading-none tracking-[0.1em] transition-colors duration-150 uppercase;
  background: transparent;
  border-color: var(--c-border);
  color: var(--c-text-faint);
}

.mode-btn:first-child {
  border-right: none;
}

.mode-btn:hover:not(.mode-active) {
  border-color: var(--c-text-muted);
  color: var(--c-text-muted);
}

.mode-btn.mode-active {
  border-color: var(--c-gold);
  color: var(--c-gold);
  background: color-mix(in srgb, var(--c-gold) 10%, transparent);
}

.form-tag {
  @apply gap-2 tracking-[0.22em];
  color: var(--c-gold);
}

.form-tag::after {
  content: '';
  display: block;
  @apply h-px w-8;
  background: var(--c-gold);
  opacity: 0.5;
  @apply transition-colors duration-200;
}

.form-fields {
  @apply flex flex-col gap-8;
}

.field {
  @apply flex flex-col gap-2;
}

.field-label-row {
  @apply flex items-center gap-[0.35rem];
}

.field-label {
  @apply text-[0.58rem] font-medium uppercase tracking-[0.16em] transition-colors duration-200;
  color: var(--c-text-muted);
  font-family: 'DM Sans', system-ui, sans-serif;
}

.field-input-row {
  @apply flex min-w-0 cursor-text items-center gap-2 overflow-visible border-b pb-[0.4rem] transition-colors duration-200;
  border-color: var(--c-border);
}

.field-input-row:focus-within {
  border-bottom-color: var(--c-gold);
}

.field-affix {
  @apply shrink-0 select-none text-[0.68rem];
  color: var(--c-text-dim);
}

.field-suffix {
  @apply ml-auto;
}

.field-input-row input {
  @apply flex-1 min-w-0 border-none bg-transparent py-1 outline-none;
  font-family: 'IBM Plex Mono', monospace;
  @apply text-[1.05rem] tracking-[0.02em] transition-colors duration-200;
  color: var(--c-text);
}

/* ── Period toggle ── */

.period-toggle {
  @apply ml-1 mr-0.5 flex shrink-0;
}

.period-btn {
  @apply w-auto cursor-pointer border px-2 py-[0.22rem] text-[0.6rem] leading-none tracking-[0.06em] transition-colors duration-150;
  background: transparent;
  border-color: var(--c-border);
  color: var(--c-text-faint);
}

.period-btn:first-child {
  border-right: none;
}

.period-btn:hover:not(.period-active) {
  border-color: var(--c-text-muted);
  color: var(--c-text-muted);
}

.period-btn.period-active {
  border-color: var(--c-gold);
  color: var(--c-gold);
  background: color-mix(in srgb, var(--c-gold) 10%, transparent);
}

/* ── Rate field container ── */

.rate-field {
  @apply gap-0;
}

/* ── Rate header: label row + source tabs ── */

.rate-header {
  @apply flex items-center justify-between gap-2 mb-3;
}

/* ── Rate source tabs (Fixa / % Índice) ── */

.rate-source-tabs {
  @apply flex shrink-0;
}

.rst-tab {
  @apply cursor-pointer border px-[0.55rem] py-[0.22rem] text-[0.58rem] leading-none tracking-[0.06em] transition-colors duration-150;
  background: transparent;
  border-color: var(--c-border);
  color: var(--c-text-faint);
}

.rst-tab:first-child {
  border-right: none;
}

.rst-tab:hover:not(.rst-active) {
  border-color: var(--c-text-muted);
  color: var(--c-text-muted);
}

.rst-tab.rst-active {
  border-color: var(--c-gold);
  color: var(--c-gold);
  background: color-mix(in srgb, var(--c-gold) 8%, transparent);
}

/* ── Conversion hint ── */

.tax-hint {
  @apply block text-[0.65rem] mt-1;
  color: var(--c-text-dim);
}

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

/* ── Index chips (CDI / Selic / IPCA) ── */

.index-chips {
  @apply flex gap-[0.4rem] mb-3;
}

.index-chip {
  @apply flex flex-1 flex-col items-center gap-[0.15rem] cursor-pointer border py-[0.4rem] px-2 transition-all duration-150;
  background: transparent;
  border-color: var(--c-border);
  color: var(--c-text-faint);
  min-width: 0;
}

.index-chip:hover:not(.chip-active) {
  border-color: var(--c-text-muted);
  color: var(--c-text-muted);
}

.index-chip.chip-active {
  border-color: var(--c-gold);
  color: var(--c-gold);
  background: color-mix(in srgb, var(--c-gold) 8%, transparent);
}

.chip-name {
  font-size: 0.52rem;
  letter-spacing: 0.12em;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1;
}

.chip-rate {
  font-size: 0.78rem;
  letter-spacing: 0.01em;
  line-height: 1;
}

/* ── Index formula row: CDI × ___% = X% a.a. ── */

.index-formula-row {
  @apply flex items-center gap-[0.45rem] border-b pb-[0.4rem] mb-2;
  border-color: var(--c-border);
}

.formula-label {
  font-size: 0.72rem;
  color: var(--c-text-muted);
  min-width: max-content;
}

.formula-op,
.formula-eq {
  font-size: 0.65rem;
  color: var(--c-text-faint);
  flex-shrink: 0;
}

.formula-input-wrap {
  @apply flex items-center gap-[0.2rem] border-b pb-[0.15rem] transition-colors duration-200;
  border-color: var(--c-border);
}

.formula-input-wrap:focus-within {
  border-bottom-color: var(--c-gold);
}

.formula-input {
  @apply border-none bg-transparent outline-none py-0;
  width: 3.6rem;
  font-size: 0.88rem;
  color: var(--c-text);
  text-align: right;
}

.formula-pct {
  font-size: 0.65rem;
  color: var(--c-text-dim);
  flex-shrink: 0;
}

.formula-result {
  @apply ml-auto;
  font-size: 0.88rem;
  color: var(--c-gold-bright);
  letter-spacing: 0.01em;
  flex-shrink: 0;
}

/* ── Index base rate row ── */

.index-base-row {
  @apply flex items-center gap-[0.3rem] flex-wrap;
}

.index-base-label {
  font-size: 0.6rem;
  color: var(--c-text-faint);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.index-rate-btn {
  @apply inline-flex items-center gap-[0.25rem] cursor-pointer border-none bg-transparent p-0 leading-none transition-colors duration-150;
  font-size: 0.68rem;
  color: var(--c-text-secondary);
}

.index-rate-btn:hover {
  color: var(--c-gold);
}

.index-custom-tag {
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.1rem 0.35rem;
  border: 1px solid color-mix(in srgb, var(--c-gold) 50%, transparent);
  color: var(--c-gold);
  background: color-mix(in srgb, var(--c-gold) 8%, transparent);
}

.index-reset-btn {
  @apply inline-flex cursor-pointer border-none bg-transparent p-0 leading-none transition-colors duration-150;
  color: var(--c-text-faint);
}

.index-reset-btn:hover {
  color: var(--c-gold);
}

.index-ref {
  font-size: 0.6rem;
  color: var(--c-text-faint);
  letter-spacing: 0.03em;
}

.index-rate-edit-input {
  @apply border-none bg-transparent py-0 outline-none;
  width: 3.8rem;
  font-size: 0.72rem;
  color: var(--c-text);
  border-bottom: 1px solid var(--c-gold) !important;
}

.index-edit-hint {
  font-size: 0.58rem;
  color: var(--c-text-faint);
  letter-spacing: 0.04em;
  margin-left: auto;
}

/* ── Calculate button ── */

.calc-btn {
  @apply relative mt-11 flex w-full items-center justify-center gap-[0.6rem] overflow-hidden border px-6 py-[0.8rem] text-[0.68rem] font-medium uppercase tracking-[0.2em] transition-all duration-200;
  background: transparent;
  border-color: color-mix(in srgb, var(--c-gold) 45%, transparent);
  color: var(--c-gold-text);
  font-family: 'DM Sans', system-ui, sans-serif;
  cursor: pointer;
}

.calc-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--c-gold);
  transform: scaleX(0);
  transform-origin: left;
  @apply transition-transform duration-200;
  z-index: 0;
}

.calc-btn:hover {
  color: var(--c-bg);
  border-color: var(--c-gold);
}

.calc-btn:hover::before {
  transform: scaleX(1);
}

.calc-btn span,
.calc-btn svg {
  position: relative;
  z-index: 1;
}

.calc-btn:active {
  opacity: 0.85;
}

@media (max-width: 720px) {
  .form-eyebrow {
    @apply mb-7;
  }

  .form-fields {
    @apply gap-7;
  }

  .calc-btn {
    @apply mt-9;
  }
}

@media (max-width: 480px) {
  .form-eyebrow {
    @apply mb-5;
  }

  .form-fields {
    @apply gap-6;
  }

  .calc-btn {
    @apply mt-7 px-6 py-[0.9rem];
  }

  /* Larger touch targets for period toggle on mobile */
  .period-btn {
    @apply px-[0.65rem] py-[0.45rem] text-[0.62rem];
  }
}
</style>
