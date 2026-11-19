# Gemini API & Model Diagnostic Report

**Generated:** 2026-11-18 19:59:51 UTC  
**google-genai SDK Version:** `3.3.0`  
**API Key Format:** `AQ.Ab8...UsAw` (Google AI Studio)  
**Key Length:** 53 characters  

---

## 1. Executive Summary

- **Total models discovered via `client.models.list()`:** 28
- **Confirmed Active & Working Models:** `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`
- **Confirmed Deprecated / 404 Models:**
  - `gemini-2.5-flash`: **404 NOT_FOUND** (Deprecated for this key/endpoint)
  - `gemini-2.5-flash-lite`: **404 NOT_FOUND** (Deprecated for this key/endpoint)
  - `gemini-2.5-pro`: **404 NOT_FOUND** (Deprecated for this key/endpoint)
  - `gemini-2.0-flash`, `gemini-2.0-flash-lite`: **404 NOT_FOUND** (Deprecated)
  - `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-1.5-flash-8b`: **404 NOT_FOUND** (Not found in API v1)
- **High Demand / 503 Models:**
  - `gemini-3.5-flash`: **503 UNAVAILABLE** (Spikes in demand)
  - `gemini-3.8-flash`: **503 UNAVAILABLE** (Spikes in demand)

---

## 2. Test Results Matrix

| Model ID | Listed by API | Status | HTTP Code | Latency (ms) | Detail / Reason |
|---|---|---|---|---|---|
| `gemini-3.5-flash-lite` | Yes | **SUCCESS** | 200 | 4970.7 | Returned 'OK' |
| `gemini-3.1-flash-lite` | Yes | **SUCCESS** | 200 | 9365.8 | Returned 'OK' |
| `gemini-3.5-flash` | Yes | **FAILED** | 504 | 9383.3 | 504 DEADLINE_EXCEEDED. {'error': {'code': 504, 'message': 'Deadline expired befo |
| `gemini-3.8-flash` | Yes | **FAILED** | 503 | 1577.0 | 503 UNAVAILABLE. {'error': {'code': 503, 'message': 'This model is currently exp |
| `gemini-2.5-flash` | Yes | **FAILED** | 404 | 423.5 | 404 NOT_FOUND. {'error': {'code': 404, 'message': 'This model models/gemini-2.5- |
| `gemini-2.5-flash-lite` | Yes | **FAILED** | 404 | 450.9 | 404 NOT_FOUND. {'error': {'code': 404, 'message': 'This model models/gemini-2.5- |
| `gemini-2.5-pro` | Yes | **FAILED** | 404 | 366.5 | 404 NOT_FOUND. {'error': {'code': 404, 'message': 'This model models/gemini-2.5- |
| `gemini-2.0-flash` | No | **FAILED** | 404 | 787.0 | 404 NOT_FOUND. {'error': {'code': 404, 'message': 'This model models/gemini-2.0- |
| `gemini-2.0-flash-lite` | No | **FAILED** | 404 | 509.7 | 404 NOT_FOUND. {'error': {'code': 404, 'message': 'This model models/gemini-2.0- |
| `gemini-1.5-flash` | No | **FAILED** | 404 | 415.1 | 404 NOT_FOUND. {'error': {'code': 404, 'message': 'models/gemini-1.5-flash is no |
| `gemini-1.5-pro` | No | **FAILED** | 404 | 408.8 | 404 NOT_FOUND. {'error': {'code': 404, 'message': 'models/gemini-1.5-pro is not  |

---

## 3. Recommended Production Model Chain

Based on empirical testing:
1. **Primary Model:** `gemini-3.5-flash-lite`
2. **Secondary Fallback Model:** `gemini-3.1-flash-lite`
3. **Tertiary Fallback Model:** `gemini-3.8-flash` (Retried once on transient 503, fail fast if unavailable)

**Models Removed (Never to be called):**
- `gemini-2.5-flash` (404)
- `gemini-2.5-flash-lite` (404)
- `gemini-2.0-flash` (404)
- `gemini-1.5-flash` (404)
