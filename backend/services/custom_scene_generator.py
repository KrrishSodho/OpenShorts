"""
Custom AI Scene Generator & Sandbox Compiler
Generates bespoke Remotion TSX visual scenes using Gemini or Claude Sonnet,
validates them for security and zero emojis, compiles via Node esbuild,
and provides multi-tier failover with synthesized fallback.
"""

import json
import logging
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import httpx
from dotenv import load_dotenv

from backend.services.llm import execute_llm_request, LLMResult

logger = logging.getLogger("viral_studio.custom_scene")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env", override=True)
load_dotenv(PROJECT_ROOT / "backend" / ".env", override=True)

DANGEROUS_CALL_PATTERNS = [
    (r"\bwindow\.", "window DOM access"),
    (r"\bwindow\[", "window property access"),
    (r"\bdocument\.", "document DOM access"),
    (r"\bdocument\[", "document property access"),
    (r"\bglobalThis\b", "globalThis access"),
    (r"\bself\.", "self access"),
    (r"\bself\[", "self property access"),
    (r"\btop\.", "top window access"),
    (r"\btop\[", "top window property access"),
    (r"\bparent\.", "parent window access"),
    (r"\bparent\[", "parent window property access"),
    (r"\bconstructor\b", "constructor property access"),
    (r"\bReflect\b", "Reflect global access"),
    (r"\bProxy\b", "Proxy global access"),
    (r"\bfetch\s*\(", "fetch network request"),
    (r"\bXMLHttpRequest\b", "XMLHttpRequest network request"),
    (r"\beval\s*\(", "eval execution"),
    (r"\bnew\s+Function\b", "dynamic Function constructor"),
    (r"\bFunction\s*\(", "Function constructor"),
    (r"\blocalStorage\b", "localStorage access"),
    (r"\bsessionStorage\b", "sessionStorage access"),
    (r"\bdangerouslySetInnerHTML\b", "dangerouslySetInnerHTML"),
    (r"\brequire\s*\(", "require call inside component body"),
    (r"\bprocess\.", "process global access"),
    (r"\bprocess\[", "process property access"),
    (r"\bWebSocket\b", "WebSocket connection"),
    (r"\bWorker\b", "Worker thread"),
    (r"\bimportScripts\b", "importScripts call"),
    (r"\bimport\s*\(", "dynamic import"),
    (r"<\s*script\b", "script tag injection"),
    (r"<\s*iframe\b", "iframe tag injection"),
]

EMOJI_PATTERN = re.compile(
    r"[\U0001F300-\U0001FAFF"
    r"\U0001F1E6-\U0001F1FF"
    r"\u2600-\u27BF"
    r"\u2300-\u23FF"
    r"\u2B50\u2B55\u2934\u2935\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE]"
)

ALLOWED_PACKAGES = {"react", "remotion", "lucide-react"}


def build_synthesized_fallback_tsx(
    tag: str = "",
    headline: str = "",
    value: str = "",
    subtext: str = "",
    accent: str = "#00F5FF",
    text_color: str = "#FFFFFF",
    language: str = "en",
) -> str:
    """Synthesize a robust, customized Remotion TSX component tailored to the beat."""
    tag_lit = json.dumps((tag or "AI SPOTLIGHT").upper())
    text_lit = json.dumps((headline or "HIGH-IMPACT TAKEAWAY").upper())
    val_lit = json.dumps((value or "").upper())
    sub_lit = json.dumps(subtext or "")
    accent_lit = json.dumps(accent or "#00F5FF")
    text_color_lit = json.dumps(text_color or "#FFFFFF")

    return f"""import React from 'react';
import {{ useCurrentFrame, spring }} from 'remotion';
import {{ Sparkles, Zap, Award, TrendingUp, Layers, CheckCircle2 }} from 'lucide-react';

export default function CustomScene({{ text, label, value, subtext, theme }}) {{
  const frame = useCurrentFrame();
  const enterSpring = spring({{ frame, fps: 30, config: {{ damping: 14, stiffness: 120 }} }});
  const pulse = Math.sin(frame / 6) * 0.04 + 1;

  const accent = (theme && theme.accentColor) || {accent_lit};
  const textColor = (theme && theme.textColor) || {text_color_lit};

  const displayTag = label || {tag_lit};
  const displayText = text || {text_lit};
  const displayVal = value || {val_lit};
  const displaySub = subtext || {sub_lit};

  return (
    <div
      style={{{{
        width: '100%',
        maxWidth: 960,
        margin: '0 auto',
        padding: '36px 44px',
        borderRadius: 24,
        background: 'rgba(15, 23, 42, 0.94)',
        border: `2px solid ${{accent}}`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.65), 0 0 40px ${{accent}}33`,
        transform: `scale(${{enterSpring}})`,
        opacity: Math.min(1, frame / 5),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 16,
      }}}}
    >
      <div
        style={{{{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 9999,
          background: `${{accent}}22`,
          border: `1px solid ${{accent}}66`,
          color: accent,
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        }}}}
      >
        <Sparkles style={{{{ width: 16, height: 16 }}}} />
        <span>{{displayTag}}</span>
      </div>

      <h1
        style={{{{
          fontSize: 44,
          fontWeight: 900,
          color: textColor,
          lineHeight: 1.15,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: -0.5,
          textShadow: '0 4px 20px rgba(0,0,0,0.85)',
        }}}}
      >
        {{displayText}}
      </h1>

      {{displayVal ? (
        <div
          style={{{{
            fontSize: 54,
            fontWeight: 900,
            fontFamily: 'monospace',
            color: accent,
            transform: `scale(${{pulse}})`,
            marginTop: 4,
          }}}}
        >
          {{displayVal}}
        </div>
      ) : null}}

      {{displaySub ? (
        <p
          style={{{{
            fontSize: 22,
            color: 'rgba(255,255,255,0.7)',
            margin: 0,
            maxWidth: 720,
          }}}}
        >
          {{displaySub}}
        </p>
      ) : null}}
    </div>
  );
}}
"""


FALLBACK_CUSTOM_SCENE_TSX = build_synthesized_fallback_tsx()


def validate_custom_scene_code(code: str) -> Tuple[bool, Optional[str]]:
    """Strict security & emoji check on generated TSX code without false-positive keyword bans."""
    if not code or not code.strip():
        return False, "Code is empty"

    # 1. Emoji Check
    emoji_match = EMOJI_PATTERN.search(code)
    if emoji_match:
        return False, f"Unicode emoji detected ({emoji_match.group(0)}). Strict ZERO EMOJI rule enforced; use Lucide icons only."

    # 2. Check for dangerous runtime invocations
    for pattern, desc in DANGEROUS_CALL_PATTERNS:
        if re.search(pattern, code):
            return False, f"Forbidden API detected ({desc}). The custom scene sandbox is strictly client-safe."

    # 3. Check for disallowed external package imports
    import_matches = re.findall(r"import\s+.*?from\s+['\"]([^'\"]+)['\"]", code)
    for pkg in import_matches:
        clean_pkg = pkg.strip()
        if clean_pkg not in ALLOWED_PACKAGES:
            return False, f"Importing external module '{clean_pkg}' is disallowed in sandbox. Only 'react', 'remotion', and 'lucide-react' are permitted."

    # 4. Must export default component
    if "export default" not in code:
        return False, "Component must export a default React function component ('export default function CustomScene(...)')"

    return True, None


def compile_with_esbuild(source_code: str) -> Tuple[bool, str, Optional[str]]:
    """Compile TSX source to CommonJS JavaScript using frontend/compile_custom_scene.mjs."""
    script_path = PROJECT_ROOT / "frontend" / "compile_custom_scene.mjs"
    if not script_path.exists():
        return False, "", f"Compiler script not found at {script_path}"

    node_bin = "node"
    try:
        proc = subprocess.run(
            [node_bin, str(script_path)],
            input=source_code,
            text=True,
            capture_output=True,
            timeout=15,
            cwd=str(PROJECT_ROOT / "frontend"),
        )
        stdout = (proc.stdout or "").strip()
        if not stdout:
            return False, "", proc.stderr or "Empty compiler output"

        data = json.loads(stdout)
        if data.get("success"):
            return True, data.get("code", ""), None
        else:
            return False, "", data.get("error", "Unknown compilation error")
    except subprocess.TimeoutExpired:
        return False, "", "Node esbuild compiler timed out after 15 seconds"
    except Exception as e:
        logger.error(f"Failed to run esbuild compiler: {e}")
        return False, "", str(e)


def _clean_code_fence(raw: str) -> str:
    """Strip ```tsx or ```jsx code blocks."""
    text = raw.strip()
    match = re.search(r"```(?:tsx|jsx|typescript|javascript)?\s*\n([\s\S]*?)\n```", text)
    if match:
        return match.group(1).strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 2 and lines[-1].strip() == "```":
            return "\n".join(lines[1:-1]).strip()
    return text


def generate_custom_scene(
    clip_transcript: str = "",
    user_prompt: str = "",
    tag: str = "",
    headline: str = "",
    value: str = "",
    subtext: str = "",
    trigger_phrase: str = "",
    detected_language: str = "en",
    theme_accent: str = "#00F5FF",
    theme_text: str = "#FFFFFF",
    provider: str = "gemini",
    api_key: str = "",
    preferred_model: str = "",
) -> Dict[str, Any]:
    """Generate, validate, and compile a custom Remotion scene component with honest failure handling."""
    effective_gemini_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    effective_anthropic_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()

    chosen_provider = provider.lower().strip()
    if api_key:
        if api_key.startswith("sk-ant-"):
            chosen_provider = "anthropic"
            effective_anthropic_key = api_key
        else:
            effective_gemini_key = api_key

    is_anthropic = chosen_provider in ("anthropic", "claude") and bool(effective_anthropic_key)
    active_key = effective_anthropic_key if is_anthropic else effective_gemini_key

    # Synthesize fallback scene tailored to beat in case network is down
    tailored_fallback_code = build_synthesized_fallback_tsx(
        tag=tag,
        headline=headline,
        value=value,
        subtext=subtext,
        accent=theme_accent,
        text_color=theme_text,
        language=detected_language,
    )

    # If deterministic fallback is explicitly requested, compile and return immediately
    if chosen_provider == "deterministic_fallback":
        fb_ok, fb_compiled, _ = compile_with_esbuild(tailored_fallback_code)
        return {
            "success": True,
            "scene_code": tailored_fallback_code,
            "compiled_js": fb_compiled if fb_ok else "",
            "archetype": "custom_ai_scene",
            "provider": "deterministic_fallback",
            "is_fallback": True,
            "error": None,
            "attempts": [],
        }

    if not active_key:
        logger.info("No API key available for custom scene generator; returning failure with tailored fallback")
        fb_ok, fb_compiled, _ = compile_with_esbuild(tailored_fallback_code)
        return {
            "success": False,
            "scene_code": tailored_fallback_code,
            "compiled_js": fb_compiled if fb_ok else "",
            "archetype": "custom_ai_scene",
            "provider": "deterministic_fallback",
            "is_fallback": True,
            "error": "No API key configured for custom scene generator.",
            "attempts": [],
        }

    # Synthesize creative prompt if user left it blank
    raw_user_prompt = (user_prompt or "").strip()
    if not raw_user_prompt:
        context_parts = []
        if tag:
            context_parts.append(f"Category: {tag}")
        if headline:
            context_parts.append(f"Headline: '{headline}'")
        if value:
            context_parts.append(f"Key Focus/Metric: '{value}'")
        if trigger_phrase:
            context_parts.append(f"Trigger words: '{trigger_phrase}'")
        if clip_transcript:
            context_parts.append(f"Spoken text: '{clip_transcript[:220]}'")

        if context_parts:
            creative_direction = f"Auto-designed from spoken speech: Create an energetic, high-retention vertical layout highlighting {', '.join(context_parts)}."
        else:
            creative_direction = "Create an energetic, high-impact motion graphic emphasizing the key takeaway."
    else:
        context_parts = []
        if headline:
            context_parts.append(f"Headline: {headline}")
        if value:
            context_parts.append(f"Focus Word: {value}")
        context_str = f" (Context: {', '.join(context_parts)})" if context_parts else ""
        creative_direction = f"{raw_user_prompt}{context_str}"

    system_prompt = f"""You are a Master Motion Graphics Engineer specializing in Remotion React components for viral short-form video (1080x1920 vertical format).

Your task is to write a single self-contained TypeScript React component for a bespoke motion scene.

CRITICAL RULES:
1. STRICTLY ZERO UNICODE EMOJIS! Never use emojis in JSX, text, or labels. Use vector stroke icons from `lucide-react` instead (e.g. Award, Zap, TrendingUp, Sparkles, Layers, Shield, Crosshair, Target, Flame, BarChart2).
2. CLIENT-SAFE & SANDBOXED: Never reference `window.`, `document.`, `fetch(`, `eval(`, `process.`, or external network requests.
3. Component signature MUST be:
   export default function CustomScene({{ text, label, value, subtext, theme }}: {{ text: string; label: string; value: string; subtext?: string; theme: any }})
4. Remotion animations:
   Use `import {{ useCurrentFrame, spring, interpolate }} from 'remotion';` to drive fluid animations with damping and scale transitions.
5. All UI labels and text must be in {detected_language}.
6. Style the card for vertical 9:16 video: max-width 960px, center-aligned, with dark slate/glass background, rounded corners (20-28px), and high-contrast typography. Accent color is {theme_accent}.
7. Return ONLY clean TypeScript React code inside a single ```tsx code block. No conversational filler.

Transcript Context:
"{clip_transcript or headline or 'High impact key moment'}"

Creative Direction:
"{creative_direction}"
"""

    llm_res = execute_llm_request(
        prompt=system_prompt,
        request_type="small_check",
        provider="anthropic" if is_anthropic else "gemini",
        api_key=active_key,
        preferred_model=preferred_model,
        temperature=0.4,
    )

    attempts_list = [a.model_dump() for a in llm_res.attempts]

    if not llm_res.ok:
        logger.warning(f"Custom scene LLM generation failed: {llm_res.user_message}")
        fb_ok, fb_compiled, _ = compile_with_esbuild(tailored_fallback_code)
        return {
            "success": False,
            "scene_code": tailored_fallback_code,
            "compiled_js": fb_compiled if fb_ok else "",
            "archetype": "custom_ai_scene",
            "provider": "deterministic_fallback",
            "is_fallback": True,
            "error": llm_res.user_message or "AI generation failed across configured models.",
            "attempts": attempts_list,
        }

    raw_response = llm_res.raw_text or ""
    code = _clean_code_fence(raw_response)

    # Initial Validation
    valid, val_err = validate_custom_scene_code(code)

    # Compile check
    compiled_ok = False
    compiled_js = ""
    comp_err = None

    if valid:
        compiled_ok, compiled_js, comp_err = compile_with_esbuild(code)

    # Auto-repair retry if validation or compile failed
    if (not valid or not compiled_ok) and raw_response:
        err_msg = val_err or comp_err or "Unknown compilation error"
        logger.warning(f"Custom scene initial generation failed ({err_msg}). Attempting auto-repair...")

        repair_prompt = f"""The previous Remotion TSX component had the following error:
ERROR: {err_msg}

Previous code:
```tsx
{code}
```

Fix the code completely. Remember:
- STRICTLY ZERO UNICODE EMOJIS.
- No `window.`, `document.`, `fetch(`, `eval(`, `process.`.
- Must export default function CustomScene({{ text, label, value, subtext, theme }})
- Return ONLY valid TSX in a ```tsx block.
"""
        repair_res = execute_llm_request(
            prompt=repair_prompt,
            request_type="small_check",
            provider="anthropic" if is_anthropic else "gemini",
            api_key=active_key,
            preferred_model=preferred_model,
            temperature=0.2,
        )
        if repair_res.ok:
            repaired_code = _clean_code_fence(repair_res.raw_text or "")
            rep_valid, rep_val_err = validate_custom_scene_code(repaired_code)
            if rep_valid:
                rep_comp_ok, rep_comp_js, rep_comp_err = compile_with_esbuild(repaired_code)
                if rep_comp_ok:
                    logger.info("Custom scene auto-repair succeeded!")
                    all_attempts = attempts_list + [a.model_dump() for a in repair_res.attempts]
                    return {
                        "success": True,
                        "scene_code": repaired_code,
                        "compiled_js": rep_comp_js,
                        "archetype": "custom_ai_scene",
                        "provider": repair_res.provider,
                        "is_fallback": False,
                        "error": None,
                        "attempts": all_attempts,
                    }

    # If successful on first pass
    if valid and compiled_ok:
        return {
            "success": True,
            "scene_code": code,
            "compiled_js": compiled_js,
            "archetype": "custom_ai_scene",
            "provider": llm_res.provider,
            "is_fallback": False,
            "error": None,
            "attempts": attempts_list,
        }

    # Honest failure return if validation/compilation could not be salvaged
    logger.warning("Custom scene validation/compilation failed; returning failure.")
    fb_ok, fb_compiled, _ = compile_with_esbuild(tailored_fallback_code)
    failure_detail = val_err or comp_err or "Generated code failed validation checks."
    return {
        "success": False,
        "scene_code": tailored_fallback_code,
        "compiled_js": fb_compiled if fb_ok else "",
        "archetype": "custom_ai_scene",
        "provider": "deterministic_fallback",
        "is_fallback": True,
        "error": f"Validation failed: {failure_detail}",
        "attempts": attempts_list,
    }
