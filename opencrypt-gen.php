<?php
/**
 * OpenCriptG — ledger de códigos criptográficos únicos (bloc de notas).
 *
 * Los códigos se generan en el cliente con el inventario OCG (10.100 tipos)
 * y se registran aquí para que no se repitan.
 */

function ocgStorageDir() {
    $dir = __DIR__ . '/data_storage/opencrypt';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function ocgLedgerPath() {
    return ocgStorageDir() . '/unique_codes.json';
}

function ocgEmptyLedger() {
    return [
        'version' => 1,
        'count' => 0,
        'hashes' => [],
        'updated_at' => date('c'),
    ];
}

function ocgLoadLedger() {
    $path = ocgLedgerPath();
    if (!is_file($path)) {
        return ocgEmptyLedger();
    }
    $raw = @file_get_contents($path);
    $data = json_decode((string)$raw, true);
    if (!is_array($data)) {
        return ocgEmptyLedger();
    }
    if (!isset($data['hashes']) || !is_array($data['hashes'])) {
        $data['hashes'] = [];
    }
    return $data;
}

function ocgSaveLedger(array $data) {
    $data['version'] = 1;
    $data['count'] = count($data['hashes'] ?? []);
    $data['updated_at'] = date('c');
    $path = ocgLedgerPath();
    $tmp = $path . '.tmp.' . getmypid();
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }
    if (@file_put_contents($tmp, $json) === false) {
        return false;
    }
    return @rename($tmp, $path);
}

function ocgFingerprint($code) {
    return hash('sha256', (string)$code);
}

/**
 * Registra códigos nuevos. Rechaza duplicados (globales / ya emitidos).
 *
 * @param array $items [{type_id, code, label?}]
 * @return array
 */
function ocgClaimCodes($items) {
    if (!is_array($items) || !$items) {
        return ['ok' => false, 'error' => 'Lista de códigos vacía'];
    }
    if (count($items) > 40) {
        return ['ok' => false, 'error' => 'Máximo 40 códigos por solicitud'];
    }

    $ledger = ocgLoadLedger();
    $accepted = [];
    $rejected = [];
    $seenBatch = [];

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }
        $code = isset($item['code']) ? (string)$item['code'] : '';
        $typeId = isset($item['type_id']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', (string)$item['type_id']) : '';
        $label = isset($item['label']) ? substr((string)$item['label'], 0, 200) : '';
        if ($code === '' || strlen($code) > 20000) {
            $rejected[] = [
                'type_id' => $typeId,
                'reason' => 'invalid_code',
            ];
            continue;
        }
        $fp = ocgFingerprint($code);
        if (isset($seenBatch[$fp]) || isset($ledger['hashes'][$fp])) {
            $rejected[] = [
                'type_id' => $typeId,
                'fingerprint' => $fp,
                'reason' => 'duplicate',
            ];
            continue;
        }
        $seenBatch[$fp] = true;
        $ledger['hashes'][$fp] = [
            'type_id' => $typeId,
            'label' => $label,
            'at' => date('c'),
            'len' => strlen($code),
        ];
        $accepted[] = [
            'type_id' => $typeId,
            'label' => $label,
            'code' => $code,
            'fingerprint' => $fp,
        ];
    }

    if ($accepted) {
        if (!ocgSaveLedger($ledger)) {
            return ['ok' => false, 'error' => 'No se pudo persistir el ledger de unicidad'];
        }
    }

    return [
        'ok' => true,
        'accepted' => $accepted,
        'rejected' => $rejected,
        'ledger_count' => count($ledger['hashes']),
    ];
}

function ocgStatus() {
    $ledger = ocgLoadLedger();
    return [
        'ok' => true,
        'inventory_types' => 10100,
        'ledger_count' => (int)($ledger['count'] ?? count($ledger['hashes'] ?? [])),
        'updated_at' => $ledger['updated_at'] ?? null,
        'catalog_url' => '/opencryptg/data/catalog.js',
        'generators_url' => '/opencryptg/data/generators.js',
    ];
}

/**
 * Maneja /api/opencrypt/* — retorna true si respondió.
 */
function ocgHandleApi($uri) {
    if (strpos($uri, '/api/opencrypt') !== 0) {
        return false;
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if (($uri === '/api/opencrypt' || $uri === '/api/opencrypt/status') && $method === 'GET') {
        echo json_encode(ocgStatus(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (($uri === '/api/opencrypt/claim' || $uri === '/api/opencrypt/register') && $method === 'POST') {
        $raw = json_decode((string)file_get_contents('php://input'), true) ?: [];
        $items = $raw['codes'] ?? $raw['items'] ?? [];
        $res = ocgClaimCodes($items);
        if (empty($res['ok'])) {
            http_response_code(400);
        }
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Unknown OpenCriptG endpoint'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return true;
}
