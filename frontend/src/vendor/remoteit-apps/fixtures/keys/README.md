# Test-only publisher key

`TEST-ONLY-publisher-key.pem` is a publisher key file of format 1 (`lib/keyfile.mjs`), made for tests and nothing else:
its passphrase is in `expected.json`, so it protects nothing, and its public key is registered with no stage. Never
register it, and never sign anything real with it.

It pins the format across implementations: `test/keyfile.test.mjs` opens it here, and the portal's vendored copy of
`lib/keyfile.mjs` (desktop `frontend/src/vendor/remoteit-apps`) opens the same file and must sign `manifest.json` to
exactly `manifest.json.sig` (Ed25519 is deterministic), the bytes the daemon verifies.
