<?php
require dirname(__DIR__, 2) . '/security.php';
foreach (['https://example.supabase.co'=>'https://example.supabase.co', 'https://example.supabase.co/rest/v1'=>'https://example.supabase.co', 'http://example.com'=>'', 'https://user:pass@example.com'=>'', 'https://127.0.0.1'=>'', 'https://localhost'=>'', 'https://service.internal'=>'', "https://example.com/#https:"] as $url=>$expected) {
    if (is_int($url)) { $url=$expected; $expected=''; }
    if (securityCspOrigin($url) !== $expected) throw new RuntimeException('Invalid CSP origin filtering');
}
echo "PASS: exact CSP origins, credentials and internal hosts rejected\n";
