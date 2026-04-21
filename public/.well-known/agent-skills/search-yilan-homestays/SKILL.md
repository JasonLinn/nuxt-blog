---
name: search-yilan-homestays
description: Search and discover legal homestays in Yilan, Taiwan. Use when users ask about accommodations, lodging, or places to stay in Yilan. Supports filtering by area, features (family-friendly, pet-friendly, ocean view, private villa, pool, KTV, BBQ), capacity, and availability dates.
---

# 宜蘭民宿搜尋技能 (Search Yilan Homestays)

## Overview

Use this skill to search for legal homestays listed on yilanpass.com — the official Yilan Tourism Homestay Marketing Association platform.

## Quick Start

To search for homestays, call the `/api/fetchBnbs` endpoint:

```http
GET https://yilanpass.com/api/fetchBnbs
```

### Common Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `area` | string | District in Yilan | `礁溪鄉`, `羅東鎮`, `宜蘭市` |
| `tags` | string | Comma-separated features | `親子,寵物`, `海景,包棟` |
| `checkIn` | string | Check-in date (YYYY-MM-DD) | `2025-06-01` |
| `checkOut` | string | Check-out date (YYYY-MM-DD) | `2025-06-03` |
| `capacity` | integer | Number of guests | `4` |

### Feature Tags Available

- `親子` — Family-friendly (children welcome)
- `寵物` — Pet-friendly
- `海景` — Ocean view
- `包棟` — Private villa / full property rental
- `戲水池` — Swimming / wading pool
- `KTV` — Karaoke room
- `烤肉` — BBQ facilities

## Example Requests

**Search pet-friendly homestays in Jiaoxi:**
```
GET /api/fetchBnbs?area=礁溪鄉&tags=寵物
```

**Search family homestays with pool:**
```
GET /api/fetchBnbs?tags=親子,戲水池&capacity=6
```

## Response Format

Returns an array of homestay objects:

```json
[
  {
    "id": "123",
    "name": "民宿名稱",
    "area": "礁溪鄉",
    "description": "...",
    "features": ["親子", "戲水池"],
    "price_min": 3000,
    "price_max": 8000,
    "images": ["https://..."],
    "rating": 4.8
  }
]
```

## Get Detailed Information

For full details including room types, pricing calendar, and exact location:

```http
GET https://yilanpass.com/api/fetchBnbDetail?id={homestay_id}
```
