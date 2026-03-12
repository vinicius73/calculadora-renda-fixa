<script setup lang="ts">
import { ref, nextTick } from 'vue'

defineProps<{
  content: string
}>()

const triggerEl = ref<HTMLElement | null>(null)
const tooltipEl = ref<HTMLElement | null>(null)
const visible = ref(false)
const isAbove = ref(true)
const tooltipStyle = ref({ top: '0px', left: '0px' })
const arrowLeft = ref('50%')

let timer: ReturnType<typeof setTimeout>

function show() {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    visible.value = true
    await nextTick()
    place()
  }, 90)
}

function hide() {
  clearTimeout(timer)
  visible.value = false
}

function place() {
  const t = triggerEl.value?.getBoundingClientRect()
  const tip = tooltipEl.value?.getBoundingClientRect()
  if (!t || !tip) return

  const gap = 10
  const sy = window.scrollY
  const vw = window.innerWidth

  const canFitAbove = t.top - tip.height - gap >= 4
  isAbove.value = canFitAbove

  const top = canFitAbove ? t.top + sy - tip.height - gap : t.bottom + sy + gap

  const idealLeft = t.left + t.width / 2 - tip.width / 2
  const left = Math.max(8, Math.min(idealLeft, vw - tip.width - 8))

  const arrowCenter = t.left + t.width / 2 - left
  arrowLeft.value = `${Math.max(12, Math.min(arrowCenter, tip.width - 12))}px`

  tooltipStyle.value = { top: `${top}px`, left: `${left}px` }
}
</script>

<template>
  <span
    ref="triggerEl"
    class="tooltip-host"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
    <Teleport to="body">
      <Transition name="tt">
        <div
          v-if="visible"
          ref="tooltipEl"
          role="tooltip"
          class="app-tooltip"
          :class="isAbove ? 'tt-above' : 'tt-below'"
          :style="tooltipStyle"
        >
          <span class="tt-arrow" :style="{ left: arrowLeft }"></span>
          {{ content }}
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<style scoped>
@reference "../assets/main.css";

.tooltip-host {
  @apply inline-flex items-center;
}
</style>
