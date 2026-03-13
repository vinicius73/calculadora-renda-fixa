<script setup lang="ts">
import { useIRConfig } from '@/composables/useIRConfig'

const emit = defineEmits<{ close: [] }>()

const { enabled, brackets, reset } = useIRConfig()

function close() {
  emit('close')
}

function onBackdropMousedown(e: MouseEvent) {
  if (e.target === e.currentTarget) close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-show="true"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ir-modal-title"
        @mousedown="onBackdropMousedown"
        @keydown="onKeydown"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h2 id="ir-modal-title" class="modal-title eyebrow-label">Imposto de Renda</h2>
            <button type="button" class="modal-close" aria-label="Fechar" @click="close">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <label class="ir-toggle-row">
            <span class="ir-toggle-label">Aplicar IR na simulação</span>
            <button
              type="button"
              class="toggle-btn"
              :class="{ 'toggle-on': enabled }"
              role="switch"
              :aria-checked="enabled"
              @click="enabled = !enabled"
            >
              <span class="toggle-thumb" />
            </button>
          </label>

          <div class="modal-rule" />

          <div class="brackets-section">
            <span class="brackets-title eyebrow-label">Faixas de alíquota</span>
            <ul class="brackets-list">
              <li v-for="(bracket, i) in brackets" :key="i" class="bracket-row">
                <span class="bracket-label mono-text-ui-dense">{{ bracket.label }}</span>
                <label class="bracket-rate-label">
                  <input
                    v-model.number="bracket.rate"
                    type="number"
                    inputmode="decimal"
                    step="0.5"
                    min="0"
                    max="100"
                    class="bracket-rate-input mono-text-ui-dense"
                  />
                  <span class="bracket-pct mono-text-ui-dense">%</span>
                </label>
              </li>
            </ul>
          </div>

          <button type="button" class="reset-btn" @click="reset">Restaurar padrões</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "../assets/main.css";

/* ── Backdrop ── */

.modal-backdrop {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(2px);
}

/* ── Box ── */

.modal-box {
  @apply flex w-full max-w-xs flex-col gap-5 p-6;
  background: var(--c-bg-panel);
  border: 1px solid var(--c-border);
}

/* ── Header ── */

.modal-header {
  @apply flex items-center justify-between;
}

.modal-title {
  @apply tracking-[0.18em];
  color: var(--c-gold);
}

.modal-close {
  @apply cursor-pointer border-none bg-transparent p-1 transition-colors duration-150;
  color: var(--c-text-faint);
}

.modal-close:hover {
  color: var(--c-text-secondary);
}

/* ── Toggle row ── */

.ir-toggle-row {
  @apply flex cursor-pointer items-center justify-between gap-3;
}

.ir-toggle-label {
  @apply text-[0.75rem] transition-colors duration-200;
  color: var(--c-text-secondary);
  font-family: 'DM Sans', system-ui, sans-serif;
}

.toggle-btn {
  @apply relative flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-none p-0 transition-colors duration-200;
  background: var(--c-border);
}

.toggle-btn.toggle-on {
  background: color-mix(in srgb, var(--c-gold) 60%, transparent);
}

.toggle-thumb {
  @apply absolute h-3.5 w-3.5 rounded-full transition-transform duration-200;
  left: 3px;
  background: var(--c-text-muted);
}

.toggle-btn.toggle-on .toggle-thumb {
  transform: translateX(16px);
  background: var(--c-gold-bright);
}

/* ── Rule ── */

.modal-rule {
  @apply h-px;
  background: var(--c-border);
}

/* ── Brackets ── */

.brackets-section {
  @apply flex flex-col gap-3;
}

.brackets-title {
  @apply text-[0.52rem] tracking-[0.18em];
  color: var(--c-text-faint);
}

.brackets-list {
  @apply flex flex-col gap-2 p-0;
  list-style: none;
}

.bracket-row {
  @apply flex items-center justify-between gap-2;
}

.bracket-label {
  @apply text-[0.7rem];
  color: var(--c-text-secondary);
}

.bracket-rate-label {
  @apply flex cursor-text items-center gap-1 border-b pb-[0.2rem] transition-colors duration-150;
  border-color: var(--c-border);
}

.bracket-rate-label:focus-within {
  border-color: var(--c-gold);
}

.bracket-rate-input {
  @apply w-12 border-none bg-transparent text-right outline-none;
  @apply text-[0.75rem] tracking-[0.02em];
  color: var(--c-text);
}

.bracket-pct {
  @apply text-[0.65rem];
  color: var(--c-text-dim);
}

/* ── Reset button ── */

.reset-btn {
  @apply cursor-pointer border-none bg-transparent p-0 text-left text-[0.62rem] uppercase tracking-[0.12em] transition-colors duration-150;
  color: var(--c-text-faint);
  font-family: 'DM Sans', system-ui, sans-serif;
}

.reset-btn:hover {
  color: var(--c-text-secondary);
}

/* ── Transitions ── */

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-box,
.modal-leave-to .modal-box {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
}
</style>
