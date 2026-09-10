<?php
/**
 * Backward-compatible chat endpoint.
 * The UI may still request /api/groq-chat from a cached asset, but all
 * inference is now handled by OpenRouter on the server.
 */
require __DIR__ . '/openrouter-chat.php';
