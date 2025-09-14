<?php
// Simple test of upload functionality
require_once '/Applications/XAMPP/xamppfiles/htdocs/deliberation/config/connection.php';
require_once '/Applications/XAMPP/xamppfiles/htdocs/deliberation/models/Student.php';

// Test CSV parsing
$csvContent = "student_id,first_name,last_name,email,program,year_level,status,gpa,at_risk,notes,grade_level\nTEST007,Charlie,Brown,charlie.brown@example.com,BSIT,1st Year,active,3.5,0,Test student,1";

echo "Testing CSV parsing...\n";
echo "CSV content:\n$csvContent\n\n";

// Parse CSV
$lines = explode("\n", $csvContent);
$headers = str_getcsv($lines[0]);
$data = [];

for ($i = 1; $i < count($lines); $i++) {
    if (!empty(trim($lines[$i]))) {
        $row = str_getcsv($lines[$i]);
        $data[] = array_combine($headers, $row);
    }
}

echo "Parsed " . count($data) . " records\n";
print_r($data);

// Test student creation
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
        $id = $student->create($studentData);
        echo "Successfully created student with ID: $id\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

echo "Test completed!\n";
?>