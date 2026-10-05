Hashcod File Vault TOTP backend

This helper links against github.com/pquerna/otp/totp.
Upstream project: https://github.com/pquerna/otp
License: Apache License 2.0

The helper receives the TOTP secret and current passcode through stdin JSON and
returns only a validation result. Hashcod Codespace encrypts the secret at rest
before storing it in cloud metadata.
