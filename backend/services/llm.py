# PATH: backend/services/llm.py
"""
Unified LLM Client Layer for OpenShort / viral-studio.
Consolidates Gemini (Google GenAI) and Anthropic (Claude) calls with:
- One cached genai.Client instance
- Configurable per-request timeouts (planning ~90-120s, small checks ~30s)
- Fine-grained transient retry with exponential backoff + jitter (max 2 attempts per model)
- Fail-fast on 400, 401, 403, 404 with exact diagnostic error reasons
- Structured response validation via Pydantic (strictly rejecting invalid data)
- Full API key redaction across logs, errors, and traces
- Thread-safe global trace storage with per-request attempt telemetry
"""

import os
import re
import time
import json
import random
import logging
import threading
from typing import Any, Dict, List, Optional, Tuple, Type
from pydantic import BaseModel, Field

import httpx
from google import genai
from google.genai import types

from backend.config import (
    get_gemini_api_key,
    get_anthropic_api_key,
    get_selected_model,
    get_gemini_model_chain,
    DEFAULT_GEMINI_MODEL,
    DEPRECATED_404_MODELS,
)

logger = logging.getLogger("viral_studio.llm")

# ---------------------------------------------------------------------------
# Global LLM Call Counter (Asserting 1 plan call, 0 during edit/preview/export)
# ---------------------------------------------------------------------------
_COUNTER_LOCK = threading.Lock()
LLM_CALL_COUNTER: Dict[str, int] = {
    "total": 0,
    "planning": 0,
    "small_check": 0,
    "director": 0,
}


def get_llm_call_count() -> Dict[str, int]:
    with _COUNTER_LOCK:
        return dict(LLM_CALL_COUNTER)


def reset_llm_call_count() -> None:
    with _COUNTER_LOCK:
        for k in LLM_CALL_COUNTER:
            LLM_CALL_COUNTER[k] = 0


# ---------------------------------------------------------------------------
# API Key Redaction Helpers
# ---------------------------------------------------------------------------
_KEY_PATTERNS = [
    (re.compile(r"AIza[0-9A-Za-z_-]{30,}"), "[REDACTED_GEMINI_KEY]"),
    (re.compile(r"sk-ant-[0-9A-Za-z_-]{20,}"), "[REDACTED_ANTHROPIC_KEY]"),
    (re.compile(r"(?:api_key|key|token)=([^\s&\"'<>]+)", re.IGNORECASE), "key=[REDACTED]"),
    (re.compile(r"(?:x-api-key|authorization):\s*([^\s,;]+)", re.IGNORECASE), "authorization: [REDACTED]"),
]


def redact_secrets(text: Any) -> str:
    """Recursively scrub any visible API keys or tokens from string or object representations."""
    if text is None:
        return ""
    s = text if isinstance(text, str) else str(text)
    for pattern, replacement in _KEY_PATTERNS:
        s = pattern.sub(replacement, s)
    return s


# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------
class AttemptTrace(BaseModel):
    model: str
    status: str = "failed"  # "success" | "failed" | "timeout"
    code: Optional[int] = None
    latency_ms: float = 0.0
    message: str = ""


class LLMResult(BaseModel):
    ok: bool = False
    data: Optional[Any] = None
    raw_text: Optional[str] = None
    provider: str = "none"  # "gemini" | "anthropic" | "none"
    model: str = "deterministic_fallback"
    attempts: List[AttemptTrace] = Field(default_factory=list)
    tokens: Dict[str, int] = Field(
        default_factory=lambda: {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    )
    error_code: Optional[str] = None
    user_message: str = ""


# ---------------------------------------------------------------------------
# Client Caching (Single instance)
# ---------------------------------------------------------------------------
_CLIENT_LOCK = threading.Lock()
_CACHED_CLIENT: Optional[genai.Client] = None
_CACHED_KEY: Optional[str] = None


def get_cached_genai_client(api_key: str) -> genai.Client:
    """Return a single cached instance of genai.Client; recreate only if key changes."""
    global _CACHED_CLIENT, _CACHED_KEY
    with _CLIENT_LOCK:
        if _CACHED_CLIENT is not None and _CACHED_KEY == api_key:
            return _CACHED_CLIENT
        _CACHED_CLIENT = genai.Client(api_key=api_key)
        _CACHED_KEY = api_key
        return _CACHED_CLIENT


# ---------------------------------------------------------------------------
# Global Telemetry / Trace Store
# ---------------------------------------------------------------------------
_TRACE_LOCK = threading.Lock()
LAST_AI_TRACE: Dict[str, Any] = {
    "source": "fallback",
    "model": "deterministic_fallback",
    "error": "Initializing or awaiting first AI request",
    "prompt_summary": "System initialized.",
    "raw_response": "{}",
    "tokens": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    "timestamp": round(time.time(), 2),
    "attempts": [],
    "media_id": "default",
    "purpose": "System initialized",
}

VIDEO_TRACE_HISTORY: Dict[str, List[Dict[str, Any]]] = {}
GLOBAL_TRACE_HISTORY: List[Dict[str, Any]] = []


def get_last_ai_trace() -> Dict[str, Any]:
    """Thread-safe snapshot of the latest LLM telemetry trace."""
    with _TRACE_LOCK:
        return dict(LAST_AI_TRACE)


def get_video_trace_history(media_id: Optional[str] = None) -> Dict[str, Any]:
    """Return per-video trace history and cumulative token usage."""
    with _TRACE_LOCK:
        mid = (media_id or "").strip() or "default"
        records = VIDEO_TRACE_HISTORY.get(mid, [])
        if not records and GLOBAL_TRACE_HISTORY:
            records = list(GLOBAL_TRACE_HISTORY)

        total_prompt = sum(r.get("tokens", {}).get("prompt_tokens", 0) for r in records)
        total_comp = sum(r.get("tokens", {}).get("completion_tokens", 0) for r in records)
        total_tok = sum(r.get("tokens", {}).get("total_tokens", 0) for r in records)

        return {
            "active_trace": dict(LAST_AI_TRACE),
            "media_id": mid,
            "history": list(records),
            "total_calls": len(records),
            "total_tokens": total_tok,
            "tokens": {
                "prompt_tokens": total_prompt,
                "completion_tokens": total_comp,
                "total_tokens": total_tok,
            },
        }


def update_last_ai_trace(
    result: LLMResult,
    prompt_summary: str = "",
    media_id: Optional[str] = None,
    purpose: Optional[str] = None,
) -> None:
    """Record execution trace into the global inspector cache and per-video history."""
    with _TRACE_LOCK:
        mid = (media_id or "").strip() or "default"
        call_purpose = purpose or ("Short Creative Plan" if "planning" in prompt_summary.lower() else "LLM Generation")

        # Frontend requires source === "gemini" only when live AI succeeded
        if result.ok and result.provider == "gemini":
            source_tag = "gemini"
        elif result.ok and result.provider == "anthropic":
            source_tag = "claude"
        else:
            source_tag = "fallback"

        # Safe serializable attempts list
        attempts_serializable = [
            {
                "model": a.model,
                "status": "success" if a.status == "success" else "failed",
                "code": a.code,
                "latency_ms": a.latency_ms,
                "error": redact_secrets(a.message) if a.status != "success" else None,
            }
            for a in result.attempts
        ]

        trace_entry = {
            "id": f"call_{len(GLOBAL_TRACE_HISTORY) + 1}",
            "source": source_tag,
            "model": result.model,
            "media_id": mid,
            "purpose": call_purpose,
            "error": redact_secrets(result.user_message) if not result.ok else None,
            "prompt_summary": redact_secrets(prompt_summary or "LLM Request")[:500],
            "raw_response": redact_secrets(result.raw_text or "")[:1500],
            "tokens": result.tokens,
            "timestamp": round(time.time(), 2),
            "attempts": attempts_serializable,
        }

        LAST_AI_TRACE.update(trace_entry)
        GLOBAL_TRACE_HISTORY.append(dict(trace_entry))
        if mid not in VIDEO_TRACE_HISTORY:
            VIDEO_TRACE_HISTORY[mid] = []
        VIDEO_TRACE_HISTORY[mid].append(dict(trace_entry))


# ---------------------------------------------------------------------------
# Error Classification Helpers
# ---------------------------------------------------------------------------
def _extract_http_code_and_msg(exc: Exception) -> Tuple[Optional[int], str]:
    """Extract numeric HTTP status code and cleansed message from SDK exceptions."""
    err_str = redact_secrets(str(exc))
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if code is None:
        # Check message body for standard status codes
        for candidate in [400, 401, 403, 404, 429, 500, 502, 503, 504]:
            if f" {candidate} " in f" {err_str} " or f"'{candidate}'" in err_str or f": {candidate}" in err_str:
                code = candidate
                break

    # Handle known timeout exceptions
    exc_type = type(exc).__name__.lower()
    if "timeout" in exc_type or "deadline" in exc_type or "deadline expired" in err_str.lower():
        if code is None:
            code = 504

    return code, err_str


def _is_transient_error(code: Optional[int], msg: str) -> bool:
    """Determine whether an error is transient (eligible for retry) or fatal."""
    if code in (429, 500, 502, 503, 504):
        return True
    msg_l = msg.lower()
    if any(k in msg_l for k in ["timeout", "timed out", "deadline exceeded", "unavailable", "high demand", "rate limit"]):
        return True
    return False


def _is_dns_or_network_error(exc: Exception, msg: str) -> bool:
    """Identify if failure is due to host DNS unreachability or network drop."""
    text = (msg or "").lower()
    exc_name = type(exc).__name__.lower()
    if any(k in text for k in [
        "11001",
        "getaddrinfo failed",
        "nodename nor servname provided",
        "name or service not known",
        "nameresolutionerror",
        "failed to resolve",
        "network is unreachable",
        "connection refused",
        "host is down",
    ]):
        return True
    if any(k in exc_name for k in ["gaierror", "nameresolutionerror", "connecterror"]):
        return True
    return False


# ---------------------------------------------------------------------------
# Core Unified LLM Invocation
# ---------------------------------------------------------------------------
def execute_llm_request(
    prompt: str,
    request_type: str = "planning",  # "planning" (90-120s) | "small_check" (30s)
    system_instruction: Optional[str] = None,
    response_schema: Optional[Type[BaseModel]] = None,
    temperature: float = 0.4,
    preferred_model: Optional[str] = None,
    provider: str = "gemini",
    api_key: Optional[str] = None,
    multimodal_parts: Optional[List[Any]] = None,
    media_id: Optional[str] = None,
    purpose: Optional[str] = None,
) -> LLMResult:
    """
    Execute an LLM request through Google Gemini or Anthropic with:
    - Dedicated per-model attempts and timeout enforcement
    - Fast fail on 400/401/403/404
    - Up to 2 attempts per model for transient errors (with backoff + jitter)
    - Strict Pydantic response validation
    """
    attempts: List[AttemptTrace] = []
    t_start = time.perf_counter()

    # Determine default model from settings if not explicitly provided
    if not preferred_model:
        preferred_model = os.getenv("SELECTED_GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip()

    with _COUNTER_LOCK:
        LLM_CALL_COUNTER["total"] += 1
        req_key = "planning" if request_type in ("planning", "plan_short") else ("director" if request_type == "director" else "small_check")
        LLM_CALL_COUNTER[req_key] = LLM_CALL_COUNTER.get(req_key, 0) + 1

    # Determine timeout in milliseconds
    if request_type in ("planning", "director", "plan_short"):
        timeout_ms = 95000  # 95 seconds
    else:
        timeout_ms = 30000  # 30 seconds

    # Check for Anthropic override
    chosen_provider = provider.lower().strip()
    if chosen_provider in ("anthropic", "claude"):
        ant_key = api_key or get_anthropic_api_key()
        if not ant_key:
            res = LLMResult(
                ok=False,
                provider="none",
                model="deterministic_fallback",
                attempts=attempts,
                error_code="NO_ANTHROPIC_KEY",
                user_message="Anthropic API key is not configured.",
            )
            update_last_ai_trace(res, prompt, media_id=media_id, purpose=purpose)
            return res
        return _call_anthropic(
            ant_key=ant_key,
            prompt=prompt,
            system_instruction=system_instruction,
            preferred_model=preferred_model or "claude-3-5-sonnet-latest",
            timeout_sec=min(60.0, timeout_ms / 1000.0),
            attempts=attempts,
        )

    # Gemini execution
    gemini_key = api_key or get_gemini_api_key()
    if not gemini_key:
        res = LLMResult(
            ok=False,
            provider="none",
            model="deterministic_fallback",
            attempts=attempts,
            error_code="NO_GEMINI_KEY",
            user_message="No GEMINI_API_KEY configured. Running in deterministic offline mode.",
        )
        update_last_ai_trace(res, prompt, media_id=media_id, purpose=purpose)
        return res

    client = get_cached_genai_client(gemini_key)

    # Build model chain from environment/config, excluding 404 models
    configured_chain = get_gemini_model_chain()
    candidate_models: List[str] = []
    if preferred_model and preferred_model not in DEPRECATED_404_MODELS and "claude" not in preferred_model.lower():
        candidate_models.append(preferred_model)
    for m in configured_chain:
        if m not in candidate_models and m not in DEPRECATED_404_MODELS:
            candidate_models.append(m)

    if not candidate_models:
        candidate_models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]

    last_user_message = ""
    last_error_code = None
    abort_chain = False

    for m_name in candidate_models:
        # Up to 2 attempts per model for transient errors
        max_attempts_for_model = 2
        for attempt_idx in range(1, max_attempts_for_model + 1):
            t_attempt_start = time.perf_counter()
            try:
                # Configure per-request HTTP timeout in ms, with attempts=1 to handle retries at the service layer
                http_opts = types.HttpOptions(
                    timeout=timeout_ms,
                    retry_options=types.HttpRetryOptions(attempts=1),
                )

                config_kwargs: Dict[str, Any] = {
                    "temperature": temperature,
                    "http_options": http_opts,
                }
                if system_instruction:
                    config_kwargs["system_instruction"] = system_instruction
                if response_schema is not None:
                    config_kwargs["response_mime_type"] = "application/json"
                    config_kwargs["response_schema"] = response_schema
                if "lite" not in m_name.lower():
                    # Disable excessive reasoning tokens for latency-critical paths
                    config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)

                config = types.GenerateContentConfig(**config_kwargs)

                # Assemble content parts
                contents: List[Any] = [prompt]
                if multimodal_parts:
                    contents.extend(multimodal_parts)

                logger.info(f"Invoking Gemini model '{m_name}' (attempt {attempt_idx}/{max_attempts_for_model}, timeout={timeout_ms}ms)...")
                response = client.models.generate_content(
                    model=m_name,
                    contents=contents,
                    config=config,
                )

                latency_ms = round((time.perf_counter() - t_attempt_start) * 1000.0, 1)

                raw_text = (response.text or "").strip() if response else ""
                if not raw_text:
                    raise ValueError(f"Model '{m_name}' returned an empty response body.")

                # Extract token usage if provided
                usage = getattr(response, "usage_metadata", None)
                tokens = {
                    "prompt_tokens": getattr(usage, "prompt_token_count", 0) or 0,
                    "completion_tokens": getattr(usage, "candidates_token_count", 0) or 0,
                    "total_tokens": getattr(usage, "total_token_count", 0) or 0,
                }

                # Validate with Pydantic if a schema was specified
                validated_data = None
                if response_schema is not None:
                    # Strip markdown code blocks if the model wrapped output
                    cleaned_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip(), flags=re.MULTILINE)
                    try:
                        validated_data = response_schema.model_validate_json(cleaned_json)
                    except Exception as val_exc:
                        logger.error(f"Pydantic validation failed for model '{m_name}': {val_exc}")
                        raise ValueError(f"Model output failed schema validation: {val_exc}")

                # Success recorded
                attempt_trace = AttemptTrace(
                    model=m_name,
                    status="success",
                    code=200,
                    latency_ms=latency_ms,
                    message="OK",
                )
                attempts.append(attempt_trace)

                res = LLMResult(
                    ok=True,
                    data=validated_data if validated_data is not None else raw_text,
                    raw_text=raw_text,
                    provider="gemini",
                    model=m_name,
                    attempts=attempts,
                    tokens=tokens,
                    user_message=f"Generated via Gemini {m_name}",
                )
                update_last_ai_trace(res, prompt, media_id=media_id, purpose=purpose)
                return res

            except Exception as exc:
                latency_ms = round((time.perf_counter() - t_attempt_start) * 1000.0, 1)
                code, msg = _extract_http_code_and_msg(exc)
                is_transient = _is_transient_error(code, msg)
                is_dns_net = _is_dns_or_network_error(exc, msg)

                # Classify fail-fast vs transient
                if is_dns_net:
                    status_desc = "failed"
                    user_msg = (
                        "No internet connection or DNS lookup failed for Google Gemini API "
                        "(generativelanguage.googleapis.com). Please check your internet connection."
                    )
                    last_error_code = "NETWORK_DNS_ERROR"
                    abort_chain = True
                elif code == 404:
                    status_desc = "failed"
                    user_msg = f"Model '{m_name}' is not available for this key/project (404 NOT_FOUND)."
                    last_error_code = "MODEL_NOT_FOUND"
                elif code in (401, 403):
                    status_desc = "failed"
                    user_msg = f"API key unauthorized or forbidden for Google Gemini ({code}). Please verify GEMINI_API_KEY."
                    last_error_code = "AUTH_FORBIDDEN"
                    abort_chain = True
                elif code == 400:
                    status_desc = "failed"
                    user_msg = f"Bad request to model '{m_name}' (400): {msg[:100]}"
                    last_error_code = "BAD_REQUEST"
                elif code == 504 or "timeout" in msg.lower():
                    status_desc = "timeout"
                    user_msg = f"Gemini timed out after {timeout_ms / 1000.0:.0f}s on model '{m_name}'"
                    last_error_code = "TIMEOUT"
                elif code == 503:
                    status_desc = "failed"
                    user_msg = f"Gemini model '{m_name}' is temporarily unavailable (503 High Demand)."
                    last_error_code = "UNAVAILABLE_503"
                else:
                    status_desc = "failed"
                    user_msg = f"Gemini error on '{m_name}' ({code or 'Error'}): {msg[:120]}"
                    last_error_code = f"HTTP_{code}" if code else "CLIENT_ERROR"

                attempts.append(AttemptTrace(
                    model=m_name,
                    status=status_desc,
                    code=code or (0 if is_dns_net else None),
                    latency_ms=latency_ms,
                    message=user_msg,
                ))
                last_user_message = user_msg

                # If DNS or fatal auth error, abort the entire chain immediately
                if abort_chain:
                    logger.error(f"Fatal unrecoverable error on {m_name} ({last_error_code}): {msg[:120]}. Aborting failover chain.")
                    break

                # If non-transient, fail fast on this model immediately (no retry)
                if not is_transient:
                    logger.warning(f"Fatal non-transient error on {m_name} ({code}): {msg[:120]}. Skipping retries.")
                    break

                # If transient and we have another attempt remaining for this model
                if attempt_idx < max_attempts_for_model:
                    backoff = 1.0 * (1.5 ** attempt_idx) + random.uniform(0.1, 0.4)
                    logger.info(f"Transient error on {m_name} ({code}); retrying in {backoff:.2f}s...")
                    time.sleep(backoff)

        if abort_chain:
            break

    # All candidate models exhausted
    if not last_user_message:
        last_user_message = f"Gemini models exhausted ({', '.join(candidate_models)}) without a valid response."

    res = LLMResult(
        ok=False,
        data=None,
        raw_text="",
        provider="none",
        model="deterministic_fallback",
        attempts=attempts,
        error_code=last_error_code or "MODELS_EXHAUSTED",
        user_message=last_user_message,
    )
    update_last_ai_trace(res, prompt, media_id=media_id, purpose=purpose)
    return res


def _call_anthropic(
    ant_key: str,
    prompt: str,
    system_instruction: Optional[str],
    preferred_model: str,
    timeout_sec: float,
    attempts: List[AttemptTrace],
) -> LLMResult:
    """Direct Anthropic Messages API client with telemetry."""
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": ant_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload: Dict[str, Any] = {
        "model": preferred_model,
        "max_tokens": 4096,
        "temperature": 0.4,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system_instruction:
        payload["system"] = system_instruction

    t0 = time.perf_counter()
    try:
        with httpx.Client(timeout=timeout_sec) as client:
            resp = client.post(url, headers=headers, json=payload)
            latency_ms = round((time.perf_counter() - t0) * 1000.0, 1)

            if resp.status_code == 200:
                data = resp.json()
                content_blocks = data.get("content", [])
                text_parts = [b.get("text", "") for b in content_blocks if b.get("type") == "text"]
                raw_text = "".join(text_parts).strip()
                tokens = {
                    "prompt_tokens": data.get("usage", {}).get("input_tokens", 0),
                    "completion_tokens": data.get("usage", {}).get("output_tokens", 0),
                    "total_tokens": data.get("usage", {}).get("input_tokens", 0) + data.get("usage", {}).get("output_tokens", 0),
                }
                attempts.append(AttemptTrace(
                    model=preferred_model,
                    status="success",
                    code=200,
                    latency_ms=latency_ms,
                    message="OK",
                ))
                res = LLMResult(
                    ok=True,
                    data=raw_text,
                    raw_text=raw_text,
                    provider="anthropic",
                    model=preferred_model,
                    attempts=attempts,
                    tokens=tokens,
                    user_message=f"Generated via Anthropic {preferred_model}",
                )
                update_last_ai_trace(res, prompt, media_id=media_id, purpose=purpose)
                return res
            else:
                code = resp.status_code
                msg = redact_secrets(resp.text)
                attempts.append(AttemptTrace(
                    model=preferred_model,
                    status="failed",
                    code=code,
                    latency_ms=latency_ms,
                    message=f"Anthropic HTTP {code}: {msg[:100]}",
                ))
                res = LLMResult(
                    ok=False,
                    provider="none",
                    model="deterministic_fallback",
                    attempts=attempts,
                    error_code=f"ANTHROPIC_{code}",
                    user_message=f"Anthropic returned HTTP {code}",
                )
                update_last_ai_trace(res, prompt, media_id=media_id, purpose=purpose)
                return res
    except Exception as exc:
        latency_ms = round((time.perf_counter() - t0) * 1000.0, 1)
        code, msg = _extract_http_code_and_msg(exc)
        attempts.append(AttemptTrace(
            model=preferred_model,
            status="timeout" if "timeout" in msg.lower() else "failed",
            code=code,
            latency_ms=latency_ms,
            message=redact_secrets(str(exc)),
        ))
        res = LLMResult(
            ok=False,
            provider="none",
            model="deterministic_fallback",
            attempts=attempts,
            error_code="ANTHROPIC_EXCEPTION",
            user_message=f"Anthropic request failed: {msg[:100]}",
        )
        update_last_ai_trace(res, prompt)
        return res
