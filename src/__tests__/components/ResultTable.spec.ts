import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultTable from '@/components/ResultTable.vue'
import type { Result } from '@/lib/calcule'

const mockValues: Result[] = [
  { index: '01', value: 1320, tax: 120, accumulative: 1200 },
  { index: '02', value: 1654.2, tax: 134.2, accumulative: 1400 },
]

describe('ResultTable', () => {
  it('renders a row per result item', () => {
    const wrapper = mount(ResultTable, { props: { values: mockValues } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
  })

  it('shows correct index', () => {
    const wrapper = mount(ResultTable, { props: { values: mockValues } })
    expect(wrapper.text()).toContain('01')
    expect(wrapper.text()).toContain('02')
  })

  it('formats values as currency', () => {
    const wrapper = mount(ResultTable, { props: { values: mockValues } })
    expect(wrapper.text()).toContain('R$')
  })

  it('renders empty tbody for empty values', () => {
    const wrapper = mount(ResultTable, { props: { values: [] } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(0)
  })
})
