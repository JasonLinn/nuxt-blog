<template>
  <div class="yp-app" :class="{ 'yp-app--wide': !chromeless }">
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

  &--wide {
    --yp-content-width: clamp(1200px, 90vw, 1560px);
    --yp-page-width: calc(var(--yp-content-width) + 48px);
  }

  &__main {
    flex: 1;
    min-width: 0;
  }
}
</style>
