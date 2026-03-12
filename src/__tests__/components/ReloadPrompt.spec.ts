import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, type Ref } from 'vue'
import ReloadPrompt from '../../components/ReloadPrompt.vue'

const { useRegisterSW } = vi.hoisted(() => ({
  useRegisterSW: vi.fn(),
}))
vi.mock('virtual:pwa-register/vue', () => ({
  useRegisterSW,
}))

describe('ReloadPrompt', () => {
  let offlineReady: Ref<boolean>
  let needRefresh: Ref<boolean>
  let updateServiceWorkerMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    offlineReady = ref(false)
    needRefresh = ref(false)
    updateServiceWorkerMock = vi.fn().mockResolvedValue(undefined)
    useRegisterSW.mockImplementation((options?: { onRegisterError?: (err: unknown) => void }) => {
      return {
        offlineReady,
        needRefresh,
        updateServiceWorker: updateServiceWorkerMock,
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render when neither offlineReady nor needRefresh', () => {
    const wrapper = mount(ReloadPrompt)
    expect(wrapper.find('.pwa-toast').exists()).toBe(false)
  })

  it('renders offline message when offlineReady is true', () => {
    offlineReady.value = true
    const wrapper = mount(ReloadPrompt)
    expect(wrapper.find('.pwa-toast').exists()).toBe(true)
    expect(wrapper.text()).toContain('pronto para uso offline')
    expect(wrapper.find('.pwa-toast__btn--primary').exists()).toBe(false)
  })

  it('renders update message when needRefresh is true', () => {
    needRefresh.value = true
    const wrapper = mount(ReloadPrompt)
    expect(wrapper.find('.pwa-toast').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nova versão disponível')
    expect(wrapper.find('.pwa-toast__btn--primary').exists()).toBe(true)
  })

  it('close button clears offlineReady and needRefresh', async () => {
    needRefresh.value = true
    const wrapper = mount(ReloadPrompt)
    const closeBtn = wrapper.findAll('button').find((b) => b.text() === 'Fechar')
    expect(closeBtn).toBeDefined()
    await closeBtn!.trigger('click')
    expect(offlineReady.value).toBe(false)
    expect(needRefresh.value).toBe(false)
  })

  it('update button calls updateServiceWorker once', async () => {
    needRefresh.value = true
    const wrapper = mount(ReloadPrompt)
    const updateBtn = wrapper.find('.pwa-toast__btn--primary')
    await updateBtn.trigger('click')
    expect(updateServiceWorkerMock).toHaveBeenCalledTimes(1)
  })

  it('update button is disabled while updating and shows "Atualizando…"', async () => {
    needRefresh.value = true
    let resolveUpdate: () => void
    updateServiceWorkerMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve
        }),
    )
    const wrapper = mount(ReloadPrompt)
    const updateBtn = wrapper.find('.pwa-toast__btn--primary')
    await updateBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.pwa-toast__btn--primary').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Atualizando…')
    resolveUpdate!()
  })

  it('double click on update only triggers updateServiceWorker once', async () => {
    needRefresh.value = true
    let resolveUpdate: () => void
    updateServiceWorkerMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve
        }),
    )
    const wrapper = mount(ReloadPrompt)
    const updateBtn = wrapper.find('.pwa-toast__btn--primary')
    updateBtn.trigger('click')
    updateBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(updateServiceWorkerMock).toHaveBeenCalledTimes(1)
    resolveUpdate!()
  })

  it('when updateServiceWorker throws, error message is shown and UI remains usable', async () => {
    needRefresh.value = true
    updateServiceWorkerMock.mockRejectedValue(new Error('Network error'))
    const wrapper = mount(ReloadPrompt)
    const updateBtn = wrapper.find('.pwa-toast__btn--primary')
    await updateBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Erro ao atualizar')
    expect(wrapper.text()).toContain('Network error')
    const closeBtn = wrapper.findAll('button').find((b) => b.text() === 'Fechar')
    await closeBtn!.trigger('click')
    expect(needRefresh.value).toBe(false)
  })

  it('reload fallback is scheduled after updateServiceWorker resolves', async () => {
    vi.useFakeTimers()
    needRefresh.value = true
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    const wrapper = mount(ReloadPrompt)
    const updateBtn = wrapper.find('.pwa-toast__btn--primary')
    await updateBtn.trigger('click')
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000)
    setTimeoutSpy.mockRestore()
  })

  it('calls onRegisterError when useRegisterSW receives it', () => {
    const onRegisterError = vi.fn()
    useRegisterSW.mockImplementation(() => ({
      offlineReady: ref(false),
      needRefresh: ref(false),
      updateServiceWorker: vi.fn().mockResolvedValue(undefined),
    }))
    mount(ReloadPrompt)
    expect(useRegisterSW).toHaveBeenCalledWith(
      expect.objectContaining({
        onRegisterError: expect.any(Function),
      }),
    )
    const opts = useRegisterSW.mock.calls[0][0] as { onRegisterError: (err: unknown) => void }
    opts.onRegisterError(new Error('registration failed'))
    // Component only logs; no crash.
    expect(true).toBe(true)
  })
})
