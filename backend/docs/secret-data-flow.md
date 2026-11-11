# Secret Data Flow and Encryption

This document describes how secret values move through the current frontend,
backend, and MongoDB implementation. Encryption and decryption happen in the
backend; this is not end-to-end or client-side encryption.

## Components

```text
Browser (Next.js)
  -> authenticated HTTP request
Express API (/api/v1/secret)
  -> route validation and access-token/session verification
Secret service
  -> AES-256-GCM encryption/decryption
Secret repository (Mongoose)
  -> MongoDB Secrets collection
```

Secret endpoints are mounted under `/api/v1/secret` and require a bearer access
token. The authentication middleware verifies the JWT, its access-token type,
and that its session exists and has not been revoked.

## Creating a secret

1. The user enters a key and value in the secrets page. The frontend submits
   them to `POST /api/v1/secret/create` in a JSON request body. The create
   payload property is currently named `encryptedValue`, but at this point it
   contains the user's **plaintext** value; the browser does not encrypt it.
2. The API validates the body. The secret service checks that the project
   exists, is not deleted, has the selected environment, and does not already
   have an active secret with the same key in that environment.
3. The backend encrypts the value with AES-256-GCM and saves the ciphertext with
   the key, project, environment, and metadata in MongoDB.
4. The response contains the secret record, not its plaintext value. The
   `encryptedValue` field is excluded from normal Mongoose query results.
5. The secrets page can import a `.env` file into one selected environment.
   Existing keys are skipped rather than overwritten, and empty values are
   stored as empty secret values.

## Listing and revealing

- `GET /api/v1/secret?projectId=...` lists active secret records. Because the
  model marks `encryptedValue` as `select: false`, the list response does not
  include the encrypted value or plaintext.
- When the user chooses to reveal a value, the frontend calls
  `GET /api/v1/secret/:secretId`. The repository explicitly selects the
  ciphertext, the backend decrypts it, and the API returns
  `{ "value": "<plaintext>" }`. The frontend then displays the returned value.
- Exporting a `.env` file reveals each selected-environment secret through the
  same endpoint and downloads a plaintext file in the browser. The export is
  aborted if any value cannot be revealed; downloaded files must be stored
  securely.
- Hiding the value removes it from the page's visible-value state. It does not
  erase copies that may exist elsewhere in browser or operating-system memory.

## Editing a secret

`PATCH /api/v1/secret/:secretId` accepts a key, a value, or both. At least one
must be provided.

- If a new key is provided, the backend rejects it if another secret in the
  same project and environment already uses it.
- If a new value is provided, the backend encrypts it before saving.
- If a field is omitted, its existing value is retained. A key-only edit does
  not decrypt or re-encrypt the stored value.
- Each successful edit increments the secret's version and records the
  authenticated user as `updatedBy`.

## Encryption format

The backend uses Node.js `crypto` with AES-256-GCM:

1. It generates a fresh, random 12-byte initialization vector (IV) for each
   encryption.
2. It encrypts the UTF-8 value using the configured 32-byte key.
3. It obtains the GCM authentication tag.
4. It stores three base64url-encoded parts, joined by periods:

   ```text
   <iv>.<authentication-tag>.<ciphertext>
   ```

The IV and authentication tag are stored alongside the ciphertext because
they are required for decryption and integrity verification. A fresh IV means
encrypting the same plaintext again normally produces a different stored
string.

## Encryption key configuration and operations

The backend requires `SECRET_ENCRYPTION_KEY` in its environment. It must be
exactly 64 hexadecimal characters, representing 32 bytes. Generate a key with
Node.js:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep this key in a trusted secret manager or protected deployment environment.
Do not commit it, send it to the frontend, or log it. Keep a secure backup and
use the same key for every backend instance that needs to decrypt the
database's secrets. If the key is lost or changed without re-encrypting stored
secrets, those values cannot be decrypted. The current implementation does not
provide key rotation; rotation requires a controlled decrypt-and-re-encrypt
migration.

## Security boundaries and current limitations

- Since the browser sends plaintext values to the API and receives plaintext
  on reveal, use HTTPS in deployed environments. AES encryption at rest does
  not replace transport encryption.
- The backend necessarily has access to the encryption key and handles
  plaintext during create, update, and reveal. Anyone with sufficient backend
  runtime access or the key and database can decrypt stored values.
- Access-token verification authenticates the caller, but it is not by itself
  project-level authorization. The update service currently checks that the
  caller owns the secret's project. The current list and reveal service
  handlers do not perform that same owner check, so do not treat those
  endpoints as enforcing per-project access control.
- Secret request bodies should not be logged. The current HTTP logger records
  request metadata (method, URL, status, duration, and IP), not the body; keep
  that behavior when changing logging or adding request tracing.
