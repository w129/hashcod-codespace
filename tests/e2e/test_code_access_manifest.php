<?php
declare(strict_types=1);

putenv('L8_CODE_ACCESS_REQUIRED=0');
require_once __DIR__ . '/../../code-access-lib.php';

$fields=[
    'TYPE'=>'MESH-NODE',
    'PAYLOAD'=>'ghWl-S1-4_OotRJmydmA_8kIkzQYw-GEPrIyfrTu9XK9BuXaTWmRYLWNkQpPl4C7',
    'SALT'=>'0e83721b7ffe4c04e3b238656fd4d316',
    'NONCE'=>'e3c51657884155c396882b9a',
    'ISSUED'=>'20261004174810',
    'USE'=>'distributed node credential',
    'CHECK'=>'4D38EF3C',
];

$normalized=meshAccessNormalizeFields($fields);
if(!is_array($normalized))throw new RuntimeException('valid mesh fields rejected');
if($normalized!==$fields)throw new RuntimeException('mesh normalization changed valid fields');

$canonical=meshAccessCanonical($fields);
if(!str_starts_with($canonical,meshAccessSchema()."\nTYPE=MESH-NODE\n")){
    throw new RuntimeException('mesh canonical format changed');
}
if(!str_contains($canonical,"CHECK=4D38EF3C")){
    throw new RuntimeException('mesh canonical CHECK missing');
}

$digest=meshAccessDigest($fields);
if(!preg_match('/^[a-f0-9]{64}$/',$digest)){
    throw new RuntimeException('mesh digest is not SHA-256 hex');
}

foreach(meshAccessFieldNames() as $name){
    $bad=$fields;
    $bad[$name]='';
    if(meshAccessNormalizeFields($bad)!==null){
        throw new RuntimeException('empty mesh field accepted: '.$name);
    }
}

$extra=$fields;
$extra['EXTRA']='x';
if(meshAccessNormalizeFields($extra)!==null){
    throw new RuntimeException('extra mesh field accepted');
}

if(meshAccessSchema()!=='OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI'){
    throw new RuntimeException('mesh schema changed');
}

echo "OCG mesh binding helpers ok\n";
