<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/User.php';

require_once __DIR__ . '/../api/headers.php';

function body(): array {
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
    if ($method !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

    $data = body();
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    if ($username === '' || $password === '') { http_response_code(400); echo json_encode(['error' => 'Missing credentials']); exit; }

    $model = UserModel::withDefaultConnection();
    $user = $model->verify($username, $password);
    if (!$user) { http_response_code(401); echo json_encode(['error' => 'Invalid credentials']); exit; }

    echo json_encode([
        'id' => $user['id'],
        'username' => $user['username'],
        'token' => base64_encode($user['username'] . '|' . time()),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}



