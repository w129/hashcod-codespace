<?php
/**
 * Hashcod form library (PSOT fillable PDFs).
 *
 *   GET /api/forms-library/{ID}             the PDF inline (preview)
 *   GET /api/forms-library/{ID}?download=1  the PDF as an attachment
 *
 * {ID} is a code such as A01, G90, H100 or U01. It is never used as a path: the file is looked up by
 * listing assets/forms/ and matching "<ID>_*.pdf", so only the bundled forms can ever be returned.
 * Access is the platform's Pro period, enforced by router.php's platformPeriodGuard for every /api/ route.
 * The titles/categories shown in the UI live in center-empty-state-build/forms-data.js.
 */

const FORMS_LIBRARY_DIR = __DIR__ . '/assets/forms';

function formsLibraryError(int $code, string $message): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
}

/** Returns the absolute path of the form with this code, or null. */
function formsLibraryFind(string $id): ?string {
    if (!preg_match('/^[A-HU]\d{2,3}$/', $id)) {
        return null;
    }
    $matches = glob(FORMS_LIBRARY_DIR . '/' . $id . '_*.pdf') ?: [];
    return count($matches) === 1 && is_file($matches[0]) ? $matches[0] : null;
}

function formsLibraryHandleApi($uri): bool {
    $uri = (string)$uri;
    if (strpos($uri, '/api/forms-library/') !== 0) {
        return false;
    }
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        formsLibraryError(405, 'Método no permitido');
        return true;
    }
    $path = formsLibraryFind(substr($uri, strlen('/api/forms-library/')));
    if ($path === null) {
        formsLibraryError(404, 'Formulario no encontrado');
        return true;
    }
    $disposition = isset($_GET['download']) && $_GET['download'] === '1' ? 'attachment' : 'inline';
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code(200);
    header('Content-Type: application/pdf');
    header('Content-Length: ' . (int)filesize($path));
    header('Content-Disposition: ' . $disposition . '; filename="' . basename($path) . '"');
    header('Cache-Control: private, max-age=3600');
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    return true;
}
