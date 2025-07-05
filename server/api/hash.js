export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { hash, couponId, userId } = body

    if (!hash || !couponId || !userId) {
      throw createError({
        statusCode: 400,
        message: "缺少必要參數"
      })
    }

    // 從數據庫獲取優惠券信息
    const { data: coupon } = await $fetch(`/api/articles/${couponId}`)
    
    if (!coupon) {
      throw createError({
        statusCode: 404,
        message: "找不到該優惠券"
      })
    }

    // 檢查序號是否存在且未使用
    const hashIndex = coupon.hash.indexOf(hash)
    if (hashIndex === -1) {
      throw createError({
        statusCode: 400,
        message: "無效的序號"
      })
    }

    // 檢查序號是否已被使用
    if (coupon.usedHash && coupon.usedHash.includes(hash)) {
      throw createError({
        statusCode: 400,
        message: "此序號已被使用"
      })
    }

    // 更新優惠券，將序號標記為已使用
    const usedHash = coupon.usedHash || []
    usedHash.push(hash)

    await $fetch(`/api/articles/${couponId}`, {
      method: 'PATCH',
      body: {
        usedHash
      }
    })

    // 記錄使用記錄
    await $fetch('/api/received', {
      method: 'POST',
      body: {
        coupon_id: couponId,
        coupon_title: coupon.title,
        coupon_content: coupon.content,
        user_id: userId,
        hash: hash,
        received_time: new Date()
      }
    })

    return {
      success: true,
      message: "序號使用成功"
    }

  } catch (error) {
    console.error('序號驗證錯誤:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "服務器錯誤，請稍後再試"
    })
  }
}) 