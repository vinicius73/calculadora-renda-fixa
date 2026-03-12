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
  border: 1px solid rgb(148 163 184 / 0.4);
  border-radius: 8px;
  z-index: 100;
  text-align: left;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
  background-color: var(--color-surface, #f8fafc);
}

.pwa-toast__message {
  margin-bottom: 8px;
  font-size: 0.875rem;
  line-height: 1.4;
}

.pwa-toast__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pwa-toast__btn {
  padding: 6px 12px;
  border: 1px solid rgb(148 163 184 / 0.5);
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
  background: transparent;
}

.pwa-toast__btn:focus {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}

.pwa-toast__btn--primary {
  border-color: rgb(30 64 175);
  background-color: rgb(59 130 246);
  color: white;
}
</style>
