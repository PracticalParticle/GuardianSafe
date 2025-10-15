# GuardianSafe: Making Safe Wallet even Safer

> This repository is a fork of the Bloxchain Protocol. It serves as the underlying engine for the GuardianSafe application. At this time, no GuardianSafe application code is required in this fork; active GuardianSafe development happens in the Sandblox environment.

For the underlying Bloxchain Protocol documentation, see [README-PROTOCOL.md](./README-PROTOCOL.md).

## What is GuardianSafe?

GuardianSafe is a secure wrapper for Safe (Gnosis Safe) wallets that adds multi-phase, time-locked operations, meta-transaction support, role-based access control, and a transaction guard to enforce safer execution paths. It combines multisig security with the Guardian state abstraction framework for defense-in-depth.

- Dual-layer security: Safe multisig + time-locked, role-gated execution
- Transaction Guard: Restricts execution paths and blocks dangerous delegatecall by default
- Role separation: Owner, Broadcaster, Recovery roles
- Meta-transactions: Gasless operations with signer ≠ executor separation

Authoritative documentation is maintained alongside the Sandblox project and UI.

## Where GuardianSafe Is Developed

Active work on the GuardianSafe module, UI, and docs is in the Sandblox environment:

- Product page and docs: `https://sandblox.app/contracts/guardian-safe`  
- Source tree (Sandblox workspace): `https://github.com/PracticalParticle/Sandblox/tree/main/src/blox/GuardianSafe`

This forked repository does not need the GuardianSafe contract or UI code copied into it. Keep this repo focused on the underlying engine (libraries, contracts, and SDKs) used by GuardianSafe.

## Reference Docs in Sandblox

For detailed technical documentation, workflows, and integration examples, refer to the GuardianSafe documentation, which includes:

- Security layers (Transaction Guard, Broadcast security, RBAC, Multi-phase and Single-phase workflows)
- Setting GuardianSafe as a transaction guard on a Safe
- Meta-transaction flows and EIP-712 signing

Links:

- GuardianSafe docs/product page: `https://sandblox.app/contracts/guardian-safe`
- Sandblox repo folder: `https://github.com/PracticalParticle/Sandblox/tree/main/src/blox/GuardianSafe`

## Scope of This Fork

This fork retains the core Bloxchain Protocol engine (state abstraction libraries, base state machine, SecureOwnable/DynamicRBAC, TypeScript SDK), which GuardianSafe relies on. It is intentionally not duplicating the GuardianSafe module contract or UI. Use this fork to:

- Maintain and evolve the underlying security engine used by GuardianSafe
- Track protocol-level changes and SDK updates
- Keep compatibility with Safe integrations expected by GuardianSafe

If you need GuardianSafe specifics (contract interface, module setup, UI), use the Sandblox sources and docs linked above.

## Getting Started (Engine Only)

For engine development (contracts/SDK), follow the standard workflow from the original protocol README (compile, test, size checks). Do not add GuardianSafe application code here.

Suggested actions:

1. Build and test the protocol core locally (Truffle/Hardhat).
2. Validate contract sizes and upgradeability constraints.
3. Consume these artifacts from GuardianSafe in Sandblox during integration testing.

## Licensing

This fork continues to use the MPL-2.0 for the core framework. GuardianSafe application code and materials are hosted in Sandblox and may be governed by their respective licenses. Always consult the license files in the corresponding repositories.

 ## Community Placement (When Stable)
 
 Once GuardianSafe development stabilizes and is migrated to the latest Bloxchain framework version, the GuardianSafe application will be added under `applications/community/` within this repository and distributed under the MPL-2.0 license. Until then, the authoritative implementation remains in Sandblox.
 
## Safe (Gnosis Safe) References

- Website: [safe.global](https://safe.global/)
- App: [app.safe.global](https://app.safe.global/)
- Documentation: [docs.safe.global](https://docs.safe.global/)

## Support and Links

- GuardianSafe page (product/docs): `https://sandblox.app/contracts/guardian-safe`
- GuardianSafe sources in Sandblox: `https://github.com/PracticalParticle/Sandblox/tree/main/src/blox/GuardianSafe`


