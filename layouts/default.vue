<template>
  <div class="yp-app">
    <LayoutHeader v-if="!chromeless" />
    <main class="yp-app__main">
      <slot />
    </main>
    <LayoutFooter v-if="!chromeless" />
    <MobileTabBar v-if="!chromeless" />
  </div>
</template>

<script setup>
import { chromelessPrefixes } from '~/utils/site-nav'

const route = useRoute()
const chromeless = computed(() =>
  chromelessPrefixes.some((prefix) => route.path === prefix || route.path.startsWith(`${prefix}/`))
)

useHead({
  bodyAttrs: {
    class: computed(() => (chromeless.value ? '' : 'has-tabbar'))
  }
})
</script>

<style lang="scss" scoped>
.yp-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__main {
    flex: 1;
    min-width: 0;
  }
}
</style>
