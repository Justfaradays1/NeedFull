// WHAT: CI check that flags hardcoded color classes missing theme tokens
// WHY: Prevents recurrence of systemic theming violations
// USAGE: node scripts/check-hardcoded-colors.mjs [--warn-only]

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const FORBIDDEN = [
  "bg-green-50", "bg-green-100", "bg-green-200", "bg-green-500",
  "bg-red-50", "bg-red-100",
  "bg-amber-50", "bg-amber-100", "bg-amber-200",
  "bg-blue-50",
  "text-green-600", "text-green-700", "text-green-800",
  "text-red-600", "text-red-700",
  "text-amber-600", "text-amber-700",
  "text-orange-600",
  "text-blue-600",
  "border-green-200", "border-green-300",
  "border-red-200",
  "border-amber-200", "border-amber-300", "border-amber-400",
  "border-gray-300",
];

const ALLOWLIST = [
  "bg-gray-50", "bg-gray-100",
  "text-gray-500", "text-gray-600", "text-gray-700", "text-gray-900",
  "border-gray-100", "border-gray-200",
  "hover:border-gray-300", "focus:border-gray-300",
  "focus:ring-brand", "focus:ring-gold",
  "ring-gray-300",
  "text-white", "text-black", "bg-white", "bg-black",
  "placeholder-gray-",
  "disabled:bg-gray-50", "disabled:bg-gray-100", "disabled:text-gray-",
  "group-hover:bg-gray-50", "hover:bg-gray-50", "hover:bg-gray-100",
  "aria-selected:bg-gray-50",
  "bg-brand", "bg-brand-light", "bg-brand-dark",
  "text-brand", "text-brand-dark",
  "bg-gold", "bg-gold-light", "bg-gold-dark",
  "text-gold", "text-gold-dark",
  "bg-surface", "text-surface", "border-card-border",
  "bg-success-subtle", "text-success-text", "border-success-border",
  "bg-warning-subtle", "text-warning-text", "border-warning-border",
  "bg-error-subtle", "text-error-text", "border-error-border",
  "hover:bg-brand", "hover:bg-brand-dark",
  "hover:bg-gold", "hover:bg-gold-dark",
  "hover:text-brand", "hover:text-white",
  "focus:ring-brand", "focus:ring-gold",
  "focus:border-brand", "focus:border-gold",
];

function isAllowed(cls) {
  return ALLOWLIST.some(a => cls.includes(a));
}

function extractClassNames(line) {
  const results = [];
  const regex = /className=(["'`])((?:[^\\]|\\.)*?)\1/g;
  let m;
  while ((m = regex.exec(line)) !== null) {
    results.push(...m[2].split(/\s+/));
  }
  return results;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const classes = extractClassNames(lines[i]);
    for (const cls of classes) {
      for (const forbidden of FORBIDDEN) {
        if (cls === forbidden || cls.startsWith(forbidden + ":")) {
          if (!isAllowed(cls)) {
            violations.push({ file: filePath, line: i + 1, class: cls });
          }
          break;
        }
      }
      // Also check for hex patterns in className
      if (/\[#[\da-fA-F]{3,6}\]/.test(cls) && !cls.includes("brand") && !cls.includes("gold")) {
        violations.push({ file: filePath, line: i + 1, class: cls });
      }
    }
  }
  return violations;
}

function scan(dir) {
  const violations = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      violations.push(...scan(full));
    } else if (stat.isFile() && /\.(tsx|ts)$/.test(entry)) {
      violations.push(...checkFile(full));
    }
  }
  return violations;
}

const warnOnly = process.argv.includes("--warn-only");
const violations = scan("src");

if (violations.length > 0) {
  console.log("=== Theming Color Violations ===\n");
  for (const v of violations) {
    console.log(`${v.file}:${v.line}  ${v.class}`);
  }
  console.log(`\nTotal: ${violations.length} violations`);
  console.log("\nMigration guide:");
  console.log("  bg-green-50     -> bg-success-subtle");
  console.log("  text-green-600  -> text-success-text");
  console.log("  border-green-200 -> border-success-border");
  console.log("  bg-amber-50     -> bg-warning-subtle");
  console.log("  text-amber-600  -> text-warning-text");
  console.log("  bg-red-50       -> bg-error-subtle");
  console.log("  text-red-600    -> text-error-text");
  console.log("  border-gray-300 -> border-gray-300 (now theme-aware)");
  console.log("  text-gray-500   -> text-gray-500 (now theme-aware via dark fix)");

  if (!warnOnly) {
    console.log("\nFAILED. Run with --warn-only to bypass.");
    process.exit(1);
  }
} else {
  console.log("✓ No theming violations found.");
}
