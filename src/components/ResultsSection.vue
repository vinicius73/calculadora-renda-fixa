<script setup lang="ts">
import { computed } from 'vue'
import { useCalculatorStore } from '@/stores/calculator'
import ResultResume from './ResultResume.vue'
import ResultTable from './ResultTable.vue'

const store = useCalculatorStore()

const showSection = computed(
  () =>
    store.hasResults ||
    (store.goalMode && store.goalTarget > 0 && store.goalResult > 0),
)
</script>

<template>
  <div v-if="store.loading" class="loading-state">
    <span class="loading-dot"></span>
    <span class="loading-dot"></span>
    <span class="loading-dot"></span>
  </div>
  <div v-else-if="showSection" class="results-wrap">
    <ResultResume />
    <ResultTable v-if="store.hasResults" :values="store.results" />
  </div>
</template>

<style scoped>
@reference "../assets/main.css";

.loading-state {
  @apply flex items-center gap-[0.4rem] py-12;
}

.loading-dot {
  @apply size-1 rounded-full;
  background: #c9963d;
  animation: blink-dot 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.results-wrap {
  animation: fade-up 0.4s ease both;
}
</style>
