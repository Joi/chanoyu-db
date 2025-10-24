"""Helper functions for interacting with Claude via the Anthropic API"""

import os
from pathlib import Path
from typing import Dict, Any
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_claude_client() -> Anthropic:
    """Get configured Claude client"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY not found in environment. "
            "Add it to .env.local or set as environment variable."
        )
    return Anthropic(api_key=api_key)


def read_file(file_path: Path | str) -> str:
    """Read file contents safely"""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return path.read_text(encoding="utf-8")


def write_file(file_path: Path | str, content: str) -> None:
    """Write file contents safely, creating parent directories if needed"""
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def load_prompt_template(template_name: str, context: Dict[str, Any] = None) -> str:
    """Load a prompt template and substitute variables"""
    template_path = Path(__file__).parent.parent / "prompts" / template_name
    template = read_file(template_path)

    if context:
        # Simple variable substitution
        for key, value in context.items():
            template = template.replace(f"{{{{{key}}}}}", str(value))

    return template


def ask_claude(
    prompt: str = None,
    prompt_template: str = None,
    context: Dict[str, Any] = None,
    model: str = "claude-sonnet-4-5-20250929",
    max_tokens: int = 4000,
    temperature: float = 1.0,
) -> str:
    """
    Ask Claude a question and get a response.

    Args:
        prompt: Direct prompt string
        prompt_template: Name of template file in prompts/ directory
        context: Variables to substitute in template
        model: Claude model to use
        max_tokens: Maximum tokens in response
        temperature: Sampling temperature (0-1)

    Returns:
        Claude's text response

    Example:
        # Direct prompt
        response = ask_claude(prompt="Explain this code: {...}")

        # Template with context
        response = ask_claude(
            prompt_template="test_generation.md",
            context={"component_code": code}
        )
    """
    if prompt is None and prompt_template is None:
        raise ValueError("Must provide either prompt or prompt_template")

    if prompt_template:
        prompt = load_prompt_template(prompt_template, context)

    client = get_claude_client()

    message = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return message.content[0].text
