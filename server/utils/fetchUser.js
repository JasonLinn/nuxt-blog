import liff from "@line/liff";
import { LIFF_ID } from "./liffID";

const fetchUser = async (data) => {
  console.log(useRoute(), 'eeeeeeeee', data)
    // web登入
    if (data) {
      const webProfile = {
        'userId': data.sub,
        'pictureUrl': data.picture,
        'displayName': data.name,
      }
      await insertUser(webProfile)
      webProfile.coupons = await getUserCoupons(webProfile)

      return webProfile
    }
    try {
        await liff.init({ liffId: LIFF_ID[useRoute().name] }); // Use own liffId
        const user = await liff.getProfile().then(async (profile) => {
          if (!liff.isLoggedIn()) {
            return;
          }
          //寫入DB
          await insertUser(profile)
          //獲取已領Coupon訊息
          profile.coupons = await getUserCoupons(profile)
          return profile
        })

        return user;

    }  catch (err) {
        console.log(`liff.state init error ${err}`);
    }
  };


  const insertUser = async (profile) => {
    await $fetch(`/api/user/user`, {
        method: 'POST',
          body: {
            name: profile.displayName,
            cover: profile.pictureUrl,
            user_id: profile.userId,
            coupons: [],
            msg_times: 0,
          }
      })
      .then((response) => {
        console.log(response, 'ppppp')
        // article.value.amount = response.amount
      })
      .catch((error) => alert(error))
  }

  const getUserCoupons = async (profile) => {
    return await $fetch(`/api/user/${profile.userId}`)
    .then((response) => {
      return response?.coupons
    })
    .catch((error) => alert(error))
  }

export default fetchUser;

