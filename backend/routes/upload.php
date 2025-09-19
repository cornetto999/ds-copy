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

// Validate file type - support CSV and provide helpful error for Excel
$allowedTypes = ['text/csv', 'text/plain', 'application/csv'];
$fileType = $file['type'];
$fileName = $file['name'];
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Check if it's an Excel file
$isExcelFile = in_array($fileExtension, ['xlsx', 'xls']) || 
               in_array($fileType, ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']);

if ($isExcelFile) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Excel files are not directly supported. Please convert your Excel file to CSV format:',
        'instructions' => [
            '1. Open your Excel file',
            '2. Go to File > Save As',
            '3. Choose "CSV (Comma delimited)" format',
            '4. Save the file',
            '5. Upload the CSV file instead'
        ],
        'supported_formats' => ['CSV (.csv)'],
        'file_type_detected' => $fileExtension
    ]);
    exit;
}

// Check if it's a valid CSV file
$isValidType = in_array($fileType, $allowedTypes) || $fileExtension === 'csv';

if (!$isValidType) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid file type. Please upload CSV files only.',
        'supported_formats' => ['CSV (.csv)'],
        'file_type_detected' => $fileExtension
    ]);
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
                    // Handle both old format and new performance format
                    $teacherData = [
                        'teacher_id' => $row['FacultyNo'] ?? $row['teacher_id'] ?? '',
                        'first_name' => $row['FacultyName'] ?? $row['first_name'] ?? '',
                        'last_name' => '', // Will be extracted from FacultyName
                        'middle_name' => null,
                        'email' => $row['email'] ?? null,
                        'department' => $row['department'] ?? 'General',
                        'position' => $row['position'] ?? null,
                        'status' => $row['status'] ?? 'Active',
                        'zone' => $row['zone'] ?? 'green',
                        'notes' => $row['notes'] ?? null,
                        'enrolled_students' => (int)($row['EnrolledStudents'] ?? $row['enrolled_students'] ?? 0),
                        'p1_failed' => (int)($row['P1_Failed'] ?? $row['p1_failed'] ?? 0),
                        'p1_percent' => (float)($row['P1_Percent'] ?? $row['p1_percent'] ?? 0.00),
                        'p1_category' => $row['P1_Category'] ?? $row['p1_category'] ?? 'GREEN (0.01%-10%)',
                        'p2_failed' => (int)($row['P2_Failed'] ?? $row['p2_failed'] ?? 0),
                        'p2_percent' => (float)($row['P2_Percent'] ?? $row['p2_percent'] ?? 0.00),
                        'p2_category' => $row['P2_Category'] ?? $row['p2_category'] ?? 'GREEN (0.01%-10%)'
                    ];
                    
                    // Extract first and last name from FacultyName if using new format
                    if (isset($row['FacultyName']) && !empty($row['FacultyName'])) {
                        $nameParts = explode(' ', trim($row['FacultyName']));
                        if (count($nameParts) >= 2) {
                            $teacherData['last_name'] = array_pop($nameParts); // Last part is last name
                            $teacherData['first_name'] = implode(' ', $nameParts); // Everything else is first name
                        } else {
                            $teacherData['first_name'] = $row['FacultyName'];
                            $teacherData['last_name'] = '';
                        }
                    }
                    
                    // Validate required fields
                    if (empty($teacherData['teacher_id']) || empty($teacherData['first_name'])) {
                        throw new Exception('Missing required fields: FacultyNo/teacher_id and FacultyName/first_name');
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