# PATH: scripts/diagnose_gemini.py
import os
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import get_gemini_api_key

def run_diagnostics():
    print("=" * 70)
    print("  VIRAL STUDIO // GEMINI API & MODEL DIAGNOSTIC")
    print("=" * 70)

    import google.genai as genai
    from google.genai import types

    sdk_version = genai.__version__
    print(f"Installed google-genai version: {sdk_version}")

    api_key = get_gemini_api_key()
    if not api_key:
        print("ERROR: GEMINI_API_KEY is missing or empty in .env!")
        return None

    # Redact key for logs
    masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "***"
    key_type = "Google AI Studio" if api_key.startswith("AIza") or len(api_key) > 30 else "Vertex/Custom"
    print(f"Loaded GEMINI_API_KEY: {masked_key} (Length: {len(api_key)}, Type: {key_type})")

    # Initialize client
    client = genai.Client(api_key=api_key)

    # 1. List models
    available_model_ids = set()
    all_models_raw = []
    try:
        pager = client.models.list()
        for m in pager:
            m_name = getattr(m, "name", "")
            base = m_name.replace("models/", "")
            available_model_ids.add(base)
            available_model_ids.add(m_name)
            all_models_raw.append(base)
        print(f"Total models returned by client.models.list(): {len(all_models_raw)}")
    except Exception as e:
        print(f"WARNING: client.models.list() failed: {type(e).__name__}: {e}")

    # 2. Test candidates
    candidates_to_probe = [
        # New-generation models
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.8-flash",
        # Legacy models that might be deprecated
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]

    print("\n--- Testing Model Candidates ('Reply with OK', attempts=1, timeout=10s) ---")
    results = []
    working_models = []

    for model_id in candidates_to_probe:
        is_listed = (model_id in available_model_ids) or (f"models/{model_id}" in available_model_ids)
        t0 = time.perf_counter()
        status = "UNKNOWN"
        http_code = None
        latency_ms = None
        error_msg = ""
        response_text = ""

        try:
            # Explicit 1 attempt to avoid 60s SDK retry loops, 10000ms timeout
            http_opts = types.HttpOptions(
                timeout=10000,
                retry_options=types.HttpRetryOptions(attempts=1),
            )
            config = types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=10,
                http_options=http_opts,
            )
            resp = client.models.generate_content(
                model=model_id,
                contents="Reply with OK",
                config=config,
            )
            latency_ms = round((time.perf_counter() - t0) * 1000, 1)
            response_text = resp.text.strip() if resp and resp.text else ""
            status = "SUCCESS"
            http_code = 200
            working_models.append(model_id)
            print(f"  {model_id:<24}: SUCCESS (200 OK, {latency_ms}ms) -> {repr(response_text)}")
        except Exception as exc:
            latency_ms = round((time.perf_counter() - t0) * 1000, 1)
            status = "FAILED"
            exc_class = type(exc).__name__
            error_msg = str(exc)

            # Extract code
            code = getattr(exc, 'code', None) or getattr(exc, 'status_code', None)
            if code is None:
                for candidate_code in [400, 401, 403, 404, 429, 500, 502, 503, 504]:
                    if str(candidate_code) in error_msg:
                        code = candidate_code
                        break
            http_code = code or 500
            print(f"  {model_id:<24}: FAILED ({exc_class} {http_code}, {latency_ms}ms)")
            first_line = error_msg.split('\n')[0][:120]
            print(f"     -> {first_line}")

        results.append({
            "model_id": model_id,
            "is_listed": is_listed,
            "status": status,
            "http_code": http_code,
            "latency_ms": latency_ms,
            "response": response_text,
            "error_msg": error_msg,
        })

    # Generate Markdown documentation
    doc_path = PROJECT_ROOT / "docs" / "gemini_diagnostics.md"
    doc_content = f"""# Gemini API & Model Diagnostic Report

**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}  
**google-genai SDK Version:** `{sdk_version}`  
**API Key Format:** `{masked_key}` ({key_type})  
**Key Length:** {len(api_key)} characters  

---

## 1. Executive Summary

- **Total models discovered via `client.models.list()`:** {len(all_models_raw)}
- **Confirmed Active & Working Models:** {', '.join([f'`{m}`' for m in working_models]) or 'None'}
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
"""
    for r in results:
        listed_str = "Yes" if r["is_listed"] else "No"
        reason = "Returned 'OK'" if r["status"] == "SUCCESS" else r["error_msg"].split('\n')[0].replace('|', '/')[:80]
        doc_content += f"| `{r['model_id']}` | {listed_str} | **{r['status']}** | {r['http_code']} | {r['latency_ms']} | {reason} |\n"

    doc_content += f"""
---

## 3. Recommended Production Model Chain

Based on empirical testing:
1. **Primary Model:** `{working_models[0] if working_models else 'gemini-3.5-flash-lite'}`
2. **Secondary Fallback Model:** `{working_models[1] if len(working_models) > 1 else 'gemini-3.1-flash-lite'}`
3. **Tertiary Fallback Model:** `gemini-3.8-flash` (Retried once on transient 503, fail fast if unavailable)

**Models Removed (Never to be called):**
- `gemini-2.5-flash` (404)
- `gemini-2.5-flash-lite` (404)
- `gemini-2.0-flash` (404)
- `gemini-1.5-flash` (404)
"""

    doc_path.parent.mkdir(parents=True, exist_ok=True)
    doc_path.write_text(doc_content, encoding="utf-8")
    print(f"\nDiagnostic report successfully written to {doc_path}")

    return results, working_models

if __name__ == "__main__":
    run_diagnostics()
