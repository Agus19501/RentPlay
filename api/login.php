<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Metodo no permitido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$email = trim((string) ($_POST['email'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Correo invalido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Contrasena invalida.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $manager = getMongoManager();
    $user = mongoFindOne($manager, 'users', ['email' => $email]);

    if (!$user || !isset($user['password_hash']) || !password_verify($password, (string) $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'message' => 'Credenciales incorrectas.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'message' => 'Sesion iniciada correctamente.',
        'user' => [
            'id' => mongoIdToString($user['_id'] ?? ''),
            'name' => (string) ($user['name'] ?? ''),
            'email' => (string) ($user['email'] ?? ''),
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Error al iniciar sesion.',
        'error' => $exception->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
