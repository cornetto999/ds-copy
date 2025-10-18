<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/headers.php';
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
$programIdParam = isset($_GET['program_id']) ? intval($_GET['program_id']) : null;
$school_year = safe_get('school_year', '2024-2025');
$semester = safe_get('semester', '1st');
$period = safe_get('period', 'All'); // All | P1 | P2 | P3
$debug = (strtolower(safe_get('debug', '0')) === '1' || strtolower(safe_get('debug', 'false')) === 'true');

$db = new DatabaseConnection();
$pdo = $db->pdo();
$teacherModel = new TeacherModel($pdo);

// Resolve program id if a non-empty program name is provided and program_id is not set
$programId = null;
if ($programIdParam && $programIdParam > 0) {
  $programId = $programIdParam;
} else if ($program !== '') {
  $stmt = $pdo->prepare('SELECT id FROM programs WHERE program_name = ? LIMIT 1');
  $stmt->execute([$program]);
  $found = $stmt->fetch();
  if ($found && isset($found['id'])) { $programId = intval($found['id']); }
}

$teachers = $teacherModel->all();
// Recompute per-teacher aggregated stats based on filters so period zones use the filtered denominator
$teachersEnriched = [];
foreach ($teachers as $t) {
  $stats = $teacherModel->aggregateStatsForTeacher(intval($t['id']), $school_year, $semester, $programId);
  $enrolled = intval($stats['enrolled_students'] ?? 0);
  $failed = intval($stats['failed_students'] ?? 0);
  if ($enrolled > 0 || $failed > 0) {
    $teachersEnriched[] = array_merge($t, $stats);
  } else {
    $teachersEnriched[] = $t;
  }
}
$teachers = $teachersEnriched;

$periods = ['P1','P2','P3'];
$selectedPeriods = ($period === 'All') ? $periods : [$period];
$totalTeachers = count($teachers);

// Helper: map category label to zone
function zoneFromCategoryLabel(string $cat): ?string {
  $u = strtoupper(trim($cat));
  if ($u === '') return null;
  if (str_starts_with($u, 'RED')) return 'red';
  if (str_starts_with($u, 'YELLOW')) return 'yellow';
  if (str_starts_with($u, 'GREEN')) return 'green';
  return null;
}

// Helper: zone from percentage using 10/40 thresholds
function zoneFromPercent(float $pct): string {
  if ($pct <= 0) return 'green';
  if ($pct <= 10) return 'green';
  if ($pct <= 40) return 'yellow';
  return 'red';
}

// Helper: determine zone for a teacher row in a given period key ('p1'|'p2'|'p3')
function zoneForTeacherPeriod(array $t, string $pk): ?string {
  $percentKey = $pk . '_percent';
  $failedKey = $pk . '_failed';
  $categoryKey = $pk . '_category';
  $dbPercentRaw = $t[$percentKey] ?? null;
  $failedRaw = $t[$failedKey] ?? null;
  $enrolledRaw = $t['enrolled_students'] ?? null;

  $dbPercent = is_numeric($dbPercentRaw) ? floatval($dbPercentRaw) : null;
  $failed = is_numeric($failedRaw) ? floatval($failedRaw) : null;
  $enrolled = is_numeric($enrolledRaw) ? floatval($enrolledRaw) : null;

  if ($failed !== null && $enrolled !== null && $enrolled > 0) {
    $pct = ($failed / $enrolled) * 100.0;
    return zoneFromPercent($pct);
  }
  if ($dbPercent !== null) {
    return zoneFromPercent($dbPercent);
  }
  $cat = isset($t[$categoryKey]) ? strval($t[$categoryKey]) : '';
  return zoneFromCategoryLabel($cat);
}

// Compute zone counts per selected period using period-based fields
$summaryRows = [];
foreach ($selectedPeriods as $p) {
  $green = 0; $yellow = 0; $red = 0;
  $pk = strtolower($p);
  foreach ($teachers as $t) {
    $zone = zoneForTeacherPeriod($t, $pk);
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

// Include SEMESTRAL placeholder for layout parity when period === All
if ($period === 'All') {
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

// Consistent zone counts: worst-case across periods when All; else mirror single period
$consistent = ['green' => 0, 'yellow' => 0, 'red' => 0];
if ($period === 'All') {
  foreach ($teachers as $t) {
    $zones = [];
    foreach (['p1','p2','p3'] as $pk) {
      $z = zoneForTeacherPeriod($t, $pk);
      if ($z) $zones[] = $z;
    }
    if (in_array('red', $zones, true)) { $consistent['red']++; }
    else if (in_array('yellow', $zones, true)) { $consistent['yellow']++; }
    else if (in_array('green', $zones, true)) { $consistent['green']++; }
  }
} else {
  $match = null;
  foreach ($summaryRows as $row) { if ($row['period'] === $period) { $match = $row; break; } }
  if ($match) {
    $consistent['green'] = intval($match['green_count'] ?? 0);
    $consistent['yellow'] = intval($match['yellow_count'] ?? 0);
    $consistent['red'] = intval($match['red_count'] ?? 0);
  }
}

// Department chart: counts per department by period-based zone
$departmentMap = [];
foreach ($teachers as $t) {
  $dept = isset($t['department']) ? strval($t['department']) : 'Unknown';
  if (!isset($departmentMap[$dept])) {
    $departmentMap[$dept] = ['department' => $dept, 'period' => $period, 'green' => 0, 'yellow' => 0, 'red' => 0];
  }
  if ($period === 'All') {
    $zones = [];
    foreach (['p1','p2','p3'] as $pk) {
      $z = zoneForTeacherPeriod($t, $pk);
      if ($z) $zones[] = $z;
    }
    $zFinal = in_array('red', $zones, true) ? 'red' : (in_array('yellow', $zones, true) ? 'yellow' : (in_array('green', $zones, true) ? 'green' : null));
    if ($zFinal) { $departmentMap[$dept][$zFinal]++; }
  } else {
    $pk = strtolower($period);
    $z = zoneForTeacherPeriod($t, $pk);
    if ($z) { $departmentMap[$dept][$z]++; }
  }
}
$departmentChart = array_values($departmentMap);

$response = [
  'filters' => [ 'program' => $program, 'program_id' => $programId, 'school_year' => $school_year, 'semester' => $semester, 'period' => $period ],
  'summary' => $summaryRows,
  'consistent_zone_counts' => $consistent,
  'department_chart' => $departmentChart,
];

if ($debug) {
  // Attach lightweight debug info to help verification
  $samples = [];
  $limit = 5; $i = 0;
  foreach ($teachers as $t) {
    if ($i >= $limit) break;
    $s = $teacherModel->aggregateStatsForTeacher(intval($t['id']), $school_year, $semester, $programId);
    $samples[] = [
      'teacher_id' => $t['teacher_id'] ?? $t['id'],
      'name' => trim(($t['first_name'] ?? '') . ' ' . ($t['last_name'] ?? '')),
      'enrolled' => $s['enrolled_students'],
      'failed' => $s['failed_students'],
      'percent' => $s['failure_percentage'],
      'zone' => $s['zone'],
    ];
    $i++;
  }
  $response['debug'] = [
    'program_id_resolved' => $programId,
    'teachers_evaluated' => $totalTeachers,
    'samples' => $samples,
  ];
}

header('Content-Type: application/json');
echo json_encode($response);