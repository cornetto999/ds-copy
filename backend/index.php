<?php
declare(strict_types=1);

// Basic CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204); exit;
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = trim($path, '/');

// Simple router mapping
switch ($path) {
    case 'students':
        require __DIR__ . '/routes/students.php';
        break;
    case 'teachers':
        require __DIR__ . '/routes/teachers.php';
        break;
    case 'subjects':
        require __DIR__ . '/routes/subjects.php';
        break;
    case 'upload':
        require __DIR__ . '/routes/upload.php';
        break;
    case 'login':
        require __DIR__ . '/routes/login.php';
        break;
    case 'register':
        require __DIR__ . '/routes/register.php';
        break;
    default:
        header('Content-Type: application/json');
        echo json_encode(['status' => 'ok', 'routes' => ['students','teachers','subjects','upload','login','register']]);
}



