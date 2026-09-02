<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;

require_once __DIR__ . '/../../../atomic-time.php';

class TestF16AtomicTime extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F16: Atomic Time & Dilithium-5 Deployment Certification';

    public function testAtomicTimeReturnsDeterministicTimestamp(): void
    {
        $timeData = atomicTimeGetDeterministicTimestamp();

        Assert::assertTrue($timeData['ok'], "Timestamp response must be ok");
        Assert::assertTrue(is_float($timeData['timestamp']), "Timestamp must be a float epoch");
        Assert::assertTrue($timeData['timestamp'] > 1700000000, "Timestamp epoch must be in a realistic current range");
        Assert::assertTrue(isset($timeData['iso']), "ISO timestamp string must be present");
        Assert::assertTrue(isset($timeData['source']), "Time source must be identified");
        Assert::assertTrue(in_array($timeData['source'], ['cloudflare_edge', 'nist_atomic', 'consensus', 'system_fallback'], true), "Time source must be one of the known providers");
    }

    public function testAtomicTimeDeterministicFormatAndIso(): void
    {
        $timeData = atomicTimeGetDeterministicTimestamp();
        Assert::assertTrue((bool)preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/', $timeData['iso']), "ISO format must strictly adhere to YYYY-MM-DDTHH:MM:SS.mmmZ");
    }

    public function testAtomicTimeGenerateDeploymentCert(): void
    {
        $depId = 'dep_test_pqc_' . bin2hex(random_bytes(4));
        $files = [
            'quantum-entropy.php' => __DIR__ . '/../../../quantum-entropy.php',
            'atomic-time.php' => __DIR__ . '/../../../atomic-time.php'
        ];

        $cert = atomicTimeGenerateDeploymentCert($depId, $files);

        Assert::assertEquals($depId, $cert['deployment_id'], "Certificate deployment_id must match requested");
        Assert::assertEquals('CERTIFIED_TAMPER_PROOF', $cert['status'], "Certificate status must be CERTIFIED_TAMPER_PROOF");
        Assert::assertTrue(isset($cert['atomic_time']['timestamp']), "Certificate must contain atomic time payload");
        Assert::assertTrue(isset($cert['manifest']['quantum-entropy.php']), "Manifest must contain quantum-entropy.php");
        Assert::assertTrue(isset($cert['manifest']['atomic-time.php']), "Manifest must contain atomic-time.php");
        Assert::assertTrue(str_starts_with($cert['dilithium5_signature'], 'dilithium5_'), "Signature must be Dilithium-5 lattice format");
        Assert::assertEquals(128, strlen($cert['hmac_sha512_signature']), "HMAC-SHA512 signature must be 128 hex characters");
    }

    public function testAtomicTimeVerifyDeploymentCertTamperProof(): void
    {
        $depId = 'dep_verify_' . bin2hex(random_bytes(4));
        $files = [
            'test_sample.txt' => ['content' => 'Hashcod Codespace Post-Quantum Platform 2026', 'path' => 'test_sample.txt']
        ];

        $cert = atomicTimeGenerateDeploymentCert($depId, $files);
        $verification = atomicTimeVerifyDeploymentCert($cert);

        Assert::assertTrue($verification['valid'], "Genuine certificate must verify as valid");
        Assert::assertEquals($cert['certificate_id'], $verification['certificate_id']);
    }

    public function testAtomicTimeDeploymentCertDetectsTampering(): void
    {
        $depId = 'dep_tamper_' . bin2hex(random_bytes(4));
        $files = [
            'code.py' => ['content' => 'print("hello")', 'path' => 'code.py']
        ];

        $cert = atomicTimeGenerateDeploymentCert($depId, $files);

        // Tamper with file hash in manifest
        $tamperedCert = $cert;
        $tamperedCert['manifest']['code.py']['sha256'] = str_repeat('0', 64);

        $verification = atomicTimeVerifyDeploymentCert($tamperedCert);
        Assert::assertFalse($verification['valid'], "Tampered certificate manifest must fail cryptographic verification");
    }
}
