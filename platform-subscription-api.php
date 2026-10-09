<?php
declare(strict_types=1);
define('HCS_LIBRARY_ONLY', true);
require_once __DIR__.'/hashcod-shared-cloud.php';
require_once __DIR__.'/tokenization-lib.php';
platformPeriodGuard();
securityBootstrap('api');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') hcsJson(['ok'=>false,'error'=>'Method not allowed.'],405);
if (!mldsaOriginAllowed() || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') hcsJson(['ok'=>false,'error'=>'Same-origin request required.'],403);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0)>16384) hcsJson(['ok'=>false,'error'=>'Request too large.'],413);
$raw=file_get_contents('php://input',false,null,0,16385);
$body=is_string($raw) && strlen($raw)<=16384 ? json_decode($raw,true) : null;
if (!is_array($body)) hcsJson(['ok'=>false,'error'=>'Invalid request.'],400);
$token=(string)(platformPeriodData()['token'] ?? '');
if (($body['action'] ?? '')==='auth') {
    $response=hcsCall('tokenization.auth',['token'=>$token,'key'=>is_string($body['key'] ?? null)?$body['key']:'']);
    $data=json_decode($response['raw'],true);
    if (!is_array($data)) hcsJson(['ok'=>false,'error'=>'Servicio no disponible.'],503);
    if (!empty($data['ok']) && is_string($data['adminTicket'] ?? null) && strlen($data['adminTicket'])<=4096 && is_int($data['expiresAt'] ?? null)) {
        mldsaCookie('hashcod_tokenization_admin_v1',mldsaSeal(['kind'=>'tokenization-admin-v1','host'=>mldsaHost(),'ticket'=>$data['adminTicket'],'expiresAt'=>$data['expiresAt']]),$data['expiresAt']);
    }
    unset($data['adminTicket']); hcsJson($data,$response['status']);
}
if (($body['action'] ?? '')!=='issue' || ($body['confirmedPayment'] ?? null)!==true) hcsJson(['ok'=>false,'error'=>'Confirma el pago recibido antes de emitir el código.'],400);
$ticket=tokenizationAdminTicket();
if ($ticket==='') hcsJson(['ok'=>false,'error'=>'Se requiere acceso administrativo.'],403);
$result=hcsCall('subscription.issue',['token'=>$token,'adminTicket'=>$ticket,
    'reference'=>is_string($body['reference'] ?? null)?$body['reference']:'','plan'=>is_string($body['plan'] ?? null)?$body['plan']:'']);
hcsForwardResponse($result);
