<?php
require dirname(__DIR__, 2) . '/admin-device.php';
$count = 0;
function check($value, $name) { global $count; if (!$value) throw new RuntimeException('FAIL: ' . $name); $count++; }

putenv('RENDER=true');
$edge = ['REMOTE_ADDR'=>'127.0.0.1', 'HTTP_X_L8_RENDER_CF_IP'=>'38.196.115.73'];
check(adminClientIp($edge) === '38.196.115.73', 'Render client IP');
check(adminClientIp(['REMOTE_ADDR'=>'127.0.0.1', 'HTTP_X_FORWARDED_FOR'=>'38.196.115.73']) === '', 'ordinary XFF ignored');
check(adminClientIp(array_replace($edge, ['REMOTE_ADDR'=>'192.0.2.1'])) === '', 'direct headers ignored');
check(adminClientIp(array_replace($edge, ['HTTP_X_FORWARDED_FOR'=>'192.0.2.1, 38.196.115.184'])) === '38.196.115.73', 'forged XFF ignored');
check(adminClientIp(array_replace($edge, ['HTTP_X_L8_RENDER_CF_IP'=>'192.0.2.1, 38.196.115.73'])) === '', 'CF header must contain one address');
check(adminClientIp(['REMOTE_ADDR'=>'127.0.0.1','HTTP_X_L8_RENDER_XFF'=>'38.196.115.73']) === '', 'legacy proxy header cannot authorize');
check(adminClientIp(['REMOTE_ADDR'=>'127.0.0.1','HTTP_CF_CONNECTING_IP'=>'38.196.115.73']) === '', 'raw CF header cannot authorize');
putenv('RENDER=false'); check(adminClientIp($edge) === '', 'unconfigured deployment denied'); putenv('RENDER=true');
check(!adminSameOrigin(['HTTP_HOST'=>ADMIN_DEVICE_RP, 'HTTP_ORIGIN'=>'https://evil.example']), 'foreign origin denied');
check(adminSameOrigin(['HTTP_HOST'=>ADMIN_DEVICE_RP, 'HTTP_ORIGIN'=>ADMIN_DEVICE_ORIGIN]), 'same origin accepted');

foreach (['/api/admin/dilithium-verify','/api/auth/dilithium-active-key','/api/auth/list-accounts','/api/auth/suspend-account','/api/auth/reactivate-account','/api/auth/delete-account','/api/auth/delete'] as $path) check(adminProtectedPath($path), $path);
foreach (['/api/auth/login','/api/auth/register','/api/auth/recover','/api/auth/session'] as $path) check(!adminProtectedPath($path), 'user path remains public: ' . $path);

$code = "import base64\nHASHCOD_ACCESS = \"ADMIN\"\nprint(HASHCOD_ACCESS)";
$codekey1 = 'CODEKEY1:' . hash('sha256', $code);
$sourceLines = array_map(static fn(string $line): string => $line . "\n", explode("\n", $code));
$canonical = [
    'nbformat'=>4,
    'nbformat_minor'=>5,
    'cells'=>[[
        'cell_type'=>'code',
        'metadata'=>['hashcod_codekey'=>true],
        'source'=>$sourceLines
    ]]
];
$jupyter1 = 'JUPYTER1:' . hash('sha256', adminCanonicalJson($canonical));
$hashcod1 = 'HASHCOD1:' . hash('sha256', ADMIN_CODEKEY_SCHEME . '|' . $codekey1 . '|' . $jupyter1);
$filename = 'test-admin-codekey.ipynb';
putenv('HASHCOD_ADMIN_CODEKEY_FILENAME=' . $filename);
putenv('HASHCOD_ADMIN_CODEKEY_CODEKEY1=' . $codekey1);
putenv('HASHCOD_ADMIN_CODEKEY_JUPYTER1=' . $jupyter1);
putenv('HASHCOD_ADMIN_CODEKEY_HASHCOD1=' . $hashcod1);

$notebook = [
    'nbformat'=>4,
    'nbformat_minor'=>5,
    'metadata'=>[
        'hashcod'=>[
            'format'=>ADMIN_CODEKEY_FORMAT,
            'fingerprint_scheme'=>ADMIN_CODEKEY_SCHEME,
            'access'=>'ADMIN',
            'scope'=>'PRIVATE',
            'version'=>'1',
            'codekey_fingerprint'=>$codekey1,
            'jupyter_fingerprint'=>$jupyter1,
            'combined_fingerprint'=>$hashcod1
        ]
    ],
    'cells'=>[[
        'cell_type'=>'code',
        'execution_count'=>null,
        'metadata'=>['hashcod_codekey'=>true],
        'outputs'=>[],
        'source'=>$sourceLines
    ]]
];

$config = adminCodeKeyConfig();
check(is_array($config) && $config['filename'] === $filename, 'CodeKey configuration loads from server secrets');
$fingerprints = adminNotebookFingerprints($notebook);
check($fingerprints['codekey1'] === $codekey1, 'CODEKEY1 recomputed from exact code');
check($fingerprints['jupyter1'] === $jupyter1, 'JUPYTER1 recomputed from canonical notebook');
check($fingerprints['hashcod1'] === $hashcod1, 'HASHCOD1 binds both fingerprints');
check(adminVerifyCodeKeyNotebook($filename, $notebook), 'authorized CodeKey notebook accepted');
check(!adminVerifyCodeKeyNotebook('wrong.ipynb', $notebook), 'wrong filename rejected');

$tampered = $notebook;
$tampered['cells'][0]['source'][0] = "import os\n";
check(!adminVerifyCodeKeyNotebook($filename, $tampered), 'tampered code rejected');
$tampered = $notebook;
$tampered['metadata']['hashcod']['combined_fingerprint'] = 'HASHCOD1:' . str_repeat('0', 64);
check(!adminVerifyCodeKeyNotebook($filename, $tampered), 'tampered metadata fingerprint rejected');
$tampered = $notebook;
$tampered['cells'][] = $tampered['cells'][0];
check(!adminVerifyCodeKeyNotebook($filename, $tampered), 'multiple marked CodeKey cells rejected');

$_SERVER = array_merge($edge, ['HTTP_HOST'=>ADMIN_DEVICE_RP,'HTTP_ORIGIN'=>ADMIN_DEVICE_ORIGIN,'REQUEST_METHOD'=>'POST']);
check(!adminAuthorized(), 'missing server session denied');
adminSession();
$_SESSION['admin_until'] = time() + 600;
$_SESSION['admin_network'] = ADMIN_DEVICE_NETWORK;
$_SESSION['admin_credential'] = adminCredentialFingerprint();
check(adminAuthorized(), 'verified CodeKey session accepted');
$_SERVER['HTTP_X_L8_RENDER_CF_IP'] = '38.196.115.161';
check(adminAuthorized(), 'verified session survives authorized network rotation');
foreach (['38.196.115.0','38.196.115.73','38.196.115.128','38.196.115.161','38.196.115.255'] as $ip) check(adminIpAllowed($ip), 'allowed network address '.$ip);
foreach (['38.196.114.255','38.196.116.0','138.196.115.73','::ffff:38.196.115.73','38.196.115.073','38.196.115.73.attacker','38.196.115.256',''] as $ip) check(!adminIpAllowed($ip), 'outside or malformed address '.$ip);
$_SESSION['admin_network'] = '38.196.115.73';
check(!adminAuthorized(), 'old policy session rejected');
$_SESSION['admin_network'] = ADMIN_DEVICE_NETWORK;
$_SERVER['HTTP_X_L8_RENDER_CF_IP'] = '192.0.2.1';
check(!adminAuthorized(), 'session rejected after IP change');
$_SERVER['HTTP_X_L8_RENDER_CF_IP'] = '38.196.115.73';
$_SESSION['admin_until'] = time() - 1;
check(!adminAuthorized(), 'expired session rejected');
$_SESSION['admin_until'] = time() + 600;
$_SESSION['admin_credential'] = 'client-side-flag';
check(!adminAuthorized(), 'wrong CodeKey credential rejected');
$_SESSION = [];
session_destroy();

echo "PASS: $count checks\n";
