<script setup lang="ts">
defineProps<{ size?: number }>()
</script>

<template>
  <svg :width="size ?? 11" :height="size ?? 11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
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
</template>
