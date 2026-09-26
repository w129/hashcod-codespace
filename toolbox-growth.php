<?php
/** Toolbox's finite ordinals below omega, materialized only as needed. */
function hashcod_toolbox_successor(string $ordinal): string {
    if (!preg_match('/^[1-9][0-9]*$/D', $ordinal)) {
        throw new InvalidArgumentException('Invalid Toolbox ordinal');
    }
    // Decimal strings avoid both PHP integer and JavaScript Number overflow.
    for ($i = strlen($ordinal) - 1; $i >= 0; $i--) {
        if ($ordinal[$i] !== '9') {
            $ordinal[$i] = chr(ord($ordinal[$i]) + 1);
            return $ordinal;
        }
        $ordinal[$i] = '0';
    }
    return '1' . $ordinal;
}

/** Read only the trusted platform markup, never client-supplied occupancy. */
function hashcod_toolbox_pages(string $markup): array {
    $pages = [];
    $occupied = [];
    preg_match_all('/<div\b[^>]*>/i', $markup, $matches);
    foreach ($matches[0] as $tag) {
        if (!preg_match('/\bclass="([^"]*)"/', $tag, $class)) continue;
        $classes = preg_split('/\s+/', trim($class[1]));
        if (in_array('toolbox-panel', $classes, true)
            && preg_match('/\bdata-toolbox-page="([1-9][0-9]*)"/', $tag, $page)) {
            $pages['p' . $page[1]] = $page[1];
        }
        if (!in_array('tb-slot', $classes, true) || !in_array('is-filled', $classes, true)) continue;
        if (!preg_match('/\bdata-slot="(?:t([1-9][0-9]*)-)?([1-4]-[1-4])"/', $tag, $slot)) continue;
        $page = $slot[1] !== '' ? $slot[1] : '1';
        $occupied['p' . $page][$slot[2]] = true;
    }
    foreach ($pages as $key => $page) {
        if (count($occupied[$key] ?? []) === 16) {
            $next = hashcod_toolbox_successor($page);
            $pages['p' . $next] = $next;
        }
    }
    $result = array_values($pages);
    usort($result, static function (string $a, string $b): int {
        return (strlen($a) <=> strlen($b)) ?: strcmp($a, $b);
    });
    return $result;
}

/** Shared by the hosted front controller and the local Apache entrypoint. */
function hashcod_toolbox_bootstrap(string $html): string {
    $start = strpos($html, '<!-- Panel Toolbox (');
    $end = strpos($html, '<!-- toolbox-growth-end -->');
    if ($start === false || $end === false || $end <= $start
        || strpos($html, 'id="hashcodToolboxGrowth"') !== false) return $html;
    $manifest = json_encode([
        'version' => 1,
        'capacity' => 16,
        'pages' => hashcod_toolbox_pages(substr($html, $start, $end - $start)),
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
    return substr_replace($html, '<script type="application/json" id="hashcodToolboxGrowth">'
        . $manifest . '</script>', $end, 0);
}
