<?php
declare(strict_types=1);

function assertSameValue(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(
            $message . "\nExpected: " . var_export($expected, true)
            . "\nActual: " . var_export($actual, true)
        );
    }
}

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function startTestServer(string $root, bool $https): array
{
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errorCode, $errorMessage);
    if ($socket === false) {
        throw new RuntimeException("Unable to reserve test port: $errorMessage");
    }
    $address = stream_socket_get_name($socket, false);
    fclose($socket);
    if (!is_string($address)) {
        throw new RuntimeException('Unable to determine test server port');
    }

    $environment = getenv();
    $environment['SURKOVE_TEST_HTTPS'] = $https ? '1' : '0';
    $logPath = $root . '/server-' . ($https ? 'https' : 'http') . '.log';
    $process = proc_open(
        [PHP_BINARY, '-S', $address, '-t', $root . '/public', $root . '/router.php'],
        [
            0 => ['pipe', 'r'],
            1 => ['file', $logPath, 'a'],
            2 => ['file', $logPath, 'a'],
        ],
        $pipes,
        null,
        $environment
    );
    if (!is_resource($process)) {
        throw new RuntimeException('Unable to start PHP test server');
    }
    fclose($pipes[0]);

    $deadline = microtime(true) + 5;
    do {
        $connection = @stream_socket_client('tcp://' . $address, $errorCode, $errorMessage, 0.1);
        if ($connection !== false) {
            fclose($connection);

            return [$process, 'http://' . $address . '/mcp.php'];
        }
        usleep(50000);
    } while (microtime(true) < $deadline);

    proc_terminate($process);
    proc_close($process);
    throw new RuntimeException("PHP test server did not start: $errorMessage");
}

function stopTestServer(mixed $process): void
{
    if (is_resource($process)) {
        proc_terminate($process);
        proc_close($process);
    }
}

function sendRequest(string $url, array $payload, array $headers = [], bool $authorize = true): array
{
    $headers = array_merge(['Content-Type: application/json'], $headers);
    if ($authorize) {
        $headers[] = 'Authorization: Bearer ' . str_repeat('a', 64);
    }
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => json_encode($payload, JSON_THROW_ON_ERROR),
            'ignore_errors' => true,
            'timeout' => 3,
        ],
    ]);
    $body = file_get_contents($url, false, $context);
    if ($body === false) {
        throw new RuntimeException('Request to test server failed');
    }
    $status = 0;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('/\AHTTP\/\S+ (\d{3})/', $header, $match)) {
            $status = (int) $match[1];
        }
    }

    return [$status, json_decode($body, true, 32, JSON_THROW_ON_ERROR)];
}

function modernHeaders(string $method, ?string $tool = null): array
{
    $headers = [
        'MCP-Protocol-Version: 2026-07-28',
        'Mcp-Method: ' . $method,
    ];
    if ($tool !== null) {
        $headers[] = 'Mcp-Name: ' . $tool;
    }

    return $headers;
}

function modernRequest(string $method, array $params = []): array
{
    $params['_meta'] = [
        'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
        'io.modelcontextprotocol/clientCapabilities' => (object) [],
    ];

    return [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => $method,
        'params' => $params,
    ];
}

function removeTestDirectory(string $path): void
{
    if (!is_dir($path)) {
        return;
    }
    foreach (new DirectoryIterator($path) as $entry) {
        if ($entry->isDot()) {
            continue;
        }
        $entryPath = $entry->getPathname();
        if ($entry->isDir() && !$entry->isLink()) {
            removeTestDirectory($entryPath);
        } else {
            unlink($entryPath);
        }
    }
    rmdir($path);
}

$root = sys_get_temp_dir() . '/surkove-mcp-test-' . bin2hex(random_bytes(8));
$httpProcess = null;
$httpsProcess = null;
$passed = 0;

try {
    mkdir($root . '/public', 0700, true);
    mkdir($root . '/private', 0700);
    copy(__DIR__ . '/../mcp.php', $root . '/public/mcp.php');
    file_put_contents(
        $root . '/private/surkove-mcp.php',
        "<?php return ['token_sha256' => '" . hash('sha256', str_repeat('a', 64)) . "'];\n"
    );
    file_put_contents(
        $root . '/router.php',
        "<?php\nif (getenv('SURKOVE_TEST_HTTPS') === '1') { \$_SERVER['HTTPS'] = 'on'; }\n"
        . "require __DIR__ . '/public/mcp.php';\n"
    );

    [$httpProcess, $httpUrl] = startTestServer($root, false);
    [$status, $response] = sendRequest($httpUrl, ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'ping'], [
        'X-Forwarded-Proto: https',
    ], false);
    assertSameValue(403, $status, 'Plain HTTP must be rejected before bearer-token authorization');
    assertSameValue('HTTPS is required', $response['error'] ?? null, 'HTTP rejection must identify HTTPS requirement');
    $passed++;
    stopTestServer($httpProcess);
    $httpProcess = null;

    [$httpsProcess, $httpsUrl] = startTestServer($root, true);
    [$status, $response] = sendRequest(
        $httpsUrl,
        modernRequest('server/discover'),
        modernHeaders('server/discover')
    );
    assertSameValue(200, $status, 'Modern server/discover should succeed');
    assertSameValue(0, $response['result']['ttlMs'] ?? null, 'Discovery ttlMs should be zero');
    assertSameValue('private', $response['result']['cacheScope'] ?? null, 'Discovery cacheScope should be private');
    assertSameValue(['2026-07-28'], $response['result']['supportedVersions'] ?? null, 'Discovery should advertise only the modern protocol');
    $passed++;

    [$status, $response] = sendRequest(
        $httpsUrl,
        modernRequest('tools/list'),
        modernHeaders('tools/list')
    );
    assertSameValue(200, $status, 'Modern tools/list should succeed');
    assertSameValue(0, $response['result']['ttlMs'] ?? null, 'tools/list ttlMs should be zero');
    assertSameValue('private', $response['result']['cacheScope'] ?? null, 'tools/list cacheScope should be private');
    $toolNames = array_column($response['result']['tools'] ?? [], 'name');
    assertSameValue(['server_health', 'database_health', 'mail_config_status'], $toolNames, 'Only the three read-only tools should be available');
    $passed++;

    [$status, $response] = sendRequest(
        $httpsUrl,
        modernRequest('ping'),
        modernHeaders('ping')
    );
    assertSameValue(404, $status, 'Modern ping should be reported as Method not found');
    assertSameValue(-32601, $response['error']['code'] ?? null, 'Modern ping should return JSON-RPC Method not found');
    $passed++;

    foreach (['2025-11-25', '2025-06-18', '2025-03-26'] as $legacyVersion) {
        [$status, $response] = sendRequest($httpsUrl, [
            'jsonrpc' => '2.0',
            'id' => 2,
            'method' => 'initialize',
            'params' => [
                'protocolVersion' => $legacyVersion,
                'capabilities' => (object) [],
                'clientInfo' => ['name' => 'test', 'version' => '1'],
            ],
        ]);
        assertSameValue(200, $status, "Legacy initialize should remain available for $legacyVersion");
        assertSameValue($legacyVersion, $response['result']['protocolVersion'] ?? null, 'Legacy initialize should echo its version');
        $passed++;
    }

    [$status, $response] = sendRequest($httpsUrl, [
        'jsonrpc' => '2.0',
        'id' => 4,
        'method' => 'tools/list',
    ], ['MCP-Protocol-Version: 2025-11-25']);
    assertSameValue(200, $status, 'Legacy tools/list should remain available');
    assertTrue(!array_key_exists('ttlMs', $response['result'] ?? []), 'Legacy tools/list should not gain a cache ttl');
    assertTrue(!array_key_exists('cacheScope', $response['result'] ?? []), 'Legacy tools/list should not gain a cache scope');
    $passed++;

    [$status, $response] = sendRequest($httpsUrl, [
        'jsonrpc' => '2.0',
        'id' => 3,
        'method' => 'ping',
        'params' => ['_meta' => [
            'io.modelcontextprotocol/protocolVersion' => '2025-11-25',
        ]],
    ], ['MCP-Protocol-Version: 2025-11-25']);
    assertSameValue(200, $status, 'Legacy ping should remain available');
    assertTrue(isset($response['result']), 'Legacy ping should return a result');
    $passed++;

    [$status, $response] = sendRequest($httpsUrl, modernRequest('tools/call', [
        'name' => 'database_health',
        'arguments' => ['query' => 'SELECT * FROM private_data'],
    ]), modernHeaders('tools/call', 'database_health'));
    assertSameValue(-32602, $response['error']['code'] ?? null, 'SQL arguments must be rejected');
    $passed++;

    foreach (['execute_sql', 'read_file'] as $unsupportedTool) {
        [$status, $response] = sendRequest($httpsUrl, modernRequest('tools/call', [
            'name' => $unsupportedTool,
            'arguments' => (object) [],
        ]), modernHeaders('tools/call', $unsupportedTool));
        assertSameValue(-32602, $response['error']['code'] ?? null, "$unsupportedTool must not be available");
        assertSameValue('Unknown read-only tool', $response['error']['message'] ?? null, "$unsupportedTool must be rejected");
        $passed++;
    }
} finally {
    stopTestServer($httpProcess);
    stopTestServer($httpsProcess);
    removeTestDirectory($root);
}

echo "Passed $passed MCP integration checks.\n";
