<template>
  <section class="yp-form-section" :aria-labelledby="labelId">
    <h2 :id="labelId" class="yp-form-section__title">送件安全驗證</h2>
    <div ref="container"></div>
    <p v-if="message" class="form-text mb-1" role="status">{{ message }}</p>
    <button v-if="failed" type="button" class="btn btn-sm btn-outline-secondary" @click="retry">重新驗證</button>
  </section>
</template>

<script setup>
const props = defineProps({ kind: { type: String, required: true } })
const labelId = `${props.kind}-verification-label`
const emit = defineEmits(['token'])
const sitekey = useRuntimeConfig().public.turnstileSiteKey
const container = ref(null)
const failed = ref(false)
const message = ref('正在載入安全驗證…')
let widgetId
let script
let loadTimer

function showError() {
  clearTimeout(loadTimer)
  emit('token', '')
  failed.value = true
  message.value = '安全驗證未完成，請檢查網路後重試。'
  return true
}

function renderWidget() {
  clearTimeout(loadTimer)
  if (!container.value || widgetId != null) return
  try {
    widgetId = window.turnstile.render(container.value, {
      sitekey, action: `${props.kind}_submit`, language: 'zh-tw', size: 'flexible', retry: 'never',
      callback(token) {
        failed.value = false
        message.value = ''
        emit('token', token)
      },
      'expired-callback': () => emit('token', ''),
      'timeout-callback': showError,
      'error-callback': showError
    })
    if (!failed.value) message.value = ''
  } catch {
    showError()
  }
}

function start() {
  failed.value = false
  message.value = '正在載入安全驗證…'
  if (!sitekey) return showError()
  if (window.turnstile) return renderWidget()
  script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.onload = renderWidget
  script.onerror = showError
  loadTimer = setTimeout(showError, 15000)
  document.head.append(script)
}

function dispose() {
  clearTimeout(loadTimer)
  if (widgetId != null) window.turnstile?.remove(widgetId)
  widgetId = undefined
  if (script) {
    script.onload = script.onerror = null
    if (!window.turnstile) script.remove()
    script = undefined
  }
}

function retry() {
  emit('token', '')
  dispose()
  start()
}

defineExpose({ reset: retry })
onMounted(start)
onBeforeUnmount(dispose)
</script>
