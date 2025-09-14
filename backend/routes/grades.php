<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connection.php';
require_once '../models/Grade.php';

$grade = new Grade($conn);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $grades = $grade->getAll();
            echo json_encode($grades);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'POST':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $data = [
                'student_id' => $input['student_id'] ?? 0,
                'subject_id' => $input['subject_id'] ?? 0,
                'academic_year' => $input['academic_year'] ?? date('Y') . '-' . (date('Y') + 1),
                'semester' => $input['semester'] ?? '1st',
                'midterm_grade' => $input['midterm_grade'] ?? null,
                'final_grade' => $input['final_grade'] ?? null,
                'final_rating' => $input['final_rating'] ?? null,
                'status' => $input['status'] ?? 'Failed'
            ];
            
            $result = $grade->create($data);
            echo json_encode(['success' => true, 'id' => $result]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? 0;
            
            $data = [
                'student_id' => $input['student_id'] ?? 0,
                'subject_id' => $input['subject_id'] ?? 0,
                'academic_year' => $input['academic_year'] ?? date('Y') . '-' . (date('Y') + 1),
                'semester' => $input['semester'] ?? '1st',
                'midterm_grade' => $input['midterm_grade'] ?? null,
                'final_grade' => $input['final_grade'] ?? null,
                'final_rating' => $input['final_rating'] ?? null,
                'status' => $input['status'] ?? 'Failed'
            ];
            
            $result = $grade->update($id, $data);
            echo json_encode(['success' => $result]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? 0;
            
            $result = $grade->delete($id);
            echo json_encode(['success' => $result]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>