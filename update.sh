#!/bin/bash
# ================================================
#  LMSP2P — Push ke GitHub (Vercel auto-redeploy)
#  Cara pakai: bash update.sh "pesan commit"
# ================================================

COMMIT_MSG="${1:-update: perubahan kode}"

echo "→ Staging semua perubahan..."
git add .

if git diff --cached --quiet; then
  echo "Tidak ada perubahan baru."
  exit 0
fi

echo "→ Commit: \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

echo "→ Push ke GitHub..."
git push origin main

echo ""
echo "✓ Selesai! Vercel sedang redeploy otomatis."
echo "  Pantau di: https://vercel.com/dashboard"
