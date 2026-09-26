<?php
require_once __DIR__ . '/../../toolbox-growth.php';

function check($condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function fixture(string $page, int $filled): string {
    $html = '<div class="toolbox-panel" data-toolbox-page="' . $page . '">';
    for ($i = 0; $i < 16; $i++) {
        $slot = ($page === '1' ? '' : 't' . $page . '-') . (intdiv($i, 4) + 1) . '-' . ($i % 4 + 1);
        $html .= '<div class="tb-slot' . ($i < $filled ? ' is-filled' : '') . '" data-slot="' . $slot . '"></div>';
    }
    return $html . '</div>';
}
check(hashcod_toolbox_successor('999999999999999999999') === '1000000000000000000000', 'Exact decimal successor');
check(hashcod_toolbox_pages(fixture('1', 15)) === ['1'], 'Partial bar must not expand');
check(hashcod_toolbox_pages(fixture('1', 16)) === ['1', '2'], 'Full bar gets a successor');
check(hashcod_toolbox_pages(fixture('1', 16) . fixture('2', 0)) === ['1', '2'], 'Reuse existing successor');
check(hashcod_toolbox_pages(fixture('4', 16)) === ['4', '5'], 'No four-page limit');
check(hashcod_toolbox_pages(fixture('999999999999999999999', 16)) === ['999999999999999999999', '1000000000000000000000'], 'No integer overflow');
$duplicate = '<div class="tb-slot is-filled" data-slot="t4-1-1"></div>';
check(hashcod_toolbox_pages(fixture('4', 15) . $duplicate) === ['4'], 'Duplicate slots do not fill a bar');
foreach (['0', '-1', '01', '1e4', '<script>'] as $invalid) {
    try { hashcod_toolbox_successor($invalid); throw new RuntimeException('Invalid ordinal accepted'); }
    catch (InvalidArgumentException $expected) {}
}
foreach (['index.php', '404.html'] as $file) {
    $html = file_get_contents(__DIR__ . '/../../' . $file);
    $rendered = hashcod_toolbox_bootstrap($html);
    check(substr_count($rendered, 'id="hashcodToolboxGrowth"') === 1, 'One server manifest');
    check(hashcod_toolbox_bootstrap($rendered) === $rendered, 'Idempotent bootstrap');
    check(strpos($rendered, '"pages":["1","2","3","4"]') !== false, 'Existing bars preserved');
}
echo "Toolbox backend ordinal tests passed.\n";
