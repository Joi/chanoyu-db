#!/usr/bin/env python3
"""
Generate Vitest tests for React components in chanoyu-db.

Usage:
    python tools/generate_test.py <component-path>

Example:
    python tools/generate_test.py app/admin/objects/page.tsx
"""

import sys
from pathlib import Path
from utils.claude_helpers import ask_claude, read_file, write_file


def generate_test_path(component_path: Path) -> Path:
    """
    Convert component path to test file path.

    Examples:
        app/admin/objects/page.tsx -> tests/admin/objects/page.test.tsx
        app/components/SearchSelect.tsx -> tests/components/SearchSelect.test.tsx
    """
    # Remove 'app/' prefix if present
    relative_path = str(component_path)
    if relative_path.startswith("app/"):
        relative_path = relative_path[4:]

    # Change extension to .test.tsx
    test_path = Path("tests") / relative_path
    test_path = test_path.with_suffix(".test.tsx")

    return test_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/generate_test.py <component-path>")
        print("\nExample:")
        print("  python tools/generate_test.py app/admin/objects/page.tsx")
        sys.exit(1)

    # Get component path
    component_path = Path(sys.argv[1])
    project_root = Path(__file__).parent.parent

    # Full path to component
    full_component_path = project_root / component_path

    if not full_component_path.exists():
        print(f"❌ Error: Component not found: {full_component_path}")
        sys.exit(1)

    print(f"📖 Reading component: {component_path}")
    component_code = read_file(full_component_path)

    print(f"🤖 Generating test with Claude...")

    try:
        test_code = ask_claude(
            prompt_template="test_generation.md",
            context={"component_code": component_code},
            max_tokens=4000,
        )

        # Clean up the response (remove markdown code blocks if present)
        if test_code.startswith("```"):
            # Remove opening ```typescript or ```tsx
            lines = test_code.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            # Remove closing ```
            if lines[-1].strip() == "```":
                lines = lines[:-1]
            test_code = "\n".join(lines)

        # Determine output path
        test_path = generate_test_path(component_path)
        full_test_path = project_root / test_path

        # Write the test file
        write_file(full_test_path, test_code)

        print(f"✅ Generated test: {test_path}")
        print(f"\n💡 Next steps:")
        print(f"   1. Review the generated test: {test_path}")
        print(f"   2. Run it: pnpm test {test_path}")
        print(f"   3. Adjust as needed for your specific use case")

    except Exception as e:
        print(f"❌ Error generating test: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
