# Surkove Read-only MCP Setup

## Status and Scope

This connector is a PHP endpoint intended to be deployed as `https://surkove.ru/mcp.php`. It provides authenticated, read-only diagnostics only. It does not connect to a live Majordomo installation in this repository: `origin/main` contains no PHP API, `update.php`, `.deploy`, or server configuration. No server deployment or production access was performed.

The endpoint exposes exactly three tools: `server_health`, `database_health`, and `mail_config_status`. All advertise `readOnlyHint: true` and `destructiveHint: false`. Tool arguments are empty objects; callers cannot supply SQL, file paths, shell commands, mail content, or other operations.

## Request Flow

1. The endpoint loads the private PHP configuration from `dirname(__DIR__) . '/private/surkove-mcp.php'`. If the file is absent, unreadable, invalid, or lacks a valid SHA-256 token digest, it returns HTTP 503 without disclosing the path.
2. It requires direct HTTPS as reported by the web server (`HTTPS` equal to `on` or `1`, or server port `443`), before checking the Bearer token. It does not trust `X-Forwarded-Proto`. It then accepts POST only, limits the body to 16 KiB, requires `Content-Type: application/json`, and disables response caching.
3. If an `Origin` header is present, only `https://surkove.ru` and `https://www.surkove.ru` are accepted. CLI requests without `Origin` are permitted.
4. It accepts a 64-hex-character Bearer token and compares its SHA-256 digest with the configured digest using `hash_equals`. Tokens in URL parameters are not read.
5. Stateless discovery advertises only the modern Streamable HTTP version (`2026-07-28`). Legacy initialize handshakes remain available for `2025-11-25`, `2025-06-18`, and `2025-03-26`; those versions are not advertised by modern discovery. Modern requests must provide matching `MCP-Protocol-Version`, `Mcp-Method`, and, for `tools/call`, `Mcp-Name` headers and the required protocol-version and client-capabilities `_meta` fields.

The database diagnostic creates a PDO connection from the private configuration and executes only the literal `SELECT 1`. It does not accept a query from the client or inspect application tables. The mail diagnostic checks configuration field presence only; it does not connect to SMTP, authenticate, or send messages.

## Private Configuration

The private configuration must be outside the web document root. For example, if the public site directory is `/home/account/www`, place it at `/home/account/private/surkove-mcp.php`. This matches the endpoint's `dirname(__DIR__) . '/private/surkove-mcp.php'` lookup. The file is not part of this repository and must not be uploaded into `www` or committed.

Example format with placeholders only:

```php
<?php
return [
    'token_sha256' => 'REPLACE_WITH_64_LOWERCASE_HEX_CHARACTERS',
    'database' => [
        'dsn' => 'mysql:host=127.0.0.1;charset=utf8mb4',
        'username' => 'REPLACE_READONLY_USER',
        'password' => 'REPLACE_DATABASE_PASSWORD',
    ],
    'mail' => [
        'host' => 'REPLACE_SMTP_HOST',
        'port' => 587,
        'username' => 'REPLACE_SMTP_USERNAME',
        'password' => 'REPLACE_SMTP_PASSWORD',
        'encryption' => 'tls',
        'from_address' => 'REPLACE_SENDER_ADDRESS',
    ],
];
```

The placeholder digest is not a usable token digest. Replace every placeholder only in the private server-side file. The endpoint needs PHP 8.3 or later with PDO, `pdo_mysql`, OpenSSL, JSON, and cURL extensions available for a fully healthy runtime. Do not put real passwords, token values, database hosts, or SMTP values in Git.

## Token and Database Account

Generate a 32-byte token locally; keep it in a secret manager or protected client environment and do not print it or commit it:

```sh
export SURKOVE_MCP_TOKEN="$(openssl rand -hex 32)"
printf '%s' "$SURKOVE_MCP_TOKEN" | sha256sum
```

Copy only the 64-character SHA-256 digest into `token_sha256` in the private PHP configuration. Give the token itself to the Copilot CLI through its authenticated HTTP header. The server stores only the digest.

Create a dedicated database account through the hosting provider's approved administrative process, using a unique strong password. Because the connector only executes the literal `SELECT 1` without selecting or reading any tables, the account needs no table privileges and no database-level grants. Example SQL (replace identifiers and password yourself; do not run it from MCP):

```sql
CREATE USER 'surkove_mcp_ro'@'localhost' IDENTIFIED BY 'REPLACE_WITH_UNIQUE_PASSWORD';
SHOW GRANTS FOR 'surkove_mcp_ro'@'localhost';
```

Keep the DSN free of `dbname` so MySQL does not need to select an application schema for `SELECT 1`. If a hosting provider requires a schema-qualified DSN, ask the provider whether a database-scope `USAGE`-only grant is supported for that account; `USAGE` must not be replaced with `SELECT`, and it grants no table-reading permission. Do not apply a grant unless the provider confirms it is required. Never grant `INSERT`, `UPDATE`, `DELETE`, DDL, `FILE`, or administrative privileges. The connector itself still runs only `SELECT 1`.

## Copilot CLI

With `SURKOVE_MCP_TOKEN` set in the local shell, add the remote HTTP server:

```sh
copilot mcp add --transport http \
  --header "Authorization: Bearer $SURKOVE_MCP_TOKEN" \
  surkove https://surkove.ru/mcp.php
```

The CLI stores the connection in user configuration, not this repository. Do not use `--show-secrets` when inspecting it. Remove the server from the CLI configuration and rotate the token if it is exposed.

The only allowed MCP tools are:

- `server_health`: PHP version, HTTPS request status, required extension availability, and database/mail configuration presence.
- `database_health`: connection status and fixed `SELECT 1` result only.
- `mail_config_status`: configured/incomplete status and missing SMTP field names only.

No file, SQL, shell, hosting, user-registration, password/OTP, or email-sending tools are implemented.

## Future Manual Deployment

This checkout's `origin/main` does not contain `update.php`; therefore its interface, deployment behavior, and exact invocation cannot be verified or documented from repository evidence. No updater was created or changed. Before deployment, the operator must confirm the intended existing `update.php` in the actual hosting environment and follow its established manual procedure.

When that procedure is confirmed, deploy only `mcp.php` to the public document root through the approved updater. Create `/private/surkove-mcp.php` separately outside the document root with restrictive filesystem permissions; never deploy that configuration from Git. Verify direct HTTPS and PHP 8.3+, install/enable `pdo_mysql` if needed, provision the dedicated no-table-privilege account outside MCP, and configure the client token whose digest is stored server-side. Then run authenticated read-only protocol checks. Do not enable the endpoint or connect real Majordomo credentials until a maintainer has reviewed and approved the configuration. This change does not perform deployment.