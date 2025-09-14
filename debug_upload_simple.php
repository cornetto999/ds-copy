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

echo "Debug upload\n";
echo "File type: " . $file['type'] . "\n";
echo "File name: " . $file['name'] . "\n";
echo "File size: " . $file['size'] . "\n";
echo "Upload type: " . $uploadType . "\n";
echo "Upload type (lowercase): " . strtolower($uploadType) . "\n";

// Parse CSV
$handle = fopen($file['tmp_name'], 'r');
$data = [];
if ($handle) {
    $headers = fgetcsv($handle);
    echo "Headers: " . json_encode($headers) . "\n";
    while (($row = fgetcsv($handle)) !== false) {
        if (count($row) > 0 && !empty(trim(implode('', $row)))) {
            $data[] = array_combine($headers, $row);
        }
    }
    fclose($handle);
}

echo "Parsed " . count($data) . " records\n";
print_r($data);

// Process data based on type
$count = 0;
$errors = [];

switch (strtolower($uploadType)) {
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
                    'gpa' => !empty($row['gpa']) ? (float)$row['gpa'] : null,
                    'at_risk' => isset($row['at_risk']) ? (int)($row['at_risk'] == '1' || $row['at_risk'] === 'true' || $row['at_risk'] === true) : 0,
                    'notes' => $row['notes'] ?? null,
                    'grade_level' => !empty($row['grade_level']) ? (int)$row['grade_level'] : 1
                ];
                
                echo "Creating student: " . $studentData['student_id'] . "\n";
                $student->create($studentData);
                $count++;
            } catch (Exception $e) {
                $errors[] = "Row " . ($count + 1) . ": " . $e->getMessage();
                echo "Error: " . $e->getMessage() . "\n";
            }
        }
        break;
        
    case 'teachers':
        $teacher = new TeacherModel($conn);
        foreach ($data as $row) {
            try {
                $teacherData = [
                    'first_name' => $row['first_name'] ?? '',
                    'last_name' => $row['last_name'] ?? '',
                    'email' => $row['email'] ?? '',
                    'department' => $row['department'] ?? 'General'
                ];
                
                echo "Creating teacher: " . $teacherData['first_name'] . " " . $teacherData['last_name'] . "\n";
                $teacher->create($teacherData);
                $count++;
            } catch (Exception $e) {
                $errors[] = "Row " . ($count + 1) . ": " . $e->getMessage();
                echo "Error: " . $e->getMessage() . "\n";
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
                
                echo "Creating subject: " . $subjectData['subject_code'] . "\n";
                $subject->create($subjectData);
                $count++;
            } catch (Exception $e) {
                $errors[] = "Row " . ($count + 1) . ": " . $e->getMessage();
                echo "Error: " . $e->getMessage() . "\n";
            }
        }
        break;
        
    case 'programs':
        $program = new ProgramModel($conn);
        foreach ($data as $row) {
            try {
                $programData = [
                    'program_code' => $row['program_code'] ?? '',
                    'program_name' => $row['program_name'] ?? '',
                    'description' => $row['description'] ?? '',
                    'duration_years' => (int)($row['duration_years'] ?? 4)
                ];
                
                echo "Creating program: " . $programData['program_code'] . "\n";
                $program->create($programData);
                $count++;
            } catch (Exception $e) {
                $errors[] = "Row " . ($count + 1) . ": " . $e->getMessage();
                echo "Error: " . $e->getMessage() . "\n";
            }
        }
        break;
}

echo "Result: Successfully created $count $uploadType\n";
if (!empty($errors)) {
    echo "Errors: " . implode(', ', $errors) . "\n";
}

echo json_encode([
    'success' => true,
    'message' => "Successfully imported $count $uploadType records",
    'count' => $count,
    'errors' => $errors
]);
?>
