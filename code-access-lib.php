<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';

function smithAuthProtocol(): string {
    return 'OCG-SMITH-AUTH/1';
}

function smithAuthFootprintProtocol(): string {
    return 'OCG-SMITH-FOOTPRINT/1';
}

function smithAuthFieldNames(): array {
    return ['TYPE','PAYLOAD','SALT','NONCE','ISSUED','USE','CHECK'];
}

function smithAuthNormalizeFields(array $input): ?array {
    $names=smithAuthFieldNames();
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

function smithAuthProjection(string $name,string $value): array {
    $raw=hash('sha256',$name."\n".$value,true);
    $a=unpack('N',substr($raw,0,4));
    $b=unpack('N',substr($raw,4,4));
    $u1=(int)($a[1]??0);
    $u2=(int)($b[1]??0);

    // Fixed-point authority values. These integers are the source of truth;
    // floating-point Gamma values are derived only for visualization/reporting.
    $rMicro=1000+($u1%999999001);        // 0.001000 .. 1000.000000
    $xMicro=($u2%200000001)-100000000;   // -100.000000 .. +100.000000

    $r=$rMicro/1000000.0;
    $x=$xMicro/1000000.0;
    $den=(($r+1.0)*($r+1.0))+($x*$x);
    $gammaR=(($r*$r)+($x*$x)-1.0)/$den;
    $gammaI=(2.0*$x)/$den;
    $gammaAbs=sqrt(($gammaR*$gammaR)+($gammaI*$gammaI));
    $gammaPhase=rad2deg(atan2($gammaI,$gammaR));

    return [
        'r_micro'=>$rMicro,
        'x_micro'=>$xMicro,
        'gamma_r'=>round($gammaR,12),
        'gamma_i'=>round($gammaI,12),
        'gamma_abs'=>round($gammaAbs,12),
        'gamma_phase_deg'=>round($gammaPhase,9),
        'field_sha256'=>hash('sha256',$name."\n".$value)
    ];
}

function smithAuthProjections(array $fields): array {
    $out=[];
    foreach(smithAuthFieldNames() as $name){
        $out[$name]=smithAuthProjection($name,(string)$fields[$name]);
    }
    return $out;
}

function smithAuthFootprintCanonical(array $fields,array $smith): string {
    $lines=[smithAuthFootprintProtocol()];
    foreach(smithAuthFieldNames() as $name){
        $lines[]=$name.'='.(string)$fields[$name];
        $lines[]=$name.'.R_MICRO='.(string)$smith[$name]['r_micro'];
        $lines[]=$name.'.X_MICRO='.(string)$smith[$name]['x_micro'];
    }
    return implode("\n",$lines);
}

function smithAuthFootprint(array $fields,array $smith): string {
    return hash('sha256',smithAuthFootprintCanonical($fields,$smith));
}

function smithAuthB64uDecode(string $value): string {
    $value=strtr(trim($value),'-_','+/');
    $pad=strlen($value)%4;
    if($pad)$value.=str_repeat('=',4-$pad);
    $decoded=base64_decode($value,true);
    return is_string($decoded)?$decoded:'';
}

function smithAuthParseManifest(string $source): ?array {
    if(strlen($source)>30000)return null;
    $pattern="~^\\s*<\\?php\\s*return\\s*\\[\\s*'protocol'\\s*=>\\s*'OCG-SMITH-AUTH/1'\\s*,\\s*'payload_b64'\\s*=>\\s*'([A-Za-z0-9_-]+)'\\s*,\\s*'signature_b64'\\s*=>\\s*'([A-Za-z0-9+/=]+)'\\s*,?\\s*\\]\\s*;\\s*$~s";
    if(!preg_match($pattern,$source,$m))return null;
    return [
        'protocol'=>smithAuthProtocol(),
        'payload_b64'=>(string)$m[1],
        'signature_b64'=>(string)$m[2]
    ];
}

function smithAuthDecodePayload(string $payloadB64): ?array {
    $json=smithAuthB64uDecode($payloadB64);
    if($json===''||strlen($json)>16000)return null;
    $payload=json_decode($json,true);
    if(!is_array($payload))return null;
    return ['json'=>$json,'data'=>$payload];
}

function smithAuthVerifyPayload(array $payload,string $expectedChallenge): array {
    if(($payload['protocol']??'')!==smithAuthProtocol()){
        return ['ok'=>false,'code'=>'protocol_mismatch','error'=>'The signed code uses the wrong access protocol.'];
    }
    if(!isset($payload['challenge'])||!is_string($payload['challenge'])||!hash_equals($expectedChallenge,$payload['challenge'])){
        return ['ok'=>false,'code'=>'challenge_mismatch','error'=>'The signed code does not match the current challenge. Generate a new code with the current challenge.'];
    }
    $fields=$payload['fields']??null;
    if(!is_array($fields)){
        return ['ok'=>false,'code'=>'invalid_fields','error'=>'The signed code does not contain the required credential fields.'];
    }
    $fields=smithAuthNormalizeFields($fields);
    if(!is_array($fields)){
        return ['ok'=>false,'code'=>'invalid_fields','error'=>'The signed credential fields are invalid.'];
    }
    $suppliedSmith=$payload['smith']??null;
    if(!is_array($suppliedSmith)){
        return ['ok'=>false,'code'=>'invalid_smith','error'=>'The signed code does not contain Smith projection values.'];
    }
    $expectedSmith=smithAuthProjections($fields);
    foreach(smithAuthFieldNames() as $name){
        $entry=$suppliedSmith[$name]??null;
        if(!is_array($entry)){
            return ['ok'=>false,'code'=>'invalid_smith','error'=>'A Smith projection is missing: '.$name];
        }
        if((int)($entry['r_micro']??PHP_INT_MIN)!==$expectedSmith[$name]['r_micro']
            ||(int)($entry['x_micro']??PHP_INT_MIN)!==$expectedSmith[$name]['x_micro']){
            return ['ok'=>false,'code'=>'smith_mismatch','error'=>'The Smith projection does not correspond to the credential values: '.$name];
        }
    }
    $expectedFootprint=smithAuthFootprint($fields,$expectedSmith);
    $footprint=strtolower(trim((string)($payload['footprint']??'')));
    if(!preg_match('/^[a-f0-9]{64}$/',$footprint)||!hash_equals($expectedFootprint,$footprint)){
        return ['ok'=>false,'code'=>'footprint_mismatch','error'=>'The authentic footprint does not match the credential structure.'];
    }
    return [
        'ok'=>true,
        'fields'=>$fields,
        'smith'=>$expectedSmith,
        'footprint'=>$expectedFootprint
    ];
}

function smithAuthTemplate(string $challenge): string {
    $safe=str_replace("'","",$challenge);
    return "<?php\n\n"
        . "// Generate this block with Hashcod Smith Credential Console.\n"
        . "// Current challenge (copy it into the desktop signer):\n"
        . "// ".$safe."\n\n"
        . "return [\n"
        . "  'protocol' => '".smithAuthProtocol()."',\n"
        . "  'payload_b64' => 'PASTE_GENERATED_PAYLOAD_HERE',\n"
        . "  'signature_b64' => 'PASTE_GENERATED_ML_DSA_87_SIGNATURE_HERE',\n"
        . "];\n";
}
