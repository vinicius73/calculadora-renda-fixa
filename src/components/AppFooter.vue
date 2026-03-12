<script setup lang="ts">
const version = import.meta.env.VITE_APP_VERSION
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner layout-container">
      <div class="footer-rule"></div>
      <div class="footer-content">
        <span class="footer-credit">
          Feito por
          <a class="footer-link" href="https://vinicius73.dev" target="_blank">Vinicius73</a>
        </span>
        <a
          class="footer-version"
          href="https://github.com/vinicius73/calculadora-renda-fixa"
          target="_blank"
          >v{{ version }}</a
        >
      </div>
    </div>
  </footer>
</template>

<style scoped>
@reference "../assets/main.css";

.app-footer {
  @apply px-8 pb-7;
}

.footer-inner {
  @apply w-full;
}

.footer-rule {
  @apply mb-4 h-px transition-colors duration-200;
  background: linear-gradient(
    to right,
    transparent,
    var(--c-gold) 30%,
    var(--c-rule-fade) 70%,
    transparent
  );
}

.footer-content {
  @apply flex items-center justify-between;
}

.footer-credit {
  @apply text-[0.65rem] uppercase tracking-[0.1em] transition-colors duration-200;
  color: var(--c-text-dim);
}

.footer-link {
  color: var(--c-link);
  @apply no-underline transition-colors duration-200;
}

.footer-link:hover {
  color: var(--c-gold);
}

.footer-version {
  @apply text-[0.6rem] tracking-[0.08em] transition-colors duration-200;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--c-text-faint);
}
</style>
