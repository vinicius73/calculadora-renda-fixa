import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Theme } from '@/composables/useTheme'

describe('Theme', () => {
  it('Dark has value "dark"', () => {
    expect(Theme.Dark).toBe('dark')
  })

  it('Light has value "light"', () => {
    expect(Theme.Light).toBe('light')
  })

  it('Dark and Light are distinct', () => {
    expect(Theme.Dark).not.toBe(Theme.Light)
  })
})

// useTheme is a module-level singleton: reset modules between tests so each
// test gets a fresh reactive ref initialized from a clean localStorage.
describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('light')
    vi.resetModules()
  })

  it('starts in dark mode by default', async () => {
    const { useTheme } = await import('@/composables/useTheme')
    const { isDark } = useTheme()
    expect(isDark.value).toBe(true)
  })

  it('toggleTheme switches dark → light', async () => {
    const { useTheme } = await import('@/composables/useTheme')
    const { isDark, toggleTheme } = useTheme()
    expect(isDark.value).toBe(true)
    toggleTheme()
    expect(isDark.value).toBe(false)
  })

  it('toggleTheme switches light → dark', async () => {
    const { useTheme } = await import('@/composables/useTheme')
    const { isDark, toggleTheme } = useTheme()
    toggleTheme() // dark → light
    expect(isDark.value).toBe(false)
    toggleTheme() // light → dark
    expect(isDark.value).toBe(true)
  })

  it('persists choice: theme ref reflects toggle after round-trip', async () => {
    const { useTheme, Theme: T } = await import('@/composables/useTheme')
    const { theme, toggleTheme } = useTheme()
    expect(theme.value).toBe(T.Dark)
    toggleTheme()
    expect(theme.value).toBe(T.Light)
    toggleTheme()
    expect(theme.value).toBe(T.Dark)
  })

  it('restores saved theme from localStorage on init', async () => {
    // Pre-seed localStorage with light theme
    localStorage.setItem('renda-fixa-theme', JSON.stringify(Theme.Light))
    const { useTheme } = await import('@/composables/useTheme')
    const { isDark } = useTheme()
    expect(isDark.value).toBe(false)
  })
})
