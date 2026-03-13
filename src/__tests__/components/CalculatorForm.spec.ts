import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CalculatorForm from '@/components/CalculatorForm.vue'
import { useCalculatorStore } from '@/stores/calculator'
import { toMonthlyRate } from '@/lib/taxRate'

describe('CalculatorForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders 4 inputs and 7 buttons (Simular, Meta, Fixa, % Índice, a.m., a.a., Calcular)', () => {
    const wrapper = mount(CalculatorForm, {
      global: {
        directives: {
          maska: {},
        },
      },
    })
    expect(wrapper.findAll('input')).toHaveLength(4)
    // mode toggle: Simular + Meta
    // rate source toggle: Fixa + % Índice
    // period toggle: a.m. + a.a.
    // Calcular button
    expect(wrapper.findAll('button')).toHaveLength(7)
  })

  it('clicking Calcular calls store.calculate()', async () => {
    const store = useCalculatorStore()
    const spy = vi.spyOn(store, 'calculate')

    const wrapper = mount(CalculatorForm, {
      global: {
        directives: {
          maska: {},
        },
      },
    })

    await wrapper.find('.calc-btn').trigger('click')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('updating tax input in annual mode stores the monthly equivalent', async () => {
    const store = useCalculatorStore()

    const wrapper = mount(CalculatorForm, {
      global: {
        directives: {
          maska: {},
        },
      },
    })

    // Order: initialValue[0], monthlyValue[1], period[2], taxDisplay[3]
    // taxPeriod starts as Annual, so entering 15 stores toMonthlyRate(15)
    const inputs = wrapper.findAll('input')
    const taxInput = inputs[3]
    await taxInput.setValue(15)
    expect(store.entry.monthlyTax).toBeCloseTo(toMonthlyRate(15), 10)
  })

  it('updating period input updates store entry', async () => {
    const store = useCalculatorStore()

    const wrapper = mount(CalculatorForm, {
      global: {
        directives: {
          maska: {},
        },
      },
    })

    // Order: initialValue[0], monthlyValue[1], period[2], taxDisplay[3]
    const inputs = wrapper.findAll('input')
    const periodInput = inputs[2]
    await periodInput.setValue(24)
    expect(store.entry.period).toBe(24)
  })
})
