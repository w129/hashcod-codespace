<?php
declare(strict_types=1);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/hashcod-workspace-access.php';

const HCWIV_MAX_BYTES = 15728640;
const HCWIV_META_VAULT = 'hashcod-image-vault';

function hcwivJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
function hcwivWorkspace(): string {
    if (!hashcodWorkspaceAccessAuthorized()) hcwivJson(['ok'=>false,'error'=>'Workspace authorization required.'],401);
    $key=hashcodWorkspaceKey();
    if ($key==='') hcwivJson(['ok'=>false,'error'=>'Workspace unavailable.'],401);
    return $key;
}
function hcwivClientId(string $id): string {
    $id=trim($id);
    if (!preg_match('/^[A-Za-z0-9_-]{8,96}$/D',$id)) hcwivJson(['ok'=>false,'error'=>'Invalid image id.'],400);
    return $id;
}
function hcwivDbId(string $workspace,string $clientId): string {
    return 'iv_' . substr(hash('sha256',$workspace.'|'.$clientId),0,52);
}
function hcwivObject(string $workspace,string $clientId): string {
    return 'workspace-image-vault/' . $workspace . '/' . rawurlencode($clientId) . '.png';
}
function hcwivMetaArray($meta): array {
    if (is_array($meta)) return $meta;
    if (is_string($meta)) {
        $decoded=json_decode($meta,true);
        if (is_array($decoded)) return $decoded;
    }
    return [];
}
function hcwivRows(string $workspace): array {
    $query='select=id,filename,mime_type,size_bytes,hash,supabase_object,meta,upload_date'
        .'&account_key=eq.'.rawurlencode($workspace)
        .'&is_deleted=eq.false&order=upload_date.desc&limit=1000';
    $res=supabaseDbSelect('l8_files',$query);
    if (empty($res['ok']) || !is_array($res['body']??null)) return [];
    $out=[];
    foreach ($res['body'] as $row) {
        if (!is_array($row)) continue;
        $meta=hcwivMetaArray($row['meta']??[]);
        if (($meta['vault']??'')!==HCWIV_META_VAULT) continue;
        $clientId=(string)($meta['client_id']??'');
        $codeHash=strtolower((string)($meta['code_hash']??''));
        if (!preg_match('/^[A-Za-z0-9_-]{8,96}$/D',$clientId)) continue;
        if (!preg_match('/^[a-f0-9]{64}$/D',$codeHash)) continue;
        $out[]=[
            'id'=>$clientId,
            'name'=>(string)($row['filename']??'image.png'),
            'type'=>'image/png',
            'size'=>(int)($row['size_bytes']??0),
            'sha256'=>(string)($row['hash']??''),
            'codeHash'=>$codeHash,
            'createdAt'=>(int)($meta['created_at_ms']??0),
            'cloud'=>true,
        ];
    }
    return $out;
}
function hcwivFind(string $workspace,string $clientId): ?array {
    $id=hcwivDbId($workspace,$clientId);
    $query='select=id,filename,mime_type,size_bytes,hash,supabase_object,meta,upload_date'
        .'&id=eq.'.rawurlencode($id)
        .'&account_key=eq.'.rawurlencode($workspace)
        .'&is_deleted=eq.false&limit=1';
    $res=supabaseDbSelect('l8_files',$query);
    if (empty($res['ok']) || !is_array($res['body']??null) || empty($res['body'][0])) return null;
    $row=$res['body'][0];
    $meta=hcwivMetaArray($row['meta']??[]);
    if (($meta['vault']??'')!==HCWIV_META_VAULT) return null;
    return $row;
}

$workspace=hcwivWorkspace();
$action=strtolower(trim((string)($_GET['action']??'list')));
$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));

if ($method==='GET' && $action==='list') {
    hcwivJson(['ok'=>true,'images'=>hcwivRows($workspace)]);
}
if ($method==='GET' && $action==='get') {
    $clientId=hcwivClientId((string)($_GET['id']??''));
    $row=hcwivFind($workspace,$clientId);
    if ($row===null) { http_response_code(404); exit; }
    $object=(string)($row['supabase_object']??'');
    $download=$object!==''?supabaseStorageDownload($object):['ok'=>false];
    if (empty($download['ok']) || !is_string($download['data']??null)) { http_response_code(502); exit; }
    $data=$download['data'];
    if (substr($data,0,8)!=="\x89PNG\r\n\x1a\n") { http_response_code(422); exit; }
    header('Content-Type: image/png');
    header('Content-Length: '.strlen($data));
    header('Cache-Control: private, no-store');
    header('X-Content-SHA256: '.hash('sha256',$data));
    header('X-Content-Type-Options: nosniff');
    echo $data;
    exit;
}
if ($method!=='POST' || $action!=='upload') {
    header('Allow: GET, POST');
    hcwivJson(['ok'=>false,'error'=>'Unsupported action.'],405);
}
if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH']??''),'XMLHttpRequest')!==0) hcwivJson(['ok'=>false,'error'=>'Request not allowed.'],403);
$site=strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE']??'')));
if ($site!=='' && !in_array($site,['same-origin','same-site'],true)) hcwivJson(['ok'=>false,'error'=>'Request not allowed.'],403);

$clientId=hcwivClientId((string)($_POST['id']??''));
$codeHash=strtolower(trim((string)($_POST['code_hash']??'')));
if (!preg_match('/^[a-f0-9]{64}$/D',$codeHash)) hcwivJson(['ok'=>false,'error'=>'Invalid save-code hash.'],400);
$createdAt=max(1,(int)($_POST['created_at']??round(microtime(true)*1000)));
if (!isset($_FILES['file']) || !is_array($_FILES['file'])) hcwivJson(['ok'=>false,'error'=>'No PNG received.'],400);
$file=$_FILES['file'];
if ((int)($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK) hcwivJson(['ok'=>false,'error'=>'Upload incomplete.'],400);
$tmp=(string)($file['tmp_name']??'');
$size=(int)($file['size']??0);
if ($tmp==='' || !is_uploaded_file($tmp) || $size<1 || $size>HCWIV_MAX_BYTES) hcwivJson(['ok'=>false,'error'=>'Invalid PNG upload.'],413);
$head=@file_get_contents($tmp,false,null,0,8);
if ($head!=="\x89PNG\r\n\x1a\n") hcwivJson(['ok'=>false,'error'=>'Invalid PNG signature.'],415);
$sha=hash_file('sha256',$tmp)?:'';
$object=hcwivObject($workspace,$clientId);
$stored=supabaseStorageUpload($object,$tmp,'image/png',true);
if (empty($stored['ok'])) hcwivJson(['ok'=>false,'error'=>'Cloud storage rejected the PNG.'],502);
$dbId=hcwivDbId($workspace,$clientId);
$record=supabaseSyncFileRecord([
    'id'=>$dbId,
    'filename'=>substr(basename((string)($file['name']??'image.png')),0,220)?:'image.png',
    'mime_type'=>'image/png',
    'size_bytes'=>$size,
    'hash'=>$sha,
    'storage_path'=>$object,
    'supabase_object'=>$object,
    'upload_date'=>gmdate('c'),
    'meta'=>[
        'vault'=>HCWIV_META_VAULT,
        'client_id'=>$clientId,
        'code_hash'=>$codeHash,
        'created_at_ms'=>$createdAt,
        'sha256'=>$sha,
    ],
],$workspace);
if (empty($record['ok']) || empty($record['db']['ok'])) hcwivJson(['ok'=>false,'error'=>'PNG metadata could not be indexed.'],502);
hcwivJson(['ok'=>true,'image'=>['id'=>$clientId,'sha256'=>$sha,'size'=>$size,'cloud'=>true]],201);
