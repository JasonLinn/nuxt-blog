// LIFF SDK 一載入就會讀 sessionStorage，只能在瀏覽器載入（伺服器端 import 會 500）；
// 它也很大，延後載入可避免放進頁面的主要 JS。與 fetchUser 共用同一個模組，登入狀態一致。
let liffPromise = null

export const loadLiff = () => {
  if (!liffPromise) liffPromise = import('@line/liff').then((module) => module.default)
  return liffPromise
}
