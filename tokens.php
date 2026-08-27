<?php
/**
 * Sistema de Tokens - DESACTIVADO (Acceso Ilimitado Libre de Restricciones)
 */

function tokensStatus() {
    return [
        'ok' => true,
        'unlimited' => true,
        'period' => date('Y-m'),
        'monthly_limit' => 999999999,
        'used' => 0,
        'remaining' => 999999999,
        'unlocked' => true,
        'areas' => []
    ];
}

function tokensConsume($kind = 'command', $detail = '') {
    return [
        'ok' => true,
        'unlimited' => true,
        'remaining' => 999999999,
        'status' => tokensStatus()
    ];
}

function tokensUnlock($area, $code) {
    return [
        'ok' => true,
        'unlimited' => true,
        'status' => tokensStatus()
    ];
}
