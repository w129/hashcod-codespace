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
foreach ([
    '/api/admin/dilithium-verify',
    '/api/auth/dilithium-active-key',
    '/api/auth/list-accounts',
    '/api/auth/suspend-account',
    '/api/auth/reactivate-account',
    '/api/auth/delete-account',
    '/api/auth/delete',
    '/api/bash/exec',
    '/api/bash/workspace',
    '/api/bash/workspace/connect',
    '/api/bash/workspace/set-path',
    '/api/catalyst/status',
    '/api/catalyst/logs',
    '/api/catalyst/execute',
    '/api/storage/pools',
    '/api/storage/fileshares',
    '/api/django/status'
] as $path) check(adminProtectedPath($path), $path);
foreach (['/api/auth/login','/api/auth/register','/api/auth/recover','/api/auth/session'] as $path) check(!adminProtectedPath($path), 'user path remains public: ' . $path);
$key = openssl_pkey_new(['private_key_type'=>OPENSSL_KEYTYPE_EC, 'curve_name'=>'prime256v1']);
$details = openssl_pkey_get_details($key);
$spki = adminB64(base64_decode(preg_replace('/-----[^-]+-----|\s/', '', $details['key'])));
$challenge = adminB64(random_bytes(32));
$client = ['type'=>'webauthn.get','challenge'=>$challenge,'origin'=>ADMIN_DEVICE_ORIGIN,'crossOrigin'=>false];
function assertion($key, $client, $flags = 5, $rp = ADMIN_DEVICE_RP) {
    $bytes = json_encode($client);
    $auth = hash('sha256', $rp, true) . chr($flags) . pack('N', 1);
    openssl_sign($auth . hash('sha256', $bytes, true), $sig, $key, OPENSSL_ALGO_SHA256);
    return ['id'=>'test-id','type'=>'public-key','clientDataJSON'=>adminB64($bytes),'authenticatorData'=>adminB64($auth),'signature'=>adminB64($sig)];
}
$valid = assertion($key, $client);
check(adminVerifyAssertion($valid, $challenge, 'test-id', $spki), 'valid ES256 assertion');
check(!adminVerifyAssertion($valid, adminB64(random_bytes(32)), 'test-id', $spki), 'wrong/replayed challenge');
check(!adminVerifyAssertion($valid, $challenge), 'different laptop cannot authenticate');
foreach ([1,4,13,21,29,69] as $flags) check(!adminVerifyAssertion(assertion($key,$client,$flags),$challenge,'test-id',$spki), 'invalid flags '.$flags);
check(!adminVerifyAssertion(assertion($key,$client,5,'evil.example'),$challenge,'test-id',$spki), 'wrong RP');
foreach ([['origin'=>'https://evil.example'],['type'=>'webauthn.create'],['crossOrigin'=>true],['topOrigin'=>ADMIN_DEVICE_ORIGIN]] as $change) check(!adminVerifyAssertion(assertion($key,array_replace($client,$change)),$challenge,'test-id',$spki), 'client data mismatch');
$bad = $valid; $bad['signature'] = adminB64(random_bytes(72));
check(!adminVerifyAssertion($bad,$challenge,'test-id',$spki), 'forged signature');
$bad = $valid; $bad['authenticatorData'] = adminB64('short');
check(!adminVerifyAssertion($bad,$challenge,'test-id',$spki), 'truncated auth data');
check(strlen(adminUnb64(ADMIN_DEVICE_ID)) === 32, 'enrolled credential ID');
$pinned = openssl_pkey_get_public("-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode(adminUnb64(ADMIN_DEVICE_SPKI)),64,"\n") . "-----END PUBLIC KEY-----\n");
check($pinned !== false && openssl_pkey_get_details($pinned)['type'] === OPENSSL_KEYTYPE_EC, 'enrolled public key valid');
$_SERVER = array_merge($edge, ['HTTP_HOST'=>ADMIN_DEVICE_RP,'HTTP_ORIGIN'=>ADMIN_DEVICE_ORIGIN,'REQUEST_METHOD'=>'POST']);
check(!adminAuthorized(), 'missing server session denied');
$_SESSION['admin_until'] = time() + 600;
$_SESSION['admin_network'] = ADMIN_DEVICE_NETWORK;
$_SESSION['admin_credential'] = hash('sha256', ADMIN_DEVICE_ID . ADMIN_DEVICE_SPKI);
check(adminAuthorized(), 'verified session accepted');
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
check(!adminAuthorized(), 'wrong enrolled credential rejected');
$_SESSION = []; session_destroy();
echo "PASS: $count checks\n";
