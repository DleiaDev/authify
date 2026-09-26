# authify

A hands-on AWS Cognito playground: a web app that drives the Cognito API surface
through a hand-rolled client, so every request, challenge, and token is visible.

## Language

### People and records

**User**:
A person's entry in the Cognito user pool, identified by its `sub`. Cognito is
the system of record for Users.
_Avoid_: account, app user, Cognito user

**User Companion Record**:
The app-side document holding what Cognito does not store about a User (extended
profile, sign-in preferences, avatar), linked to exactly one User by its `sub`.
_Avoid_: companion record, app user record, user document, account

**Admin**:
A User who belongs to the `Admins` group. Group membership is the only source of
a User's role.
_Avoid_: administrator, superuser, admin user

**`Users` group**:
The Cognito group for ordinary Users. Always named with the word "group" so it
is never confused with Users.
_Avoid_: users (unqualified)

**Federated Identity**:
The Identity Pool entry a User's tokens are exchanged for, which receives
temporary AWS credentials and owns a private S3 prefix.
_Avoid_: identity, identity ID (unqualified)

### Signing in

**Auth Strategy**:
A User's chosen way of signing in, either **Password** or **SRP**, stored on the
User Companion Record and looked up by email before authentication.
_Avoid_: sign-in flow, login strategy, auth flow

**Token Set**:
The id, access, and refresh tokens Cognito issues when a User signs in.
_Avoid_: tokens (unqualified), OIDC tokens

**Session**:
A signed-in User's Token Set, held by the app in httpOnly cookies.
_Avoid_: auth state, login

### Clients

**Web Client**:
The confidential Cognito app client (with a secret) through which Users sign in
to the app.
_Avoid_: app client (unqualified)

**Machine Client**:
The Cognito app client that obtains access tokens with scopes via the client
credentials grant, with no User involved.
_Avoid_: M2M app, service account

### Calls to AWS

**Public Call**:
An unsigned call to the Cognito user pool API, made on behalf of a User or an
anonymous visitor.
_Avoid_: client call, user call

**Privileged Call**:
A call signed with the server's own AWS credentials (SigV4), such as the
Cognito `Admin*` actions, which acts regardless of who is signed in.
_Avoid_: admin call, admin API

**API Call Log**:
The self-trimming record of every call the hand-rolled client makes, inspected
in-app. Each entry is a **Logged Call**.
_Avoid_: audit log, request log
