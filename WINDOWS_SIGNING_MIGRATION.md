# Windows Code-Signing Migration Plan

## Objective

Move Remote.It Windows releases from SSL.com to Microsoft Artifact Signing without disrupting existing customers or changing the application, installer, agent, installation identity, or normal update experience.

The migration must preserve automatic upgrades for:

- Current customers.
- Customers running older desktop versions.
- Customers whose computers remain offline during the migration and return later.
- x86, x64, and ARM64 installations.

## Current State

The current Windows desktop application uses Electron, electron-builder, and NSIS. Windows releases are signed through an SSL.com custom signing hook in `electron/scripts/sign.js`.

The public Remote.It 3.46.1 Windows installer was inspected during preparation of this plan. Its Authenticode certificate contains this publisher identity:

```text
CN=remot3.it, Inc.
O=remot3.it, Inc.
```

Its embedded `resources/app-update.yml` does not contain a `publisherName` restriction. Those clients should not inherently reject an update merely because it was signed by a different publicly trusted certificate authority.

Some older versions may contain a `publisherName` restriction. The repository includes `electron/scripts/windows-upgrade-recover.ps1`, which removes that restriction from an installed `app-update.yml`. This confirms that publisher-name continuity has caused upgrade problems before.

Removing `publisherName` entirely is not the desired long-term solution because it weakens update verification. The safe migration is to install an explicit old-and-new publisher allow-list through a bridge release.

## Why Microsoft Artifact Signing

Microsoft Artifact Signing, formerly called Trusted Signing, is a managed Authenticode signing service appropriate for publicly distributed Win32 applications.

The Public Trust model provides:

- A certificate rooted in the Microsoft Root Certificate Program.
- Managed keys held in FIPS-certified hardware security modules.
- Automatic certificate lifecycle management.
- GitHub Actions, SignTool, Azure DevOps, and electron-builder integration.
- Support for Windows SmartScreen, Smart App Control, and Authenticode verification.

Use a **Public Trust** certificate profile. Private Trust and Public Trust Test profiles are not appropriate for public production installers.

Microsoft documentation:

- [Artifact Signing overview](https://learn.microsoft.com/en-us/azure/artifact-signing/overview)
- [Artifact Signing setup](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- [Artifact Signing trust models](https://learn.microsoft.com/en-us/azure/artifact-signing/concept-trust-models)
- [Artifact Signing signing integrations](https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations)

## Step-by-Step Migration

### 1. Freeze and record the existing signing identity

Record the exact SSL.com Authenticode identity and treat it as the compatibility baseline:

```text
CN=remot3.it, Inc.
O=remot3.it, Inc.
```

Archive the following for each supported Windows architecture:

- The most recent SSL.com-signed installer.
- Its update manifest and blockmap.
- The certificate chain and signer subject.
- Signature-verification output.
- The installer hash.

Verify that every released installer has a valid RFC 3161 timestamp:

```powershell
signtool verify /pa /all /v Remote.It-Installer-x64.exe
```

Do not revoke the SSL.com certificate. Revocation could affect previously shipped binaries even when they were timestamped. The objective is to stop using SSL.com for new signatures, not invalidate existing releases.

### 2. Inventory updater behavior in deployed versions

Use application telemetry to identify every Windows desktop version that remains active.

Obtain representative installed copies of those versions, especially versions released before and after November 2025. Inspect this file on each installation:

```text
C:\Program Files\Remote.It\resources\app-update.yml
```

Classify installations into these groups:

- No `publisherName`: expected to accept any correctly signed and publicly trusted replacement installer.
- `publisherName: remot3.it, Inc.`: expected to accept only a signer that the updater recognizes as that publisher.
- Another publisher value: record the exact value as an additional compatibility identity.

Also record the electron-updater version contained in each materially different client release. Testing must use actual installed builds rather than relying solely on current electron-updater documentation.

Do not use the current recovery script as the default migration mechanism. Replace publisher restrictions with an explicit allow-list instead of permanently deleting signature identity checks.

### 3. Provision Microsoft Artifact Signing

Create the production signing resources in Azure:

1. Select or create the appropriate Azure subscription.
2. Register the `Microsoft.CodeSigning` resource provider.
3. Create an Artifact Signing account in a supported region.
4. Assign the responsible administrator the `Artifact Signing Identity Verifier` role.
5. Start a Public organization identity-validation request.
6. Enter the registered legal entity as `remot3.it, Inc.` if that remains the company's legal name.
7. Supply the company website, business identifier, address, monitored company email addresses, and validating representative.
8. Review the Certificate Subject Preview carefully.
9. Complete all email, representative, and document validation.
10. Create a **Public Trust** certificate profile.
11. Assign the CI identity the `Artifact Signing Certificate Profile Signer` role, scoped to the certificate profile.

Microsoft does not allow an arbitrary custom Common Name or Organization value. The values are derived from the validated legal entity. Therefore, the Certificate Subject Preview is a migration gate, not an administrative detail.

Record:

- Azure endpoint.
- Artifact Signing account name.
- Certificate profile name.
- Full certificate subject.
- Common Name.
- Organization value.

### 4. Test the new signing identity before changing production

Sign a harmless test executable with the Artifact Signing Public Trust profile.

Inspect the resulting signer:

```powershell
Get-AuthenticodeSignature .\test.exe |
  Select-Object -ExpandProperty SignerCertificate |
  Format-List Subject,Issuer,Thumbprint
```

Verify the signature independently:

```powershell
signtool verify /pa /all /v .\test.exe
```

Use representative old Remote.It installations to test whether their updater verification accepts the Artifact Signing certificate.

The decision gate is:

- If clients restricted to `remot3.it, Inc.` accept the Artifact Signing signature, a normal bridge release is sufficient and offline long-tail clients can accept future releases directly.
- If they reject the new signature because the recognized publisher subject differs, use the permanent two-hop update path described in step 9.

Do not assume that similar display names are compatible. Test the exact Artifact Signing certificate against the exact client versions deployed to customers.

### 5. Create one final SSL.com-signed bridge release

While SSL.com is still operational, build one final normal Remote.It release signed with the existing SSL.com identity.

Its updater publisher allow-list must contain both identities:

```json
"publisherName": [
  "remot3.it, Inc.",
  "<exact Artifact Signing publisher identity>"
]
```

Electron-builder supports multiple publisher names specifically for certificate rotation. The configured values are written to the installed `app-update.yml`, and electron-updater uses them when validating subsequent Windows installers.

Electron-builder documentation:

- [Windows code signing](https://www.electron.build/docs/features/code-signing/code-signing-win/)
- [Windows configuration and update verification](https://www.electron.build/docs/api/app-builder-lib.interface.windowsconfiguration/)

The bridge release must:

- Be signed by the existing SSL.com certificate.
- Contain the old and new publisher allow-list.
- Keep the existing application ID.
- Keep the existing product name.
- Keep the existing NSIS installation identity and location.
- Preserve all per-architecture artifact names.
- Preserve the existing agent and service behavior.
- Preserve customer configuration and registration.
- Contain no unrelated application change.
- Have valid RFC 3161 timestamps.
- Remain downloadable permanently.

The update sequence works because the customer's existing client validates the bridge against the old SSL.com signer. After installation, the bridge accepts installers signed by either the old or new identity.

### 6. Build the Artifact Signing version without publishing it

Prepare a second release containing no functional change beyond the signing provider and required publisher metadata.

The project currently uses electron-builder 26.15.3. For that version:

- Remove the SSL.com custom `signtoolOptions.sign` hook.
- Configure `win.azureSignOptions`.
- Supply the Artifact Signing endpoint.
- Supply the Artifact Signing account name.
- Supply the certificate profile name.
- Supply the exact Artifact Signing publisher identity.
- Use SHA-256 file and timestamp digests.
- Use the Artifact Signing RFC 3161 timestamp service.
- Enable a hard build failure when signing is unavailable.

Authenticate GitHub Actions to Azure with workload identity federation. Avoid long-lived client secrets when possible.

Do not remove SSL.com credentials or tooling yet. Keep them available for producing or rebuilding the bridge until the migration is proven.

### 7. Verify every produced Portable Executable

Microsoft Store policy is not the reason for this requirement; it is necessary for consistent Windows trust regardless of distribution channel.

Verify every executable and DLL after packaging, including:

- The NSIS installer.
- The generated uninstaller.
- The Remote.It Electron executable.
- Electron helper executables.
- Native modules and DLLs.
- `remoteit.exe`.
- `connectd.exe`.
- `demuxer.exe`.
- `muxer.exe`.

For each PE file, run:

```powershell
signtool verify /pa /all /v <file>
```

Add a release-CI validation that fails when:

- A PE file is unsigned.
- A signature is invalid.
- A certificate chain is untrusted.
- The timestamp is absent or invalid.
- The signer subject differs from the expected production identity.

Also extract the generated installer and inspect its embedded `resources/app-update.yml`. Confirm that the bridge contains both publisher identities and that the Artifact-signed release contains the intended production identity.

### 8. Test the complete customer upgrade matrix

Use clean Windows 10 and Windows 11 virtual machines. Test every supported architecture and every materially different deployed updater generation.

For each starting version, test this exact sequence:

```text
Existing customer version
  -> SSL.com-signed bridge
  -> Artifact Signing release
```

Verify:

- Automatic update discovery succeeds.
- Download completes and hash validation succeeds.
- Authenticode publisher validation succeeds.
- `quitAndInstall()` completes.
- UAC shows a verified publisher.
- The application retains the same installation location.
- Windows retains a single Add/Remove Programs entry.
- The Remote.It agent service stops, updates, and restarts.
- Existing login state survives.
- Device registration survives.
- Services and connection configuration survive.
- In-app connections continue to work.
- A reboot during or after installation does not leave the agent unavailable.
- Rollback to the archived bridge installer is possible.

Test these delivery paths separately:

- Automatic in-app update.
- Manual installation over the existing application.
- Fresh website download.
- Upgrade while the application is elevated.
- Upgrade while the application is not elevated.

Test direct website downloads for SmartScreen behavior. Microsoft no longer gives EV certificates automatic SmartScreen reputation. A new signing identity can initially receive an unrecognized-app warning while reputation builds.

Microsoft guidance:

- [SmartScreen reputation for Windows developers](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)

### 9. Provide a permanent route for offline customers

A temporary bridge window alone cannot protect a machine that remains offline for the entire window and returns only after production has switched to the new signer.

#### If the new publisher identity is accepted by old clients

No separate long-tail route is required. An offline old client can accept the latest Artifact-signed release directly because its publisher-name verification still succeeds.

Keep the bridge installer archived as a recovery artifact.

#### If the new publisher identity is not accepted by old clients

Establish a permanent two-hop update path:

1. Leave the existing legacy update feed permanently advertising the timestamped SSL.com-signed bridge.
2. Configure the installed bridge to use a new Artifact Signing production feed.
3. Publish all Artifact-signed releases to the new feed.
4. Configure fresh installers to use the new feed.
5. Never replace the bridge on the legacy feed with an incompatible new-signer installer.

The permanent customer flow becomes:

```text
Old customer computer returns online
  -> existing legacy feed
  -> timestamped SSL.com-signed bridge
  -> new Artifact Signing feed
  -> current Artifact-signed release
```

This allows SSL.com to be discontinued while retaining a permanent migration route. No future SSL.com signing is needed because the timestamped bridge remains immutable and available indefinitely.

### 10. Deploy and hold the bridge release

Publish the SSL.com-signed bridge through the existing production updater.

Keep it as the current production version until:

- At least 99% of Windows installations active during the migration period have installed it.
- Every continuously active enterprise deployment has passed through it.
- All supported starting-version tests have passed.
- No signature-verification regression appears in telemetry.
- No increase appears in installer, elevation, or agent-service failures.
- Customer support confirms that no systematic upgrade problem exists.

Use measured adoption rather than only a fixed waiting period.

Do not publish an Artifact-signed production update until these gates pass.

### 11. Release the first Artifact-signed version gradually

Release the prepared Artifact-signed build in stages:

1. Internal Windows devices.
2. Automated upgrade-test machines.
3. Beta or prerelease users.
4. A small production cohort if supported by the release infrastructure.
5. General production.

Monitor by previous installed version and architecture:

- Update-check failures.
- Update-download failures.
- Signature-verification failures.
- Installer return codes.
- UAC and SmartScreen reports.
- Agent installation or restart failures.
- Devices that stop reporting after attempting the update.
- Support cases mentioning publisher warnings or blocked installation.

Keep the SSL.com-signed bridge, manifests, and rollback artifacts unchanged throughout the rollout.

If the Artifact-signed release fails, stop advertising it and return affected feeds to the bridge. Do not produce an unrelated emergency application release during the signer migration.

### 12. Remove SSL.com from CI

After the first Artifact-signed release is stable:

- Remove the CodeSignTool download from the Windows workflow.
- Remove the custom SSL.com signing-hook configuration.
- Remove the SSL.com username secret.
- Remove the SSL.com password secret.
- Remove the SSL.com credential ID secret.
- Remove the SSL.com TOTP secret.
- Remove SSL.com-specific temporary-directory handling.
- Confirm that unsigned builds fail rather than silently publishing.

The workflow should retain only the Artifact Signing identity and its workload-identity authentication.

Do not delete the old release artifacts.

### 13. Decommission the SSL.com service

After at least two successful Artifact-signed production releases:

1. Confirm that the permanent offline-customer route works.
2. Confirm that the archived bridge remains downloadable.
3. Confirm that its Authenticode timestamp validates on clean Windows systems.
4. Export the final signing and timestamp-verification records.
5. Remove remaining SSL.com access from staff and CI.
6. Cancel automatic renewal and paid SSL.com services.
7. Do not request revocation unless the old private key was compromised.
8. Preserve documentation of the old and new publisher identities.
9. Preserve the compatibility and rollback runbook.

## Customer-Safety Release Gates

Production must not switch to Artifact Signing until all of these conditions are true:

- The exact Artifact Signing certificate subject has been inspected.
- The new certificate is publicly trusted on supported Windows versions.
- An actual old-client-to-bridge update has succeeded.
- An actual bridge-to-Artifact-Signing update has succeeded.
- x86, x64, and ARM64 artifacts have passed signature verification.
- Every bundled PE file is signed and timestamped.
- The bridge publisher allow-list contains both exact identities.
- The bridge has reached the required active-install adoption.
- Offline clients either accept the new signer directly or have a permanent legacy bridge feed.
- A tested rollback can restore the bridge without changing customer data.

## Rollback Plan

If a problem appears before general availability:

1. Stop publishing or advertising the Artifact-signed release.
2. Restore the production update manifest to the immutable SSL.com-signed bridge.
3. Preserve logs and affected installer artifacts.
4. Identify whether the failure is certificate subject matching, certificate-chain trust, signing completeness, timestamping, installer behavior, or SmartScreen reputation.
5. Correct and retest the Artifact-signed build.
6. Resume staged rollout only after the complete upgrade matrix passes again.

Never modify an already published signed installer in place. Publish a new versioned artifact with a new immutable URL and hash.

## Expected Customer Experience

When the migration is performed correctly:

- Customers receive the bridge as a normal automatic update.
- Customers receive the Artifact-signed release as a subsequent normal automatic update.
- No reinstallation is required.
- No device re-registration is required.
- No login is required solely because of the signer change.
- The Remote.It agent and services remain configured.
- The application retains its existing installation identity and location.
- Offline customers retain a working upgrade path when they return.

The only risk that cannot be guaranteed away for direct website downloads is temporary SmartScreen reputation behavior for the new certificate. Matching the existing legal publisher identity, signing every release consistently, staging the rollout, and validating SmartScreen before general availability minimize that risk.

## Final Recommendation

Use Microsoft Artifact Signing Public Trust and perform a controlled certificate rotation through one final SSL.com-signed bridge release.

The decisive compatibility test is whether the Artifact Signing identity is accepted by old clients restricted to `remot3.it, Inc.`. If it is, the migration is straightforward. If it is not, retain the immutable SSL.com bridge on a permanent legacy feed and move bridge and fresh installations to a new Artifact Signing feed.

Do not revoke the old certificate, do not combine this migration with product or installer changes, and do not discontinue SSL.com until the two-step upgrade and offline-customer path are proven.
