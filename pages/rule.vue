<template>
  <div class="yp-page">
    <nav class="yp-breadcrumb" aria-label="breadcrumb">
      <NuxtLink to="/">首頁</NuxtLink><span>推薦代碼使用規範</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">使用須知</span>
        <h1 class="yp-page-head__title">推薦代碼使用規範</h1>
        <p class="yp-page-head__desc">保障會員權益，維護公平使用</p>
      </div>
    </header>

    <section class="yp-card yp-card__section rule-block">
      <div class="rule-block__icon"><Icon name="ri:shield-check-line" /></div>
      <div>
        <h2 class="rule-block__title">適用範圍</h2>
        <p class="rule-block__text">
          推薦代碼僅限宜蘭觀光民宿行銷協會會員使用，任何非協會會員的第三方均不得進行商業使用。
        </p>
      </div>
    </section>

    <section class="yp-card yp-card__section rule-block">
      <div class="rule-block__icon rule-block__icon--warn"><Icon name="ri:forbid-2-line" /></div>
      <div>
        <h2 class="rule-block__title">禁止行為</h2>
        <ul class="rule-list">
          <li>
            <Icon name="ri:close-circle-fill" />
            <span>
              禁止轉售、出租、或以其他形式牟利（包括但不限於：未經許可向他人提供推薦代碼以換取經濟利益）。
            </span>
          </li>
          <li>
            <Icon name="ri:close-circle-fill" />
            <span>禁止利用推薦代碼從事欺詐、違法或不正當用途。</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="yp-card yp-card__section rule-block">
      <div class="rule-block__icon rule-block__icon--danger">
        <Icon name="ri:error-warning-line" />
      </div>
      <div>
        <h2 class="rule-block__title">違規處理</h2>
        <p class="rule-block__text">
          若平台發現用戶違反上述規範，有權立即暫停或取消該推薦代碼的有效性，並保留追究相關法律責任的權利。
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
useSeoMeta({
  title: '推薦代碼使用規範 - 宜蘭旅遊通',
  description: '宜蘭旅遊通推薦代碼使用規範，保障會員權益，維護公平使用。',
  canonical: 'https://yilanpass.com/rule'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/rule'
    }
  ]
})
</script>

<style scoped lang="scss">
.rule-block {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;

  &__icon {
    flex: none;
    width: 44px;
    height: 44px;
    border-radius: $yp-radius;
    background: $yp-primary-soft;
    color: $yp-primary;
    display: grid;
    place-items: center;
    font-size: 24px;

    &--warn {
      background: $yp-warning-soft;
      color: $yp-warning;
    }

    &--danger {
      background: $yp-danger-soft;
      color: $yp-danger;
    }
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 8px;
  }

  &__text {
    margin: 0;
    line-height: 1.8;
    color: #24434c;
  }
}

.rule-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    gap: 8px;
    line-height: 1.8;
    color: #24434c;

    & + li {
      margin-top: 8px;
    }

    svg {
      flex: none;
      margin-top: 5px;
      color: $yp-danger;
    }
  }
}
</style>
