import { LIFF_ID } from './liffID'

const fetchUser = async (profile) => {
  try {
    if (!profile) {
      try { profile = await $fetch('/api/line/session') } catch {
        const liffId = LIFF_ID[useRoute().name]
        // LIFF SDK 很大，只在需要 LINE 登入時才載入，避免放進每一頁的主要 JS
        const { default: liff } = await import('@line/liff')
        await liff.init({ liffId })
        if (!liff.isLoggedIn()) return
        const result = await $fetch('/api/line/session', { method: 'POST', body: { accessToken: liff.getAccessToken() } })
        profile = result.profile
      }
    }
    await $fetch('/api/user/user', { method: 'POST', body: { user_id: profile.userId } })
    const user = await $fetch(`/api/user/${profile.userId}`)
    return { ...profile, coupons: user.coupons }
  } catch { return null }
}
export default fetchUser
