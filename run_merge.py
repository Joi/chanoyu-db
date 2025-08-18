from __future__ import annotations

import os
import sys


def main() -> None:
    # Ensure project root on sys.path
    project_root = os.path.abspath(os.path.dirname(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    # Signal dumping outputs without CLI flags
    os.environ["DUMP"] = os.environ.get("DUMP", "true")

    # Import and run the existing entrypoint
    from main import main as entrypoint

    entrypoint()


if __name__ == "__main__":
    main()



