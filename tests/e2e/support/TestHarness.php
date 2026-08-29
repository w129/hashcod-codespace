<?php
declare(strict_types=1);

namespace Hashcod\Tests\Support;

class TestHarness
{
    private static ?string $sandboxDir = null;
    private static array $originalServer = [];
    private static array $originalEnv = [];
    private static array $mockHeaders = [];
    private static int $mockStatusCode = 200;

    public static function setUpSandbox(): string
    {
        if (self::$sandboxDir === null) {
            $base = sys_get_temp_dir() . '/hashcod_e2e_sandbox_' . bin2hex(random_bytes(6));
            @mkdir($base . '/data_storage/security', 0777, true);
            @mkdir($base . '/data_storage/cache', 0777, true);
            @mkdir($base . '/data_storage/sync_queue', 0777, true);
            @mkdir($base . '/data_storage/auth', 0777, true);
            @mkdir($base . '/data_storage/durable_objects', 0777, true);
            self::$sandboxDir = $base;
        }
        self::$originalServer = $_SERVER;
        self::$originalEnv = $_ENV;
        self::$mockHeaders = [];
        self::$mockStatusCode = 200;
        return self::$sandboxDir;
    }

    public static function tearDownSandbox(): void
    {
        $_SERVER = self::$originalServer;
        $_ENV = self::$originalEnv;
        self::$mockHeaders = [];
        self::$mockStatusCode = 200;
    }

    public static function cleanSandbox(): void
    {
        if (self::$sandboxDir !== null && is_dir(self::$sandboxDir)) {
            self::recursiveRmdir(self::$sandboxDir);
            self::$sandboxDir = null;
        }
    }

    private static function recursiveRmdir(string $dir): void
    {
        if (!is_dir($dir)) return;
        $files = array_diff(scandir($dir) ?: [], ['.', '..']);
        foreach ($files as $file) {
            $path = "$dir/$file";
            is_dir($path) ? self::recursiveRmdir($path) : @unlink($path);
        }
        @rmdir($dir);
    }

    public static function simulateRequest(
        string $method = 'GET',
        string $uri = '/',
        array $headers = [],
        string|array|null $body = null,
        array $serverParams = []
    ): void {
        $_SERVER = self::$originalServer;
        $_SERVER['REQUEST_METHOD'] = strtoupper($method);
        $_SERVER['REQUEST_URI'] = $uri;
        $_SERVER['SCRIPT_NAME'] = '/router.php';
        $_SERVER['PHP_SELF'] = '/router.php';
        $_SERVER['REMOTE_ADDR'] = $serverParams['REMOTE_ADDR'] ?? '127.0.0.1';
        $_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';
        $_SERVER['HTTP_HOST'] = 'localhost';

        foreach ($headers as $k => $v) {
            $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $k));
            $_SERVER[$serverKey] = $v;
            if (strtolower($k) === 'content-type') {
                $_SERVER['CONTENT_TYPE'] = $v;
            }
            if (strtolower($k) === 'content-length') {
                $_SERVER['CONTENT_LENGTH'] = $v;
            }
        }

        foreach ($serverParams as $k => $v) {
            $_SERVER[$k] = $v;
        }

        if (is_array($body)) {
            $_POST = $body;
            $rawJson = json_encode($body);
            $_SERVER['CONTENT_LENGTH'] = (string)strlen($rawJson);
        } elseif (is_string($body)) {
            $_SERVER['CONTENT_LENGTH'] = (string)strlen($body);
        }
    }

    public static function getSandboxDir(): string
    {
        if (self::$sandboxDir === null) {
            return self::setUpSandbox();
        }
        return self::$sandboxDir;
    }
}
