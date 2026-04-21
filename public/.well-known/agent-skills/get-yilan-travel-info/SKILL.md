---
name: get-yilan-travel-info
description: Get Yilan travel articles, tourist spots, events, and coupons. Use when users ask about things to do in Yilan, tourist attractions, travel itineraries, local food, or discount coupons for Yilan.
---

# 宜蘭旅遊資訊技能 (Get Yilan Travel Info)

## Overview

Use this skill to retrieve travel articles, nearby attractions, activities, and coupons from yilanpass.com.

## Articles

Retrieve travel articles and guides:

```http
GET https://yilanpass.com/api/articles
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Article category filter |
| `limit` | integer | Number of results (default: 10) |
| `page` | integer | Page number for pagination |

### Response Format

```json
{
  "articles": [
    {
      "id": "456",
      "title": "文章標題",
      "category": "景點推薦",
      "summary": "...",
      "published_at": "2025-04-01",
      "url": "https://yilanpass.com/articles/456"
    }
  ],
  "total": 100
}
```

## Nearby Attractions & Activities

```http
GET https://yilanpass.com/api/relative
```

Categories include:
- `景點` — Tourist attractions
- `美食` — Local cuisine
- `活動` — Events and activities
- `購物` — Shopping

## Yilan Outdoor Activities

```http
GET https://yilanpass.com/api/yilan-activities
```

## Coupons & Discounts

```http
GET https://yilanpass.com/api/coupons
```

Returns active discount coupons for homestays and attractions.

## Common Use Cases

**User asks "What are top attractions in Jiaoxi?"**
→ Call `/api/relative?category=景點&area=礁溪`

**User asks "Are there any events in Yilan this weekend?"**
→ Call `/api/yilan-activities` and filter by date

**User wants travel itinerary suggestions**
→ Call `/api/articles?category=行程規劃`
