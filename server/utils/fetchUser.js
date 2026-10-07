import liff from '@line/liff'
import { LIFF_ID } from './liffID'

const fetchUser = async (profile) => {
  try {
    if (!profile) {
      try { profile = await $fetch('/api/line/session') } catch {
        await liff.init({ liffId: LIFF_ID[useRoute().name] })
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
