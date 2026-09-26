# No AWS SDK: a hand-rolled Cognito client

authify exists to learn Cognito, so every call to AWS (the `cognito-idp` JSON API, `cognito-identity`, the OAuth2 token endpoint) goes through our own HTTP client, with our own `SECRET_HASH` helper and SigV4 signer. We deliberately do not use `@aws-sdk/*` or Amplify, even though they would be less code and better tested, because they hide the request shapes, challenge sequence, and signing we want to see. Do not "fix" this by introducing the SDK.
