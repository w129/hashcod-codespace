<?php
declare(strict_types=1);

require_once __DIR__ . '/supabase.php';

const HASHCOD_LEGACY_REGISTRATION_TABLE = 'hashcod_platform_registrations';
const HASHCOD_LEGACY_REGISTRATION_BUCKET = 'hashcod-registration-code';

function hcrcLog(string $message): void {
    fwrite(STDOUT, '[registration-cleanup] ' . $message . PHP_EOL);
}

$cfg = supabaseConfig(true);
if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
    hcrcLog('Supabase secret credentials unavailable; cleanup skipped.');
    exit(0);
}

// Delete all physical objects through the official Storage API. Never delete
// storage.objects rows directly because that would orphan the underlying files.
$empty = supabaseRequest(
    'storage/v1/bucket/' . rawurlencode(HASHCOD_LEGACY_REGISTRATION_BUCKET) . '/empty',
    [
        'method' => 'POST',
        'use_secret' => true,
        'bypass_circuit' => true,
        'body' => new stdClass(),
        'timeout' => 120,
    ]
);

if (!empty($empty['ok'])) {
    hcrcLog('Legacy registration bucket emptied.');
} elseif ((int)($empty['status'] ?? 0) === 404) {
    hcrcLog('Legacy registration bucket already absent.');
} else {
    hcrcLog('Bucket empty request returned status ' . (int)($empty['status'] ?? 0) . '.');
}

// Delete all legacy request rows through PostgREST. If the table was already
// dropped by the database migration, a 404/42P01 response is treated as done.
$rows = supabaseDbHardDelete(HASHCOD_LEGACY_REGISTRATION_TABLE, 'id=not.is.null');
if (!empty($rows['ok'])) {
    hcrcLog('Legacy registration rows deleted.');
} elseif (in_array((int)($rows['status'] ?? 0), [400, 404], true)) {
    hcrcLog('Legacy registration table already absent or unavailable.');
} else {
    hcrcLog('Legacy row cleanup returned status ' . (int)($rows['status'] ?? 0) . '.');
}

// Best-effort bucket deletion after emptying. If Supabase is still processing
// the empty operation, the next container start will retry safely.
$dropBucket = supabaseRequest(
    'storage/v1/bucket/' . rawurlencode(HASHCOD_LEGACY_REGISTRATION_BUCKET),
    [
        'method' => 'DELETE',
        'use_secret' => true,
        'bypass_circuit' => true,
        'timeout' => 30,
    ]
);

if (!empty($dropBucket['ok']) || (int)($dropBucket['status'] ?? 0) === 404) {
    hcrcLog('Legacy registration bucket deleted or already absent.');
} else {
    hcrcLog('Bucket deletion will be retried on the next start.');
}
