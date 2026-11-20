# Icon fixtures

An app's icon (`icon` in a built manifest; docs/contract.md, "Packaging and trust") with its verdict, for every
implementation to test against the same files: this repository (`lib/rules.mjs iconProblem`), graphql (which checks
the icon a release names before it takes the release) and the portal (which checks one before packing it).

`expected.json` names each file and the problem `iconProblem` gives (`null`: a valid icon). Another implementation's
wording may differ; it refuses the same file for the same reason.
