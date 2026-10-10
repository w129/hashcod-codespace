<?php
/** Camera Vision: frame validation, detector response validation, log dedupe, and a live call against a fake detector. */
require_once __DIR__ . '/../camera-vision.php';

$failed = 0;
function check(bool $ok, string $name): void { global $failed; echo ($ok ? '  [PASS] ' : '  [FAIL] ') . $name . "\n"; if (!$ok) $failed++; }

$jpeg = "\xFF\xD8\xFF\xE0" . str_repeat("\0", 32);
$url = 'data:image/jpeg;base64,' . base64_encode($jpeg);
check(cameraVisionDecodeFrame($url) === $jpeg, 'accepts a JPEG data URL');
check(cameraVisionDecodeFrame('data:image/png;base64,AAAA') === null, 'rejects non-JPEG mime');
check(cameraVisionDecodeFrame('data:image/jpeg;base64,' . base64_encode('notajpeg')) === null, 'rejects bad magic bytes');
check(cameraVisionDecodeFrame('data:image/jpeg;base64,' . base64_encode("\xFF\xD8\xFF" . str_repeat('a', CAMERA_VISION_MAX_FRAME_BYTES))) === null, 'rejects oversized frame');
check(cameraVisionDecodeFrame(['x']) === null, 'rejects non-string');

$good = ['width' => 640, 'height' => 480, 'detections' => [['label' => 'person<script>', 'score' => 1.7, 'box' => [1, 2, 3, 4]], ['label' => 'bad']]];
$n = cameraVisionNormalizeDetections($good);
check($n !== null && count($n['detections']) === 1, 'drops malformed detections');
check($n['detections'][0]['label'] === 'personscript' && $n['detections'][0]['score'] === 1.0, 'sanitizes label and clamps score');
check(cameraVisionNormalizeDetections(['detections' => []]) === null, 'rejects missing dimensions');
check(cameraVisionNormalizeDetections('x') === null, 'rejects non-array upstream');

$d = [['label' => 'cup', 'score' => 0.9, 'box' => [0, 0, 1, 1]], ['label' => 'cup', 'score' => 0.7, 'box' => [0, 0, 1, 1]]];
$rows = cameraVisionAppendLog([], $d, 100);
check(count($rows) === 1 && $rows[0]['counts'] === ['cup' => 2] && $rows[0]['best']['cup'] === 0.9, 'logs counts and best score');
check(count(cameraVisionAppendLog($rows, $d, 103)) === 1, 'same scene within window is not re-logged');
check(count(cameraVisionAppendLog($rows, $d, 100 + CAMERA_VISION_MAX_LOG_ENTRIES)) === 2, 'same scene after window is logged');
check(count(cameraVisionAppendLog($rows, [['label' => 'dog', 'score' => 0.8, 'box' => [0, 0, 1, 1]]], 101)) === 2, 'changed scene is logged');
check(cameraVisionAppendLog($rows, [], 200) === $rows, 'empty scene adds nothing');

putenv('DETECTRON2_URL=');
check(cameraVisionCallDetector($jpeg) === [false, 'detector_not_configured'], 'unconfigured detector reports so');

// Fake detector: asserts bearer + body, answers with one detection.
$port = 18089;
$router = sys_get_temp_dir() . '/fake-detector-' . getmypid() . '.php';
file_put_contents($router, '<?php if (($_SERVER["HTTP_AUTHORIZATION"] ?? "") !== "Bearer s3cret" || strncmp(file_get_contents("php://input"), "\xFF\xD8\xFF", 3) !== 0) { http_response_code(401); exit; } header("Content-Type: application/json"); echo json_encode(["width"=>10,"height"=>10,"detections"=>[["label"=>"cup","score"=>0.9,"box"=>[1,1,2,2]]]]);');
$proc = proc_open([PHP_BINARY, '-S', "127.0.0.1:$port", $router], [['pipe', 'r'], ['pipe', 'w'], ['pipe', 'w']], $pipes);
usleep(600000);
putenv("DETECTRON2_URL=http://127.0.0.1:$port");
putenv('DETECTRON2_TOKEN=s3cret');
[$ok, $res] = cameraVisionCallDetector($jpeg);
check($ok && $res['detections'][0]['label'] === 'cup', 'calls detector with bearer and normalizes result');
putenv('DETECTRON2_TOKEN=wrong');
check(cameraVisionCallDetector($jpeg) === [false, 'detector_unavailable'], 'upstream rejection maps to detector_unavailable');
proc_terminate($proc);
@unlink($router);

echo $failed ? "\n$failed FAILED\n" : "\nAll passed\n";
exit($failed ? 1 : 0);
