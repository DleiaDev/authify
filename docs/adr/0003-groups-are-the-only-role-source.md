# Cognito groups are the only source of a User's role

A User's role comes solely from Cognito group membership (`Admins`, `Users` group), surfaced as the `cognito:groups` claim. There is no custom role attribute in Cognito and no role field on the User Companion Record, so role can never disagree between two stores. Membership changes only through the Cognito group APIs.
