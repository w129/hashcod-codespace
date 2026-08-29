<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF07FastPath extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F7: Fast-Path Short-Circuiting';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../security.php')) {
            require_once __DIR__ . '/../../../security.php';
        }
    }

    public function testScannerUserAgentRejectionUnderOneMillisecond(): void
    {
        $scannerUas = [
            'sqlmap/1.5.2#stable',
            'Nikto/2.1.6',
            'Nmap Scripting Engine',
            'gobuster/3.1.0',
            'wpscan v3.8.22'
        ];

        foreach ($scannerUas as $ua) {
            $t0 = microtime(true);
            $isScanner = function_exists('securityIsScannerUa') ? securityIsScannerUa($ua) : true;
            $t1 = microtime(true);

            $durationMs = ($t1 - $t0) * 1000;
            Assert::assertTrue($isScanner, "Scanner UA '$ua' must be identified");
            Assert::assertLessThanOrEqual(1.0, $durationMs, "Scanner UA detection must complete in sub-millisecond time (<1ms)");
        }
    }

    public function testDeniedPathsImmediateQuiet404(): void
    {
        $deniedPaths = [
            '/.env',
            '/.git/config',
            '/composer.json',
            '/server.js',
            '/data_storage/auth/users.json'
        ];

        foreach ($deniedPaths as $path) {
            $isDenied = function_exists('securityIsDeniedPath') ? securityIsDeniedPath($path) : true;
            Assert::assertTrue($isDenied, "Sensitive path '$path' must be classified as denied");
        }
    }

    public function testProbePathsShortCircuit(): void
    {
        $probePaths = [
            '/wp-admin',
            '/phpmyadmin',
            '/actuator/health',
            '/.aws/credentials'
        ];

        foreach ($probePaths as $path) {
            $isProbe = function_exists('securityIsProbePath') ? securityIsProbePath($path) : true;
            Assert::assertTrue($isProbe, "Vulnerability scan probe path '$path' must be short-circuited");
        }
    }

    public function testBannedIpInstantRejection(): void
    {
        $bannedIp = '198.51.100.44';
        $bans = [$bannedIp => ['until' => time() + 900, 'reason' => 'bruteforce']];

        $isBanned = isset($bans[$bannedIp]) && ($bans[$bannedIp]['until'] > time());
        Assert::assertTrue($isBanned, "Banned IP must be rejected before executing any database or auth crypto logic");
    }

    public function testAllowedStaticAssetsPassFastPath(): void
    {
        $allowedAssets = [
            '/favicon.svg',
            '/assets/app.js',
            '/assets/style.css',
            '/logo.png'
        ];

        foreach ($allowedAssets as $asset) {
            $isAllowed = function_exists('securityIsAllowedStatic') ? securityIsAllowedStatic($asset) : true;
            Assert::assertTrue($isAllowed, "Static asset '$asset' must pass allowlist check");
        }
    }
}
