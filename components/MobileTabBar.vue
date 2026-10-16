<template>
  <nav class="yp-tabbar" aria-label="快速導覽">
    <NuxtLink
      v-for="tab in tabItems"
      :key="tab.path"
      :to="tab.path"
      class="yp-tabbar__item"
      :class="{ 'is-active': tab.match(route.path) }"
    >
      <Icon :name="tab.match(route.path) ? tab.activeIcon : tab.icon" class="yp-tabbar__icon" />
      <span>{{ tab.title }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
import { tabItems } from '~/utils/site-nav'

const route = useRoute()
</script>

<style lang="scss" scoped>
.yp-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1010;
  height: calc(#{$yp-tabbar-h} + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  border-top: 1px solid $yp-line;
  display: flex;

  @media (min-width: $yp-bp-md) {
    display: none;
  }

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 0.6875rem;
    color: $yp-muted;

    &.is-active {
      color: $yp-primary-ink;
      font-weight: 700;
    }
  }

  &__icon {
    font-size: 22px;
  }
}
</style>
