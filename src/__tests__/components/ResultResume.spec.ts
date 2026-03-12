import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ResultResume from '@/components/ResultResume.vue'
import { useCalculatorStore } from '@/stores/calculator'

describe('ResultResume', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('does not render when no results', () => {
    const store = useCalculatorStore()
    store.reset()
    const wrapper = mount(ResultResume)
    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('renders formatted values when results exist', () => {
    const store = useCalculatorStore()
    store.calculate()
    const wrapper = mount(ResultResume)
    expect(wrapper.text()).toContain('R$')
    expect(wrapper.text()).toContain('Rendimento')
    expect(wrapper.text()).toContain('Total Investido')
  })
})
