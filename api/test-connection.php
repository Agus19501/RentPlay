<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

try {
    $manager = getMongoManager();
    mongoPing($manager);

    echo json_encode([
        'ok' => true,
        'message' => 'Conexion a MongoDB exitosa.',
        'database' => getMongoDatabaseName(),
        'uri' => getenv('MONGODB_URI') ?: 'mongodb://127.0.0.1:27017',
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'message' => 'No se pudo conectar a la base de datos.',
        'error' => $exception->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
