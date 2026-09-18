<?php
declare(strict_types=1);

require_once __DIR__ . '/../../access-intake.php';

function accessCheck(bool $ok, string $message): void {
    if (!$ok) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$base = [
    'full_name' => 'Ana Pérez García',
    'age' => 18,
    'cedula' => '001-1234567-8',
    'platform_name' => 'Plataforma Demo',
    'email' => 'ana@example.com',
    'phone' => '+1 809 555 0101',
];

$valid = hairNormalize($base);
accessCheck($valid['valid'] === true, '18+ valid payload must pass');

$minor = $base;
$minor['age'] = 17;
$minorResult = hairNormalize($minor);
accessCheck($minorResult['valid'] === false, '17-year-old payload must fail');
accessCheck(isset($minorResult['errors']['age']), 'minor rejection must point to age');

$badCedula = $base;
$badCedula['cedula'] = '00112345678';
$cedulaResult = hairNormalize($badCedula);
accessCheck($cedulaResult['valid'] === false, 'cedula without hyphens must fail');
accessCheck(isset($cedulaResult['errors']['cedula']), 'cedula rejection must point to cedula');

$badEmail = $base;
$badEmail['email'] = 'not-an-email';
$emailResult = hairNormalize($badEmail);
accessCheck($emailResult['valid'] === false, 'invalid email must fail');

$singleName = $base;
$singleName['full_name'] = 'Ana';
$nameResult = hairNormalize($singleName);
accessCheck($nameResult['valid'] === false, 'name without surname must fail');

echo "PASS: access-intake server validation enforces the requested adult/form contract.\n";
