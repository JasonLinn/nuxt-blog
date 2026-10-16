<template>
  <aside class="relative-footer">
    <div class="relative-footer__icon"><Icon name="ri:line-fill" /></div>
    <div class="relative-footer__text">
      <p class="relative-footer__title">加入官方 LINE，取得獨家優惠</p>
      <p class="relative-footer__desc">
        如有興趣可洽「宜蘭旅遊通」官方 LINE，或至消費店家洽詢，即可取得獨家優惠！
      </p>
    </div>
    <a href="https://lin.ee/6ymvmWV" class="btn btn-line btn-icon" target="_blank" rel="noopener">
      <Icon name="ri:add-line" />加入好友
    </a>
  </aside>
</template>

<style scoped lang="scss">
.relative-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin-top: 24px;
  padding: 16px 20px;
  border-radius: $yp-radius-lg;
  background: $yp-success-soft;
  border: 1px solid rgba($yp-line-green, 0.25);

  &__icon {
    flex: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: $yp-line-green;
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 24px;
  }

  &__text {
    flex: 1 1 220px;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-weight: 700;
    color: $yp-ink;
  }

  &__desc {
    margin: 2px 0 0;
    font-size: 0.875rem;
    color: $yp-muted;
  }
}
</style>
