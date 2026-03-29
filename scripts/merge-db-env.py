#!/usr/bin/env python3
"""
Merge DATABASE_URL and DIRECT_DATABASE_URL from the process environment into ./.env.

Used ONLY by the manual GitHub Actions workflow — never by the main deploy job.
"""
import os
import pathlib
import sys


def main() -> None:
    db = os.environ.get("DATABASE_URL", "").strip()
    direct = os.environ.get("DIRECT_DATABASE_URL", "").strip()
    if not db or not direct:
        print("merge-db-env: DATABASE_URL and DIRECT_DATABASE_URL must both be set", file=sys.stderr)
        sys.exit(1)

    db = db.strip('"').strip("'")
    direct = direct.strip('"').strip("'")

    p = pathlib.Path(".env")
    lines: list[str] = []
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            if line.startswith("DATABASE_URL=") or line.startswith("DIRECT_DATABASE_URL="):
                continue
            lines.append(line)
    while lines and lines[-1] == "":
        lines.pop()

    def esc(v: str) -> str:
        return v.replace("\\", "\\\\").replace('"', '\\"')

    lines.append(f'DATABASE_URL="{esc(db)}"')
    lines.append(f'DIRECT_DATABASE_URL="{esc(direct)}"')
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("merge-db-env: wrote DATABASE_URL and DIRECT_DATABASE_URL")


if __name__ == "__main__":
    main()
