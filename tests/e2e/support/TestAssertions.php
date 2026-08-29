<?php
declare(strict_types=1);

namespace Hashcod\Tests\Support;

use Exception;

class AssertionException extends Exception
{
    private mixed $expected;
    private mixed $actual;

    public function __construct(string $message, mixed $expected = null, mixed $actual = null)
    {
        parent::__construct($message);
        $this->expected = $expected;
        $this->actual = $actual;
    }

    public function getExpected(): mixed
    {
        return $this->expected;
    }

    public function getActual(): mixed
    {
        return $this->actual;
    }
}

class TestAssertions
{
    public static function assertTrue(bool $condition, string $message = 'Failed asserting that condition is true'): void
    {
        if (!$condition) {
            throw new AssertionException($message, true, false);
        }
    }

    public static function assertFalse(bool $condition, string $message = 'Failed asserting that condition is false'): void
    {
        if ($condition) {
            throw new AssertionException($message, false, true);
        }
    }

    public static function assertEquals(mixed $expected, mixed $actual, string $message = ''): void
    {
        if ($expected !== $actual) {
            $msg = $message !== '' ? $message : sprintf("Failed asserting that %s matches expected %s", json_encode($actual), json_encode($expected));
            throw new AssertionException($msg, $expected, $actual);
        }
    }

    public static function assertNotEquals(mixed $expected, mixed $actual, string $message = ''): void
    {
        if ($expected === $actual) {
            $msg = $message !== '' ? $message : sprintf("Failed asserting that %s is not equal to %s", json_encode($actual), json_encode($expected));
            throw new AssertionException($msg, "not " . json_encode($expected), $actual);
        }
    }

    public static function assertNull(mixed $actual, string $message = 'Failed asserting that value is null'): void
    {
        if ($actual !== null) {
            throw new AssertionException($message, null, $actual);
        }
    }

    public static function assertNotNull(mixed $actual, string $message = 'Failed asserting that value is not null'): void
    {
        if ($actual === null) {
            throw new AssertionException($message, 'not null', null);
        }
    }

    public static function assertContains(mixed $needle, array|string $haystack, string $message = ''): void
    {
        if (is_string($haystack)) {
            if (strpos($haystack, (string)$needle) === false) {
                $msg = $message !== '' ? $message : sprintf("Failed asserting that '%s' contains '%s'", $haystack, $needle);
                throw new AssertionException($msg, $needle, $haystack);
            }
        } elseif (is_array($haystack)) {
            if (!in_array($needle, $haystack, true)) {
                $msg = $message !== '' ? $message : sprintf("Failed asserting that array contains item: %s", json_encode($needle));
                throw new AssertionException($msg, $needle, $haystack);
            }
        }
    }

    public static function assertNotContains(mixed $needle, array|string $haystack, string $message = ''): void
    {
        if (is_string($haystack)) {
            if (strpos($haystack, (string)$needle) !== false) {
                $msg = $message !== '' ? $message : sprintf("Failed asserting that '%s' does not contain '%s'", $haystack, $needle);
                throw new AssertionException($msg, "not containing $needle", $haystack);
            }
        } elseif (is_array($haystack)) {
            if (in_array($needle, $haystack, true)) {
                $msg = $message !== '' ? $message : sprintf("Failed asserting that array does not contain item: %s", json_encode($needle));
                throw new AssertionException($msg, "not containing item", $haystack);
            }
        }
    }

    public static function assertArrayHasKey(string|int $key, array $array, string $message = ''): void
    {
        if (!array_key_exists($key, $array)) {
            $msg = $message !== '' ? $message : sprintf("Failed asserting that array has key '%s'", (string)$key);
            throw new AssertionException($msg, "key: $key", array_keys($array));
        }
    }

    public static function assertMatchesRegularExpression(string $pattern, string $string, string $message = ''): void
    {
        if (@preg_match($pattern, $string) !== 1) {
            $msg = $message !== '' ? $message : sprintf("Failed asserting that '%s' matches pattern '%s'", $string, $pattern);
            throw new AssertionException($msg, $pattern, $string);
        }
    }

    public static function assertGreaterThanOrEqual(int|float $expected, int|float $actual, string $message = ''): void
    {
        if ($actual < $expected) {
            $msg = $message !== '' ? $message : sprintf("Failed asserting that %s is greater than or equal to %s", (string)$actual, (string)$expected);
            throw new AssertionException($msg, ">= $expected", $actual);
        }
    }

    public static function assertLessThanOrEqual(int|float $expected, int|float $actual, string $message = ''): void
    {
        if ($actual > $expected) {
            $msg = $message !== '' ? $message : sprintf("Failed asserting that %s is less than or equal to %s", (string)$actual, (string)$expected);
            throw new AssertionException($msg, "<= $expected", $actual);
        }
    }

    public static function assertBetween(int|float $min, int|float $max, int|float $actual, string $message = ''): void
    {
        if ($actual < $min || $actual > $max) {
            $msg = $message !== '' ? $message : sprintf("Failed asserting that %s is between %s and %s", (string)$actual, (string)$min, (string)$max);
            throw new AssertionException($msg, "between [$min, $max]", $actual);
        }
    }

    public static function assertHeaderPresent(array $headers, string $headerName, ?string $valuePattern = null): void
    {
        $found = false;
        $matchedValue = null;
        $nameLower = strtolower($headerName);

        foreach ($headers as $k => $v) {
            $hKey = is_string($k) ? $k : '';
            $hVal = (string)$v;
            if (is_numeric($k) && strpos($v, ':') !== false) {
                list($kPart, $vPart) = explode(':', $v, 2);
                $hKey = trim($kPart);
                $hVal = trim($vPart);
            }
            if (strtolower($hKey) === $nameLower) {
                $found = true;
                $matchedValue = $hVal;
                break;
            }
        }

        if (!$found) {
            throw new AssertionException(sprintf("Header '%s' was not present in response headers: %s", $headerName, json_encode($headers)));
        }

        if ($valuePattern !== null && $matchedValue !== null) {
            if (@preg_match($valuePattern, $matchedValue) !== 1) {
                throw new AssertionException(
                    sprintf("Header '%s' value '%s' did not match pattern '%s'", $headerName, $matchedValue, $valuePattern),
                    $valuePattern,
                    $matchedValue
                );
            }
        }
    }
}
