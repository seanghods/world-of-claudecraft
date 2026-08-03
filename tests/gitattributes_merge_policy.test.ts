import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Merge policy for the generated i18n artifacts.
//
// `pending.ts` is the one file marked `merge=union`: every PR that adds an English
// string inserts into the same short per-locale list across all 21 locales, so two
// concurrent branches conflict in the same hunk every time. Union keeps both sides'
// lines instead of stopping the merge.
//
// That is only safe because the file is fully derived: the gate's "i18n freshness"
// step regenerates it and diffs, so a union result the build would not emit cannot
// survive CI. The failure union is actually capable of (an addition merged against a
// deletion, i.e. a release fill beside a feature branch) emits a duplicate
// `"<locale>":` key, which tsc (TS1117) and biome (noDuplicateObjectKeys) both reject
// before the diff even runs.
//
// This guard exists for the OTHER direction: nobody should widen union to the sibling
// locale slices. Those are read at runtime and are not append-only, so silently
// concatenating two sides there would paper over a real disagreement rather than a
// mechanical one.
const GITATTRIBUTES = readFileSync(new URL('../.gitattributes', import.meta.url), 'utf8');

/** Attribute lines only: comments explain the policy and must not be read as rules. */
const RULES = GITATTRIBUTES.split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '' && !line.startsWith('#'));

describe('gitattributes merge policy for generated i18n artifacts', () => {
  it('marks pending.ts union, so concurrent new-key branches stop conflicting', () => {
    expect(RULES).toContain('src/ui/i18n.resolved.generated/pending.ts merge=union');
  });

  it('marks nothing else union, keeping every other conflict visible', () => {
    // A union rule elsewhere resolves a real disagreement by concatenation and never
    // says so. Pinned as an exact set rather than a count so adding one is deliberate.
    const unionRules = RULES.filter((line) => line.includes('merge=union'));
    expect(unionRules).toEqual(['src/ui/i18n.resolved.generated/pending.ts merge=union']);
  });

  it('keeps pending.ts inside the freshness-checked artifact tree', () => {
    // The safety net IS the regeneration diff. If pending.ts ever moved out of the
    // directory the gate regenerates and diffs (I18N_ARTIFACTS in
    // scripts/lib/gate_steps.mjs), union would lose the thing that makes it safe.
    expect(RULES).toContain('src/ui/i18n.resolved.generated/** linguist-generated');
    const gateSteps = readFileSync(
      new URL('../scripts/lib/gate_steps.mjs', import.meta.url),
      'utf8',
    );
    expect(gateSteps).toContain("'src/ui/i18n.resolved.generated'");
  });
});
