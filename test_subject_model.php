<?php
require_once '/Applications/XAMPP/xamppfiles/htdocs/deliberation/config/connection.php';
require_once '/Applications/XAMPP/xamppfiles/htdocs/deliberation/models/Subject.php';

echo "Testing Subject model...\n";

$subject = new SubjectModel($conn);

try {
    $subjectData = [
        'subject_code' => 'TEST101',
        'subject_name' => 'Test Subject',
        'description' => 'Test description',
        'units' => 3,
        'year_level' => 1,
        'semester' => 'Y1S1',
        'program_name' => 'BSIT',
        'cutoff_grade' => 60.0
    ];
    
    echo "Creating subject: " . $subjectData['subject_code'] . "\n";
    $id = $subject->create($subjectData);
    echo "Successfully created subject with ID: $id\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "Test completed!\n";
?>


