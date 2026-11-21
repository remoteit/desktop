# CLAUDE.md — desktop

## Wording

Every user-facing string (portal, tray menu, notices, errors) follows these:

- [docs/ux/glossary.md](docs/ux/glossary.md): one name per concept, and the retired words.
- [docs/ux/voice.md](docs/ux/voice.md): the voice rules, with before-and-after examples.
- [docs/ux/placement.md](docs/ux/placement.md): where a new feature goes.

## Strings and translations

- Give every `t()` key its English text as the inline default: `t('options.language.label', 'Language')`.
- After adding or changing a `t()` string, run `npm run i18n:extract -w=frontend` and commit all four catalogs (`frontend/src/i18n/locales/{en,de,es,ja}`). CI re-extracts and fails on any catalog diff.
- Never rewrite a catalog with a JSON dumper; let the extractor write it.

## Wording tests

`frontend/src/i18n/userWording.test.ts` and `frontend/src/i18n/wordingRatchet.test.ts`. The ratchet counts English strings with each retired word, strings over 25 words, and strings with internal words. A count may fall but never rise; when one falls, lower `frontend/src/i18n/wordingBaseline.json` in the same commit.

```sh
cd frontend && npx vitest run src/i18n/
cd frontend && UPDATE_WORDING_BASELINE=1 npx vitest run src/i18n/wordingRatchet.test.ts   # lower the baseline
```
