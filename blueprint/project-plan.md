# Project Plan

> One of the two planning docs you provide. Use as much detail as the project
> needs, including rationale, constraints, examples, edge cases, and explicit
> exclusions that should guide later feature work. Draft it directly, develop it
> through any AI conversation, or optionally run `/discovery` for a guided deep
> planning session. The content is always yours to direct. When it is filled in,
> run `/overview` to generate the project overview from this plus `build-plan.md`.

## 1. Problem - What problem are we solving?

The main purpose of this project is to implement UI that calls AWS Cognito API in order to get familliar with all the features Cognito offers.

## 2. Users - Who is this for?

Not intended for commercial use. But it needs to support both public and admin flows.

## 3. Features - What does the MVP need?

Sign Up & Email Verification: Build a registration form collecting standard attributes (Email, Name). Trigger Cognito’s native OTP email confirmation flow.

Sign In & Session Storage: Implement standard password login returning standard OIDC tokens (id_token, access_token, refresh_token).

Selectable Auth Strategy (Password vs SRP): Let each user pick their sign-in flow on the settings page, stored per user in MongoDB (authStrategy). Default is plain password auth (USER_PASSWORD_AUTH via InitiateAuth). When SRP is selected, implement the Secure Remote Password handshake by hand (USER_SRP_AUTH: send SRP_A, then answer the PASSWORD_VERIFIER challenge with SECRET_BLOCK, TIMESTAMP, and PASSWORD_CLAIM_SIGNATURE). The login screen resolves the user by email first to know which flow to run.

Token Storage Strategy: Store tokens in httpOnly secure cookies via Next.js Middleware or Server Actions to handle SSR/CSR auth state smoothly.

Self-Service Forgot/Reset Password: Build the ForgotPassword and ConfirmForgotPassword workflow using email-delivered challenge codes.

Admin-Initiated Force Password Change: Create a test scenario handling the NEW_PASSWORD_REQUIRED challenge state (typically when an admin creates a user manually in the AWS Console).

Multi-Factor Authentication (MFA) - Time-Based One-Time Password (TOTP): Implement a profile screen feature where users can enable TOTP. Generate a QR code using Cognito's secret key output (AssociateSoftwareToken API) and verify the setup with an authenticator app code.

User Pool Groups as Roles: Create two groups in Cognito (Admins, Users). Groups are the single source of truth for a user's role; there is no custom role attribute. Membership is managed through the Cognito group APIs (AdminAddUserToGroup / AdminRemoveUserFromGroup) and surfaces in the token as the cognito:groups claim.

Next.js Route Protection: Decode the JWT access_token or id_token in Next.js Middleware (middleware.ts). Restrict access to /admin routes based on the cognito:groups array inside the token payload.

Do Server-Side JWT Verification, a utility created with jose (chosen over aws-jwt-verify so the JWKS fetch/cache and every claim check are implemented by hand for learning) to download Cognito's JSON Web Key Set (JWKS) and validate the JWT signature, issuer (iss), audience (client_id), token use (token_use), and token expiration (exp) before returning data.

Machine-to-Machine Access (OAuth2 Client Credentials): Provision a Cognito domain, a resource server with custom scopes, and a separate app client that uses the client_credentials grant. Implement a backend caller that requests an access token from POST /oauth2/token (grant_type=client_credentials, HTTP Basic auth with the M2M client id and secret) and uses it to call the protected server API. The JWKS utility verifies these tokens too: token_use=access, client_id, and the required scope claim, with no id_token and no user in the loop.

Federated AWS Access (Cognito Identity Pool) - Exchange the User Pool id_token via an Identity Pool (GetCredentialsForIdentity API) to acquire temporary IAM credentials (AccessKeyId, SecretKey, SessionToken). Direct Client-to-S3 Upload: Use the temporary IAM credentials in the browser to upload an avatar or document directly to a private Amazon S3 bucket path scoped to the user's Cognito Identity ID (/s3-bucket/${cognito-identity-id}/\*).

Phase 1 Registration & Login User Pools, App Clients, OTP Verification, Tokens
Phase 2 Next.js Middleware Protection Token Decoding, Expiration Checking, Refresh Token Flow
Phase 3 MFA & Account Recovery Authentication Challenges, TOTP Setup, Password Lifecycle
Phase 4 Protected Server API JWKS Validation, Custom Claims, cognito:groups RBAC
Phase 5 S3 Profile Upload Identity Pools, Federated Identities, IAM Roles & Policies

These phases are just rough ideas, please feel free to modify anything if there are some concerns or something doesn't make sense.

## 4. Data - What are we storing?

Cognito is the system of record for identity. MongoDB holds two collections.

### users - one companion document per Cognito user

- cognitoSub (string, unique) - Cognito user pool `sub`; the join key every feature uses
- email (string) - mirrored from Cognito so the login screen can resolve authStrategy before authenticating (needed for SRP)
- authStrategy ("USER_PASSWORD_AUTH" | "USER_SRP_AUTH", default "USER_PASSWORD_AUTH") - which sign-in flow this user uses
- profile.nickname (string, optional)
- profile.age (number, optional)
- profile.dateOfBirth (string, ISO date, optional)
- profile.hobbies (string[], optional)
- avatar (object, optional) - S3 object metadata: bucket, key (<identityId>/...), contentType, size, uploadedAt
- createdAt, updatedAt (Date)

The document is created and linked on first sign-in. cognitoSub uniqueness and its role as the link key are locked; profile, settings, and avatar features all query by it.

### apiCallLogs - capped collection, written by the custom Cognito HTTP client

- target (string) - X-Amz-Target action or endpoint path
- requestBody (object) - outgoing payload with Password, SECRET_HASH, Session, AccessToken, RefreshToken redacted
- statusCode (number)
- responseBody (object) - response with tokens redacted
- challengeName (string, optional) - e.g. NEW_PASSWORD_REQUIRED, SOFTWARE_TOKEN_MFA
- cognitoSub (string, optional) - when the caller is known
- durationMs (number)
- createdAt (Date)

Capped (roughly 5000 documents) so it self-trims and never needs cleanup. Backs the in-app /api-log inspector (build item 3).

## 5. Tech - What stack are we using?

Next.js, Shadcn UI, MongoDB for storage, Terragrunt for AWS, Docker for local development, jose for JWT/JWKS verification.

There should be Next.js container and mongodb container. Project containers should be runnable with docker compose.

Regarding communicaiton with Cognito's API, I don't want to use any SDK, I want to call API directly and kind of implement my own SDK so I know what Cognito clients are doing behind the scenes.

This project is using TypeScript only, types should be clearly defined, grouped and reused across the project.

## 6. Monetize - How will this make money?

Not for commercial use.

## 7. UI/UX - How should this look and feel?

I want the UI to be modern, built with Shadcn components and with the color scheme already defined in globals.css.

## 8. Deployment - Where and how will this ship?

Target host is AWS ECS but there is no plan for running this in production since it's for learning purposes only. I'll probably add prod deployment later with full CI/CD, but it's unnecessary detour for now.
