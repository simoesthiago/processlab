"""
LLM-based command interpreter for natural language BPMN editing.

Uses OpenAI GPT to convert free-form commands into structured patch operations.
Falls back gracefully — callers should catch LlmInterpreterError for error mapping.
"""

from __future__ import annotations

import json
import re
import logging
from typing import Any

logger = logging.getLogger(__name__)


class LlmInterpreterError(Exception):
    """Base error for LLM interpreter failures."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.status_code = status_code


SYSTEM_PROMPT = """\
You are a BPMN diagram editor assistant. Your job is to translate natural-language \
editing commands into structured JSON patch operations.

Respond ONLY with a single JSON object. No markdown fences, no explanation.

Supported operations:
  {"op": "add_node",        "args": {"type": "<bpmn:Type>", "name": "<name>", "x": <int>, "y": <int>}}
  {"op": "connect_by_name", "args": {"sourceName": "<name>", "targetName": "<name>"}}
  {"op": "remove_by_name",  "args": {"name": "<name>"}}
  {"op": "rename_by_name",  "args": {"oldName": "<name>", "newName": "<name>"}}
  {"op": "convert_by_name", "args": {"name": "<name>", "type": "<bpmn:Type>"}}
  {"op": "noop",            "args": {}}

Valid bpmn:Type values: bpmn:Task, bpmn:UserTask, bpmn:ServiceTask, bpmn:ScriptTask, \
bpmn:SendTask, bpmn:ReceiveTask, bpmn:StartEvent, bpmn:EndEvent, bpmn:IntermediateCatchEvent, \
bpmn:IntermediateThrowEvent, bpmn:ExclusiveGateway, bpmn:ParallelGateway, \
bpmn:InclusiveGateway, bpmn:EventBasedGateway, bpmn:SubProcess.

Use x/y values between 100–800 (x) and 100–500 (y). Place new nodes to the right of \
existing ones when possible.

If the command is ambiguous or cannot be represented as a single operation, return \
{"op": "noop", "args": {}}.
"""


class LlmCommandInterpreter:
    """
    Interprets BPMN editing commands using an OpenAI LLM.

    Usage:
        interpreter = LlmCommandInterpreter(api_key="sk-...")
        patch = interpreter.interpret("Add a user task called Review", elements)
    """

    def __init__(self, api_key: str, model: str = "gpt-4o-mini", timeout: int = 15):
        try:
            import openai  # type: ignore
        except ImportError as exc:
            raise LlmInterpreterError(
                "openai package is not installed. Run: pip install openai", 500
            ) from exc

        self._openai = openai
        self.client = openai.OpenAI(api_key=api_key, timeout=timeout)
        self.model = model

    def interpret(self, command: str, elements: list[dict[str, Any]]) -> dict:
        """
        Translate a natural-language command into a patch dict.

        Args:
            command: User's free-form instruction, e.g. "Add a review task after Submit"
            elements: List of current diagram elements [{id, name, type}, ...]

        Returns:
            A patch dict, e.g. {"op": "add_node", "args": {...}}

        Raises:
            LlmInterpreterError: on authentication, rate-limit, timeout, or parse errors
        """
        # Build compact element context (avoid leaking large diagrams in tokens)
        element_context = [
            {"id": el.get("id"), "name": el.get("name"), "type": el.get("type")}
            for el in elements
            if el.get("id")
        ][:40]  # cap at 40 elements to keep prompt short

        user_content = (
            f"Current elements: {json.dumps(element_context)}\n\n"
            f"Command: {command}"
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_content},
                ],
                temperature=0,
                max_tokens=256,
            )
        except self._openai.AuthenticationError as exc:
            logger.warning("OpenAI authentication failed")
            raise LlmInterpreterError("Invalid OpenAI API key", 401) from exc
        except self._openai.RateLimitError as exc:
            logger.warning("OpenAI rate limit exceeded")
            raise LlmInterpreterError("OpenAI rate limit exceeded — try again later", 429) from exc
        except self._openai.APITimeoutError as exc:
            logger.warning("OpenAI request timed out")
            raise LlmInterpreterError("AI service timed out — try again", 503) from exc
        except self._openai.OpenAIError as exc:
            logger.error(f"OpenAI API error: {exc}")
            raise LlmInterpreterError(f"AI service error: {exc}", 502) from exc

        raw = (response.choices[0].message.content or "").strip()
        logger.debug(f"LLM raw response: {raw!r}")

        return self._parse_response(raw)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _parse_response(self, raw: str) -> dict:
        """Extract and validate JSON from the LLM response."""
        # Strip markdown code fences if present
        cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).strip().strip("`")

        # Extract first JSON object (greedy match within braces)
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            logger.warning(f"LLM returned no JSON object: {raw!r}")
            return {"op": "noop", "args": {}}

        try:
            patch = json.loads(match.group())
        except json.JSONDecodeError as exc:
            logger.warning(f"LLM JSON parse error: {exc} — raw: {raw!r}")
            return {"op": "noop", "args": {}}

        # Basic shape validation
        if not isinstance(patch, dict) or "op" not in patch:
            logger.warning(f"LLM patch missing 'op': {patch}")
            return {"op": "noop", "args": {}}

        if "args" not in patch or not isinstance(patch["args"], dict):
            patch["args"] = {}

        return patch
