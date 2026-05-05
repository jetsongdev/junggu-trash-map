import { describe, it, expect } from 'vitest';
import { nextVersion, transformChangelog } from './bump-version';

describe('nextVersion', () => {
  it('patch bump', () => {
    expect(nextVersion('0.9.0', 'patch')).toBe('0.9.1');
  });

  it('minor bump resets patch', () => {
    expect(nextVersion('0.9.3', 'minor')).toBe('0.10.0');
  });

  it('major bump resets minor and patch', () => {
    expect(nextVersion('1.2.3', 'major')).toBe('2.0.0');
  });

  it('minor 9 → 10 (no clamping)', () => {
    expect(nextVersion('0.9.0', 'minor')).toBe('0.10.0');
  });

  it('rejects invalid semver', () => {
    expect(() => nextVersion('1.2', 'patch')).toThrow(/Invalid semver/);
    expect(() => nextVersion('v1.2.3', 'patch')).toThrow(/Invalid semver/);
  });
});

describe('transformChangelog', () => {
  const fixture = `# Changelog

## [Unreleased]

### Added
- new feature shipped to users

### Performance
- 30% faster boot

## [0.9.0] - 2026-05-05

### Infrastructure
- foundation

[Unreleased]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.8.0...v0.9.0
`;

  it('moves [Unreleased] body into a new dated version section', () => {
    const out = transformChangelog(fixture, '0.10.0', '0.9.0', '2026-05-06');
    expect(out).toContain('## [0.10.0] - 2026-05-06');
    expect(out).toContain('### Added\n- new feature shipped to users');
    expect(out).toContain('### Performance\n- 30% faster boot');
  });

  it('leaves [Unreleased] heading present but empty above the new version', () => {
    const out = transformChangelog(fixture, '0.10.0', '0.9.0', '2026-05-06');
    const idxUnreleased = out.indexOf('## [Unreleased]');
    const idxNew = out.indexOf('## [0.10.0]');
    const idxOld = out.indexOf('## [0.9.0]');
    expect(idxUnreleased).toBeLessThan(idxNew);
    expect(idxNew).toBeLessThan(idxOld);
    const between = out.slice(idxUnreleased, idxNew).trim();
    expect(between).toBe('## [Unreleased]');
  });

  it('updates compare links: [Unreleased] retargeted, [new] inserted', () => {
    const out = transformChangelog(fixture, '0.10.0', '0.9.0', '2026-05-06');
    expect(out).toContain(
      '[Unreleased]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.10.0...HEAD',
    );
    expect(out).toContain(
      '[0.10.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.9.0...v0.10.0',
    );
    expect(out).not.toContain(
      '[Unreleased]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.9.0...HEAD',
    );
  });

  it('preserves prior version sections untouched', () => {
    const out = transformChangelog(fixture, '0.10.0', '0.9.0', '2026-05-06');
    expect(out).toContain('## [0.9.0] - 2026-05-05');
    expect(out).toContain('[0.9.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.8.0...v0.9.0');
  });

  it('throws when [Unreleased] is empty', () => {
    const empty = `# Changelog

## [Unreleased]

## [0.9.0] - 2026-05-05

### Infrastructure
- foundation

[Unreleased]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.8.0...v0.9.0
`;
    expect(() => transformChangelog(empty, '0.10.0', '0.9.0', '2026-05-06')).toThrow(/empty/);
  });

  it('throws when previous-version compare link is missing', () => {
    const broken = fixture.replace(
      '[Unreleased]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.9.0...HEAD',
      '[Unreleased]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.7.0...HEAD',
    );
    expect(() => transformChangelog(broken, '0.10.0', '0.9.0', '2026-05-06')).toThrow(
      /Cannot find \[Unreleased\] compare link/,
    );
  });
});
