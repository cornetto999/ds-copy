<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/connection.php';
require_once '../models/Student.php';
require_once '../models/Teacher.php';
require_once '../models/Subject.php';
require_once '../models/Program.php';

// Check if file was uploaded
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['file'];
$uploadType = $_POST['type'] ?? 'students';

// Validate file type - only CSV supported
$allowedTypes = ['text/csv'];
$fileType = $file['type'];

if (!in_array($fileType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Please upload CSV files only. Excel files are not currently supported.']);
    exit;
}

// Create uploads directory if it doesn't exist
$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$fileName = uniqid() . '_' . $file['name'];
$filePath = $uploadDir . $fileName;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save uploaded file']);
    exit;
}

try {
    $data = parseFile($filePath, $fileType);
    $result = processData($data, $uploadType, $conn);
    
    // Clean up uploaded file
    unlink($filePath);
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully imported {$result['count']} {$uploadType} records",
        'count' => $result['count'],
        'errors' => $result['errors'] ?? []
    ]);
    
} catch (Exception $e) {
    // Clean up uploaded file
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function parseFile($filePath, $fileType) {
    $data = [];
    
    if ($fileType === 'text/csv') {
        // Parse CSV
        $handle = fopen($filePath, 'r');
        if ($handle) {
            $headers = fgetcsv($handle);
            while (($row = fgetcsv($handle)) !== false) {
                $data[] = array_combine($headers, $row);
            }
            fclose($handle);
        }
    } else {
        // For Excel files, we need to use a different approach
        // Since we don't have PhpSpreadsheet installed, we'll try to convert to CSV first
        // or provide a clear error message
        throw new Exception('Excel file parsing requires PhpSpreadsheet library. Please convert your Excel file to CSV format or install the required dependencies.');
    }
    
    return $data;
}

function processData($data, $type, $conn) {
    $count = 0;
    $errors = [];
    
    switch ($type) {
        case 'students':
            $student = new StudentModel($conn);
            foreach ($data as $row) {
                try {
                    $studentData = [
                        'student_id' => $row['student_id'] ?? '',
                        'first_name' => $row['first_name'] ?? '',
                        'last_name' => $row['last_name'] ?? '',
                        'email' => $row['email'] ?? '',
                        'program' => $row['program'] ?? 'BSIT',
                        'year_level' => $row['year_level'] ?? '1st Year',
                        'status' => $row['status'] ?? 'active',
                        'gpa' => $row['gpa'] ?? null,
                        'at_risk' => isset($row['at_risk']) ? (bool)$row['at_risk'] : false,
                        'notes' => $row['notes'] ?? null
                    ];
                    $student->create($studentData);
                    $count++;
                } catch (Exception $e) {
                    $errors[] = "Row " . ($count + 1) . ": " . $e->getMessage();
                }
            }
            break;
            
        case 'teachers':
            $teacher = new TeacherModel($conn);
            foreach ($data as $row) {
                try {
                    $teacherData = [
                        'teacher_id' => $row['teacher_id'] ?? '',
                        'first_name' => $row['first_name'] ?? '',
                        'last_name' => $row['last_name'] ?? '',
                        'middle_name' => $row['middle_name'] ?? null,
                        'email' => $row['email'] ?? null,
                        'department' => $row['department'] ?? 'General',
                        'position' => $row['position'] ?? null,
                        'status' => $row['status'] ?? 'Active',
                        'zone' => $row['zone'] ?? 'green',
                        'notes' => $row['notes'] ?? null
                    ];
                    
                    // Validate required fields
                    if (empty($teacherData['teacher_id']) || empty($teacherData['first_name']) || empty($teacherData['last_name'])) {
                        throw new Exception('Missing required fields: teacher_id, first_name, or last_name');
                    }
                    
                    $teacher->create($teacherData);
                    $count++;
                } catch (Exception $e) {
                    $errors[] = "Row " . ($count + 1) . ": " . $e->getMessage();
                }
            }
            break;
            
        case 'subjects':
            $subject = new SubjectModel($conn);
            foreach ($data as $row) {
                try {
                    $subjectData = [
                        'subject_code' => $row['subject_code'] ?? '',
                        'subject_name' => $row['subject_name'] ?? '',
                        'description' => $row['description'] ?? '',
                        'units' => (int)($row['units'] ?? 3),
                        'year_level' => (int)($row['year_level'] ?? 1),
                        'semester' => $row['semester'] ?? 'Y1S1',
                        'program_name' => $row['program'] ?? 'BSIT',
                        'cutoff_grade' => (float)($row['cutoff'] ?? 60.0)
                    ];
                    $subject->create($subjectData);
                    $count++;
                } catch (Exception $e) {
                    $errors[] = "Row " . ($count + 1) . ": " . $e->getMessage();
                }
            }
            break;
    }
    
    return ['count' => $count, 'errors' => $errors];
}
?>