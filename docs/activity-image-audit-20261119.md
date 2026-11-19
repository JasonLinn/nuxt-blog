# 宜蘭旅遊通活動結構化資料與圖片排查

## 正式資料修正（2026-11-19）

活動 82 已引用宜蘭縣政府活動官網為 12 月 6 日開幕踩街嘉年華指定的 800 × 500 px 分享圖，並在活動相簿標示子活動與圖片來源。原圖由活動官網提供，宜蘭旅遊通透過原網址顯示。[冬戀蘭陽溫泉季](https://yilanpass.com/yilan-activities/82) · [縣府活動官網原頁](https://www.yilanhotspring.com.tw/h/servicedetail?key=hhb9w&cont=328069)

另外 10 個活動的 23 張圖片已依相簿原順序換成同圖的大尺寸版本。匯入程式在來源再次提供縮圖時，會沿用該活動已刊登的同一張大圖，來源新增或移除照片時仍可正常更新。

正式站 62 個 Event 皆有圖片。11 個更新頁的公開 API、相簿首圖、社群預覽圖、Event 圖片順序與圖片來源連結均核對通過；24 張圖均成功解碼，寬度皆達 720 px。另外 51 個活動的結構化圖片清單與修正前相同。尚有 4 個未結束的 OPENTIX 活動和 20 個已結束活動僅有小圖。[逐頁網址與實測尺寸](evidence/activity-images-20261119/production.json)

## 修正前盤點

2026-11-19（台北時間）檢查正式站。當日 sitemap 收錄的 263 個網址皆回應 HTTP 200。其中 62 個活動詳情頁各自輸出一筆可解析的 Event，1 頁缺少圖片，另有 34 頁雖有圖，但每張都小於 Google 列出的最低圖片寬度 720 px。[正式站 sitemap](https://yilanpass.com/sitemap.xml) · [Google 活動結構化資料規格](https://developers.google.com/search/docs/appearance/structured-data/event#structured-data-type-definitions)

| Event 圖片狀態 | 進行中或尚未開始 | 已結束 | 合計 |
| --- | ---: | ---: | ---: |
| 缺少 `image` | 1 | 0 | 1 |
| 已填，每張寬度都小於 720 px | 14 | 20 | 34 |
| 至少一張寬度達 720 px | 5 | 22 | 27 |
| 合計 | 20 | 42 | 62 |

## 通知對應的活動

[2026 冬戀蘭陽溫泉季系列活動](https://yilanpass.com/yilan-activities/82)的公開資料回傳空的圖片陣列，畫面顯示「暫無活動圖片」。`buildActivitySeo` 在圖片清單為空時略過 Event 的 `image`，社群預覽圖則回退為網站標誌。匯入來源「台灣好湯」的活動內文當天沒有活動圖，該頁的分享圖是網站通用圖。補件應採用可使用且對應本屆活動的主視覺或照片，放進活動相簿後，既有模板即可同步輸出結構化圖片。[公開資料](https://yilanpass.com/api/yilan-activities/82) · [台灣好湯公告](https://taiwanhotspring.net/News-Content.aspx?a=4307&l=1) · [活動 SEO 程式](../utils/activity-seo.js)

## 其他欄位與頁型

- 62 個 Event 都有名稱、開始日期、地點與地址欄位，亦都有描述及結束日期。逐頁核對日期格式、起訖順序及 canonical，皆通過。地址品質仍有差異，模板會把同一個地點字串同時填入場館名稱和街道地址。例如活動 65 只有「宜蘭縣宜蘭境內」。[二結王公文化祭](https://yilanpass.com/yilan-activities/65)
- 13 頁輸出主辦單位，這些節點都有名稱與網址。其餘 49 頁省略主辦單位節點。62 頁都未輸出票券資訊或演出者，兩者都是 Google 建議欄位，可在活動適用且有可信資料時補上。[主辦單位比對規則](activity-organizer-schema.md) · [Google 欄位說明](https://developers.google.com/search/docs/appearance/structured-data/event#structured-data-type-definitions)
- 80 個民宿詳情頁中，78 頁的 LodgingBusiness 有圖片，2 頁缺圖。97 個優惠店家頁的 LocalBusiness 均有圖片。此處僅檢查這兩種頁型的圖片欄位有值，圖片連線與像素量測僅涵蓋活動頁。[好揪民宿](https://yilanpass.com/homestays/3140) · [東尼的家](https://yilanpass.com/homestays/1517)

## 圖片實測及可用來源

61 個有圖的活動共引用 82 個不同圖片網址，全部以公開 GET 取得 HTTP 200，並從圖片檔頭讀到 JPEG、PNG 或 WebP 格式與尺寸。50 張不足 720 px，包括宜蘭勁好玩的 29 張縮圖、OPENTIX 的 7 張 300 × 420 海報，以及站內的 14 張圖片。檢查圖片回應標頭與六個來源主機的 robots.txt 後，未發現命中這批路徑的爬取或索引封鎖規則。Google 實際擷取情況仍以 Search Console 為準。[Google 對 robots.txt 回應碼的處理](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#handling-http-result-codes)

14 個仍在進行或尚未開始、只有小圖的活動中，10 個在「宜蘭勁好玩」官方來源頁列出同圖的大尺寸版本。用文章圖片 ID 和檔名逐一比對，共 23 張，實測寬度皆達 720 px。下表每頁列一張可用範例，其餘 4 個活動的來源為 OPENTIX。

| 活動頁 | 目前圖片寬度（px） | 官方來源 | 同圖較大版本範例 |
| --- | ---: | --- | --- |
| [世紀初戀－楊麗花歌仔戲特展](https://yilanpass.com/yilan-activities/63) | 480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/event/192/) | [1024 × 1280 px](https://travel.yilan.gov.tw/_api/content/images/articles/27087/1024x768_articles-image-gizcakwmnk6f8xcexk-ehw.jpg) |
| [二結王公文化祭｜二結王公廟240週年系列活動](https://yilanpass.com/yilan-activities/65) | 480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/event/346/) | [1024 × 1448 px](https://travel.yilan.gov.tw/_api/content/images/articles/28047/1024x768_articles-image-7qr2sbjmska0cfrf3kv35a.jpg) |
| [雙子二重奏《初心》](https://yilanpass.com/yilan-activities/71) | 300 | OPENTIX | 待核對原始大圖 |
| [蘭燈之星 2026 新逸交響樂團年度公演](https://yilanpass.com/yilan-activities/72) | 300 | OPENTIX | 待核對原始大圖 |
| [2026 宜蘭冬山河超級馬拉松](https://yilanpass.com/yilan-activities/76) | 480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/news/272/) | [1900 × 768 px](https://travel.yilan.gov.tw/_api/content/images/articles/27577/1024x768_articles-image-lnb1jhvuyuundslbr2jt1q.jpg) |
| [2026礁溪溫泉馬拉松](https://yilanpass.com/yilan-activities/77) | 480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/news/307/) | [1024 × 1449 px](https://travel.yilan.gov.tw/_api/content/images/articles/27783/1024x768_articles-image-yrmar5tm5uoqeik85cunng.jpg) |
| [2026 礁溪溫泉燈花季](https://yilanpass.com/yilan-activities/83) | 479–480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/event/375/) | [2018 × 768 px](https://travel.yilan.gov.tw/_api/content/images/articles/28194/1024x768_articles-image-i5kycn-dxuw46_5maqhh_a.png) |
| [謝平安・龜遊傳藝｜跟著柑仔龜尋五福](https://yilanpass.com/yilan-activities/84) | 480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/event/363/) | [1024 × 1024 px](https://travel.yilan.gov.tw/_api/content/images/articles/28165/1024x768_articles-image-enisd3ccduaxumvmgqfm1g.jpg) |
| [感恩十載謝平安系列活動｜文化展示Ｘ平安遶境Ｘ民俗體驗](https://yilanpass.com/yilan-activities/85) | 480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/event/365/) | [1920 × 768 px](https://travel.yilan.gov.tw/_api/content/images/articles/28167/1024x768_articles-image-qx28yjvkjuqditr3z3jaqg.jpg) |
| [2027 杏輝宜蘭馬拉松](https://yilanpass.com/yilan-activities/87) | 480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/event/371/) | [1364 × 768 px](https://travel.yilan.gov.tw/_api/content/images/articles/28181/1024x768_articles-image-bcvmqyorp0ofnx9n7xxsmw.jpg) |
| [2026 紙廠電影院－中興57影展](https://yilanpass.com/yilan-activities/88) | 479–480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/event/376/) | [1078 × 768 px](https://travel.yilan.gov.tw/_api/content/images/articles/28198/1024x768_articles-image-ekyd_qvihusyekerodpeag.png) |
| [興創村市集｜復古派對](https://yilanpass.com/yilan-activities/89) | 480 | [宜蘭勁好玩](https://travel.yilan.gov.tw/zh-tw/event/377/) | [1024 × 1448 px](https://travel.yilan.gov.tw/_api/content/images/articles/28205/1024x768_articles-image-5iclzjazfu2ldk7xn0plag.jpg) |
| [宜蘭搖擺到紐約!-蘭燈爵士團新年音樂會](https://yilanpass.com/yilan-activities/91) | 300 | OPENTIX | 待核對原始大圖 |
| [奏樂·節律 2026聲納年度音樂會宜蘭合唱寓教於樂系列4](https://yilanpass.com/yilan-activities/92) | 300 | OPENTIX | 待核對原始大圖 |

另有 20 個已結束活動只提供小圖。活動編號為 [22](https://yilanpass.com/yilan-activities/22)、[30](https://yilanpass.com/yilan-activities/30)、[33](https://yilanpass.com/yilan-activities/33)、[35](https://yilanpass.com/yilan-activities/35)、[37](https://yilanpass.com/yilan-activities/37)、[39](https://yilanpass.com/yilan-activities/39)、[49](https://yilanpass.com/yilan-activities/49)、[51](https://yilanpass.com/yilan-activities/51)、[58](https://yilanpass.com/yilan-activities/58)、[59](https://yilanpass.com/yilan-activities/59)、[60](https://yilanpass.com/yilan-activities/60)、[66](https://yilanpass.com/yilan-activities/66)、[67](https://yilanpass.com/yilan-activities/67)、[68](https://yilanpass.com/yilan-activities/68)、[69](https://yilanpass.com/yilan-activities/69)、[70](https://yilanpass.com/yilan-activities/70)、[73](https://yilanpass.com/yilan-activities/73)、[74](https://yilanpass.com/yilan-activities/74)、[75](https://yilanpass.com/yilan-activities/75)、[86](https://yilanpass.com/yilan-activities/86)。

## 核對範圍

以 sitemap 列出的正式網址為母體，解析伺服器回傳的 HTML 與 JSON-LD，並以活動的台灣結束日期區分是否已結束。逐頁比對活動首圖與頁面顯示的圖片，並實測每個結構化圖片網址。720 px 是活動圖片的最低寬度，Google 建議寬度為 1920 px。此份紀錄反映公開頁面當日的狀態，Search Console 後台受影響網址、重新擷取及驗證狀態均待 Google 報表確認。
