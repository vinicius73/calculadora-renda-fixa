<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import CalculatorForm from './components/CalculatorForm.vue'
import ResultsSection from './components/ResultsSection.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <div class="app-layout layout-container">
        <aside class="app-sidebar">
          <CalculatorForm />
        </aside>
        <section class="app-content">
          <ResultsSection />
        </section>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
@reference "./assets/main.css";

.app-shell {
  @apply flex min-h-screen flex-col;
}

.app-main {
  @apply flex-1 px-8 py-10;
}

.app-layout {
  @apply grid items-start gap-16;
  grid-template-columns: 300px 1fr;
}

.app-sidebar {
  @apply sticky overflow-visible pr-2;
  top: 2.5rem;
}

.app-content {
  @apply min-w-0;
}

@media (max-width: 720px) {
  .app-main {
    @apply px-5 py-8;
  }

  .app-layout {
    grid-template-columns: 1fr;
    @apply gap-10;
  }

  .app-sidebar {
    @apply static;
  }
}

@media (max-width: 480px) {
  .app-main {
    @apply px-4 py-6;
  }

  .app-layout {
    @apply gap-8;
  }
}
</style>
