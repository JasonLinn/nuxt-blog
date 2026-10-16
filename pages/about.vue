<template>
  <div class="yp-page">
    <nav class="yp-breadcrumb" aria-label="breadcrumb">
      <NuxtLink to="/">首頁</NuxtLink><span>關於我們</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">宜蘭觀光民宿行銷協會・官方平台</span>
        <h1 class="yp-page-head__title">宜蘭旅遊通</h1>
        <p class="yp-page-head__desc">讓旅遊更簡單，更環保</p>
      </div>
    </header>

    <section class="yp-card yp-card__section about-block">
      <h2 class="about-block__title">關於我們</h2>
      <p class="about-block__text mb-0">
        歡迎來到
        <strong>宜蘭旅遊通</strong
        >！我們是由「宜蘭觀光民宿行銷協會」發起的數位旅遊平台，提供在地店家的免費電子優惠券、合法民宿推薦與旅遊資訊。旅客可以領取店家優惠券，也能依地區、人數與特色尋找合適的合法民宿，輕鬆規劃宜蘭旅程。
      </p>
    </section>

    <h2 class="yp-section-head__title about-heading">我們的使命</h2>
    <div class="row g-3">
      <div v-for="item in missions" :key="item.title" class="col-12 col-md-4">
        <div class="yp-card yp-card--flat about-feature h-100">
          <div class="about-feature__icon"><Icon :name="item.icon" /></div>
          <h3 class="about-feature__title">{{ item.title }}</h3>
          <p class="about-feature__text">{{ item.text }}</p>
        </div>
      </div>
    </div>

    <h2 class="yp-section-head__title about-heading">我們的特色</h2>
    <div class="row g-3">
      <div v-for="item in features" :key="item.title" class="col-12 col-md-4">
        <div class="yp-card yp-card--flat about-feature h-100">
          <div class="about-feature__icon about-feature__icon--alt"><Icon :name="item.icon" /></div>
          <h3 class="about-feature__title">{{ item.title }}</h3>
          <p class="about-feature__text">{{ item.text }}</p>
        </div>
      </div>
    </div>

    <section class="yp-card yp-card__section about-block about-block--last">
      <h2 class="about-block__title">為什麼選擇我們？</h2>
      <p class="about-block__text">
        宜蘭旅遊通不僅僅是優惠券平台，更是旅遊生活的好夥伴。我們希望每一位旅客都能透過宜蘭旅遊通，探索宜蘭的美好，留下難忘的回憶！
      </p>
      <p class="about-block__text fw-bold mb-0">
        一起踏上便捷與綠色的旅程吧！宜蘭旅遊通，讓旅遊更簡單！
      </p>
    </section>

    <section class="about-cta">
      <div>
        <h2 class="about-cta__title">開始探索宜蘭優惠</h2>
        <p class="about-cta__desc">免費領券，手機出示就能用。</p>
      </div>
      <NuxtLink to="/" class="btn btn-primary btn-pill">逛逛優惠券</NuxtLink>
    </section>
  </div>
</template>

<script setup>
useSeoMeta({
  title: '關於我們 - 宜蘭旅遊通',
  description:
    '宜蘭旅遊通由宜蘭觀光民宿行銷協會發起，提供在地店家的免費電子優惠券、合法民宿推薦與旅遊資訊，協助旅客規劃宜蘭旅程。',
  canonical: 'https://yilanpass.com/about'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/about'
    }
  ]
})

const missions = [
  {
    icon: 'ri:smartphone-line',
    title: '便捷旅遊',
    text: '提供直觀易用的平台，將優惠資訊一網打盡。'
  },
  {
    icon: 'ri:leaf-line',
    title: '環保未來',
    text: '以數位化取代紙本，減少浪費，為地球盡一份心力。'
  },
  {
    icon: 'ri:store-2-line',
    title: '促進商機',
    text: '串聯宜蘭在地商家與旅客，創造雙贏局面，推動地方經濟發展。'
  }
]

const features = [
  { icon: 'ri:flashlight-line', title: '即時優惠', text: '隨時更新宜蘭最新、最熱門的優惠活動。' },
  {
    icon: 'ri:search-eye-line',
    title: '智慧搜尋',
    text: '根據用戶需求推薦最適合的旅遊優惠與行程。'
  },
  { icon: 'ri:device-line', title: '多平台支援', text: '無論是手機、平板或電腦，都能輕鬆使用。' }
]
</script>

<style scoped lang="scss">
.about-heading {
  margin: 28px 0 14px;
}

.about-block {
  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 12px;
  }

  &__text {
    line-height: 1.85;
    color: #24434c;
    margin-bottom: 1em;
  }

  &--last {
    margin-top: 28px;
  }
}

.about-feature {
  padding: 20px;

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: $yp-radius;
    background: $yp-primary-soft;
    color: $yp-primary;
    display: grid;
    place-items: center;
    font-size: 24px;
    margin-bottom: 12px;

    &--alt {
      background: $yp-surface-2;
      color: $yp-primary-ink;
    }
  }

  &__title {
    font-size: 1.0625rem;
    font-weight: 700;
    margin: 0 0 6px;
  }

  &__text {
    color: $yp-muted;
    margin: 0;
    line-height: 1.7;
  }
}

.about-cta {
  margin-top: 32px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: $yp-radius-lg;
  background: linear-gradient(120deg, $yp-primary-soft, #fff1ec);

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 4px;
  }

  &__desc {
    color: $yp-muted;
    margin: 0;
  }
}
</style>
