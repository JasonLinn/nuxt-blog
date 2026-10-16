# 宜蘭旅遊通 Design System — Style A「蘭陽清新 Fresh Coast」

全站（前台＋後台）共用一套視覺語言。**新頁面與重構頁面一律照這份文件做。**
視覺參考：`docs/ui-style-proposals/A-fresh-coast.png`；實作範例：`pages/index.vue`。

## 1. 原則

1. **Bootstrap 5 + SCSS**，不使用 Tailwind。專案裡殘留的 Tailwind 類別（`flex`、`items-center`、`text-gray-500`、`w-full`、`max-w-4xl`、`mx-auto`、`px-6`…）**在這個專案是無效的**，重構時全部換成 Bootstrap utility 或 `.yp-*` 元件。
2. **先用共用元件，再寫 scoped style。** 能用 `.yp-*` / Bootstrap 元件就不要自己刻；scoped style 只放頁面獨有的版面。
3. **顏色只用 token。** 禁止在頁面寫死色碼（`#667eea`、`#764ba2` 紫色漸層、`#3b82f6`、`#613030` 等舊色全部移除）。SCSS 用 `$yp-*` 變數；inline / JS 用 `var(--yp-*)`。
4. **珊瑚紅（deal）只給「折扣 / 優惠值」用**，不要拿來當一般強調色或錯誤色（錯誤用 danger）。
5. **手機優先**：375px 寬要好用；觸控目標 ≥ 40px；底部有 64px 的 Tab Bar（`body.has-tabbar` 已自動留白）。
6. 載入、空資料、錯誤三種狀態都要有（`.yp-skeleton`、`.yp-empty`、`.yp-empty--error`）。
7. **不要改商業邏輯、API 呼叫、資料欄位、路由、SEO meta。** 只動 template 結構、class 與 style。

## 2. Tokens

SCSS 變數已自動注入每個 SFC（`assets/scss/_color.scss`、`_variables.scss`），直接用即可。

| 用途 | SCSS | CSS var | 值 |
|---|---|---|---|
| 主色（按鈕、選取） | `$yp-primary` | `--yp-primary` | #0A9EC0 |
| 主色深（文字連結、hover） | `$yp-primary-ink` | `--yp-primary-ink` | #076F87 |
| 主色淺底 | `$yp-primary-soft` | `--yp-primary-soft` | #E3F6FA |
| 折扣底色（白字） | `$yp-deal` | `--yp-deal` | #F2553D |
| 折扣文字 | `$yp-deal-ink` | `--yp-deal-ink` | #C9402B |
| 折扣淺底 | `$yp-deal-soft` | `--yp-deal-soft` | #FFEDEA |
| 主要文字 | `$yp-ink` | `--yp-ink` | #13303A |
| 次要文字 | `$yp-muted` | `--yp-muted` | #5E7780 |
| placeholder / 停用 | `$yp-subtle` | `--yp-subtle` | #8BA1A8 |
| 邊框 | `$yp-line` | `--yp-line` | #DCEBEF |
| 頁面底色 | `$yp-bg` | `--yp-bg` | #F6FAFB |
| 卡片底 | `$yp-surface` | `--yp-surface` | #FFFFFF |
| 次要底（表頭、segmented） | `$yp-surface-2` | `--yp-surface-2` | #EEF5F7 |
| 成功 / 警告 / 危險 | `$yp-success` / `$yp-warning` / `$yp-danger` | 同名 | #16A34A / #D97706 / #E5484D |
| 對應淺底 | `$yp-success-soft` … | 同名 | |
| LINE 綠 | `$yp-line-green` | `--yp-line-green` | #06C755 |

- 圓角：`$yp-radius-sm` 8px（按鈕、輸入框）、`$yp-radius` 12px、`$yp-radius-lg` 16px（卡片）、`$yp-radius-xl` 24px、`$yp-radius-pill`。
- 陰影：`$yp-shadow-sm`、`$yp-shadow`（卡片）、`$yp-shadow-lg`（搜尋框、浮層）。
- 字體：Noto Sans TC（全站）、Rubik（數字：加 `.yp-num` 或 `font-family: $yp-font-num`）。
- 斷點：`$yp-bp-sm` 576 / `$yp-bp-md` 768 / `$yp-bp-lg` 992 / `$yp-bp-xl` 1200。
- Bootstrap 主題色已對應：`primary`=水藍、`secondary`=muted、`danger`、`success`、`warning`、`info`、`light`=surface-2、`dark`=ink。

## 3. 字級

| 角色 | 大小 | 粗細 |
|---|---|---|
| 頁面標題 `.yp-page-head__title` | 24px（≥768: 30px） | 700 |
| 區塊標題 `.yp-section-head__title` | 18–20px | 700 |
| 卡片標題 | 16–17px | 600 |
| 內文 | 16px / line-height 1.6 | 400 |
| 輔助文字 | 13–14px，`$yp-muted` | 400 |
| 標籤 | 12px | 500 |
| 數字（Rubik） | 依情境 | 600 |

**字重上限 700，不使用 800 / 900。** 折扣值不要做成超大字，用票券標籤（見 `pages/articles/[id].vue` 的 `.detail-ticket`）或 `.yp-coupon__deal` 小標。

## 4. 版面

```html
<!-- 一般前台頁 -->
<div class="yp-page">            <!-- 前台與首頁共用自適應寬度，內距已含手機 / 桌機 -->
  <nav class="yp-breadcrumb"><NuxtLink to="/">首頁</NuxtLink><span>民宿</span></nav>
  <header class="yp-page-head">
    <div>
      <span class="yp-page-head__eyebrow">住宿服務</span>
      <h1 class="yp-page-head__title">宜蘭合法民宿推薦</h1>
      <p class="yp-page-head__desc">協會認證、安心入住</p>
    </div>
    <div class="yp-page-head__actions"><button class="btn btn-primary">…</button></div>
  </header>
  …
</div>
```

- 一般前台頁面、說明頁、導覽列與頁尾共用 `--yp-content-width: clamp(1200px, 90vw, 1560px)`，桌機容器另含左右各 24px 內距；手機維持左右各 16px。關於我們、使用規範與優惠詳情等頁面均與首頁內容邊界對齊。
- 表單頁保留 `.yp-page.yp-page--form`（760px）方便填寫；`.yp-page--narrow`（880px）僅供明確需要窄版的特殊內容使用，不套用於一般說明頁。
- 大型 Hero（列表頁首屏可用）：`.yp-hero > .yp-hero__inner` + `__eyebrow` / `__title`（`<em>` 會變主色）/ `__desc`。
- 詳情頁：`.yp-detail`（左內容、右側欄 340px，桌機側欄 sticky）+ `.yp-detail__aside`。

## 5. 元件速查

| 需求 | 用法 |
|---|---|
| 主要按鈕 | `btn btn-primary`；次要 `btn btn-outline-primary`；柔和 `btn btn-soft`；文字 `btn btn-ghost`；LINE `btn btn-line`；危險 `btn btn-outline-danger` / `btn-danger`；圓角膠囊加 `btn-pill`；含圖示加 `btn-icon` |
| 卡片容器 | `.yp-card`（可加 `--flat` 無陰影有框、`--hover` 浮起）；內部 `__media`（16:10 圖）、`__body`、`__title`、`__meta`、`__footer`、`__head` + `__head-title`、`__section` |
| 卡片網格 | `.yp-grid`（1 → 2 → 3 → 4 欄），三欄上限加 `.yp-grid--3`；也可用 Bootstrap `row g-3` + `col-*` |
| 優惠券卡 | `.yp-coupon`（見 `pages/index.vue`），圖片固定 2:1、以 contain 完整顯示，手機維持上圖下文；折扣值用 `utils/coupon-deal.js` 的 `extractDeal()` |
| 搜尋框 | `.yp-search` > `.yp-search__field`（`__icon` + `__input` + `__clear`）+ 可選 `select.form-select.yp-search__select` + `.btn` |
| 類別篩選 | `.yp-chips` > `button.yp-chip`（選取 `.is-active`；小尺寸 `--sm`；數量 `__count`）— **取代下拉選單** |
| 排序 / 切換 | `.yp-seg` > `button.yp-seg__btn.is-active` |
| 篩選工具列 | `.yp-toolbar` > `.yp-toolbar__group` |
| 區塊標題 | `.yp-section-head` > `h2.yp-section-head__title` + `a.yp-section-head__link` |
| 資訊標籤 | `.yp-tags` > `.yp-tag`（`--primary` / `--deal` / `--success` / `--warning` / `--danger`） |
| 審核狀態 | `.yp-status--pending` 待審、`--approved` 通過、`--rejected` 退回、`--draft` 草稿、`--info` |
| 統計 | 行內 `.yp-stats > span > b`；卡片 `.yp-stat-card`（`__label` / `__value` / `__hint`，色彩 `--primary` / `--warning` / `--success` / `--danger`）。**數值為 0 時不要顯示一排 0** |
| 空 / 錯誤 | `.yp-empty`（`__icon` / `__title` / `__text` + 按鈕），錯誤加 `.yp-empty--error` |
| Skeleton | `<span class="yp-skeleton" style="width:60%;height:16px">` |
| 分頁 | `.yp-pager` > `.yp-pager__btn`（`.is-active` / `.is-disabled`） |
| 表單 | 區塊 `.yp-form-section`（`__title` / `__desc`）；欄位用 Bootstrap `form-label`（必填加 `.required`）、`form-control`、`form-select`、`form-check`、`form-text`、`invalid-feedback`；送出列 `.yp-form-actions`（手機自動 sticky）；上傳區 `.yp-upload`（拖曳中 `.is-dragover`） |
| 資訊列表 | `ul.yp-info-list > li > span.yp-info-list__label + span.yp-info-list__value` |
| 富文字內容 | 包在 `.yp-prose` 內（Quill 列表、引用樣式已處理） |
| 文字截斷 | `.yp-clamp-1` / `-2` / `-3` |
| Modal | Bootstrap `.modal` 結構（圓角、陰影已調好）；自製 modal 也請套用相同視覺：白底、16px 圓角、`$yp-shadow-lg`、遮罩 `rgba(19,48,58,.45)` |
| 輕提示 | `.yp-toast` |
| 圖示 | `<Icon name="ri:...">`（Remix Icon，nuxt-icon）。不要用 emoji 當 UI 圖示 |

Bootstrap 元件全部可用：`card`、`badge`、`alert`、`nav` / `nav-tabs` / `nav-pills`、`dropdown`、`pagination`、`list-group`、`progress`、`spinner-border`、`placeholder`、`breadcrumb`、`btn-group`、`modal`、`table`。

## 6. 後台

- 後台頁面 `definePageMeta({ layout: 'admin', middleware: … })`，**移除頁面內的 `<AdminHeader />`**。側欄選單定義在 `utils/site-nav.js` 的 `adminMenu`。
- 頁首：`.yp-admin-head` > `div`（`h1.yp-admin-head__title` + `p.yp-admin-head__desc`）+ `.yp-admin-head__actions`。
- 統計列：`.yp-admin-stats` > `.yp-stat-card`。
- 篩選列：`.yp-filter-bar`（裡面直接放 `form-control` / `form-select` / `btn`；搜尋框加 `.yp-filter-bar__search`）。
- 表格：`.yp-table-wrap` > `.table-responsive` > `table.table.table-hover`；縮圖 `.yp-table-thumb`；操作欄 `.yp-row-actions`（`btn btn-sm btn-soft` / `btn-outline-danger`）；底部 `.yp-table-wrap__footer`（筆數 + 分頁）。手機轉卡片：table 加 `.yp-table-stack`，每個 `td` 加 `data-label="欄位名"`。
- 登入頁（後台、民宿業者）：`.yp-auth > .yp-auth__card`（`__logo` / `__title` / `__desc`），頁面 `layout: false`。
- 民宿業者後台（`/homestay-admin`）沿用前台 layout，但內容用後台元件（stat-card、table-wrap、form-section）。

## 7. 檔案位置

```
assets/scss/_color.scss        色彩 token（注入每個 SFC，只能放變數）
assets/scss/_variables.scss    尺寸 token + Bootstrap 覆寫（注入每個 SFC，只能放變數）
assets/scss/design/_tokens.scss      :root CSS 變數
assets/scss/design/_base.scss        全站基礎
assets/scss/design/_components.scss  共用元件
assets/scss/design/_coupon.scss      優惠券卡
assets/scss/design/_admin.scss       後台框架
layouts/default.vue  前台（Header + Footer + 手機 Tab Bar）
layouts/admin.vue    後台（側欄）
utils/site-nav.js    所有導覽設定
```

共用檔案（上列）由設計系統維護者修改；頁面重構時若需要新元件，先在頁面 scoped style 實作，並在交付說明中提出。
