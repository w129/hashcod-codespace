<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';

function smithAuthProtocol(): string {
    return 'OCG-SMITH-AUTH/1';
}

function smithAuthFootprintProtocol(): string {
    return 'OCG-SMITH-FOOTPRINT/1';
}

function smithAuthGammaProtocol(): string {
    return 'SMITH-GAMMA-Z0-50/1';
}

function smithAuthFieldNames(): array {
    return ['TYPE','PAYLOAD','SALT','NONCE','ISSUED','USE','CHECK'];
}

function smithAuthZ0Ohm(): int {
    return 50;
}

function smithAuthZ0MicroOhm(): int {
    return smithAuthZ0Ohm()*1000000;
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

    // Deterministic normalized impedance z = r + jx. Fixed-point integers are
    // the authority values so Python, C and PHP can compare them exactly.
    $rMicro=1000+($u1%999999001);
    $xMicro=($u2%200000001)-100000000;

    // Physical impedance uses Z0 = 50 ohm. Because z = ZL/Z0:
    //   Re(ZL) = Z0*r, Im(ZL) = Z0*x.
    $z0MicroOhm=smithAuthZ0MicroOhm();
    $zlRMicroOhm=$rMicro*smithAuthZ0Ohm();
    $zlIMicroOhm=$xMicro*smithAuthZ0Ohm();

    // Exact integer form of Gamma_L = (ZL - Z0) / (ZL + Z0).
    $oneMicro=1000000;
    $gammaDen=(($rMicro+$oneMicro)*($rMicro+$oneMicro))+($xMicro*$xMicro);
    $gammaRNum=($rMicro*$rMicro)+($xMicro*$xMicro)-($oneMicro*$oneMicro);
    $gammaINum=2*$oneMicro*$xMicro;

    $gammaR=$gammaRNum/$gammaDen;
    $gammaI=$gammaINum/$gammaDen;
    $gammaAbs=sqrt(($gammaR*$gammaR)+($gammaI*$gammaI));
    $gammaPhase=rad2deg(atan2($gammaI,$gammaR));

    return [
        'formula'=>smithAuthGammaProtocol(),
        'z0_ohm'=>smithAuthZ0Ohm(),
        'z0_micro_ohm'=>$z0MicroOhm,
        'r_micro'=>$rMicro,
        'x_micro'=>$xMicro,
        'zl_r_micro_ohm'=>$zlRMicroOhm,
        'zl_i_micro_ohm'=>$zlIMicroOhm,
        'gamma_r_num'=>$gammaRNum,
        'gamma_i_num'=>$gammaINum,
        'gamma_den'=>$gammaDen,
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
    $lines=[
        smithAuthFootprintProtocol(),
        'FORMULA='.smithAuthGammaProtocol(),
        'Z0_OHM='.(string)smithAuthZ0Ohm()
    ];
    foreach(smithAuthFieldNames() as $name){
        $p=$smith[$name];
        $lines[]=$name.'='.(string)$fields[$name];
        $lines[]=$name.'.R_MICRO='.(string)$p['r_micro'];
        $lines[]=$name.'.X_MICRO='.(string)$p['x_micro'];
        $lines[]=$name.'.ZL_R_MICRO_OHM='.(string)$p['zl_r_micro_ohm'];
        $lines[]=$name.'.ZL_I_MICRO_OHM='.(string)$p['zl_i_micro_ohm'];
        $lines[]=$name.'.GAMMA_R_NUM='.(string)$p['gamma_r_num'];
        $lines[]=$name.'.GAMMA_I_NUM='.(string)$p['gamma_i_num'];
        $lines[]=$name.'.GAMMA_DEN='.(string)$p['gamma_den'];
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
    if($json===''||strlen($json)>24000)return null;
    $payload=json_decode($json,true);
    if(!is_array($payload))return null;
    return ['json'=>$json,'data'=>$payload];
}

function smithAuthVerifyPayload(array $payload,string $expectedChallenge): array {
    if(($payload['protocol']??'')!==smithAuthProtocol()){
        return ['ok'=>false,'code'=>'protocol_mismatch','error'=>'The signed code uses the wrong access protocol.'];
    }
    if(($payload['formula']??'')!==smithAuthGammaProtocol()){
        return ['ok'=>false,'code'=>'formula_mismatch','error'=>'The signed code did not pass through the required Smith reflection-coefficient formula.'];
    }
    if((int)($payload['z0_ohm']??0)!==smithAuthZ0Ohm()){
        return ['ok'=>false,'code'=>'z0_mismatch','error'=>'The signed code uses the wrong reference impedance Z0.'];
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
        return ['ok'=>false,'code'=>'invalid_smith','error'=>'The signed code does not contain Smith reflection values.'];
    }

    $expectedSmith=smithAuthProjections($fields);
    $exactKeys=[
        'z0_micro_ohm','r_micro','x_micro','zl_r_micro_ohm','zl_i_micro_ohm',
        'gamma_r_num','gamma_i_num','gamma_den'
    ];
    foreach(smithAuthFieldNames() as $name){
        $entry=$suppliedSmith[$name]??null;
        if(!is_array($entry)){
            return ['ok'=>false,'code'=>'invalid_smith','error'=>'A Smith reflection projection is missing: '.$name];
        }
        if(($entry['formula']??'')!==smithAuthGammaProtocol()){
            return ['ok'=>false,'code'=>'formula_mismatch','error'=>'The Smith formula marker is missing or invalid: '.$name];
        }
        foreach($exactKeys as $key){
            if(!array_key_exists($key,$entry)||(int)$entry[$key]!==$expectedSmith[$name][$key]){
                return ['ok'=>false,'code'=>'smith_mismatch','error'=>'The impedance/reflection values do not correspond to the credential: '.$name.' / '.$key];
            }
        }
    }

    $expectedFootprint=smithAuthFootprint($fields,$expectedSmith);
    $footprint=strtolower(trim((string)($payload['footprint']??'')));
    if(!preg_match('/^[a-f0-9]{64}$/',$footprint)||!hash_equals($expectedFootprint,$footprint)){
        return ['ok'=>false,'code'=>'footprint_mismatch','error'=>'The authentic footprint does not match the impedance/reflection structure.'];
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
        . "// Every input is transformed with Gamma_L=(Z_L-Z_0)/(Z_L+Z_0), Z0=50 ohm.\n"
        . "// Current challenge (copy it into the desktop signer):\n"
        . "// ".$safe."\n\n"
        . "return [\n"
        . "  'protocol' => '".smithAuthProtocol()."',\n"
        . "  'payload_b64' => 'PASTE_GENERATED_PAYLOAD_HERE',\n"
        . "  'signature_b64' => 'PASTE_GENERATED_ML_DSA_87_SIGNATURE_HERE',\n"
        . "];\n";
}

// Retired first-use mesh helpers kept only so historical CI fixtures can run.
// The production /api/code-access endpoint does not load or use this layer.
function meshAccessSchema(): string {
    return 'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI';
}
function meshAccessFieldNames(): array {
    return ['TYPE','PAYLOAD','SALT','NONCE','ISSUED','USE','CHECK'];
}
function meshAccessNormalizeFields(array $input): ?array {
    $names=meshAccessFieldNames();
    if(count($input)!==count($names))return null;
    $out=[];
    foreach($names as $name){
        if(!array_key_exists($name,$input)||!is_scalar($input[$name]))return null;
        $value=trim((string)$input[$name]);
        if($value==='')return null;
        $out[$name]=$value;
    }
    foreach(array_keys($input) as $key){
        if(!in_array((string)$key,$names,true))return null;
    }
    return $out;
}
function meshAccessCanonical(array $fields): string {
    $normalized=meshAccessNormalizeFields($fields);
    if(!is_array($normalized))return '';
    $lines=[meshAccessSchema()];
    foreach(meshAccessFieldNames() as $name)$lines[]=$name.'='.$normalized[$name];
    return implode("\n",$lines);
}
function meshAccessDigest(array $fields): string {
    return hash('sha256',meshAccessCanonical($fields));
}
function meshAccessBindingName(): string { return 'l8_ocg_mesh_binding_v1'; }
function meshAccessReadBinding(): string { return (string)($_COOKIE[meshAccessBindingName()]??''); }
function meshAccessWriteBinding(string $digest): void {
    if(headers_sent()||!preg_match('/^[a-f0-9]{64}$/D',$digest))return;
    setcookie(meshAccessBindingName(),$digest,['expires'=>time()+3600,'path'=>'/','httponly'=>true,'samesite'=>'Strict']);
}
