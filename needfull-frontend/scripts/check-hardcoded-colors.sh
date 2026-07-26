#!/usr/bin/env bash
# WHAT: Grep-based CI check that flags hardcoded color classes/hex values
# WHY: Prevents recurrence of systemic theming violations
# USAGE: bash scripts/check-hardcoded-colors.sh [--warn-only]
# NOTE: Update the ALLOWLIST regex if a false-positive appears

set -euo pipefail

WARN_ONLY=${1:-}

SRC_DIR="src"
ALLOWLIST_REGEX="\
bg-gray-50$|\
bg-gray-100$|\
text-gray-500$|\
text-gray-600$|\
text-gray-700$|\
text-gray-900$|\
border-gray-100$|\
border-gray-200$|\
hover:border-gray-300$|\
focus:border-gray-300$|\
focus:ring-brand|\
focus:ring-gold|\
ring-gray-300|\
text-white|\
text-black|\
bg-white|\
bg-black|\
placeholder-gray-|\
disabled:bg-gray-50|\
disabled:bg-gray-100|\
disabled:text-gray-|\
group-hover:bg-gray-50|\
hover:bg-gray-50$|\
hover:bg-gray-100|\
aria-selected:bg-gray-50|\
\
bg-brand|\
bg-brand-light|\
bg-brand-dark|\
text-brand|\
text-brand-dark|\
bg-gold|\
bg-gold-light|\
bg-gold-dark|\
text-gold|\
text-gold-dark|\
bg-surface|\
text-surface|\
border-card-border|\
\
bg-success-subtle|\
text-success-text|\
border-success-border|\
bg-warning-subtle|\
text-warning-text|\
border-warning-border|\
bg-error-subtle|\
text-error-text|\
border-error-border|\
\
hover:bg-brand|\
hover:bg-brand-dark|\
hover:bg-gold|\
hover:bg-gold-dark|\
hover:text-brand|\
hover:text-white|\
focus:ring-brand|\
focus:ring-gold|\
focus:border-brand|\
focus:border-gold|\
"

# Patterns that SHOULD trigger the check
FORBIDDEN_PATTERNS=(
  'bg-green-50'
  'bg-green-100'
  'bg-green-200'
  'bg-green-500'
  'bg-red-50'
  'bg-red-100'
  'bg-amber-50'
  'bg-amber-100'
  'bg-amber-200'
  'bg-blue-50'
  'text-green-600'
  'text-green-700'
  'text-green-800'
  'text-red-600'
  'text-red-700'
  'text-amber-600'
  'text-amber-700'
  'text-orange-600'
  'text-blue-600'
  'border-green-200'
  'border-green-300'
  'border-red-200'
  'border-amber-200'
  'border-amber-300'
  'border-amber-400'
  'border-gray-300'
  'bg-\[#'
  'text-\[#'
  'border-\[#'
)

HAS_ERRORS=0
TMPFILE=$(mktemp)

echo "=== Theming Color Check ==="
echo "Scanning $SRC_DIR for hardcoded color classes without theme tokens..."
echo ""

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  grep -rn "$pattern" "$SRC_DIR" \
    --include='*.tsx' --include='*.ts' \
    --exclude='*.css' \
    --exclude='*.d.ts' \
    2>/dev/null \
    | grep -vE "$ALLOWLIST_REGEX" \
    | grep -v '/node_modules/' \
  >> "$TMPFILE" || true
done

if [ -s "$TMPFILE" ]; then
  echo "VIOLATIONS FOUND:"
  echo "================"
  sort -u "$TMPFILE"
  echo ""
  echo "Fix: Replace hardcoded colors with theme tokens from globals.css @theme block."
  echo "  bg-green-50    -> bg-success-subtle"
  echo "  bg-green-100   -> bg-success-subtle"
  echo "  text-green-600 -> text-success-text"
  echo "  border-green-200 -> border-success-border"
  echo "  bg-red-50      -> bg-error-subtle"
  echo "  text-red-600   -> text-error-text"
  echo "  bg-amber-50    -> bg-warning-subtle"
  echo "  text-amber-600  -> text-warning-text"
  echo "  border-amber-200 -> border-warning-border"
  echo "  border-gray-300 -> border-gray-300 (now theme-aware via --color-gray-300)"
  echo ""
  HAS_ERRORS=1
else
  echo "No violations found! All color classes are theme-aware."
fi

rm -f "$TMPFILE"

if [ "$HAS_ERRORS" -eq 1 ] && [ -z "$WARN_ONLY" ]; then
  echo "FAILED: Some color classes need migration to theme tokens."
  echo "Run with --warn-only to bypass (e.g. during active development)."
  exit 1
elif [ "$HAS_ERRORS" -eq 1 ]; then
  echo "WARN: Violations exist but --warn-only set. Not failing."
  exit 0
fi
