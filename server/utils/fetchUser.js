import liff from "@line/liff";

const fetchUser = async () => {
    try {
        await liff.init({ liffId: "2005661804-zld9QenV" }); // Use own liffId
        const user = await liff.getProfile().then(profile => {
          if (!liff.isLoggedIn()) {
            return;
          }
          //寫入DB
          insertUser(profile)

          return profile
        })

        return user;

    }  catch (err) {
        console.log(`liff.state init error ${err}`);
    }
  };


  const insertUser = async (profile) => {
    console.log(profile, 'iiiiiiii')
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

export default fetchUser;

