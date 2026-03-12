import { useLocalStorage } from '@vueuse/core'
import { computed, watch } from 'vue'

export enum Theme {
  Dark = 'dark',
  Light = 'light',
}

const theme = useLocalStorage<Theme>('renda-fixa-theme', Theme.Dark)
const isDark = computed(() => theme.value === Theme.Dark)

watch(
  theme,
  (val) => {
    document.documentElement.classList.toggle('light', val === Theme.Light)
  },
  { immediate: true },
)

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === Theme.Dark ? Theme.Light : Theme.Dark
  }

  return { theme, isDark, toggleTheme }
}
