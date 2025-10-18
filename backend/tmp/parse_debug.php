<?php
// Standalone debug script to run parseFile on a given CSV and dump JSON
if ($argc < 2) {
    fwrite(STDERR, "Usage: php parse_debug.php <csv_path>\n");
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

    $firstLine = fgets($handle);
    if ($firstLine === false) {
        fclose($handle);
        throw new Exception('CSV file appears to be empty.');
    }
    $firstLine = preg_replace('/^\xEF\xBB\xBF/', '', $firstLine);

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
        'p1failed' => 'P1_Failed',
        'p1percent' => 'P1_Percent',
        'p1category' => 'P1_Category',
        'p2failed' => 'P2_Failed',
        'p2percent' => 'P2_Percent',
        'p2category' => 'P2_Category',
        'p3failed' => 'P3_Failed',
        'p3percent' => 'P3_Percent',
        'p3category' => 'P3_Category',
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

    $out = [
        'delimiter' => $delimiter,
        'headers_raw' => $headers,
        'headers_canonical' => $canonicalHeaders,
        'rows' => []
    ];

    while (($line = fgets($handle)) !== false) {
        $row = str_getcsv($line, $delimiter);
        if ($row === null || $row === false) {
            continue;
        }
        if (count(array_filter($row, fn($v) => $v !== null && trim((string)$v) !== '')) === 0) {
            continue;
        }
        if (count($row) < count($canonicalHeaders)) {
            $row = array_pad($row, count($canonicalHeaders), '');
        } elseif (count($row) > count($canonicalHeaders)) {
            $row = array_slice($row, 0, count($canonicalHeaders));
        }
        $row = array_map(function ($v) { return is_string($v) ? trim($v) : $v; }, $row);
        $combined = @array_combine($canonicalHeaders, $row);
        $out['rows'][] = $combined ?: ['combine_failed' => true, 'values' => $row];
    }
    fclose($handle);
    return $out;
}

try {
    $parsed = parseFile($filePath);
    echo json_encode($parsed, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}