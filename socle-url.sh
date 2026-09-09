#!/usr/bin/env bash
# socle-url.sh — compose l'URL ÉPINGLÉE du socle, à coller dans l'amorce WeWeb.
#
# Le socle n'est pas un module du registre : il est chargé par une balise posée
# dans le workflow « on app load » de WeWeb. Tant que cette balise pointe sur
# @main, jsDelivr et le navigateur peuvent servir une version périmée pendant
# des heures — et c'est le seul fichier commun à TOUS les tenants, donc le seul
# dont on ne peut ni voir la version en place, ni revenir en arrière.
#
# Usage :
#   ./socle-url.sh              → l'URL du dernier commit touchant socle.js
#   ./socle-url.sh --verifie    → la même, après avoir vérifié que le CDN la sert
set -euo pipefail

DEPOT="oropra-apps/one-data-blocs"
cd "$(dirname "$0")"

# Le dépôt distant fait foi : une empreinte locale non poussée ne serait servie
# par personne.
git fetch --quiet origin main
LOCAL=$(git rev-parse HEAD)
DISTANT=$(git rev-parse origin/main)
if [ "$LOCAL" != "$DISTANT" ]; then
  echo "⚠  Votre dépôt local diffère de origin/main. Faites 'git pull' (ou 'git push')." >&2
fi

SHA=$(git log -1 --format=%H origin/main -- socle.js)
COURT=${SHA:0:7}
DATE=$(git log -1 --format=%ci "$SHA" -- socle.js)
URL="https://cdn.jsdelivr.net/gh/${DEPOT}@${SHA}/socle.js"

if [ "${1:-}" = "--verifie" ]; then
  echo "→ vérification du CDN…"
  if curl -fsS "$URL" -o /dev/null; then
    echo "  ✅ jsDelivr sert bien ce commit"
  else
    echo "  ❌ jsDelivr ne trouve pas ce commit — attendez une minute et réessayez" >&2
    exit 1
  fi
fi

echo
echo "Socle épinglé sur $COURT  ($DATE)"
echo
echo "Collez cette ligne dans l'amorce WeWeb (workflow « on app load ») :"
echo
echo "  s.src = '${URL}';"
echo
echo "Puis publiez le projet WeWeb — un workflow modifié ne prend effet qu'après publication."
