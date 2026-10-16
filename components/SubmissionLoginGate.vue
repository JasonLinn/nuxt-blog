<template>
  <section class="yp-card yp-empty login-gate">
    <div class="yp-empty__icon login-gate__icon"><Icon name="ri:line-fill" /></div>
    <h2 class="yp-empty__title">{{ title }}</h2>
    <p class="yp-empty__text">{{ description }}</p>
    <a :href="loginUrl" class="btn btn-line btn-icon px-4">
      <Icon name="ri:line-fill" /> 使用 LINE 登入
    </a>
    <p class="login-gate__note">登入後會自動回到這個頁面</p>
  </section>
</template>

<script setup>
defineProps({
  loginUrl: { type: String, required: true },
  title: { type: String, default: '請先登入再開始填寫' },
  description: {
    type: String,
    default: '為了保護您的資料並方便後續聯繫，送出前需要先用 LINE 登入。'
  }
})
</script>

<style scoped lang="scss">
.login-gate {
  &__icon {
    background: rgba($yp-line-green, 0.12);
    color: $yp-line-green;
  }

  &__note {
    font-size: 0.8125rem;
    color: $yp-subtle;
    margin: 12px 0 0;
  }
}
</style>
