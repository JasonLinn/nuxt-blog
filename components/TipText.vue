<template>
  <div class="tip-text-wrapper">
    <p class="tip-text-title"><Icon name="ri:alert-line" />旅遊通提醒</p>
    <ol class="tip-text-content">
      <li>店家有權修改優惠方案權利，本券不得與其他優惠方案合併使用。</li>
      <li>
        請務必於入場或使用時，出示電子票券的最新畫面（即時顯示）。截圖或非即時畫面將無法驗證或使用。
      </li>
    </ol>
  </div>
</template>

<style scoped lang="scss">
.tip-text-wrapper {
  text-align: left;
  margin: 12px 0 0;
  padding: 14px 16px;
  background: $yp-warning-soft;
  border-radius: $yp-radius;
  line-height: 1.6;
}

.tip-text-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  font-size: 0.875rem;
  font-weight: 700;
  color: #b45309;
}

.tip-text-content {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: $yp-muted;

  li + li {
    margin-top: 4px;
  }
}
</style>
