#!/usr/bin/env bash
# Run as root ON the PostgreSQL machine (85.215.156.153), via SSH or provider console.
# Fixes the usual cause of P1001 from the app server: firewall + Docker not publishing :5432.
#
# App server that must reach this host:
#   STRATO_APP_IP=82.165.66.236
#
# Usage:
#   sudo bash scripts/db-recovery-on-db-host.sh           # diagnose only
#   sudo bash scripts/db-recovery-on-db-host.sh --apply   # add ufw rule + restart docker postgres

set -euo pipefail
STRATO_APP_IP="${STRATO_APP_IP:-82.165.66.236}"
APPLY="${1:-}"

echo "=== Pack Attack DB host recovery (this machine) ==="
echo "Allowing inbound from app server: ${STRATO_APP_IP} -> TCP 5432 (prod) / 5433 (dev)"

echo "=== docker postgres containers ==="
docker ps -a 2>/dev/null | grep -iE 'postgres|POSTGRES' || true
echo "=== try start common container names ==="
for n in postgres packattack-db pg; do
  docker start "$n" 2>/dev/null && echo "started $n" && break
done || true
echo "=== listen on 5432 / 5433 ==="
ss -tlnp 2>/dev/null | grep -E '5432|5433' || echo "(no listener on 5432/5433)"
echo "=== systemd postgresql ==="
systemctl is-active postgresql 2>/dev/null || systemctl is-active postgresql@* 2>/dev/null || true

if [[ "${APPLY}" == "--apply" ]]; then
  echo "=== APPLY: ufw ==="
  if command -v ufw >/dev/null 2>&1; then
    ufw allow from "${STRATO_APP_IP}" to any port 5432 proto tcp comment 'packattack prod'
    ufw allow from "${STRATO_APP_IP}" to any port 5433 proto tcp comment 'packattack dev'
    ufw reload || true
  else
    echo "ufw not installed — open TCP 5432 and 5433 from ${STRATO_APP_IP} in your provider firewall / security group."
  fi
  echo "=== APPLY: restart docker postgres containers (all names) ==="
  docker ps -a --format '{{.Names}}' 2>/dev/null | grep -iE 'postgres|packattack|pg' | while read -r n; do
    docker restart "$n" 2>/dev/null && echo "restarted $n" || true
  done
  echo "=== listen again ==="
  ss -tlnp 2>/dev/null | grep -E '5432|5433' || echo "(still no listener — check Docker -p 0.0.0.0:5432:5432)"
fi

echo "=== ufw status (if installed) ==="
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose 2>/dev/null || true
else
  echo "If ufw is not used, configure your provider firewall: allow ${STRATO_APP_IP} -> TCP 5432 (and 5433 if needed)."
fi

echo ""
echo "If still failing: inside the Postgres container, listen_addresses must include '*' or the"
echo "public IP, and pg_hba.conf must allow hostssl or host connections from ${STRATO_APP_IP}."
echo "Docker run must publish: -p 0.0.0.0:5432:5432 (not only 127.0.0.1)."
