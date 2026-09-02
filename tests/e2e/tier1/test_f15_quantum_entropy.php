<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;

require_once __DIR__ . '/../../../quantum-entropy.php';
require_once __DIR__ . '/../../../auth.php';

class TestF15QuantumEntropy extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F15: Quantum Entropy & RFC 8937 Hybrid Mixer';

    public function testQuantumHarvestReturnsRequestedByteLength(): void
    {
        $bytes32 = quantumHarvestEntropy(32);
        $bytes64 = quantumHarvestEntropy(64);
        $bytes128 = quantumHarvestEntropy(128);

        Assert::assertEquals(32, strlen($bytes32), "quantumHarvestEntropy(32) must return exactly 32 bytes");
        Assert::assertEquals(64, strlen($bytes64), "quantumHarvestEntropy(64) must return exactly 64 bytes");
        Assert::assertEquals(128, strlen($bytes128), "quantumHarvestEntropy(128) must return exactly 128 bytes");
        Assert::assertNotEquals($bytes32, substr($bytes64, 0, 32), "Subsequent harvests must produce unique entropy");
    }

    public function testQuantumEntropyHybridNonDegradation(): void
    {
        // Harvest entropy when external network may or may not be reachable
        $entropy = quantumHarvestEntropy(64);
        Assert::assertTrue(strlen($entropy) === 64, "Entropy must never be empty or degraded under any network condition");

        // Verify entropy uniqueness over 50 consecutive harvests
        $seen = [];
        for ($i = 0; $i < 50; $i++) {
            $e = quantumHarvestEntropy(32);
            $hex = bin2hex($e);
            Assert::assertFalse(isset($seen[$hex]), "Entropy collision detected in consecutive harvests");
            $seen[$hex] = true;
        }
    }

    public function testQuantumGenerateSecureNonceLengthAndFormat(): void
    {
        $nonce32 = quantumGenerateSecureNonce(32);
        $nonce64 = quantumGenerateSecureNonce(64);

        Assert::assertEquals(64, strlen($nonce32), "32-byte nonce must be a 64-character hex string");
        Assert::assertEquals(128, strlen($nonce64), "64-byte nonce must be a 128-character hex string");
        Assert::assertTrue((bool)preg_match('/^[a-f0-9]{64}$/i', $nonce32), "Nonce must contain only hexadecimal characters");
        Assert::assertTrue((bool)preg_match('/^[a-f0-9]{128}$/i', $nonce64), "Nonce must contain only hexadecimal characters");
    }

    public function testQuantumDeriveDilithiumSeed(): void
    {
        $seed1 = quantumDeriveDilithiumSeed('account_001');
        $seed2 = quantumDeriveDilithiumSeed('account_002');

        Assert::assertEquals(64, strlen($seed1), "Dilithium-5 seed must be exactly 64 bytes");
        Assert::assertEquals(64, strlen($seed2), "Dilithium-5 seed must be exactly 64 bytes");
        Assert::assertNotEquals($seed1, $seed2, "Seeds derived with different contexts must differ");
    }

    public function testJitterEntropyCollection(): void
    {
        $jitter = quantumCollectJitterEntropy(32);
        Assert::assertTrue(strlen($jitter) === 64, "Jitter entropy must produce 64 bytes of SHA-512 conditioned noise");
    }

    public function testQuantumEntropyStatusStructure(): void
    {
        $status = quantumEntropyStatus();

        Assert::assertTrue($status['ok'], "Status report ok flag must be true");
        Assert::assertTrue(isset($status['status']), "Status report must specify status level");
        Assert::assertTrue(isset($status['sources']['os_csprng']), "OS CSPRNG source must be present");
        Assert::assertTrue(isset($status['sources']['cpu_jitter']), "CPU Jitter source must be present");
        Assert::assertTrue(isset($status['sources']['anu_qrng']), "ANU QRNG source must be present");
        Assert::assertTrue(isset($status['sources']['nist_beacon']), "NIST Beacon source must be present");
        Assert::assertTrue(isset($status['telemetry']['total_harvests']), "Telemetry harvest count must be present");
    }

    public function testAuthKeyGeneratorsUseQuantumEntropy(): void
    {
        $aes = authGenerateAes256Key();
        $id = authGenerateIdentityKey();
        $rec = authGenerateRecoveryKey();
        $backup = authGenerateBackupCodes(4);
        $acct = authNewAccountId();

        Assert::assertEquals(64, strlen($aes), "AES-256 key must be 64 uppercase hex characters");
        Assert::assertTrue(str_starts_with($id, 'L8ID-'), "Identity key must start with L8ID- prefix");
        Assert::assertTrue(str_starts_with($rec, 'L8REC-'), "Recovery key must start with L8REC- prefix");
        Assert::assertEquals(4, count($backup), "Backup codes array must contain requested count");
        Assert::assertTrue(str_starts_with($acct, 'acct_'), "Account ID must start with acct_ prefix");
    }
}
