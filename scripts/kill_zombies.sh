#!/usr/bin/env bash
set -euo pipefail

# Kill stray Next.js dev servers and free common dev ports.
# Customize ports by setting KILL_PORTS="3000 3001 ...".

PORTS=${KILL_PORTS:-"3000 3001 3002 3003 3004 3005 3006 3007 3008 3009"}

echo "Killing stray Next.js dev servers (if any)..."
pkill -f "next dev" >/dev/null 2>&1 || true
pkill -f "node.*next.*dev" >/dev/null 2>&1 || true

FREED=()
for p in $PORTS; do
  if lsof -ti tcp:$p >/dev/null 2>&1; then
    pid=$(lsof -ti tcp:$p | tr '\n' ' ')
    echo "Killing PID(s) $pid on port $p"
    kill -9 $pid >/dev/null 2>&1 || true
    FREED+=("$p")
  fi
done

if [ ${#FREED[@]} -gt 0 ]; then
  echo "Freed ports: ${FREED[*]}"
else
  echo "No occupied dev ports found."
fi

exit 0


