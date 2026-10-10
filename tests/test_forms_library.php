<?php
/** Form library: every bundled PDF is reachable by code, and the lookup cannot be steered outside assets/forms. */
require_once __DIR__ . '/../forms-library.php';

$failed = 0;
function check(bool $ok, string $name): void { global $failed; echo ($ok ? '  [PASS] ' : '  [FAIL] ') . $name . "\n"; if (!$ok) $failed++; }

$data = file_get_contents(__DIR__ . '/../center-empty-state-build/forms-data.js');
preg_match_all('/\["([A-HU]\d{2,3})",/', $data, $m);
check(count($m[1]) === 100, 'catalog lists 100 forms');
$bad = array_filter($m[1], fn($id) => !($p = formsLibraryFind($id)) || file_get_contents($p, false, null, 0, 5) !== '%PDF-');
check(!$bad, 'every catalog code resolves to a real PDF');
check(count(glob(FORMS_LIBRARY_DIR . '/*.pdf')) === 100, 'assets/forms holds exactly the 100 PDFs');
foreach (['../router', 'A01/../../x', 'A1', 'Z01', 'A01_', 'a01', 'A01%00', '', 'A0001', '..', 'U03', 'A01_Verificacion_de_identidad_KYC'] as $evil) {
    check(formsLibraryFind($evil) === null, 'rejects ' . json_encode($evil));
}
echo $failed ? "\n$failed FAILED\n" : "\nAll passed\n";
exit($failed ? 1 : 0);
