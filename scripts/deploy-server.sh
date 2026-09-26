#!/usr/bin/env bash
# Deploy the Next.js frontend on the production server.
# Invoked by .github/workflows/deploy.yml over SSH:  ssh ... "APP_DIR=... bash -s" < scripts/deploy-server.sh
#
# 1. git pull --ff-only (aborts if the server checkout diverged)
# 2. Build the new image while the old container keeps serving
# 3. Recreate ONLY the web container (Traefik / API untouched)
# 4. Wait until it answers HTTP; on failure roll back to the previous image
set -euo pipefail

APP_DIR="${APP_DIR:-/root/HR-Managment}"
BRANCH="${BRANCH:-main}"
CONTAINER=hr-frontend-web
HEALTH_TIMEOUT=180

cd "$APP_DIR"
C="docker compose --env-file .env.production -f docker-compose.prod.yml"

echo "==> Pulling $BRANCH"
PREV_COMMIT=$(git rev-parse HEAD)
git fetch origin "$BRANCH"
git merge --ff-only "origin/$BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)
echo "    $PREV_COMMIT -> $NEW_COMMIT"

IMAGE=$(docker inspect -f '{{.Config.Image}}' "$CONTAINER")
PREV_IMAGE_ID=$(docker inspect -f '{{.Image}}' "$CONTAINER")
docker tag "$PREV_IMAGE_ID" "$IMAGE:rollback"

echo "==> Building new image (old container still serving)"
$C build web

echo "==> Recreating web container"
$C up -d --no-deps web

echo "==> Waiting for the site to respond"
deadline=$((SECONDS + HEALTH_TIMEOUT))
until docker exec "$CONTAINER" wget -q -O /dev/null http://127.0.0.1:3001/ 2>/dev/null; do
  if [ $SECONDS -ge $deadline ] || [ "$(docker inspect -f '{{.State.Status}}' "$CONTAINER")" = exited ]; then
    echo "!! Frontend not responding — rolling back to previous image"
    docker logs --tail 80 "$CONTAINER" || true
    git reset --hard "$PREV_COMMIT"
    docker tag "$IMAGE:rollback" "$IMAGE"
    $C up -d --no-deps web
    echo "!! Rolled back to $PREV_COMMIT"
    exit 1
  fi
  sleep 5
done

echo "==> Up. Cleaning up"
docker rmi "$IMAGE:rollback" >/dev/null 2>&1 || true
docker image prune -f >/dev/null
echo "==> Deployed $NEW_COMMIT"
