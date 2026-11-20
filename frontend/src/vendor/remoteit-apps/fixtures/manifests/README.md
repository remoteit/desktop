# Manifest fixtures

Contract-1 manifests with their verdicts, for every implementation of the contract to test against the same files:
this repository (`lib/contract.mjs`, `test/fixtures.test.mjs`), graphql (publishing and delivery) and the daemon.

- `valid/` — accepted: the schema passes and no rule beyond it is broken. Both forms of `listen`: the single form
  (one listener object, `${remoteit.port}`/`${remoteit.listen}`) and named listeners (with a service list,
  multi-port services, `ports` ranges, internal listeners).
- `invalid/schema/` — refused by [`schema/manifest.schema.json`](../../schema/manifest.schema.json) itself.
- `invalid/rules/` — the schema passes; refused by one rule of the contract's "Checked beyond the schema"
  ([`docs/contract.md`](../../docs/contract.md)). Each breaks exactly one rule.
- `expected-rules.json` — for each `invalid/rules/` file (by name, without `.json`), the errors `lib/contract.mjs`
  gives. Another implementation's wording may differ; it refuses the same file for the same reason.

No fixture has `run.files`: they need no app files beside them.
