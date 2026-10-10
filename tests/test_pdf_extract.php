<?php
/** PDF extract: input validation helpers and a real run of the OpenDataLoader jar when it is available. */
require_once __DIR__ . '/../pdf-extract.php';

$failed = 0;
function check(bool $ok, string $name): void { global $failed; echo ($ok ? '  [PASS] ' : '  [FAIL] ') . $name . "\n"; if (!$ok) $failed++; }

check(pdfExtractParsePages('') === null, 'empty pages = all pages');
check(pdfExtractParsePages('1,3,5-7') === '1,3,5-7', 'accepts a page list');
check(pdfExtractParsePages('abc') === false, 'rejects letters');
check(pdfExtractParsePages('1;rm -rf') === false, 'rejects shell metacharacters');
check(pdfExtractParsePages('1-2-3') === false, 'rejects malformed ranges');
check(pdfExtractParsePages(str_repeat('1,', 30) . '1') === false, 'rejects overlong lists');
check(pdfExtractParseFormats('markdown,evil,json') === ['json', 'markdown'], 'format whitelist drops unknown values');
check(pdfExtractParseFormats('') === ['json', 'markdown', 'html', 'text'], 'no formats = all');
check(pdfExtractPageCount(['json' => ['content' => '{"number of pages": 7}', 'truncated' => false]]) === 7, 'reads page count from json');
check(pdfExtractPageCount(['json' => ['content' => '{', 'truncated' => true]]) === null, 'no page count from truncated json');

$pdf = getenv('PDF_EXTRACT_TEST_PDF');
if (pdfExtractAvailable() && $pdf && is_file($pdf)) {
    $dir = sys_get_temp_dir() . '/pdfx_test_' . getmypid();
    mkdir($dir . '/out', 0700, true);
    copy($pdf, $dir . '/input.pdf');
    [$ok, $out] = pdfExtractRun($dir, ['json', 'markdown'], false, '1');
    $files = $ok ? pdfExtractCollect($out, ['json', 'markdown']) : [];
    check($ok && isset($files['json'], $files['markdown']) && strlen($files['markdown']['content']) > 100, 'jar extracts json + markdown');
    check(pdfExtractPageCount($files) !== null, 'extracted json has a page count');
    pdfExtractRemoveDir($dir);
    check(!is_dir($dir), 'temp directory removed');
} else {
    echo "  [SKIP] jar run (set OPENDATALOADER_JAR and PDF_EXTRACT_TEST_PDF)\n";
}
echo $failed ? "\n$failed FAILED\n" : "\nAll passed\n";
exit($failed ? 1 : 0);
