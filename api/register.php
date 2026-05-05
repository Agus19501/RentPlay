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
$name = trim((string) ($_POST['name'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Correo invalido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (mb_strlen($name) < 2) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Nombre demasiado corto.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'La contrasena debe tener al menos 6 caracteres.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $manager = getMongoManager();
    $existingUser = mongoFindOne($manager, 'users', ['email' => $email]);

    if ($existingUser) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'message' => 'Este correo ya esta registrado.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $insertedId = mongoInsertOne($manager, 'users', [
        'name' => $name,
        'email' => $email,
        'password_hash' => $passwordHash,
        'created_at' => new MongoDB\BSON\UTCDateTime(),
    ]);

    echo json_encode([
        'ok' => true,
        'message' => 'Cuenta creada correctamente.',
        'user' => [
            'id' => mongoIdToString($insertedId),
            'name' => $name,
            'email' => $email,
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Error al crear la cuenta.',
        'error' => $exception->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
