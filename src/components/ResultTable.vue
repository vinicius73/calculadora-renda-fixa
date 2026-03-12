<script setup lang="ts">
import type { Result } from '@/lib/calcule'
import { useMoney } from '@/composables/useMoney'
import AppTooltip from '@/components/AppTooltip.vue'

defineProps<{
  values: Result[]
}>()

const { formatMoney } = useMoney()
</script>

<template>
  <div class="table-wrap">
    <div class="table-eyebrow">
      <span class="table-tag eyebrow-label">Evolução mensal</span>
    </div>
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th class="data-table-head-cell col-index">#</th>
            <th class="data-table-head-cell">
              <AppTooltip content="Patrimônio acumulado ao fim do mês">
                <span class="th-label">Total</span>
              </AppTooltip>
            </th>
            <th class="data-table-head-cell">
              <AppTooltip content="Juros gerados no mês sobre o saldo acumulado">
                <span class="th-label">Rendimento</span>
              </AppTooltip>
            </th>
            <th class="data-table-head-cell">
              <AppTooltip content="Soma de todos os aportes realizados até o mês">
                <span class="th-label">Investido</span>
              </AppTooltip>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in values"
            :key="row.index"
            class="data-row"
            :class="{ 'row-last': i === values.length - 1 }"
          >
            <td class="data-table-cell cell-index">{{ row.index }}</td>
            <td
              class="data-table-cell cell-total"
              :class="{ 'cell-final': i === values.length - 1 }"
            >
              {{ formatMoney(row.value) }}
            </td>
            <td class="data-table-cell cell-tax">{{ formatMoney(row.tax) }}</td>
            <td class="data-table-cell cell-acc">{{ formatMoney(row.accumulative) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@reference "../assets/main.css";

.table-wrap {
  @apply overflow-hidden;
}

.table-eyebrow {
  @apply mb-4;
}

.table-tag {
  @apply tracking-[0.2em];
  color: var(--c-text-dim);
}

.table-scroll {
  @apply overflow-x-auto;
}

.th-label {
  @apply inline-block cursor-default border-b border-dashed border-transparent pb-px transition-colors duration-150;
}

.th-label:hover {
  color: var(--c-text-secondary);
  border-bottom-color: var(--c-border);
}

.col-index {
  @apply w-12;
}

.data-row:hover td {
  background: var(--c-hover-row);
}

.cell-index {
  @apply text-[0.7rem];
  color: var(--c-text-faint);
}

.cell-total {
  @apply font-medium;
  color: var(--c-text-secondary);
}

.cell-final {
  color: var(--c-gold) !important;
}

.cell-tax {
  color: var(--c-green);
}

.cell-acc {
  color: var(--c-text-dim);
}

.row-last td {
  border-bottom: none;
}

@media (max-width: 720px) {
  .data-table-head-cell {
    @apply px-2.5 py-2 text-[0.54rem];
  }

  .data-table-cell {
    @apply px-2.5 py-2 text-[0.75rem];
  }

  .col-index {
    @apply w-9;
  }
}

@media (max-width: 480px) {
  .data-table-head-cell {
    @apply px-2 py-[0.45rem] text-[0.5rem] tracking-[0.1em];
  }

  .data-table-cell {
    @apply px-2 py-[0.45rem] text-[0.7rem];
  }

  .col-index {
    @apply w-7;
  }

  .cell-index {
    @apply text-[0.62rem];
  }
}
</style>
