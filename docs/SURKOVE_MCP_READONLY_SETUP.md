# Surkove Read-only MCP Setup

## Status and Scope

This PHP endpoint is intended for `https://surkove.ru/mcp.php`. It exposes exactly three read-only diagnostics: `server_health`, `database_health`, and `mail_config_status`. There is no live Majordomo API or server configuration in this repository. No production deployment or database access was performed.

The endpoint accepts only fixed, empty tool arguments. It provides no arbitrary SQL, file, shell, write, user-registration, or email-sending operations.

## Request and Protocol

- Direct HTTPS is required based only on the server's `HTTPS=on`/`1` or `SERVER_PORT=443` values. `X-Forwarded-Proto` is not trusted. HTTPS is checked before configuration loading and bearer-token authorization.
- Only POST is accepted. A present `Origin` must be `https://surkove.ru` or `https://www.surkove.ru`. The body is limited to 16 KiB, and `Content-Type` must be `application/json`.
- MCP Streamable HTTP clients must send `Accept: application/json, text/event-stream`. The endpoint returns one JSON response; it does not implement SSE response streams.
- Modern requests use `2026-07-28`. Discovery advertises only that version. Legacy initialize handshakes remain available for `2025-11-25`, `2025-06-18`, and `2025-03-26`.
- Modern requests must provide matching `MCP-Protocol-Version` and `_meta.io.modelcontextprotocol/protocolVersion`, `Mcp-Method` and JSON-RPC `method`, plus `Mcp-Name` and `params.name` for `tools/call`. Client capabilities are required in `_meta.io.modelcontextprotocol/clientCapabilities`.
- Responses disable HTTP caching. Modern `server/discover` and `tools/list` use `ttlMs: 0` and `cacheScope: private`.

## Private Server Configuration

The private PHP configuration must be outside the web document root and contain only required data. If `mcp.php` is `/home/account/www/mcp.php`, the endpoint resolves the private file at `/home/account/private/surkove-mcp.php`. Create the parent directory with mode `700` and the file with mode `600`. Confirm the actual path and access restrictions with the hosting provider before generating any real token. Never put this file in `www`, the repository, or a deployment artifact.

Example format (placeholders only):

```php
<?php
return [
    'token_sha256' => 'REPLACE_WITH_64_LOWERCASE_HEX_CHARACTERS',
    'database' => [
        'dsn' => 'mysql:host=127.0.0.1;charset=utf8mb4',
        'username' => 'REPLACE_MCP_DATABASE_USER',
        'password' => 'REPLACE_MCP_DATABASE_PASSWORD',
    ],
    'mail' => [
        'status' => 'not_configured',
    ],
];
```

The token placeholder is not usable. The server stores only the SHA-256 digest of the 32-byte bearer token. Do not put an SMTP password or SMTP credentials in this configuration. `mail.status` is an explicit value (`configured`, `incomplete`, or `not_configured`); if absent or invalid, MCP reports `not_specified`. Mail status responses say that SMTP connectivity and email sending have not been checked.

The endpoint requires PHP 8.3+ and PDO, `pdo_mysql`, OpenSSL, JSON, and cURL extensions for a healthy runtime. Do not commit any real password, token, or private host value.

## Token and Least-Privilege Database Account

Only after the private config path and its owner/permissions are confirmed, generate a 32-byte token on the trusted client machine. This writes directly to a protected file, does not print the token, and does not put its value in shell history:

```sh
umask 077
install -d -m 700 "$HOME/.config/surkove-mcp"
token_file="$HOME/.config/surkove-mcp/token"
openssl rand -hex 32 > "$token_file"
chmod 600 "$token_file"
sha256sum "$token_file" | cut -d ' ' -f 1
```

Copy only the 64-character digest into `token_sha256` in the server's private configuration. Keep the token file client-side, mode `600`, and outside the repository. Do not print or paste the token into chat or a terminal command.

The connector opens MySQL without selecting a schema and executes only the literal `SELECT 1`; it does not read tables. Create a dedicated account through the hosting provider's approved administrative process, with no table privileges or database grants. The following is example SQL only; do not run it from MCP or against production as part of this repository task:

```sql
CREATE USER 'surkove_mcp_ro'@'localhost' IDENTIFIED BY 'REPLACE_WITH_UNIQUE_PASSWORD';
SHOW GRANTS FOR 'surkove_mcp_ro'@'localhost';
```

If a hosting provider requires a schema-qualified DSN, ask whether a database-scope `USAGE`-only grant is required and supported. `USAGE` grants no table-reading permission; do not substitute `SELECT`. Never grant `INSERT`, `UPDATE`, `DELETE`, DDL, `FILE`, or administrative privileges. No real account has been created and no SQL was run.

## Copilot CLI

After confirming secure server-side configuration placement, load the token silently from its protected local file and add the endpoint over HTTPS:

```sh
IFS= read -r -s SURKOVE_MCP_TOKEN < "$HOME/.config/surkove-mcp/token"
umask 077
copilot mcp add --transport http \
  --header "Authorization: Bearer ${SURKOVE_MCP_TOKEN}" \
  surkove https://surkove.ru/mcp.php
unset SURKOVE_MCP_TOKEN
chmod 600 "$HOME/.copilot/mcp-config.json"
```

The command history contains the variable reference, not the token value. The CLI may persist the authorization header in its user configuration. Verify that `~/.copilot/mcp-config.json` is mode `600` without printing its contents or using `--show-secrets`. If credentials are exposed, remove the connection and rotate the token.

The tools report:

- `server_health`: PHP version, HTTPS request status, required extension availability, database configuration presence, and explicit mail configuration status.
- `database_health`: connection status and the fixed `SELECT 1` result only.
- `mail_config_status`: explicit configuration status only, and explicit `false` values for SMTP-connection and email-sending checks.

## Manual Deployment

This checkout's `origin/main` does not contain `update.php`; its behavior and manual update procedure cannot be verified from repository evidence. The public homepage, `update.php`, and `mcp.php` could not be reached during unauthenticated GET checks (network timeouts). It is therefore unknown whether `mcp.php` is already published or whether a secure private config path is available on the host.

Before any real connection, the operator must confirm the host's document root and private path, create the private config outside `www` with restrictive permissions, follow the approved manual deployment procedure for `mcp.php`, and verify HTTPS/PHP behavior on the real server. Only after the config location is confirmed safe should a client token be generated and its digest installed. Provision a separate no-table-privilege MySQL account through the host's approved process only if the database diagnostic is needed. No deployment, account creation, token generation, or production connection was performed for this change.
