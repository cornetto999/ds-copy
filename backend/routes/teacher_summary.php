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
    $cat = '';
    if (isset($t[$pkey . '_category']) && is_string($t[$pkey . '_category'])) {
      $cat = strtoupper($t[$pkey . '_category']);
    }
    if ($cat === '') { continue; }
    if (startsWith($cat, 'GREEN')) { $green++; }
    else if (startsWith($cat, 'YELLOW')) { $yellow++; }
    else if (startsWith($cat, 'RED')) { $red++; }
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
    $zones = [];
    foreach ($periods as $p) {
      $k = strtolower($p) . '_category';
      $val = isset($t[$k]) && is_string($t[$k]) ? strtoupper(trim($t[$k])) : '';
      if ($val === '') { continue; }
      if (startsWith($val, 'GREEN')) { $zones[] = 'green'; }
      else if (startsWith($val, 'YELLOW')) { $zones[] = 'yellow'; }
      else if (startsWith($val, 'RED')) { $zones[] = 'red'; }
    }
    $countZones = count($zones);
    if ($countZones >= 2) {
      $unique = array_values(array_unique($zones));
      if (count($unique) === 1) {
        $consistent[$unique[0]]++;
      }
    }
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
    $vote = ['green' => 0, 'yellow' => 0, 'red' => 0];
    foreach ($periods as $p) {
      $k = strtolower($p) . '_category';
      $val = isset($t[$k]) && is_string($t[$k]) ? strtoupper($t[$k]) : '';
      if ($val === '') continue;
      if (startsWith($val, 'GREEN')) { $vote['green']++; }
      else if (startsWith($val, 'YELLOW')) { $vote['yellow']++; }
      else if (startsWith($val, 'RED')) { $vote['red']++; }
    }
    $winner = 'green'; $max = -1;
    foreach ($vote as $k => $v) { if ($v > $max) { $max = $v; $winner = $k; } }
    $departmentMap[$dept][$winner]++;
  } else {
    $k = strtolower($period) . '_category';
    $val = isset($t[$k]) && is_string($t[$k]) ? strtoupper($t[$k]) : '';
    if ($val === '') continue;
    if (startsWith($val, 'GREEN')) { $departmentMap[$dept]['green']++; }
    else if (startsWith($val, 'YELLOW')) { $departmentMap[$dept]['yellow']++; }
    else if (startsWith($val, 'RED')) { $departmentMap[$dept]['red']++; }
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