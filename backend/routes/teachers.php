<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Teacher.php';

require_once __DIR__ . '/../api/headers.php';

$model = TeacherModel::withDefaultConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function body(): array {
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

try {
    if ($method === 'GET') {
        // Optional filters to recompute grade-based stats
        $schoolYear = isset($_GET['school_year']) ? trim(strval($_GET['school_year'])) : null;
        $semester = isset($_GET['semester']) ? trim(strval($_GET['semester'])) : null;
        $programParam = isset($_GET['program_id']) ? intval($_GET['program_id']) : null;
        // Accept 'program' as numeric id if present
        if ($programParam === null && isset($_GET['program'])) {
            $maybeInt = intval($_GET['program']);
            if ($maybeInt > 0) $programParam = $maybeInt;
        }
        $recompute = isset($_GET['recompute']) ? (strval($_GET['recompute']) === '1' || strtolower(strval($_GET['recompute'])) === 'true') : true;

        if (isset($_GET['id'])) {
            $row = $model->find(intval($_GET['id']));
            if (!$row) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
            if ($recompute) {
                $stats = $model->aggregateStatsForTeacher(intval($row['id']), $schoolYear, $semester, $programParam);
                $enrolled = intval($stats['enrolled_students'] ?? 0);
                $failed = intval($stats['failed_students'] ?? 0);
                // Only merge recomputed stats when grade data exists; otherwise preserve imported period values and zone
                if ($enrolled > 0 || $failed > 0) {
                    $row = array_merge($row, $stats);
                    $row['zone'] = $stats['zone'];
                }
            }
            echo json_encode($row); exit;
        }
        $rows = $model->all();
        if ($recompute) {
            foreach ($rows as &$row) {
                $stats = $model->aggregateStatsForTeacher(intval($row['id']), $schoolYear, $semester, $programParam);
                $enrolled = intval($stats['enrolled_students'] ?? 0);
                $failed = intval($stats['failed_students'] ?? 0);
                // Only merge recomputed stats when grade data exists
                if ($enrolled > 0 || $failed > 0) {
                    $row = array_merge($row, $stats);
                    $row['zone'] = $stats['zone'];
                }
                // else preserve original imported period values and zone
            }
            unset($row);
        }
        echo json_encode($rows); exit;
    }

    if ($method === 'POST') {
        $id = $model->create(body());
        echo json_encode(['id' => $id]); exit;
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if (!isset($_GET['id'])) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
        $ok = $model->update(intval($_GET['id']), body());
        echo json_encode(['success' => $ok]); exit;
    }

    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
        $ok = $model->delete(intval($_GET['id']));
        echo json_encode(['success' => $ok]); exit;
    }

    http_response_code(405); echo json_encode(['error' => 'Method not allowed']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}



