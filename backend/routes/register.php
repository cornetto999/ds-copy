<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/User.php';

header('Content-Type: application/json');

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
    if ($username === '' || $password === '') { http_response_code(400); echo json_encode(['error' => 'Missing fields']); exit; }

    $model = UserModel::withDefaultConnection();
    $existing = $model->findByUsername($username);
    if ($existing) { http_response_code(409); echo json_encode(['error' => 'Username taken']); exit; }
    $id = $model->create($username, $password);
    echo json_encode(['id' => $id, 'username' => $username]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}



