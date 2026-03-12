<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCalculatorStore } from '@/stores/calculator'
import AppTooltip from '@/components/AppTooltip.vue'
import { TaxPeriod, toAnnualRate, toMonthlyRate } from '@/lib/taxRate'

const store = useCalculatorStore()
const { entry } = storeToRefs(store)

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
</script>

<template>
  <div class="form-wrap">
    <div class="form-eyebrow">
      <span class="form-tag eyebrow-label">Parâmetros</span>
    </div>

    <div class="form-fields">
      <div class="field">
        <div class="field-label-row">
          <span class="field-label">Aporte inicial</span>
          <AppTooltip content="Valor aplicado no início do investimento">
            <span class="info-icon" tabindex="-1" aria-label="Ajuda">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
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
        <label class="field-input-row">
          <span class="field-affix mono-text-ui-dense">R$</span>
          <input v-model.number="entry.initialValue" inputmode="numeric" type="number" min="0" />
        </label>
      </div>

      <div class="field">
        <div class="field-label-row">
          <span class="field-label">Aporte mensal</span>
          <AppTooltip content="Valor adicionado ao investimento todo mês">
            <span class="info-icon" tabindex="-1" aria-label="Ajuda">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
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
        <label class="field-input-row">
          <span class="field-affix mono-text-ui-dense">R$</span>
          <input v-model.number="entry.monthlyValue" inputmode="numeric" type="number" min="0" />
        </label>
      </div>

      <!-- ── Interest rate ── -->
      <div class="field">
        <div class="field-label-row">
          <span class="field-label">Taxa de Juros</span>
          <AppTooltip
            content="Taxa de retorno do investimento. Use a.m. para mensal ou a.a. para anual — a conversão é feita automaticamente com juros compostos"
          >
            <span class="info-icon" tabindex="-1" aria-label="Ajuda">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
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
        <label class="field-input-row">
          <input v-model.number="taxDisplay" inputmode="decimal" type="number" step="any" min="0" />
          <span class="field-affix mono-text-ui-dense">%</span>
          <div class="period-toggle" role="group" aria-label="Período da taxa">
            <AppTooltip content="Taxa mensal — juros compostos sobre o saldo a cada mês">
              <button
                type="button"
                class="period-btn mono-text-ui-dense"
                :class="{ 'period-active': taxPeriod === TaxPeriod.Monthly }"
                @click="switchPeriod(TaxPeriod.Monthly)"
              >
                a.m.
              </button>
            </AppTooltip>
            <AppTooltip content="Taxa anual — convertida para mensal usando (1 + r)^(1/12) − 1">
              <button
                type="button"
                class="period-btn mono-text-ui-dense"
                :class="{ 'period-active': taxPeriod === TaxPeriod.Annual }"
                @click="switchPeriod(TaxPeriod.Annual)"
              >
                a.a.
              </button>
            </AppTooltip>
          </div>
        </label>
        <Transition name="hint">
          <span v-if="taxHint" class="tax-hint mono-text-ui">{{ taxHint }}</span>
        </Transition>
      </div>

      <div class="field">
        <div class="field-label-row">
          <span class="field-label">Período</span>
          <AppTooltip content="Duração total do investimento em meses">
            <span class="info-icon" tabindex="-1" aria-label="Ajuda">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
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
  @apply mb-9;
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
  @apply flex cursor-text items-center gap-2 border-b pb-[0.4rem] transition-colors duration-200;
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
  @apply ml-1 flex shrink-0;
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

/* ── Conversion hint ── */

.tax-hint {
  @apply block text-[0.65rem];
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
