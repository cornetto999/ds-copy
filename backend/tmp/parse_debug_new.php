<?php
// Debug script using the same parseFile logic as upload.php
if ($argc < 2) {
    fwrite(STDERR, "Usage: php parse_debug_new.php <csv_path>\n");
    exit(1);
}
$filePath = $argv[1];
if (!file_exists($filePath)) {
    fwrite(STDERR, "File not found: $filePath\n");
    exit(1);
}

function parseFile($filePath) {
    $data = [];
    $handle = fopen($filePath, 'r');
    if (!$handle) {
        throw new Exception('Unable to open uploaded file for reading.');
    }

    // Read first line raw to detect delimiter and handle BOM
    $firstLine = fgets($handle);
    if ($firstLine === false) {
        fclose($handle);
        throw new Exception('CSV file appears to be empty.');
    }
    $firstLine = preg_replace('/^\xEF\xBB\xBF/', '', $firstLine);

    // Detect delimiter: prefer the one with highest occurrence in header
    $commaCount = substr_count($firstLine, ',');
    $semiCount = substr_count($firstLine, ';');
    $tabCount = substr_count($firstLine, "\t");
    $delimiter = ',';
    if ($semiCount > $commaCount && $semiCount >= $tabCount) {
        $delimiter = ';';
    } elseif ($tabCount > $commaCount && $tabCount > $semiCount) {
        $delimiter = "\t";
    }

    $headers = str_getcsv($firstLine, $delimiter);
    if ($headers === false || count($headers) === 0) {
        fclose($handle);
        throw new Exception('CSV file appears to have no header row.');
    }

    $headers = array_map(function ($h) {
        $h = $h ?? '';
        $h = preg_replace('/^\xEF\xBB\xBF/', '', $h);
        return trim($h);
    }, $headers);

    // Canonicalize common header variations
    $canonicalByNorm = [
        'facultyno' => 'FacultyNo',
        'facultynumber' => 'FacultyNo',
        'faculty_no' => 'FacultyNo',
        'faculty no' => 'FacultyNo',
        'teacherid' => 'teacher_id',
        'id' => 'teacher_id',
        'facultyname' => 'FacultyName',
        'faculty_name' => 'FacultyName',
        'faculty name' => 'FacultyName',
        'name' => 'FacultyName',
        'teachername' => 'FacultyName',
        'instructorname' => 'FacultyName',
        'firstname' => 'first_name',
        'lastname' => 'last_name',
        'enrolledstudents' => 'EnrolledStudents',
        'enrolled' => 'EnrolledStudents',
        'totalenrolled' => 'EnrolledStudents',
        'numberofenrolledstudents' => 'EnrolledStudents',
        'noofenrolledstudents' => 'EnrolledStudents',
        'p1failed' => 'P1_Failed',
        'p1numberoffailed' => 'P1_Failed',
        'p1percent' => 'P1_Percent',
        'p1percentfailed' => 'P1_Percent',
        'p1percentoffailed' => 'P1_Percent',
        'p1offailed' => 'P1_Percent',
        'p1category' => 'P1_Category',
        'p1categorization' => 'P1_Category',
        'p2failed' => 'P2_Failed',
        'p2numberoffailed' => 'P2_Failed',
        'p2percent' => 'P2_Percent',
        'p2percentfailed' => 'P2_Percent',
        'p2percentoffailed' => 'P2_Percent',
        'p2offailed' => 'P2_Percent',
        'p2category' => 'P2_Category',
        'p2categorization' => 'P2_Category',
        'p3failed' => 'P3_Failed',
        'p3numberoffailed' => 'P3_Failed',
        'p3percent' => 'P3_Percent',
        'p3percentfailed' => 'P3_Percent',
        'p3percentoffailed' => 'P3_Percent',
        'p3offailed' => 'P3_Percent',
        'p3category' => 'P3_Category',
        'p3categorization' => 'P3_Category',
        'email' => 'email',
        'department' => 'department',
        'position' => 'position',
        'status' => 'status',
        'zone' => 'zone',
        'notes' => 'notes',
    ];

    $canonicalHeaders = array_map(function ($h) use ($canonicalByNorm) {
        $norm = strtolower(preg_replace('/[^A-Za-z0-9]/', '', $h));
        return $canonicalByNorm[$norm] ?? $h;
    }, $headers);

    $rows = [];
    while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
        if ($row === null || $row === false) {
            continue;
        }
        $nonEmpty = array_filter($row, function ($v) {
            return $v !== null && trim((string)$v) !== '';
        });
        if (count($nonEmpty) === 0) {
            continue;
        }
        if (count($row) < count($canonicalHeaders)) {
            $row = array_pad($row, count($canonicalHeaders), '');
        } elseif (count($row) > count($canonicalHeaders)) {
            $row = array_slice($row, 0, count($canonicalHeaders));
        }
        $row = array_map(function ($v) {
            return is_string($v) ? trim($v) : $v;
        }, $row);
        $combined = @array_combine($canonicalHeaders, $row);
        if ($combined === false) {
            continue;
        }
        $rows[] = $combined;
    }
    fclose($handle);

    return [
        'headers_raw' => $headers,
        'headers_canonical' => $canonicalHeaders,
        'rows' => $rows,
    ];
}

try {
    $parsed = parseFile($filePath);
    echo json_encode($parsed, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}