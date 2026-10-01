#!/usr/bin/env bash
# ============================================================================
#  One Data — publication d'une version de module (SHA immuable + registre)
#
#  Usage :
#    ./publish.sh <module> <version> [options]
#
#  CIBLES AUTOMATIQUES (publish-targets)
#    Un module listé dans le fichier 'publish-targets' est en déploiement
#    CIBLÉ : il n'est jamais promu en version par défaut de la flotte, et il
#    est épinglé tout seul sur le ou les tenants déclarés.
#        dashboard = teamcolin
#    Ainsi « ./publish.sh dashboard v34 » suffit : Team Colin reçoit v34, les
#    autres clients ne bougent pas. Plus rien à penser au moment de publier.
#
#  Options :
#    --no-default        publie SANS promouvoir la version en défaut.
#    --force-default     promeut en défaut MÊME si le module est ciblé.
#                        (à n'utiliser qu'en sortant un module du mode ciblé)
#    --pin <slug>        épingle ce tenant en plus des cibles automatiques
#    --unpin <slug>      détache ce tenant (il resuit la version par défaut)
#    --republish         autorise la publication alors que le fichier n'a pas
#                        changé (reprise après un échec de vérification CDN)
#
#  Exemples :
#    ./publish.sh dashboard v34               # Team Colin seul (cible auto)
#    ./publish.sh socle v9                    # tout le monde (non ciblé)
#    ./publish.sh propale_vo v9 --pin teamcolin --no-default
#
#  Garde-fous : node -c, aucun secret en dur, tag immuable, CDN vérifié AVANT
#  d'écrire au registre, refus de republier un fichier inchangé, et récap de
#  l'état du registre à la fin (défaut de flotte + tenants épinglés).
# ============================================================================
set -euo pipefail

MODULE="${1:?usage: ./publish.sh <module> <version> [--no-default] [--pin <slug>]}"
VERSION="${2:?usage: ./publish.sh <module> <version> [--no-default] [--pin <slug>]}"
shift 2

SET_DEFAULT=1
FORCE_DEFAULT=0
EXPLICIT_NO_DEFAULT=0
REPUBLISH=0
PIN=""
UNPIN=""
while [ $# -gt 0 ]; do
  case "$1" in
    --no-default)    SET_DEFAULT=0; EXPLICIT_NO_DEFAULT=1; shift ;;
    --force-default) FORCE_DEFAULT=1; shift ;;
    --republish)     REPUBLISH=1; shift ;;
    --pin)           PIN="${2:?--pin attend un slug}"; shift 2 ;;
    --unpin)         UNPIN="${2:?--unpin attend un slug}"; shift 2 ;;
    *) echo "❌ option inconnue : $1"; exit 1 ;;
  esac
done

# --- config (depuis .env, NON commité) --------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$SCRIPT_DIR/.env" ] && source "$SCRIPT_DIR/.env"
: "${CP_URL:?CP_URL manquant dans .env (ex https://lerofucjmfrrduohnwet.supabase.co)}"
: "${CP_SERVICE_KEY:?CP_SERVICE_KEY manquant dans .env (service_role du control plane)}"

REPO="oropra-apps/one-data-blocs"
FILE="${MODULE}.js"
TAG="${MODULE}-${VERSION}"
TARGETS_FILE="$SCRIPT_DIR/publish-targets"

cp_curl() { curl -fsS "$@" \
  -H "apikey: ${CP_SERVICE_KEY}" \
  -H "Authorization: Bearer ${CP_SERVICE_KEY}" \
  -H "Content-Type: application/json"; }

# lit une valeur texte dans une réponse JSON (objet ou tableau d'un élément)
jval() {  # $1 = clé, $2 = json
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$2" | jq -r "(if type==\"array\" then .[0] else . end).$1 // empty"
  else
    printf '%s' "$2" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p"
  fi
}

# --- cibles automatiques ----------------------------------------------------
# Lues AVANT toute écriture : si le module est ciblé, la promotion en défaut
# est désarmée d'office. C'est la correction du piège qui, cinq fois, a fait
# basculer toute la flotte sur une version écrite pour un seul client.
AUTO_TARGETS=""
if [ -f "$TARGETS_FILE" ]; then
  AUTO_TARGETS="$(sed -e 's/#.*//' "$TARGETS_FILE" \
                  | grep -E "^[[:space:]]*${MODULE}[[:space:]]*=" \
                  | head -n1 | cut -d= -f2 | tr -d '[:space:]' || true)"
fi

if [ -n "$AUTO_TARGETS" ]; then
  if [ "$FORCE_DEFAULT" = "1" ]; then
    SET_DEFAULT=1
    echo "⚠️  '${MODULE}' est ciblé (${AUTO_TARGETS}) mais --force-default a été demandé :"
    echo "    la version SERA promue en défaut de flotte."
  else
    SET_DEFAULT=0
    echo "ℹ️  '${MODULE}' est en déploiement ciblé → ${AUTO_TARGETS}"
    echo "    (défaut de flotte inchangé ; --force-default pour le promouvoir)"
  fi
fi

[ -f "$FILE" ] || { echo "❌ fichier introuvable : $FILE (es-tu dans le dossier du repo ?)"; exit 1; }

# Garde-fou : le module doit au moins être du JS valide
if command -v node >/dev/null 2>&1; then
  node -c "$FILE" || { echo "❌ $FILE ne compile pas (node -c). Publication annulée."; exit 1; }
fi

# Garde-fou : aucun secret / URL de tenant en dur
#
# Exception ciblée pour socle.js : c'est le point d'amorçage de la flotte.
# Il doit porter l'URL et la clé ANON du control plane pour résoudre le
# tenant, et ne peut donc pas les recevoir d'ailleurs — il n'a personne
# au-dessus de lui. Une clé ANON est publique par construction : elle est
# dans le bundle servi à chaque client, lisible par n'importe quel
# visiteur. Ce n'est pas un secret, contrairement à sb_secret_.
#
# Les deux autres motifs restent contrôlés sur socle.js comme ailleurs :
# un vrai secret (sb_secret_) et la référence d'un tenant en dur, qui
# n'ont rien à faire dans un fichier servi à toute la flotte.
if [ "$FILE" = "socle.js" ]; then
  MOTIFS_INTERDITS='sb_secret_|esehlhlrqcsfszunpjrt'
else
  MOTIFS_INTERDITS='eyJhbGciOiJIUzI1NiI|sb_secret_|esehlhlrqcsfszunpjrt'
fi
if grep -qE "$MOTIFS_INTERDITS" "$FILE"; then
  echo "❌ $FILE contient un secret ou une URL de tenant en dur. Publication annulée."; exit 1
fi

# Garde-fou : le fichier a-t-il réellement changé ?
# (« rien de neuf à committer » = tu republies l'ancien code sous un nouveau nom)
# Un fichier NOUVEAU (jamais committé) n'a pas de diff : sans ce test, il était
# pris pour « identique » et le premier publish d'un module échouait.
if git ls-files --error-unmatch -- "$FILE" >/dev/null 2>&1 \
   && git diff --quiet -- "$FILE" && git diff --cached --quiet -- "$FILE"; then
  if [ "$REPUBLISH" != "1" ]; then
    echo "❌ $FILE est identique à la version committée : il n'y a rien à publier."
    echo "   Soit ton correctif n'est pas enregistré (vérifie : grep -n '<ton correctif>' $FILE),"
    echo "   soit tu reprends un run interrompu — dans ce cas : --republish"
    exit 1
  fi
  echo "⚠️  fichier inchangé, publication forcée (--republish)"
fi

# Immuabilité : un tag existant n'est réutilisable que s'il pointe déjà sur HEAD
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  if [ "$(git rev-parse "refs/tags/$TAG^{commit}")" = "$(git rev-parse HEAD)" ]; then
    echo "ℹ️  tag $TAG déjà posé sur ce commit — reprise du run."
  else
    echo "❌ le tag '$TAG' existe déjà sur un autre commit. Incrémente la version."; exit 1
  fi
  TAG_EXISTS=1
else
  TAG_EXISTS=0
fi

echo "→ commit + push de $FILE …"
git add "$FILE"
git commit -m "publish ${MODULE} ${VERSION}" || echo "  (rien de neuf à committer)"
git push

if [ "$TAG_EXISTS" = "0" ]; then
  echo "→ tag $TAG (historique / rollback) …"
  git tag "$TAG"
  git push origin "$TAG"
fi

SHA="$(git rev-parse HEAD)"
CDN_URL="https://cdn.jsdelivr.net/gh/${REPO}@${SHA}/${FILE}"

# --- VÉRIFICATION CDN avant d'écrire quoi que ce soit au registre ------------
echo "→ vérification du CDN (jsDelivr doit servir le fichier) …"
OK=0
for i in $(seq 1 20); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' -m 15 "$CDN_URL" || true)"
  if [ "$CODE" = "200" ]; then OK=1; echo "  ✅ CDN OK (tentative $i)"; break; fi
  echo "  … pas encore prêt (HTTP $CODE) — nouvelle tentative dans 6 s"
  sleep 6
done
if [ "$OK" != "1" ]; then
  echo "❌ le CDN ne sert pas $CDN_URL"
  echo "   Le registre n'a PAS été modifié : les clients restent sur la version précédente."
  echo "   (git push et tag sont faits ; relance avec --republish.)"
  exit 1
fi

# --- publication au registre ------------------------------------------------
# p_make_default = false : la version est enregistrée mais PAS promue.
# Les clients non épinglés restent où ils sont.
if [ "$SET_DEFAULT" = "1" ]; then MAKE_DEFAULT=true; else MAKE_DEFAULT=false; fi

echo "→ enregistrement dans le registre (control plane) …"
RESP="$(cp_curl -X POST "${CP_URL}/rest/v1/rpc/publish_module_version" \
  -d "{\"p_module\":\"${MODULE}\",\"p_label\":\"${VERSION}\",\"p_cdn_url\":\"${CDN_URL}\",\"p_make_default\":${MAKE_DEFAULT}}")"

# la RPC renvoie {module, label, version_id, cdn_url, default}
VERSION_ID="$(jval version_id "$RESP")"
[ -n "$VERSION_ID" ] || { echo "❌ réponse inattendue du registre : $RESP"; exit 1; }

# --- épinglages -------------------------------------------------------------
epingler() {  # $1 = slug
  local slug="$1" tid
  tid="$(jval id "$(cp_curl "${CP_URL}/rest/v1/tenant?slug=eq.${slug}&select=id")")"
  [ -n "$tid" ] || { echo "❌ tenant '${slug}' introuvable au control plane"; exit 1; }
  cp_curl -X POST "${CP_URL}/rest/v1/tenant_module" \
    -H "Prefer: resolution=merge-duplicates,return=minimal" \
    -d "{\"tenant_id\":${tid},\"module_key\":\"${MODULE}\",\"version_id\":\"${VERSION_ID}\"}" >/dev/null
  echo "  ✅ ${slug} → ${MODULE} ${VERSION}"
}

if [ -n "$AUTO_TARGETS" ] && [ "$FORCE_DEFAULT" != "1" ]; then
  echo "→ épinglage des cibles automatiques …"
  IFS=',' read -ra _cibles <<< "$AUTO_TARGETS"
  for c in "${_cibles[@]}"; do [ -n "$c" ] && epingler "$c"; done
fi

if [ -n "$PIN" ]; then
  echo "→ épinglage de '${PIN}' sur ${VERSION} …"
  epingler "$PIN"
fi

if [ -n "$UNPIN" ]; then
  echo "→ détachement de '${UNPIN}' …"
  TENANT_ID="$(jval id "$(cp_curl "${CP_URL}/rest/v1/tenant?slug=eq.${UNPIN}&select=id")")"
  [ -n "$TENANT_ID" ] || { echo "❌ tenant '${UNPIN}' introuvable au control plane"; exit 1; }
  cp_curl -X DELETE "${CP_URL}/rest/v1/tenant_module?tenant_id=eq.${TENANT_ID}&module_key=eq.${MODULE}" >/dev/null
  echo "  ✅ ${UNPIN} resuit désormais la version par défaut"
fi

# --- récapitulatif : qui reçoit quoi, maintenant ----------------------------
# C'est la ligne qu'il faut lire avant de fermer le terminal : si le défaut de
# flotte a bougé alors qu'il ne devait pas, ça se voit ici, tout de suite.
echo
echo "✅ ${MODULE} ${VERSION} publié :"
echo "   ${CDN_URL}"
echo
echo "   ETAT DU REGISTRE POUR '${MODULE}' :"
# Deux appels plats plutôt qu'un select imbriqué : la jointure PostgREST
# renvoyait {default_version:{label:…}}, dont jval ne sait pas lire la clé
# imbriquée — le récap annonçait donc « aucun » alors que le défaut existait.
DEF_ID="$(jval default_version_id "$(cp_curl "${CP_URL}/rest/v1/code_module?module_key=eq.${MODULE}&select=default_version_id")")"
if [ -n "$DEF_ID" ] && [ "$DEF_ID" != "null" ]; then
  DEF_LABEL="$(jval label "$(cp_curl "${CP_URL}/rest/v1/code_version?id=eq.${DEF_ID}&select=label")")"
else
  DEF_LABEL=""
fi
echo "   - defaut de flotte : ${DEF_LABEL:-aucun (null)}"
# Sortie en ASCII pur : le terminal Git Bash sous Windows n'est pas en UTF-8 et
# transformait les puces et les flèches en charabia.
PINS="$(cp_curl "${CP_URL}/rest/v1/tenant_module?module_key=eq.${MODULE}&select=tenant:tenant(slug),version:code_version(label)" 2>/dev/null || true)"
if command -v jq >/dev/null 2>&1 && [ -n "$PINS" ]; then
  printf '%s' "$PINS" | jq -r '.[] | "   - epingle : \(.tenant.slug) = \(.version.label)"'
else
  echo "   - epinglages : ${PINS:-aucun}"
fi
echo
if [ "$SET_DEFAULT" = "1" ]; then
  echo "   → version par DÉFAUT : tous les clients non épinglés la reçoivent"
else
  echo "   → publiée SANS être promue : seuls les tenants épinglés dessus la reçoivent"
  echo "     promouvoir plus tard (control plane) :"
  echo "     update code_module set default_version_id = '${VERSION_ID}'"
  echo "      where module_key = '${MODULE}';"
fi
