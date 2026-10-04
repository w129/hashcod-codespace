<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';

function meshAccessSchema(): string {
    return 'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI';
}

function meshAccessFieldNames(): array {
    return ['TYPE','PAYLOAD','SALT','NONCE','ISSUED','USE','CHECK'];
}

function meshAccessBindingName(): string {
    return 'l8_ocg_mesh_binding_v1';
}

function meshAccessNormalizeFields(array $input): ?array {
    $names=meshAccessFieldNames();
    if(count($input)!==count($names))return null;

    $out=[];
    foreach($names as $name){
        if(!array_key_exists($name,$input)||!is_scalar($input[$name]))return null;
        $value=trim((string)$input[$name]);
        $max=$name==='PAYLOAD'?4096:512;
        if($value===''||strlen($value)>$max)return null;
        if(preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/',$value))return null;
        $out[$name]=$value;
    }

    foreach(array_keys($input) as $key){
        if(!in_array((string)$key,$names,true))return null;
    }
    return $out;
}

function meshAccessCanonical(array $fields): string {
    $lines=[meshAccessSchema()];
    foreach(meshAccessFieldNames() as $name){
        $lines[]=$name.'='.(string)$fields[$name];
    }
    return implode("\n",$lines);
}

function meshAccessDigest(array $fields): string {
    return hash_hmac('sha256',meshAccessCanonical($fields),mldsaAccessSecret());
}

function meshAccessReadBinding(): ?array {
    $raw=(string)($_COOKIE[meshAccessBindingName()]??'');
    if($raw==='')return null;
    $data=mldsaOpen($raw);
    if(!is_array($data))return null;
    if(($data['kind']??'')!=='ocg-mesh-binding-v1')return null;
    if(($data['schema']??'')!==meshAccessSchema())return null;
    if(!hash_equals((string)($data['ua']??''),mldsaUa()))return null;
    if(!hash_equals((string)($data['host']??''),mldsaHost()))return null;
    if(!preg_match('/^[a-f0-9]{64}$/',(string)($data['digest']??'')))return null;
    return $data;
}

function meshAccessWriteBinding(string $digest): void {
    $now=time();
    $exp=$now+(365*24*60*60);
    mldsaCookie(meshAccessBindingName(),mldsaSeal([
        'kind'=>'ocg-mesh-binding-v1',
        'v'=>1,
        'schema'=>meshAccessSchema(),
        'digest'=>$digest,
        'created_at'=>$now,
        'ua'=>mldsaUa(),
        'host'=>mldsaHost()
    ]),$exp);
}

function meshAccessTemplate(): string {
    return "<?php\n\n"
        . "// Open the vector mesh icon inside the editor.\n"
        . "return [\n"
        . "  'schema' => '" . meshAccessSchema() . "',\n"
        . "  'mode' => 'MESH-NODE-BINDING',\n"
        . "  'action' => 'OPEN_VECTOR_ICON',\n"
        . "];\n";
}
