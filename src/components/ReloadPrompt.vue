<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW()

async function close() {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <div v-if="offlineReady || needRefresh" class="pwa-toast" role="alert">
    <div class="pwa-toast__message">
      <span v-if="offlineReady"> App pronto para uso offline. </span>
      <span v-else> Nova versão disponível. Clique em atualizar para carregar. </span>
    </div>
    <div class="pwa-toast__actions">
      <button
        v-if="needRefresh"
        type="button"
        class="pwa-toast__btn pwa-toast__btn--primary"
        @click="updateServiceWorker()"
      >
        Atualizar
      </button>
      <button type="button" class="pwa-toast__btn" @click="close">Fechar</button>
    </div>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px 16px;
  border: 1px solid var(--c-tooltip-border);
  border-radius: 8px;
  z-index: 100;
  text-align: left;
  background-color: var(--c-tooltip-bg);
  color: var(--c-tooltip-text);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.35),
    0 2px 6px rgba(0, 0, 0, 0.2);
  transition:
    background-color 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
}

.pwa-toast__message {
  margin-bottom: 8px;
  font-size: 0.875rem;
  line-height: 1.4;
  color: inherit;
}

.pwa-toast__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pwa-toast__btn {
  padding: 6px 12px;
  border: 1px solid var(--c-tooltip-border);
  border-radius: 6px;
  font-size: 0.8125rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  cursor: pointer;
  background: transparent;
  color: var(--c-tooltip-text);
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

.pwa-toast__btn:hover {
  border-color: var(--c-gold);
  color: var(--c-gold);
}

.pwa-toast__btn:focus {
  outline: 2px solid var(--c-gold-bright);
  outline-offset: 2px;
}

.pwa-toast__btn--primary {
  border-color: var(--c-gold);
  background-color: var(--c-gold-bright);
  color: var(--c-gold-text-on);
}

.pwa-toast__btn--primary:hover {
  border-color: var(--c-gold-bright);
  background-color: var(--c-gold);
  color: var(--c-gold-text-on);
}
</style>
