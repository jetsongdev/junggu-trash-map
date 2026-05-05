#!/usr/bin/env bun
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export type BumpKind = 'patch' | 'minor' | 'major';

export const REPO_SLUG = 'jetsongdev/junggu-trash-map';

export function nextVersion(current: string, kind: BumpKind): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!m) throw new Error(`Invalid semver: ${current}`);
  const maj = +m[1];
  const min = +m[2];
  const pat = +m[3];
  if (kind === 'major') return `${maj + 1}.0.0`;
  if (kind === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

export function transformChangelog(
  source: string,
  newVersion: string,
  prevVersion: string,
  date: string,
  repoSlug: string = REPO_SLUG,
): string {
  const unreleasedRe = /## \[Unreleased\]\n([\s\S]*?)(?=\n## \[|\n\[Unreleased\]:)/;
  const m = unreleasedRe.exec(source);
  if (!m) throw new Error('Cannot find [Unreleased] section');
  const body = m[1].trim();
  if (!body) throw new Error('[Unreleased] is empty — nothing to release');

  const replaced = `## [Unreleased]\n\n## [${newVersion}] - ${date}\n${m[1]}`;
  let result = source.replace(m[0], replaced);

  const oldUnreleased = `[Unreleased]: https://github.com/${repoSlug}/compare/v${prevVersion}...HEAD`;
  const newUnreleased = `[Unreleased]: https://github.com/${repoSlug}/compare/v${newVersion}...HEAD`;
  const newVersionLink = `[${newVersion}]: https://github.com/${repoSlug}/compare/v${prevVersion}...v${newVersion}`;
  if (!result.includes(oldUnreleased)) {
    throw new Error(`Cannot find [Unreleased] compare link for v${prevVersion}`);
  }
  result = result.replace(oldUnreleased, `${newUnreleased}\n${newVersionLink}`);

  return result;
}

const isMain = (() => {
  try {
    return process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
  } catch {
    return false;
  }
})();

if (isMain) {
  const kind = process.argv[2] as BumpKind;
  if (!['patch', 'minor', 'major'].includes(kind)) {
    console.error('Usage: bun run scripts/bump-version.ts <patch|minor|major>');
    process.exit(1);
  }

  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const pkgPath = resolve(root, 'package.json');
  const changelogPath = resolve(root, 'CHANGELOG.md');

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const prevVersion: string = pkg.version;
  const newVer = nextVersion(prevVersion, kind);
  const today = new Date().toISOString().slice(0, 10);

  const changelog = readFileSync(changelogPath, 'utf8');
  const updated = transformChangelog(changelog, newVer, prevVersion, today);

  pkg.version = newVer;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  writeFileSync(changelogPath, updated);

  console.log(`Bumped ${prevVersion} → ${newVer}`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVer}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `prev_version=${prevVersion}\n`);
  }
}
