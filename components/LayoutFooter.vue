<template>
  <footer class="yp-footer">
    <div class="yp-footer__inner">
      <div class="yp-footer__brand">
        <img src="/logo.png" alt="宜蘭旅遊通" width="140" height="37" />
        <p>由宜蘭觀光民宿行銷協會發起，整合在地店家與合法民宿的數位旅遊優惠平台。</p>
        <a href="https://lin.ee/6ymvmWV" class="btn btn-line btn-sm" target="_blank" rel="noopener">
          <Icon name="ri:line-fill" /> 加入官方 LINE
        </a>
      </div>
      <nav
        v-for="group in mainMenu"
        :key="group.title"
        class="yp-footer__col"
        :aria-label="group.title"
      >
        <h2>{{ group.title }}</h2>
        <NuxtLink v-for="link in group.children" :key="link.path" :to="link.path">{{
          link.title
        }}</NuxtLink>
      </nav>
    </div>
    <div class="yp-footer__bottom">© {{ year }} 宜蘭旅遊通・宜蘭觀光民宿行銷協會</div>
  </footer>
</template>

<script setup>
import { mainMenu } from '~/utils/site-nav'

const year = new Date().getFullYear()
</script>

<style lang="scss" scoped>
.yp-footer {
  background: #fff;
  border-top: 1px solid $yp-line;
  margin-top: 48px;
  color: $yp-muted;
  font-size: 0.875rem;

  &__inner {
    max-width: calc(var(--yp-content-width, #{$yp-container}) + 48px);
    margin: 0 auto;
    padding: 36px 16px 24px;
    display: grid;
    gap: 28px 24px;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (min-width: $yp-bp-md) {
      padding: 48px 24px 32px;
      grid-template-columns: 2fr repeat(4, minmax(0, 1fr));
    }
  }

  &__brand {
    grid-column: 1 / -1;

    @media (min-width: $yp-bp-md) {
      grid-column: auto;
    }

    img {
      height: 30px;
      width: auto;
      margin-bottom: 12px;
    }

    p {
      max-width: 320px;
      margin: 0 0 14px;
      line-height: 1.7;
    }
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2 {
      font-size: 0.875rem;
      font-weight: 700;
      color: $yp-ink;
      margin: 0 0 4px;
    }

    a {
      color: $yp-muted;

      &:hover {
        color: $yp-primary-ink;
      }
    }
  }

  &__bottom {
    border-top: 1px solid $yp-line;
    text-align: center;
    padding: 16px;
    font-size: 0.8125rem;
    color: $yp-subtle;
  }
}
</style>
