<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') { http_response_code(405); echo json_encode(['error' => 'Method Not Allowed']); exit; }

require_once __DIR__ . '/../models/Teacher.php';
require_once __DIR__ . '/../config/connection.php';

function startsWith($haystack, $needle) {
  return strncmp($haystack, $needle, strlen($needle)) === 0;
}

function safe_get(string $key, $default = null) {
  return isset($_GET[$key]) ? trim(strval($_GET[$key])) : $default;
}

$program = safe_get('program', '');
$school_year = safe_get('school_year', '2024-2025');
$semester = safe_get('semester', '1st');
$period = safe_get('period', 'All'); // All | P1 | P2 | P3

$teacherModel = TeacherModel::withDefaultConnection();
$teachers = $teacherModel->all();

// NOTE: Current teacher schema does not include school_year/semester/program.
// We accept filters for forward compatibility but do not apply them to DB yet.
// Summary is computed from existing teacher columns: p1_category, p2_category, p3_category and department.

$periods = ['P1','P2','P3'];
$selectedPeriods = ($period === 'All') ? $periods : [$period];

$totalTeachers = count($teachers);

$summaryRows = [];
foreach ($selectedPeriods as $p) {
  $pkey = strtolower($p); // p1/p2/p3
  $green = 0; $yellow = 0; $red = 0;
  foreach ($teachers as $t) {
    $percentKey = $pkey . '_percent';
    $failedKey = $pkey . '_failed';

    $pct = null;
    $enrolled = isset($t['enrolled_students']) && is_numeric($t['enrolled_students']) ? intval($t['enrolled_students']) : null;
    $failed = isset($t[$failedKey]) && is_numeric($t[$failedKey]) ? intval($t[$failedKey]) : null;
    if ($enrolled !== null && $enrolled > 0 && $failed !== null) {
      $pct = ($failed / $enrolled) * 100.0;
    } else if (isset($t[$percentKey]) && is_numeric($t[$percentKey])) {
      $pct = floatval($t[$percentKey]);
    }

    $zone = null;
    if ($pct !== null) {
      if ($pct > 40) { $zone = 'red'; }
      else if ($pct > 10) { $zone = 'yellow'; }
      else { $zone = 'green'; }
    } else {
      $cat = isset($t[$pkey . '_category']) && is_string($t[$pkey . '_category']) ? strtoupper(trim($t[$pkey . '_category'])) : '';
      if ($cat === '') { continue; }
      if (startsWith($cat, 'RED')) { $zone = 'red'; }
      else if (startsWith($cat, 'YELLOW')) { $zone = 'yellow'; }
      else if (startsWith($cat, 'GREEN')) { $zone = 'green'; }
    }

    if ($zone === 'green') { $green++; }
    else if ($zone === 'yellow') { $yellow++; }
    else if ($zone === 'red') { $red++; }
  }
  $summaryRows[] = [
    'period' => $p,
    'total_teachers' => $totalTeachers,
    'green_count' => $green,
    'green_percent' => $totalTeachers > 0 ? round(($green / $totalTeachers) * 100, 2) : 0,
    'yellow_count' => $yellow,
    'yellow_percent' => $totalTeachers > 0 ? round(($yellow / $totalTeachers) * 100, 2) : 0,
    'red_count' => $red,
    'red_percent' => $totalTeachers > 0 ? round(($red / $totalTeachers) * 100, 2) : 0,
  ];
}

// Semestral row: placeholder with dashes to match requested layout
$includeSemestral = ($period === 'All');
if ($includeSemestral) {
  $summaryRows[] = [
    'period' => 'SEMESTRAL',
    'total_teachers' => null,
    'green_count' => null,
    'green_percent' => null,
    'yellow_count' => null,
    'yellow_percent' => null,
    'red_count' => null,
    'red_percent' => null,
  ];
}

// Consistent zone counts for the selected period(s)
// For a single period, consistent == counts in that period.
// For All, treat a teacher as consistent if all non-empty period categories are the same zone (require at least 2 periods).
$consistent = ['green' => 0, 'yellow' => 0, 'red' => 0];
if ($period === 'All') {
  foreach ($teachers as $t) {
    $hasRed = false; $hasYellow = false; $hasGreen = false;
    foreach ($periods as $p) {
      $pkey = strtolower($p);
      $percentKey = $pkey . '_percent';
      $failedKey = $pkey . '_failed';
      $pct = null;
      $enrolled = isset($t['enrolled_students']) && is_numeric($t['enrolled_students']) ? intval($t['enrolled_students']) : null;
      $failed = isset($t[$failedKey]) && is_numeric($t[$failedKey]) ? intval($t[$failedKey]) : null;
      if ($enrolled !== null && $enrolled > 0 && $failed !== null) {
        $pct = ($failed / $enrolled) * 100.0;
      } else if (isset($t[$percentKey]) && is_numeric($t[$percentKey])) {
        $pct = floatval($t[$percentKey]);
      }
      if ($pct !== null) {
        if ($pct > 40) { $hasRed = true; }
        else if ($pct > 10) { $hasYellow = true; }
        else { $hasGreen = true; }
      } else {
        $k = $pkey . '_category';
        $val = isset($t[$k]) && is_string($t[$k]) ? strtoupper(trim($t[$k])) : '';
        if ($val === '') { continue; }
        if (startsWith($val, 'RED')) { $hasRed = true; }
        else if (startsWith($val, 'YELLOW')) { $hasYellow = true; }
        else if (startsWith($val, 'GREEN')) { $hasGreen = true; }
      }
    }
    if ($hasRed) { $consistent['red']++; }
    else if ($hasYellow) { $consistent['yellow']++; }
    else if ($hasGreen) { $consistent['green']++; }
  }
} else {
  // Single period: use that period counts
  $match = null;
  foreach ($summaryRows as $row) { if ($row['period'] === $period) { $match = $row; break; } }
  if ($match) {
    $consistent['green'] = $match['green_count'];
    $consistent['yellow'] = $match['yellow_count'];
    $consistent['red'] = $match['red_count'];
  }
}

// Department chart data: counts per department by zone for selected period(s)
$departmentMap = [];
foreach ($teachers as $t) {
  $dept = isset($t['department']) ? strval($t['department']) : 'Unknown';
  if (!isset($departmentMap[$dept])) {
    $departmentMap[$dept] = ['department' => $dept, 'period' => $period, 'green' => 0, 'yellow' => 0, 'red' => 0];
  }
  // For All, aggregate across all periods: count a teacher into zone if majority across periods falls into zone
  if ($period === 'All') {
    // Worst-case zone across periods using percent-based classification with category fallback
    $hasRed = false; $hasYellow = false; $hasGreen = false;
    foreach ($periods as $p) {
      $pkey = strtolower($p);
      $percentKey = $pkey . '_percent';
      $failedKey = $pkey . '_failed';
      $pct = null;
      $enrolled = isset($t['enrolled_students']) && is_numeric($t['enrolled_students']) ? intval($t['enrolled_students']) : null;
      $failed = isset($t[$failedKey]) && is_numeric($t[$failedKey]) ? intval($t[$failedKey]) : null;
      if ($enrolled !== null && $enrolled > 0 && $failed !== null) {
        $pct = ($failed / $enrolled) * 100.0;
      } else if (isset($t[$percentKey]) && is_numeric($t[$percentKey])) {
        $pct = floatval($t[$percentKey]);
      }
      if ($pct !== null) {
        if ($pct > 40) { $hasRed = true; }
        else if ($pct > 10) { $hasYellow = true; }
        else { $hasGreen = true; }
      } else {
        $k = $pkey . '_category';
        $val = isset($t[$k]) && is_string($t[$k]) ? strtoupper(trim($t[$k])) : '';
        if ($val === '') continue;
        if (startsWith($val, 'RED')) { $hasRed = true; }
        else if (startsWith($val, 'YELLOW')) { $hasYellow = true; }
        else if (startsWith($val, 'GREEN')) { $hasGreen = true; }
      }
    }
    if ($hasRed) { $departmentMap[$dept]['red']++; }
    else if ($hasYellow) { $departmentMap[$dept]['yellow']++; }
    else if ($hasGreen) { $departmentMap[$dept]['green']++; }
  } else {
    $pkey = strtolower($period);
    $percentKey = $pkey . '_percent';
    $failedKey = $pkey . '_failed';
    $pct = null;
    $enrolled = isset($t['enrolled_students']) && is_numeric($t['enrolled_students']) ? intval($t['enrolled_students']) : null;
    $failed = isset($t[$failedKey]) && is_numeric($t[$failedKey]) ? intval($t[$failedKey]) : null;
    if ($enrolled !== null && $enrolled > 0 && $failed !== null) {
      $pct = ($failed / $enrolled) * 100.0;
    } else if (isset($t[$percentKey]) && is_numeric($t[$percentKey])) {
      $pct = floatval($t[$percentKey]);
    }
    if ($pct !== null) {
      if ($pct > 40) { $departmentMap[$dept]['red']++; }
      else if ($pct > 10) { $departmentMap[$dept]['yellow']++; }
      else { $departmentMap[$dept]['green']++; }
    } else {
      $k = $pkey . '_category';
      $val = isset($t[$k]) && is_string($t[$k]) ? strtoupper($t[$k]) : '';
      if ($val === '') continue;
      if (startsWith($val, 'GREEN')) { $departmentMap[$dept]['green']++; }
      else if (startsWith($val, 'YELLOW')) { $departmentMap[$dept]['yellow']++; }
      else if (startsWith($val, 'RED')) { $departmentMap[$dept]['red']++; }
    }
  }
}
$departmentChart = array_values($departmentMap);

header('Content-Type: application/json');
echo json_encode([
  'filters' => [ 'program' => $program, 'school_year' => $school_year, 'semester' => $semester, 'period' => $period ],
  'summary' => $summaryRows,
  'consistent_zone_counts' => $consistent,
  'department_chart' => $departmentChart,
]);