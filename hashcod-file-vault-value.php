<?php
declare(strict_types=1);

function hfvUsdCents(mixed $value): ?int {
    if ($value === null || $value === '') return null;
    // Multipart forms carry strings; JSON callers may send integer cents.
    if (is_string($value) && preg_match('/^(0|[1-9][0-9]{0,8})$/D', $value)) $value = (int)$value;
    if (!is_int($value) || $value < 0 || $value > 999999999) {
        throw new InvalidArgumentException('Enter a USD value from $0.00 to $9,999,999.99, with up to two decimals.');
    }
    return $value;
}
