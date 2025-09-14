<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connection.php';
require_once '../models/Subject.php';

$subject = new Subject($conn);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $subjects = $subject->getAll();
            echo json_encode($subjects);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'POST':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $data = [
                'subject_code' => $input['subject_code'] ?? '',
                'subject_name' => $input['subject_name'] ?? '',
                'description' => $input['description'] ?? '',
                'units' => $input['units'] ?? 0,
                'year_level' => $input['year_level'] ?? 1,
                'semester' => $input['semester'] ?? '',
                'program_id' => $input['program_id'] ?? 1,
                'cutoff_grade' => $input['cutoff_grade'] ?? 60.0
            ];
            
            $result = $subject->create($data);
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
                'subject_code' => $input['subject_code'] ?? '',
                'subject_name' => $input['subject_name'] ?? '',
                'description' => $input['description'] ?? '',
                'units' => $input['units'] ?? 0,
                'year_level' => $input['year_level'] ?? 1,
                'semester' => $input['semester'] ?? '',
                'program_id' => $input['program_id'] ?? 1,
                'cutoff_grade' => $input['cutoff_grade'] ?? 60.0
            ];
            
            $result = $subject->update($id, $data);
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
            
            $result = $subject->delete($id);
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