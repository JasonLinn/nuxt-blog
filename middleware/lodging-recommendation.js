export default defineNuxtRouteMiddleware((to) => {
  // 舊住宿優惠入口改導向民宿推薦，避免暗示民宿提供優惠券。
  if (to.params.id === 'live' || (to.path === '/' && to.query.cate === 'live')) {
    return navigateTo('/homestay-list', { redirectCode: 302 })
  }
})
