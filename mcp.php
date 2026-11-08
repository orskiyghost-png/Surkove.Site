<?php
declare(strict_types=1);

const SURKOVE_MCP_MODERN_VERSION = '2026-07-28';
const SURKOVE_MCP_LEGACY_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const SURKOVE_MCP_SUPPORTED_VERSIONS = [
    SURKOVE_MCP_MODERN_VERSION,
];
const SURKOVE_MCP_MAX_BODY_BYTES = 16384;
const SURKOVE_MCP_PROTOCOL_META = 'io.modelcontextprotocol/protocolVersion';
const SURKOVE_MCP_CLIENT_INFO_META = 'io.modelcontextprotocol/clientInfo';
const SURKOVE_MCP_CLIENT_CAPABILITIES_META = 'io.modelcontextprotocol/clientCapabilities';
const SURKOVE_MCP_SERVER_INFO_META = 'io.modelcontextprotocol/serverInfo';

ini_set('display_errors', '0');

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function surkoveMcpSendJson(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    $encoded = json_encode(
        $payload,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );

    if ($encoded === false) {
        http_response_code(500);
        echo '{"error":"Internal Server Error"}';
        exit;
    }

    echo $encoded;
    exit;
}

function surkoveMcpSendHttpError(int $status, string $message): void
{
    if ($status === 401) {
        header('WWW-Authenticate: Bearer realm="Surkove MCP"');
    }

    surkoveMcpSendJson($status, ['error' => $message]);
}

function surkoveMcpSendRpcError(
    mixed $id,
    int $code,
    string $message,
    ?array $data = null,
    int $httpStatus = 200
): void {
    $error = ['code' => $code, 'message' => $message];
    if ($data !== null) {
        $error['data'] = $data;
    }

    surkoveMcpSendJson($httpStatus, [
        'jsonrpc' => '2.0',
        'id' => $id,
        'error' => $error,
    ]);
}

function surkoveMcpHeader(string $name): ?string
{
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    $value = $_SERVER[$serverKey] ?? null;

    return is_string($value) ? $value : null;
}

function surkoveMcpIsHttpsRequest(): bool
{
    $https = $_SERVER['HTTPS'] ?? null;

    return (is_string($https) && in_array(strtolower($https), ['on', '1'], true))
        || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
}

function surkoveMcpIsNonEmptyString(mixed $value): bool
{
    return is_string($value) && trim($value) !== '';
}

function surkoveMcpHasDatabaseConfig(mixed $database): bool
{
    if (!is_array($database)) {
        return false;
    }

    return surkoveMcpIsNonEmptyString($database['dsn'] ?? null)
        && str_starts_with((string) $database['dsn'], 'mysql:')
        && surkoveMcpIsNonEmptyString($database['username'] ?? null)
        && surkoveMcpIsNonEmptyString($database['password'] ?? null);
}

function surkoveMcpCompleteResult(string $protocolVersion, array|object $fields): array|object
{
    if ($protocolVersion === SURKOVE_MCP_MODERN_VERSION) {
        return ['resultType' => 'complete'] + (array) $fields;
    }

    return $fields;
}

function surkoveMcpToolDefinitions(): array
{
    $emptyObjectSchema = [
        'type' => 'object',
        'properties' => (object) [],
        'additionalProperties' => false,
    ];

    return [
        [
            'name' => 'server_health',
            'description' => 'Reports PHP runtime, required extension availability, HTTPS request status, database configuration presence, and explicit mail configuration status. Does not expose configuration values.',
            'inputSchema' => $emptyObjectSchema,
            'annotations' => ['readOnlyHint' => true, 'destructiveHint' => false],
        ],
        [
            'name' => 'database_health',
            'description' => 'Checks the configured MySQL connection using only the fixed SELECT 1 statement. Does not read application tables or accept SQL input.',
            'inputSchema' => $emptyObjectSchema,
            'annotations' => ['readOnlyHint' => true, 'destructiveHint' => false],
        ],
        [
            'name' => 'mail_config_status',
            'description' => 'Reports only the explicitly configured mail status. SMTP connectivity and email sending are not checked.',
            'inputSchema' => $emptyObjectSchema,
            'annotations' => ['readOnlyHint' => true, 'destructiveHint' => false],
        ],
    ];
}

function surkoveMcpToolPayload(string $name, array $config): array
{
    if ($name === 'server_health') {
        $databaseConfigured = surkoveMcpHasDatabaseConfig($config['database'] ?? null);

        return [
            'php_version' => PHP_VERSION,
            'https' => surkoveMcpIsHttpsRequest(),
            'extensions' => [
                'PDO' => extension_loaded('PDO'),
                'pdo_mysql' => extension_loaded('pdo_mysql'),
                'OpenSSL' => extension_loaded('openssl'),
                'JSON' => extension_loaded('json'),
                'cURL' => extension_loaded('curl'),
            ],
            'database_configured' => $databaseConfigured,
            'mail_config_status' => surkoveMcpMailConfigStatus($config['mail'] ?? null),
        ];
    }

    if ($name === 'database_health') {
        $database = $config['database'] ?? null;
        if (!surkoveMcpHasDatabaseConfig($database)) {
            return ['status' => 'not_configured'];
        }
        if (!extension_loaded('PDO') || !extension_loaded('pdo_mysql')) {
            return ['status' => 'driver_unavailable'];
        }

        try {
            $pdo = new PDO(
                $database['dsn'],
                $database['username'],
                $database['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_NUM,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_TIMEOUT => 5,
                ]
            );
            $statement = $pdo->query('SELECT 1');
            $connected = $statement !== false && (int) $statement->fetchColumn() === 1;

            return ['status' => $connected ? 'connected' : 'unavailable'];
        } catch (Throwable) {
            return ['status' => 'unavailable'];
        }
    }

    if ($name === 'mail_config_status') {
        return [
            'status' => surkoveMcpMailConfigStatus($config['mail'] ?? null),
            'smtp_connection_checked' => false,
            'email_sending_checked' => false,
        ];
    }

    throw new InvalidArgumentException('Unknown tool');
}

function surkoveMcpMailConfigStatus(mixed $mail): string
{
    $status = is_array($mail) ? ($mail['status'] ?? null) : null;

    return is_string($status) && in_array($status, ['configured', 'incomplete', 'not_configured'], true)
        ? $status
        : 'not_specified';
}

function surkoveMcpSendToolResult(string $protocolVersion, mixed $requestId, array $payload): void
{
    $text = json_encode(
        $payload,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    if ($text === false) {
        surkoveMcpSendRpcError($requestId, -32603, 'Internal error', null, 500);
    }

    surkoveMcpSendJson(200, [
        'jsonrpc' => '2.0',
        'id' => $requestId,
        'result' => surkoveMcpCompleteResult($protocolVersion, [
            'content' => [['type' => 'text', 'text' => $text]],
            'isError' => false,
        ]),
    ]);
}

if (!surkoveMcpIsHttpsRequest()) {
    surkoveMcpSendHttpError(403, 'HTTPS is required');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    surkoveMcpSendHttpError(405, 'Method Not Allowed');
}

if (array_key_exists('HTTP_ORIGIN', $_SERVER)
    && !in_array($_SERVER['HTTP_ORIGIN'], ['https://surkove.ru', 'https://www.surkove.ru'], true)) {
    surkoveMcpSendHttpError(403, 'Origin Forbidden');
}

$privateConfigPath = dirname(__DIR__) . '/private/surkove-mcp.php';
if (!is_file($privateConfigPath) || !is_readable($privateConfigPath)) {
    surkoveMcpSendHttpError(503, 'MCP server configuration is unavailable');
}

try {
    $config = @require $privateConfigPath;
} catch (Throwable) {
    surkoveMcpSendHttpError(503, 'MCP server configuration is unavailable');
}

if (!is_array($config) || !is_string($config['token_sha256'] ?? null)
    || !preg_match('/\A[a-f0-9]{64}\z/', $config['token_sha256'])) {
    surkoveMcpSendHttpError(503, 'MCP server configuration is unavailable');
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (!is_string($contentType)
    || !preg_match('/\Aapplication\/json(?:\s*;\s*charset\s*=\s*"?utf-8"?)?\s*\z/i', trim($contentType))) {
    surkoveMcpSendHttpError(415, 'Content-Type must be application/json');
}

$contentLength = $_SERVER['CONTENT_LENGTH'] ?? null;
if ($contentLength !== null && (!ctype_digit((string) $contentLength)
    || (int) $contentLength > SURKOVE_MCP_MAX_BODY_BYTES)) {
    surkoveMcpSendHttpError(413, 'Request body too large');
}

$body = file_get_contents('php://input', false, null, 0, SURKOVE_MCP_MAX_BODY_BYTES + 1);
if ($body === false) {
    surkoveMcpSendHttpError(400, 'Invalid request body');
}
if (strlen($body) > SURKOVE_MCP_MAX_BODY_BYTES) {
    surkoveMcpSendHttpError(413, 'Request body too large');
}

$authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!is_string($authorization)
    || !preg_match('/\ABearer ([a-fA-F0-9]{64})\z/', $authorization, $tokenMatch)
    || !hash_equals($config['token_sha256'], hash('sha256', $tokenMatch[1]))) {
    surkoveMcpSendHttpError(401, 'Unauthorized');
}

try {
    $request = json_decode($body, false, 32, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    surkoveMcpSendRpcError(null, -32700, 'Parse error', null, 400);
}

if (!$request instanceof stdClass || ($request->jsonrpc ?? null) !== '2.0'
    || !is_string($request->method ?? null)) {
    surkoveMcpSendRpcError(null, -32600, 'Invalid Request', null, 400);
}

$hasId = property_exists($request, 'id');
$requestId = $hasId ? $request->id : null;
if ($hasId && !(is_string($requestId) || is_int($requestId))) {
    surkoveMcpSendRpcError(null, -32600, 'Invalid Request', null, 400);
}
if (!$hasId && str_starts_with($request->method, 'notifications/')) {
    http_response_code(202);
    exit;
}
if (!$hasId) {
    surkoveMcpSendRpcError(null, -32600, 'Invalid Request', null, 400);
}

if (property_exists($request, 'params') && !$request->params instanceof stdClass) {
    surkoveMcpSendRpcError($requestId, -32600, 'Invalid Request', null, 400);
}
$params = isset($request->params) ? get_object_vars($request->params) : [];
$method = $request->method;
$meta = isset($params['_meta']) && $params['_meta'] instanceof stdClass
    ? get_object_vars($params['_meta'])
    : [];
$metaProtocolVersion = $meta[SURKOVE_MCP_PROTOCOL_META] ?? null;
$protocolHeader = surkoveMcpHeader('MCP-Protocol-Version');
$isModernRequest = $metaProtocolVersion === SURKOVE_MCP_MODERN_VERSION
    || $protocolHeader === SURKOVE_MCP_MODERN_VERSION;

if ($isModernRequest) {
    if (!is_string($metaProtocolVersion) || $protocolHeader === null
        || !hash_equals($metaProtocolVersion, $protocolHeader)) {
        surkoveMcpSendRpcError($requestId, -32020, 'Header mismatch: protocol version does not match request metadata', null, 400);
    }
    if (!in_array($metaProtocolVersion, SURKOVE_MCP_SUPPORTED_VERSIONS, true)) {
        surkoveMcpSendRpcError($requestId, -32022, 'Unsupported protocol version', [
            'supported' => SURKOVE_MCP_SUPPORTED_VERSIONS,
            'requested' => $metaProtocolVersion,
        ], 400);
    }
    if (!isset($meta[SURKOVE_MCP_CLIENT_CAPABILITIES_META])
        || !$meta[SURKOVE_MCP_CLIENT_CAPABILITIES_META] instanceof stdClass) {
        surkoveMcpSendRpcError($requestId, -32602, 'Invalid params: client capabilities are required', null, 400);
    }
    if (isset($meta[SURKOVE_MCP_CLIENT_INFO_META])
        && (!$meta[SURKOVE_MCP_CLIENT_INFO_META] instanceof stdClass
            || !is_string($meta[SURKOVE_MCP_CLIENT_INFO_META]->name ?? null)
            || !is_string($meta[SURKOVE_MCP_CLIENT_INFO_META]->version ?? null))) {
        surkoveMcpSendRpcError($requestId, -32602, 'Invalid params: client info is malformed', null, 400);
    }

    $methodHeader = surkoveMcpHeader('Mcp-Method');
    if ($methodHeader === null || !hash_equals($method, $methodHeader)) {
        surkoveMcpSendRpcError($requestId, -32020, 'Header mismatch: Mcp-Method does not match request method', null, 400);
    }

    $nameHeader = surkoveMcpHeader('Mcp-Name');
    if ($method === 'tools/call') {
        $toolName = $params['name'] ?? null;
        if (!is_string($toolName) || $nameHeader === null || !hash_equals($toolName, $nameHeader)) {
            surkoveMcpSendRpcError($requestId, -32020, 'Header mismatch: Mcp-Name does not match request name', null, 400);
        }
    } elseif ($nameHeader !== null) {
        surkoveMcpSendRpcError($requestId, -32020, 'Header mismatch: Mcp-Name is not valid for this method', null, 400);
    }

    $protocolVersion = $metaProtocolVersion;
} else {
    $methodHeader = surkoveMcpHeader('Mcp-Method');
    if ($methodHeader !== null && !hash_equals($method, $methodHeader)) {
        surkoveMcpSendRpcError($requestId, -32020, 'Header mismatch: Mcp-Method does not match request method', null, 400);
    }

    $nameHeader = surkoveMcpHeader('Mcp-Name');
    if ($method === 'tools/call' && $nameHeader !== null
        && (!is_string($params['name'] ?? null) || !hash_equals($params['name'], $nameHeader))) {
        surkoveMcpSendRpcError($requestId, -32020, 'Header mismatch: Mcp-Name does not match request name', null, 400);
    }

    if ($method === 'initialize') {
        $protocolVersion = $params['protocolVersion'] ?? null;
        if (!is_string($protocolVersion) || !in_array($protocolVersion, SURKOVE_MCP_LEGACY_VERSIONS, true)) {
            surkoveMcpSendRpcError($requestId, -32602, 'Unsupported legacy protocol version', [
                'supported' => SURKOVE_MCP_LEGACY_VERSIONS,
            ], 200);
        }
        if ($protocolHeader !== null && !hash_equals($protocolVersion, $protocolHeader)) {
            surkoveMcpSendRpcError($requestId, -32020, 'Header mismatch: protocol version does not match initialize request', null, 400);
        }
        if (!($params['capabilities'] ?? null) instanceof stdClass
            || !($params['clientInfo'] ?? null) instanceof stdClass
            || !is_string($params['clientInfo']->name ?? null)
            || !is_string($params['clientInfo']->version ?? null)) {
            surkoveMcpSendRpcError($requestId, -32602, 'Invalid params: initialize parameters are malformed', null, 200);
        }
    } else {
        $protocolVersion = $protocolHeader ?? '2025-03-26';
        if (!in_array($protocolVersion, SURKOVE_MCP_LEGACY_VERSIONS, true)) {
            surkoveMcpSendRpcError($requestId, -32022, 'Unsupported protocol version', [
                'supported' => SURKOVE_MCP_SUPPORTED_VERSIONS,
                'requested' => $protocolVersion,
            ], 400);
        }
    }
}

if ($method === 'initialize' && !$isModernRequest) {
    surkoveMcpSendJson(200, [
        'jsonrpc' => '2.0',
        'id' => $requestId,
        'result' => [
            'protocolVersion' => $protocolVersion,
            'capabilities' => ['tools' => ['listChanged' => false]],
            'serverInfo' => ['name' => 'Surkove Majordomo Read-only MCP', 'version' => '1.0.0'],
            'instructions' => 'Read-only diagnostics only. No data or files can be changed.',
        ],
    ]);
}

if ($method === 'server/discover' && $isModernRequest) {
    surkoveMcpSendJson(200, [
        'jsonrpc' => '2.0',
        'id' => $requestId,
        'result' => [
            'resultType' => 'complete',
            'ttlMs' => 0,
            'cacheScope' => 'private',
            'supportedVersions' => SURKOVE_MCP_SUPPORTED_VERSIONS,
            'capabilities' => ['tools' => (object) []],
            '_meta' => [SURKOVE_MCP_SERVER_INFO_META => [
                'name' => 'Surkove Majordomo Read-only MCP',
                'version' => '1.0.0',
            ]],
            'instructions' => 'This server exposes exactly three read-only health tools. It cannot change data or files.',
        ],
    ]);
}

if ($method === 'ping' && !$isModernRequest) {
    surkoveMcpSendJson(200, [
        'jsonrpc' => '2.0',
        'id' => $requestId,
        'result' => surkoveMcpCompleteResult($protocolVersion, (object) []),
    ]);
}

if ($method === 'tools/list') {
    $result = surkoveMcpCompleteResult($protocolVersion, [
        'tools' => surkoveMcpToolDefinitions(),
    ]);
    if ($isModernRequest) {
        $result['ttlMs'] = 0;
        $result['cacheScope'] = 'private';
    }

    surkoveMcpSendJson(200, [
        'jsonrpc' => '2.0',
        'id' => $requestId,
        'result' => $result,
    ]);
}

if ($method === 'tools/call') {
    $toolName = $params['name'] ?? null;
    $arguments = $params['arguments'] ?? (object) [];
    if (!is_string($toolName) || !$arguments instanceof stdClass
        || get_object_vars($arguments) !== []) {
        surkoveMcpSendRpcError($requestId, -32602, 'Invalid params: tools accept no arguments', null, 200);
    }

    $toolNames = array_column(surkoveMcpToolDefinitions(), 'name');
    if (!in_array($toolName, $toolNames, true)) {
        surkoveMcpSendRpcError($requestId, -32602, 'Unknown read-only tool', null, 200);
    }

    try {
        surkoveMcpSendToolResult($protocolVersion, $requestId, surkoveMcpToolPayload($toolName, $config));
    } catch (Throwable) {
        surkoveMcpSendRpcError($requestId, -32603, 'Internal error', null, 500);
    }
}

surkoveMcpSendRpcError($requestId, -32601, 'Method not found', null, $isModernRequest ? 404 : 200);