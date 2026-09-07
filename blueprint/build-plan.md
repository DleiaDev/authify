# Build Plan

Learning project: exercise the full AWS Cognito API surface from a custom Next.js
UI with a hand-rolled HTTP client (no AWS SDK). MongoDB holds one app-side user
record per Cognito `sub` (extended profile + per-user auth settings). Items are
ordered by dependency and earliest useful vertical slice; depth for each lives in
its `/feature` spec.

Run `/feature` with no number to spec the next unchecked item, or `/feature 3` /
`/feature "sign in"` to pick one. Completed items get checked off here.

## Milestone 0 - Foundations

- [ ] 1. **Local dev environment** - docker compose with Next.js + MongoDB
  containers, env wiring, `docker compose up` serves the app
- [ ] 2. **Cognito core infrastructure (Terragrunt)** - user pool, confidential
  app client (with secret), `Admins` / `Users` groups, enabled auth flows;
  stack outputs feed app config
- [ ] 3. **Cognito HTTP client** - hand-rolled `cognito-idp` JSON caller
  (`X-Amz-Target` targets, error-shape parsing, `SECRET_HASH` HMAC helper) that
  logs every request/response for inspection. No AWS SDK

## Milestone 1 - Registration & login

- [ ] 4. **Sign up** - form (email, name), `SignUp`, pending-confirmation state
- [ ] 5. **Email OTP confirmation** - `ConfirmSignUp` + `ResendConfirmationCode`
- [ ] 6. **Password sign in** - `InitiateAuth` (USER_PASSWORD_AUTH) returning
  id / access / refresh tokens
- [ ] 7. **Server-side session** - tokens in httpOnly secure cookies via Server
  Actions; sign-out via `RevokeToken` / `GlobalSignOut`
- [ ] 8. **App user record (MongoDB)** - create and link a Mongo document keyed
  by Cognito `sub` on first sign-in; foundation for profile + settings
- [ ] 9. **Auth-aware UI shell** - header reflects session, public vs protected
  layout, redirect when unauthenticated

## Milestone 2 - Session middleware & route protection

- [ ] 10. **Middleware token check** - `middleware.ts` reads cookies, decodes JWT
  claims, enforces `exp`, gates app routes
- [ ] 11. **Refresh token flow** - refresh expired access tokens (`InitiateAuth`
  REFRESH_TOKEN_AUTH); refresh failure -> forced sign-out
- [ ] 12. **Group-based route gating** - `/admin` restricted by the
  `cognito:groups` claim

## Milestone 3 - Password lifecycle & recovery

- [ ] 13. **Forgot / reset password** - `ForgotPassword` + `ConfirmForgotPassword`
- [ ] 14. **Change password while signed in** - `ChangePassword`
- [ ] 15. **NEW_PASSWORD_REQUIRED challenge** - first-login password set for
  admin-created users via `RespondToAuthChallenge`

## Milestone 4 - MFA (TOTP)

- [ ] 16. **Enable TOTP** - `AssociateSoftwareToken`, QR render,
  `VerifySoftwareToken`, `SetUserMFAPreference`
- [ ] 17. **TOTP login challenge** - handle `SOFTWARE_TOKEN_MFA` in sign-in
- [ ] 18. **Manage / disable MFA** - MFA status + turn-off on settings

## Milestone 5 - Profile & account settings

- [ ] 19. **Cognito attribute management** - `GetUser`, `UpdateUserAttributes`;
  `GetUserAttributeVerificationCode` + `VerifyUserAttribute` for email/phone
- [ ] 20. **Extended profile (MongoDB)** - nickname, age, date of birth, hobbies;
  edit form writing to the Mongo user record
- [ ] 21. **Account settings (MongoDB)** - per-user preferred auth strategy
  (`USER_PASSWORD_AUTH` vs `USER_SRP_AUTH`) plus other app prefs
- [ ] 22. **SRP sign-in** - implement the SRP handshake (`SRP_A` ->
  `PASSWORD_VERIFIER` challenge: `SECRET_BLOCK`, `TIMESTAMP`,
  `PASSWORD_CLAIM_SIGNATURE`); login uses it when the user's stored strategy is
  SRP, looked up by email before authentication
- [ ] 23. **Delete own account** - `DeleteUser` + remove the Mongo record

## Milestone 6 - Protected server API & token verification

- [ ] 24. **JWKS verification utility** - fetch and cache Cognito JWKS; verify
  signature, `iss`, `token_use`, `exp`, and `aud` / `client_id`
- [ ] 25. **Protected API route** - sample endpoint requiring a valid access
  token, with `cognito:groups` RBAC
- [ ] 26. **Machine-to-machine (client credentials)** - Terragrunt: Cognito
  domain, resource server + custom scopes, M2M app client. App: call
  `POST /oauth2/token` with `grant_type=client_credentials`, then call the
  protected API with the resulting token; verify the `scope` claim

## Milestone 7 - Admin console

- [ ] 27. **SigV4 request signer** - AWS Signature v4 signer so the HTTP client
  can make the signed calls (`Admin*` and `cognito-identity`); public
  `cognito-idp` calls stay unsigned
- [ ] 28. **Admin: user list & detail** - `ListUsers`, `AdminGetUser`
- [ ] 29. **Admin: create user** - `AdminCreateUser` (drives item 15)
- [ ] 30. **Admin: user lifecycle** - `AdminEnableUser` / `AdminDisableUser` /
  `AdminDeleteUser`, `AdminSetUserPassword`
- [ ] 31. **Admin: group management** - `CreateGroup` / `ListGroups`,
  `AdminAddUserToGroup` / `AdminRemoveUserFromGroup`, `AdminListGroupsForUser`

## Milestone 8 - Federated AWS access & S3 upload

- [ ] 32. **Identity Pool infrastructure (Terragrunt)** - identity pool,
  authenticated IAM role, per-identity S3 prefix policy
- [ ] 33. **Exchange tokens for IAM credentials** - `GetId` +
  `GetCredentialsForIdentity` against `cognito-identity` (SigV4-signed)
- [ ] 34. **Direct browser-to-S3 upload** - use the temporary credentials to PUT
  an avatar to the user's `identity-id/` prefix; render it on the profile and
  store object metadata in the Mongo record

## Milestone 9 - Coverage sweep (optional)

- [ ] 35. **Remaining API surface** - device tracking (`ConfirmDevice` /
  `ListDevices` / `ForgetDevice`), SMS MFA variants, custom schema attributes,
  `DescribeUserPool` / `GetUserPoolMfaConfig` read views,
  `AdminUserGlobalSignOut`, token-revocation edge cases
