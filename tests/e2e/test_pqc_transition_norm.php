<?php
declare(strict_types=1);

require_once __DIR__ . '/../../pqc-actions-lib.php';

function expect_true(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: " . $message . PHP_EOL);
        exit(1);
    }
}

$previous = str_repeat('0', 128);
$event = '{"event":"alpha","seq":1}';
$eventId = 'event:12345678';

$a = pqaEuclideanTransition($previous, $event, 1, $eventId);
$b = pqaEuclideanTransition($previous, $event, 1, $eventId);
$c = pqaEuclideanTransition($previous, $event, 2, $eventId);
$d = pqaEuclideanTransition(str_repeat('a', 128), $event, 1, $eventId);

expect_true($a === $b, 'same transit must reproduce the same Euclidean transition factor');
expect_true($a !== $c, 'changing sequence must change the Euclidean transition factor');
expect_true($a !== $d, 'changing previous chain hash must change the Euclidean transition factor');
expect_true(($a['scheme'] ?? '') === 'EUCLIDEAN-NORM-V1', 'scheme marker missing');
expect_true(($a['formula'] ?? '') === '||x||_2=sqrt(x1^2+...+xn^2)', 'Euclidean norm formula marker missing');
expect_true((int)($a['dimension'] ?? 0) === 8, 'transition vector must have dimension 8');
expect_true((int)($a['norm_scaled_1e6'] ?? 0) > 0, 'fixed-point Euclidean norm must be positive');
expect_true((int)($a['transit_scalar'] ?? 0) >= 1 && (int)$a['transit_scalar'] <= 65536, 'transit scalar out of range');
expect_true((float)($a['transition_product'] ?? 0) > 0, 'transition product must be positive');
expect_true((bool)preg_match('/^[a-f0-9]{64}$/', (string)($a['vector_commitment_sha256'] ?? '')), 'vector commitment must be SHA-256 hex');

$canonical = pqaCanonicalTransition($a);
expect_true(str_contains($canonical, 'transition_product'), 'canonical transition must bind multiplication product');
expect_true(str_contains($canonical, 'norm_scaled_1e6'), 'canonical transition must bind Euclidean norm');

echo "PASS: Euclidean transition norm is deterministic per transit and changes across transitions\n";
