#!/usr/bin/env bash
# Run as root ON the database machine (85.215.156.153) — SSH, serial console, or provider panel.
#
# Symptom from Strato app server: Prisma P1001 / "connection refused" to :5432 or :5433 means
# TCP never reaches PostgreSQL. Fix is always on THIS host: Docker/systemd, bind address, firewall.
#
# App server that must be allowed inbound:
#   STRATO_APP_IP=82.165.66.236  (production, pack-attack.de)
#
# Usage:
#   sudo bash scripts/db-recovery-on-db-host.sh           # diagnose
#   sudo bash scripts/db-recovery-on-db-host.sh --apply   # ufw + docker restart + compose up

set -euo pipefail
STRATO_APP_IP="${STRATO_APP_IP:-82.165.66.236}"
APPLY="${1:-}"

echo "=== Pack Attack — DB host recovery (run on 85.215.156.153) ==="
echo "Strato app IP to allow: ${STRATO_APP_IP} -> TCP 5432 (prod), 5433 (dev)"
echo ""

echo "=== All Docker containers (names matter) ==="
docker ps -a 2>/dev/null || echo "(docker not installed or not running)"

echo ""
echo "=== Listeners on 5432 / 5433 (want 0.0.0.0 or *, not only 127.0.0.1) ==="
ss -tlnp 2>/dev/null | grep -E ':5432|:5433' || echo "(nothing listening on 5432/5433 — start Postgres/Docker)"

echo ""
echo "=== Per-container published ports (if Postgres is in Docker) ==="
while read -r cid; do
  [ -z "$cid" ] && continue
  echo "--- $cid ---"
  docker port "$cid" 2>/dev/null || true
done < <(docker ps -aq 2>/dev/null | head -20)

echo ""
echo "=== systemd PostgreSQL (non-Docker installs) ==="
systemctl is-active postgresql 2>/dev/null || systemctl is-active 'postgresql@*' 2>/dev/null || true

echo ""
echo "=== ufw (if installed) ==="
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose 2>/dev/null || true
else
  echo "(ufw not installed — use provider firewall / iptables)"
fi

echo ""
echo "=== iptables INPUT (first 30 lines) ==="
iptables -L INPUT -n -v 2>/dev/null | head -30 || nft list ruleset 2>/dev/null | head -40 || true

if [[ "${APPLY}" == "--apply" ]]; then
  echo ""
  echo "=== APPLY: firewall (ufw) ==="
  if command -v ufw >/dev/null 2>&1; then
    ufw allow from "${STRATO_APP_IP}" to any port 5432 proto tcp comment 'packattack prod'
    ufw allow from "${STRATO_APP_IP}" to any port 5433 proto tcp comment 'packattack dev'
    ufw reload || true
  else
    echo "Install/enable ufw or add provider rules: allow ${STRATO_APP_IP} -> TCP 5432, 5433"
  fi

  echo ""
  echo "=== APPLY: docker compose (common paths) ==="
  for d in /root /opt /var/www /home; do
    for f in docker-compose.yml compose.yaml docker-compose.yaml; do
      if [[ -f "$d/$f" ]]; then
        echo "Trying: cd $d && docker compose -f $f up -d"
        (cd "$d" && docker compose -f "$f" up -d) 2>/dev/null && echo "OK: $d/$f" || true
      fi
    done
  done

  echo ""
  echo "=== APPLY: start/restart Postgres containers ==="
  docker ps -a --format '{{.Names}}' 2>/dev/null | grep -iE 'postgres|packattack|pg' | while read -r n; do
    docker start "$n" 2>/dev/null || docker restart "$n" 2>/dev/null || true
    echo "touched: $n"
  done

  for n in postgres packattack-db pg; do
    docker start "$n" 2>/dev/null && echo "started: $n" && break
  done || true

  echo ""
  echo "=== Listeners again ==="
  ss -tlnp 2>/dev/null | grep -E ':5432|:5433' || echo "(still nothing — fix -p 0.0.0.0:5432:5432 and container health)"
fi

echo ""
echo "=== Checklist (if still failing) ==="
echo "1. Container must publish: -p 0.0.0.0:5432:5432 (not 127.0.0.1:5432:5432)."
echo "2. postgresql.conf: listen_addresses = '*' (or host IP) inside container/VM."
echo "3. pg_hba.conf: host all all ${STRATO_APP_IP}/32 scram-sha-256 (or md5)."
echo "4. Provider/cloud firewall: allow ${STRATO_APP_IP} -> 5432, 5433."
echo "5. Optional: add Strato deploy public key to root's ~/.ssh/authorized_keys on this host for automation."
