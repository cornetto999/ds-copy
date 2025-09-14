<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connection.php';
require_once '../models/Student.php';

$student = new Student($conn);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $students = $student->getAll();
            echo json_encode($students);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'POST':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $data = [
                'student_id' => $input['student_id'] ?? '',
                'first_name' => $input['first_name'] ?? '',
                'last_name' => $input['last_name'] ?? '',
                'middle_name' => $input['middle_name'] ?? '',
                'email' => $input['email'] ?? '',
                'program_id' => $input['program_id'] ?? 1,
                'year_level' => $input['year_level'] ?? 1,
                'semester' => $input['semester'] ?? '1st',
                'academic_year' => $input['academic_year'] ?? date('Y') . '-' . (date('Y') + 1),
                'status' => $input['status'] ?? 'Active'
            ];
            
            $result = $student->create($data);
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
                'student_id' => $input['student_id'] ?? '',
                'first_name' => $input['first_name'] ?? '',
                'last_name' => $input['last_name'] ?? '',
                'middle_name' => $input['middle_name'] ?? '',
                'email' => $input['email'] ?? '',
                'program_id' => $input['program_id'] ?? 1,
                'year_level' => $input['year_level'] ?? 1,
                'semester' => $input['semester'] ?? '1st',
                'academic_year' => $input['academic_year'] ?? date('Y') . '-' . (date('Y') + 1),
                'status' => $input['status'] ?? 'Active'
            ];
            
            $result = $student->update($id, $data);
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
            
            $result = $student->delete($id);
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