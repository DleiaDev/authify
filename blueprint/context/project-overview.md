# authify - Project Overview

<!-- blueprint:source-hash 845f75775d584bae3b9d3f98f6cb30f170eab87235983cb20e49f2103130040f -->

> A hands-on AWS Cognito playground: a modern Next.js UI that drives the full
> Cognito API surface through a hand-rolled HTTP client (no AWS SDK).

## Problem

The goal is to learn AWS Cognito end to end by building the UI and server code
that calls every meaningful part of its API. Rather than leaning on Amplify or
`@aws-sdk`, the project implements its own thin client so the request shapes,
challenge state machine, token handling, and SigV4 signing are all visible and
understood. It is a learning project, not a commercial product.

## Users

Not for commercial use. Two roles exercised by the same app:

- **Public user** - signs up, confirms email, signs in (password or SRP),
  manages their own password, MFA, profile, and account.
- **Admin** - member of the `Admins` group; manages other users and groups from
  a protected `/admin` area.

Groups are the single source of truth for role; there is no custom role
attribute.

## Features

In `build-plan.md` order, grouped by milestone. Headline: the **custom Cognito
HTTP client** (item 3) that every later feature calls through.

**M0 - Foundations**
1. **Local dev environment** - docker compose runs Next.js + MongoDB.
2. **Cognito core infrastructure (Terragrunt)** - user pool, confidential app
   client, `Admins`/`Users` groups, auth flows.
3. **Cognito HTTP client** - hand-rolled `cognito-idp` JSON caller with
   `SECRET_HASH`, error parsing, and request/response logging.

**M1 - Registration & login**
4. **Sign up** - `SignUp` with email + name, pending-confirmation state.
5. **Email OTP confirmation** - `ConfirmSignUp` + `ResendConfirmationCode`.
6. **Password sign in** - `InitiateAuth` (USER_PASSWORD_AUTH) -> token set.
7. **Server-side session** - tokens in httpOnly secure cookies; sign-out via
   `RevokeToken` / `GlobalSignOut`.
8. **App user record (MongoDB)** - create/link a Mongo doc keyed by Cognito
   `sub` on first sign-in.
9. **Auth-aware UI shell** - session-aware header, public vs protected layout.

**M2 - Session middleware & route protection**
10. **Middleware token check** - `middleware.ts` decodes claims, enforces `exp`.
11. **Refresh token flow** - `InitiateAuth` REFRESH_TOKEN_AUTH; failure -> sign
    out.
12. **Group-based route gating** - `/admin` gated by `cognito:groups`.

**M3 - Password lifecycle & recovery**
13. **Forgot / reset password** - `ForgotPassword` + `ConfirmForgotPassword`.
14. **Change password while signed in** - `ChangePassword`.
15. **NEW_PASSWORD_REQUIRED challenge** - first-login password set via
    `RespondToAuthChallenge`.

**M4 - MFA (TOTP)**
16. **Enable TOTP** - `AssociateSoftwareToken`, QR, `VerifySoftwareToken`,
    `SetUserMFAPreference`.
17. **TOTP login challenge** - handle `SOFTWARE_TOKEN_MFA` in sign-in.
18. **Manage / disable MFA** - status + turn-off in settings.

**M5 - Profile & account settings**
19. **Cognito attribute management** - `GetUser`, `UpdateUserAttributes`,
    `GetUserAttributeVerificationCode` + `VerifyUserAttribute`.
20. **Extended profile (MongoDB)** - nickname, age, date of birth, hobbies.
21. **Account settings (MongoDB)** - preferred auth strategy + app prefs.
22. **SRP sign-in** - SRP handshake (`SRP_A` -> `PASSWORD_VERIFIER`); used when
    the user's stored strategy is SRP, resolved by email before auth.
23. **Delete own account** - `DeleteUser` + remove Mongo record.

**M6 - Protected server API & token verification**
24. **JWKS verification utility** - verify signature, `iss`, `token_use`, `exp`,
    `aud` / `client_id`.
25. **Protected API route** - sample endpoint requiring a valid access token,
    with `cognito:groups` RBAC.
26. **Machine-to-machine (client credentials)** - Cognito domain, resource
    server + scopes, M2M client (Terragrunt); `POST /oauth2/token` then call the
    protected API; verify `scope`.

**M7 - Admin console**
27. **SigV4 request signer** - sign `Admin*` and `cognito-identity` calls;
    public `cognito-idp` calls stay unsigned.
28. **Admin: user list & detail** - `ListUsers`, `AdminGetUser`.
29. **Admin: create user** - `AdminCreateUser` (drives item 15).
30. **Admin: user lifecycle** - `AdminEnableUser` / `AdminDisableUser` /
    `AdminDeleteUser`, `AdminSetUserPassword`.
31. **Admin: group management** - `CreateGroup` / `ListGroups`,
    `AdminAddUserToGroup` / `AdminRemoveUserFromGroup`,
    `AdminListGroupsForUser`.

**M8 - Federated AWS access & S3 upload**
32. **Identity Pool infrastructure (Terragrunt)** - identity pool, authenticated
    IAM role, per-identity S3 prefix policy.
33. **Exchange tokens for IAM credentials** - `GetId` +
    `GetCredentialsForIdentity` (SigV4-signed).
34. **Direct browser-to-S3 upload** - temp credentials PUT an avatar to the
    user's `identity-id/` prefix; store object metadata in Mongo.

**M9 - Coverage sweep (optional)**
35. **Remaining API surface** - device tracking, SMS MFA variants, custom schema
    attributes, `DescribeUserPool` / `GetUserPoolMfaConfig`,
    `AdminUserGlobalSignOut`, token-revocation edge cases.

## Data model

The app stores almost nothing about identity itself; **Cognito is the system of
record**. MongoDB holds two collections (`project-plan.md` §4).

### User (`users`) - one companion document per Cognito user

- `_id` (ObjectId)
- `cognitoSub` (string, unique) - Cognito user pool `sub`; the join key every
  feature relies on. **Locked.**
- `email` (string) - mirrored from Cognito so the login screen can resolve
  `authStrategy` before authenticating (needed for SRP, item 22)
- `authStrategy` (`"USER_PASSWORD_AUTH"` | `"USER_SRP_AUTH"`, default
  `"USER_PASSWORD_AUTH"`) - which sign-in flow this user uses (items 21-22)
- `profile` (object, item 20)
  - `nickname` (string, optional)
  - `age` (number, optional)
  - `dateOfBirth` (string, ISO date, optional)
  - `hobbies` (string[], optional)
- `avatar` (object, optional, item 34)
  - `bucket` (string), `key` (string, `<identityId>/...`),
    `contentType` (string), `size` (number), `uploadedAt` (Date)
- `createdAt` (Date), `updatedAt` (Date)

> `cognitoSub` uniqueness and its role as the link key are locked; later
> features (profile, settings, avatar) all query by it. Created on first sign-in.

### ApiCallLog (`apiCallLogs`) - capped collection, written by the custom client

- `target` (string) - `X-Amz-Target` action or endpoint path
- `requestBody` (object) - outgoing payload, with `Password`, `SECRET_HASH`,
  `Session`, `AccessToken`, `RefreshToken` redacted
- `statusCode` (number)
- `responseBody` (object) - response with tokens redacted
- `challengeName` (string, optional) - e.g. `NEW_PASSWORD_REQUIRED`,
  `SOFTWARE_TOKEN_MFA`
- `cognitoSub` (string, optional) - when the caller is known
- `durationMs` (number)
- `createdAt` (Date)

> Capped at ~5000 documents so it self-trims. Backs the in-app `/api-log`
> inspector (item 3).

### External state (AWS, provisioned via Terragrunt)

- **User pool user** - standard attributes (`email`, `name`, `email_verified`),
  MFA config, group membership
- **Groups** - `Admins`, `Users`; the `cognito:groups` claim is the only role
  source
- **App clients** - confidential web client (secret, `SECRET_HASH`); separate M2M
  client for `client_credentials`
- **Resource server + custom scopes** - target of M2M access tokens (item 26)
- **Identity pool** - maps a user-pool token to an `identityId` and temporary IAM
  credentials (items 32-33)
- **S3 bucket** - private, objects under `<identityId>/` prefixes (item 34)

## Tech stack

- **Next.js** (App Router, RSC, `middleware.ts`) - UI, server-side Cognito calls,
  cookie session
- **TypeScript** - the only language; types clearly defined, grouped, and reused
  across the project
- **shadcn/ui + Tailwind v4** - components and styling; violet-forward theme with
  light/dark already defined in `app/globals.css`
- **MongoDB** - the `users` and `apiCallLogs` collections; runs as a container
- **Custom Cognito client** - hand-rolled calls to `cognito-idp`,
  `cognito-identity`, and the OAuth2 token endpoint, plus a SigV4 signer and
  `SECRET_HASH` helper; **no AWS SDK / Amplify**
- **jose** - JWKS fetch/cache and each claim check written by hand (chosen over
  `aws-jwt-verify` for learning)
- **Terragrunt** - provisions all AWS resources listed under External state
- **Docker + Docker Compose** - local dev: Next.js container + MongoDB container,
  `docker compose up`

## Monetization

Not applicable. Learning project, not for commercial use.

## UI/UX

Modern, built from shadcn/ui components, using the existing `globals.css` theme
(violet primary, neutral surfaces, light + dark). Indicative routes (firmed up
per `/feature`):

- `/` - auth-aware landing
- `/signup`, `/confirm` - registration and email OTP
- `/login` - password or SRP sign-in, plus challenge screens
  (`NEW_PASSWORD_REQUIRED`, `SOFTWARE_TOKEN_MFA`)
- `/forgot-password` - request and confirm a reset
- `/profile` - Cognito attributes, extended profile, avatar upload
- `/settings` - change password, MFA management, auth-strategy toggle, delete
  account
- `/admin` - group-gated console: user list/detail, create, lifecycle, groups
- `/api-log` - inspector for logged Cognito requests/responses
- `/api/protected` - sample protected route handler (user token and M2M token)

## Deployment

Eventual target is **AWS ECS** (container image), but there is **no production
deployment in this phase** and no CI/CD yet - explicitly deferred.

- **Local**: `docker compose up` (Next.js + MongoDB)
- **Runtime needs**: MongoDB connection; AWS credentials or task role for
  `Admin*` and `cognito-identity` SigV4 calls
- **Env vars (by name, indicative)**: `AWS_REGION`, `COGNITO_USER_POOL_ID`,
  `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, `COGNITO_M2M_CLIENT_ID`,
  `COGNITO_M2M_CLIENT_SECRET`, `COGNITO_DOMAIN`, `COGNITO_IDENTITY_POOL_ID`,
  `S3_BUCKET`, `MONGODB_URI`
- `> TODO`: exact ECS service shape, build/start commands for the image, health
  check path, domain

## Open questions

Minor, non-blocking:

1. **Foundational items 1-3** are setup-flavored rather than user-visible, but
   kept in the build plan because they are substantive deliverables central to
   the learning goal.
2. The rough **"Phase 1-5" list** in `project-plan.md` §3 predates the 9-milestone
   build plan and is now only loose background; the build plan is authoritative.
