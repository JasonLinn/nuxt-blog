<template>
    <div class="container">
        <div class="row">
            <!-- <div id="userId">{{coupons}}</div> -->
            <!-- <textarea name="" id="" cols="30" rows="10" v-model="text"></textarea> -->
            <h2 class="cupon-geted">{{userName}} 您好，以下是已領優惠券：</h2>
            <hr>
            <div v-if="coupons" class="coupon-list">
                <div v-if="!coupons?.length">尚未領取優惠券</div>
                <Icon v-if="!coupons?.length" class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
                <article
                    v-for="(coupon, index) in coupons"
                    :key="coupon.id + index"
                    class="cupon col-md-3"
                    >
                    <div class="coupon-wrapper">
                    <div class="coupon">
                        <div class="header">
                          <span class="coupon-title">{{ coupon.title }}</span>
                        </div>
                        <div class="barcode">
                          <Carousel>
                          <Slide v-for="img in coupon.cover" :key="img">
                            <img :src="img" class="cupon-img" />
                          </Slide>

                          <template #addons="{ slidesCount }">
                            <Navigation v-if="slidesCount > 1" />
                            <Pagination v-if="slidesCount > 1" />
                          </template>
                        </Carousel>
                        </div>
                        <div class="cupon-line"></div>
                        <AccordionRoot
                          class="AccordionRoot"
                          default-value="'item-1'"
                          type="single"
                          :collapsible="true"
                        >
                            <AccordionItem
                              class="AccordionItem"
                              value="item.value"
                            >
                              <AccordionHeader class="AccordionHeader">
                                <AccordionTrigger class="AccordionTrigger">
                                  <span>查看使用說明</span>
                                  <Icon
                                    icon="radix-icons:chevron-down"
                                    class="AccordionChevron"
                                    aria-label="Expand/Collapse"
                                  />
                                </AccordionTrigger>
                              </AccordionHeader>
                              <AccordionContent class="AccordionContent">
                                <div class="AccordionContentText">
                                  {{ coupon.content }}
                                </div>
                                <TipText/>
                              </AccordionContent>
                            </AccordionItem>
                        </AccordionRoot>
                        <table class="coupon-info-table">
                          <tbody>
                            <tr class="coupon-info-tr">
                              <td class="coupon-info-title">推薦店家：</td>
                              <td>{{ coupon.referral?.name || '無' }}</td>
                            </tr>
                            <tr class="coupon-info-tr">
                              <td class="coupon-info-title">兌換序號：</td>
                              <td>{{ coupon.hash[0] || '無' }}</td>
                            </tr>
                            <tr class="coupon-info-tr" v-if="coupon.qrCodeData">
                              <td class="coupon-info-title">條碼：</td>
                              <td>
                                <canvas :id="'barcode-' + index"></canvas>
                              </td>
                            </tr>
                            <tr class="coupon-info-tr">
                              <td class="coupon-info-title">使用期限：</td>
                              <td>2025/6/30</td>
                            </tr>
                          </tbody>
                        </table>
                        <button class="btn coupon-button-received" v-if="coupon.received">已兌換</button>
                        <button
                          class="coupon-button"
                          @click="received"
                          :id="coupon.gotTime"
                          v-if="!coupon.received"
                        >請店員點擊兌換</button>
                        <div class="coupon-footer" v-if="!coupon.received">此按鈕請交由門市人員點擊</div>
                    </div>
                    </div>
                    <!-- <time class="order-first mb-3 mt-1 hidden items-center text-sm text-gray-400 md:flex">
                        {{ date2LocaleString(article.updated_at) }}
                    </time> -->
                    </article>
            </div>
        </div>
    </div>
</template>

<script setup>
import useStore from "~~/store";
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'radix-vue'
import { Icon } from '@iconify/vue'
import { ref, onMounted } from 'vue'

const store = useStore();
const userName = store.getUserDisplayName
const userId = store.getUserId
store.getCoupons(userId)
const coupons = computed(() => store.getUserCoupons)

const accordionItems = [
  {
    value: 'item-1',
    title: 'Is it accessible?',
    content: 'Yes. It adheres to the WAI-ARIA design pattern.',
  },
  {
    value: 'item-2',
    title: 'Is it unstyled?',
    content: 'Yes. It\'s unstyled by default, giving you freedom over the look and feel.',
  },
  {
    value: 'item-3',
    title: 'Can it be animated?',
    content: 'Yes! You can use the transition prop to configure the animation.',
  },
]

// const userI = store.getUserInfo
// const data =''
// onMounted(() => {
//   const { pending, data: user, error } = useFetch(`/api/user/${userId}`)
// })

const items = [
  "{\"id\":48,\"title\":\"蘇澳冷泉丨VIP、頂級湯屋\",\"category\":\"play\",\"content\":\"蘇澳冷泉二樓VIP湯屋及頂級湯屋，限定2人一間作折扣，\\n需現場排隊不可預約 ，折價150元\",\"cover\":[\"https://yilanpass.com/shop/play/cold1.jpg\",\"https://yilanpass.com/shop/play/cold2.jpg\",\"https://yilanpass.com/shop/play/cold3.JPG\"],\"amount\":9993,\"used_times\":0,\"isReferral\":false,\"hash\":[\"\"],\"updated_at\":\"2024-10-11T06:02:36.140Z\",\"referral\":null}",
  "{\"id\":47,\"title\":\"陳家庄農園丨米果丨米餅丨伴手禮\",\"category\":\"buy\",\"content\":\"優惠內容：\\n1.陳家庄米果袋裝3包$250優惠，原價$108/包\\n2.陳家庄米餅罐裝3罐$500優惠，原價$200/罐\\n3.宜蘭嚴選居仁米一箱$1000+免運費（居仁米3.5公斤✖️5包）原價$1250\\n\\n\\n\\n了解更多農園近況歡迎臉書&IG追蹤我們\\n臉書：陳家庄農園\\nIG：228sandy\\nLINE：@riceshop\\n聯繫電話： TEL:0971005171\\n陳家庄官網： https://www.rice-shop.com.tw/about.html \",\"cover\":[\"https://yilanpass.com/shop/buy/chen_farm1.jpeg\",\"https://yilanpass.com/shop/buy/chen_farm.jpeg\",\"https://yilanpass.com/shop/buy/chen_farm2.jpeg\"],\"amount\":9988,\"used_times\":0,\"isReferral\":false,\"hash\":[\"\"],\"updated_at\":\"2024-09-26T00:56:48.254Z\",\"referral\":null}",
  "{\"id\":47,\"title\":\"陳家庄農園丨米果丨米餅丨伴手禮\",\"category\":\"buy\",\"content\":\"優惠內容：\\n1.陳家庄米果袋裝3包$250優惠，原價$108/包\\n2.陳家庄米餅罐裝3罐$500優惠，原價$200/罐\\n3.宜蘭嚴選居仁米一箱$1000+免運費（居仁米3.5公斤✖️5包）原價$1250\\n\\n\\n\\n了解更多農園近況歡迎臉書&IG追蹤我們\\n臉書：陳家庄農園\\nIG：228sandy\\nLINE：@riceshop\\n聯繫電話： TEL:0971005171\\n陳家庄官網： https://www.rice-shop.com.tw/about.html \",\"cover\":[\"https://yilanpass.com/shop/buy/chen_farm1.jpeg\",\"https://yilanpass.com/shop/buy/chen_farm.jpeg\",\"https://yilanpass.com/shop/buy/chen_farm2.jpeg\"],\"amount\":9987,\"used_times\":0,\"isReferral\":false,\"hash\":[\"\"],\"updated_at\":\"2024-09-26T00:56:48.254Z\",\"referral\":null}"
].map((item)=> JSON.parse(item)).sort((a, b)=> new Date(a.updated_at) - new Date(b.updated_at))
const fakeUser = {
  id: 11,
  name: 'Jason Lin',
  user_id: 'U6a5aaa9d07c1d3742e19ccbdbe3b9e4a',
  cover: 'https://profile.line-scdn.net/0hsDb-1A3zLGtPVDyaTipSFD8ELwFsJXV5ZWBlWioGdAknZmxuYjdjXn9dJQh1ZW85ZjE2DXxXJVlDR1sNUQLQX0hkcVpzYGw6YztiiA',
  coupons: [
    '{"id":35,"title":"農場","category":"buy","content":"GOOD","cover":"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg","amount":9952,"used_times":0,"hash":[""],"updated_at":"2024-07-24T06:05:16.617Z"}',
    '{"id":35,"title":"農場","category":"buy","content":"GOOD","cover":"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg","amount":9951,"used_times":0,"hash":[""],"updated_at":"2024-07-24T06:21:04.378Z"}',
    '{"id":35,"title":"農場","category":"buy","content":"GOOD","cover":"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg","amount":9950,"used_times":0,"hash":[""],"updated_at":"2024-07-24T06:28:24.715Z"}',
    '{"id":34,"title":"好玩","category":"play","content":"好玩a1","cover":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDF4NhElQATrC2VFZyaEUenGHyU0voLS-s8A&s","amount":1999993,"used_times":0,"hash":["a1","a2"],"updated_at":"2024-07-13T04:27:39.043Z"}',
  ],
  msg_times: 0,
  join_at: "2024-07-24T06:19:34.744Z"
}
// user.map((item)=> {
//     console.log(JSON.parse(item).title, 'kkkkkk')
// })

const received = (e) => {
  const getted = confirm("是否確認兌換?");
  let couponGetted = {}

  if (getted) {
    let newCoupons = coupons.value.map((objectCoupon)=> {
      if (objectCoupon.gotTime == e.target.id) {
        objectCoupon.received = true
        objectCoupon.receivedTime = new Date()
        couponGetted = objectCoupon

        return couponGetted
      }

      return objectCoupon
    })

    $fetch('/api/received', {
      method: 'POST',
      body: {
        coupon_title: couponGetted.title,
        coupon_id: couponGetted.id,
        coupon_content: couponGetted.content,
        user_id: userId || 0,
        user_name: userName || 'undefined',
        remark: '',
        received_time: couponGetted.receivedTime
      }
    })
      .then((response) => {
        console.log(response)
      })
      .catch((error) => alert(error))


    $fetch(`/api/user/updateCoupon`, {
      method: 'PATCH',
        body: {
          coupons: newCoupons,
          userId: userId,
        }
    })
    .then(async () => {
      alert('已標註兌換!')
      await store.setCoupons(newCoupons)
    })
    .catch((error) => alert(error))
  }
}

const nextTick = ref(null)

// 添加條碼生成函數
const generateBarcode = async (canvas, text) => {
  if (process.client) {
    const JsBarcode = (await import('jsbarcode')).default;
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 5
    });
  }
}

onMounted(() => {
  // 在組件掛載後生成條碼
  nextTick(async () => {
    coupons.value?.forEach(async (coupon, index) => {
      if (coupon.qrCodeData) {
        const canvas = document.getElementById(`barcode-${index}`)
        if (canvas) {
          await generateBarcode(canvas, coupon.qrCodeData)
        }
      }
    })
  })
})
</script>

<style lang="scss" scoped>
.coupon-list {
  overflow: hidden;
}
.cupon-geted {
  font-weight: bold;
  margin-bottom: 10px;
  margin-top: 10px;
  font-size: 16px;
  text-align: left;
}
.cupon-line {
  position: relative;
  border-top: 5px dotted #7c7c7c;
  margin-bottom: 20px;
}
.cupon-line::after {
  position: absolute;
  content: "";
  height: 40px;
  right: -45px;
  border-radius: 40px;
  z-index: 1;
  top: -25px;
  background-color: #fff;
  width: 40px;
}

.cupon-line::before {
  position: absolute;
  content: "";
  height: 40px;
  left: -45px;
  border-radius: 40px;
  z-index: 1;
  top: -25px;
  background-color: #fff;
  width: 40px;
}
.cupon-wrapper {
  // border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}
.cupon-wrapper:hover {
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
}
.cupon-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}
.cupon-info {
  padding: 5px 8px 15px 8px;
  background-color: #fff;
}
.cupon-info:hover {
  box-shadow: #000;
}
.cupon-img-wrapper {
  height: 200px;
  overflow: hidden;
}
.cupon-img {
  display: inline-block;
  width: 100%;
  max-height: 165px;
  object-fit: cover;
  border-radius: 10px;
}
.cupon-category {
  display: inline-block;
  font-size: 14px;
  padding: 3px;
  color: rgb(117, 117, 117);
  background-color: rgb(245, 245, 245);
  margin-bottom: 10px;
}
.card {
  width: 100%;
  height: 180px;
  border-radius: 5px;
  box-shadow: 0 4px 6px 0 rgba(0, 0, 0, 0.2);
  background-color: #ffcccc;
  padding: 10px 10px;
  position: relative;
}

.main,
.copy-button {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  align-items: center;
}
.card-wrapper {
  overflow: hidden;
}


.co-img img {
  width: 100px;
  height: 100px;
}
.vertical {
  border-left: 5px dotted black;
  height: 100px;
  position: absolute;
  left: 40%;
}

.content h1 {
  font-size: 35px;
  margin-left: -20px;
  color: #565656;
}

.content h1 span {
  font-size: 18px;
}
.content h2 {
  font-size: 18px;
  margin-left: -20px;
  color: #565656;
  text-transform: uppercase;
}

.content p {
  font-size: 16px;
  color: #696969;
  margin-left: -20px;
}

.copy-button {
  margin: 12px 0 -5px 0;
  height: 45px;
  border-radius: 4px;
  padding: 0 5px;
  border: 1px solid #e1e1e1;
}

.copy-button input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  font-size: 15px;
}

.copy-button button {
  padding: 5px 20px;
  background-color: #fff;
  color: #fff;
  border: 1px solid transparent;
}
.coupon {
    background-color: #e5f5ff;
    border-radius: 15px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    position: relative;
    padding: 10px;
    margin-bottom: 40px;
}
.coupon-info-table {
  margin-top: 15px;
  text-align: left;
  margin-bottom: 15px;
}
.coupon-info-title {
  width: 90px;
  padding: 3px 0;
}
// .coupon::before {
//     content: "";
//     display: block;
//     background-color: #e5f5ff;
//     width: 40px;
//     height: 40px;
//     border-radius: 50%;
//     position: absolute;
//     top: -20px;
//     right: 0;
//     left: 0;
//     margin: auto;
// }

.header {
    font-size: 16px;
}
.coupon-title {
  font-weight: bold;
  font-size: 20px;
}

.timer {
    margin: 20px 0;
    font-size: 18px;
    color: #333;
}

.barcode {
    margin: 10px 0;
}

.coupon-button {
    background-color: #00cc99;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.coupon-button-received {
  height: 36px;
  background-color: #ccc;
  color: #fff;
}

.coupon-footer {
    margin: 10px 0;
    color: #ff5858;
    font-size: 12px;
}
.AccordionRoot {
  border-radius: 6px;
  background-color: var(--mauve-6);
  box-shadow: 0 2px 10px var(--black-a4);
}

.AccordionItem {
  overflow: hidden;
  margin-top: 1px;
}

.AccordionItem:first-child {
  margin-top: 0;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.AccordionItem:last-child {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.AccordionItem:focus-within {
  position: relative;
  z-index: 1;
  box-shadow: 0 0 0 2px var(--mauve-12);
}

.AccordionHeader {
  display: flex;
}

.AccordionTrigger {
  font-family: inherit;
  background-color: transparent;
  padding: 0 20px;
  height: 45px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  line-height: 1;
  color: var(--grass-11);
  box-shadow: 0 1px 0 var(--mauve-6);
  background-color: white;
}

.AccordionTrigger:hover {
  background-color: var(--mauve-2);
}

.AccordionContent {
  overflow: hidden;
  font-size: 15px;
  color: var(--mauve-11);
  background-color: var(--mauve-2);
}
.AccordionContent[data-state='open'] {
  animation: slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1);
}
.AccordionContent[data-state='closed'] {
  animation: slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1);
}

.AccordionContentText {
  padding: 15px 10px;
  white-space: pre-wrap;
  text-align: left;
  border: 1px dashed;
}

.AccordionChevron {
  color: var(--grass-10);
  transition: transform 300ms cubic-bezier(0.87, 0, 0.13, 1);
}
.AccordionTrigger[data-state='open'] > .AccordionChevron {
  transform: rotate(180deg);
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}
</style>