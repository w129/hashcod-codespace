<?php
declare(strict_types=1);

putenv('L8_CODE_ACCESS_REQUIRED=0');
require_once __DIR__ . '/../../code-access-lib.php';

$challenge='HC-MLDSA87-V2.P1.abcdefghijklmnopqrstuvwxyz_0123456789';
$signature=str_repeat('A',128);
$valid="<?php\n\nreturn [\n"
    . "  'protocol' => 'HASHCOD-ACCESS/1',\n"
    . "  'challenge' => '".$challenge."',\n"
    . "  'signature' => '".$signature."',\n"
    . "];\n";

$parsed=codeAccessParseManifest($valid);
if(!is_array($parsed))throw new RuntimeException('valid access manifest did not parse');
if($parsed['protocol']!=='HASHCOD-ACCESS/1')throw new RuntimeException('protocol changed');
if($parsed['challenge']!==$challenge)throw new RuntimeException('challenge changed');
if($parsed['signature']!==$signature)throw new RuntimeException('signature changed');

$template=codeAccessTemplate($challenge);
if(!str_contains($template,$challenge))throw new RuntimeException('template lost challenge');
if(!str_contains($template,'PASTE_ML_DSA_87_SIGNATURE_BASE64_HERE'))throw new RuntimeException('template signature placeholder missing');

$bad=[
    $valid."\nsystem('id');",
    "<?php eval('return 1;');",
    "<?php return ['protocol'=>'HASHCOD-ACCESS/1','challenge'=>'".$challenge."','signature'=>'".$signature."','extra'=>'x'];",
    "<?php \$x='x'; return ['protocol'=>'HASHCOD-ACCESS/1','challenge'=>'".$challenge."','signature'=>'".$signature."'];",
];
foreach($bad as $index=>$source){
    if(codeAccessParseManifest($source)!==null)throw new RuntimeException('unsafe manifest accepted at case '.$index);
}

echo "code access manifest parser ok\n";
