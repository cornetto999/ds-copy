<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/headers.php';
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') { http_response_code(405); echo json_encode(['error' => 'Method Not Allowed']); exit; }

require_once __DIR__ . '/../models/Teacher.php';
require_once __DIR__ . '/../config/connection.php';

function safe_get(string $key, $default = null) {
  return isset($_GET[$key]) ? trim(strval($_GET[$key])) : $default;
}

function zoneFromPercent(float $pct): string {
  if ($pct <= 0) return 'green';
  if ($pct <= 10) return 'green';
  if ($pct <= 40) return 'yellow';
  return 'red';
}

$program = safe_get('program', '');
$programIdParam = isset($_GET['program_id']) ? intval($_GET['program_id']) : null;
$school_year = safe_get('school_year', date('Y') . '-' . (intval(date('Y')) + 1));
$semester = safe_get('semester', '1st');
$debug = (strtolower(safe_get('debug', '0')) === '1' || strtolower(safe_get('debug', 'false')) === 'true');

$db = new DatabaseConnection();
$pdo = $db->pdo();

// Resolve program id if name provided
$programId = null;
if ($programIdParam && $programIdParam > 0) {
  $programId = $programIdParam;
} else if ($program !== '') {
  $stmt = $pdo->prepare('SELECT id FROM programs WHERE program_name = ? LIMIT 1');
  $stmt->execute([$program]);
  $found = $stmt->fetch();
  if ($found && isset($found['id'])) { $programId = intval($found['id']); }
}

$currentYear = intval(date('Y'));
$currentMonth = intval(date('n'));
$months = [];
for ($m = 1; $m <= $currentMonth; $m++) { $months[] = $m; }

// Build teacher-month aggregates filtered by school_year, semester, and optional program
$sql = "
  SELECT 
    MONTH(g.created_at) AS month_num,
    t.id AS teacher_id,
    t.department AS department,
    COUNT(DISTINCT g.student_id) AS total,
    COUNT(DISTINCT CASE WHEN g.status = 'Failed' THEN g.student_id END) AS failed
  FROM student_grades g
  LEFT JOIN students s ON s.id = g.student_id
  LEFT JOIN teachers t ON t.id = g.teacher_id
  WHERE g.student_id IS NOT NULL
    AND (g.status IS NULL OR g.status NOT IN ('Dropped','Withdrawn'))
    AND g.academic_year = :sy
    AND g.semester = :sem
    AND YEAR(g.created_at) = :cy
";
$params = ['sy' => $school_year, 'sem' => $semester, 'cy' => $currentYear];
if ($programId !== null && $programId > 0) {
  $sql .= " AND s.program_id = :pid";
  $params['pid'] = $programId;
}
$sql .= " GROUP BY month_num, teacher_id, department ORDER BY month_num ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

// Aggregate counts per month by zone and track per-department counts
$monthData = [];
foreach ($months as $m) {
  $monthData[$m] = [
    'month_num' => $m,
    'green' => 0,
    'yellow' => 0,
    'red' => 0,
    'dept_counts' => [
      'green' => [],
      'yellow' => [],
      'red' => [],
    ],
  ];
}

foreach ($rows as $r) {
  $mnum = intval($r['month_num'] ?? 0);
  if ($mnum < 1 || $mnum > $currentMonth) { continue; }
  $total = intval($r['total'] ?? 0);
  $failed = intval($r['failed'] ?? 0);
  $dept = strval($r['department'] ?? 'Unknown');
  $pct = $total > 0 ? ($failed / $total) * 100.0 : 0.0;
  $zone = zoneFromPercent($pct);

  $monthData[$mnum][$zone] += 1; // count teacher in this zone for this month
  if (!isset($monthData[$mnum]['dept_counts'][$zone][$dept])) {
    $monthData[$mnum]['dept_counts'][$zone][$dept] = 0;
  }
  $monthData[$mnum]['dept_counts'][$zone][$dept] += 1;
}

// Compute top department per zone per month and format output
function monthLabel(int $m): string {
  return date('M', mktime(0, 0, 0, $m, 1));
}

$monthly = [];
foreach ($months as $m) {
  $entry = $monthData[$m];
  $top = [ 'green' => null, 'yellow' => null, 'red' => null ];
  foreach (['green','yellow','red'] as $z) {
    $maxDept = null; $maxVal = -1;
    foreach ($entry['dept_counts'][$z] as $d => $val) {
      if ($val > $maxVal) { $maxVal = $val; $maxDept = $d; }
    }
    $top[$z] = $maxDept;
  }
  $monthly[] = [
    'month_num' => $m,
    'month_label' => monthLabel($m),
    'green' => intval($entry['green']),
    'yellow' => intval($entry['yellow']),
    'red' => intval($entry['red']),
    'top_departments' => $top,
  ];
}

$response = [
  'filters' => [ 'program' => $program, 'program_id' => $programId, 'school_year' => $school_year, 'semester' => $semester ],
  'months' => array_map(fn($m) => monthLabel(intval($m)), $months),
  'monthly_zone_counts' => $monthly,
];

if ($debug) {
  $response['debug'] = [ 'months' => $months, 'rows_evaluated' => count($rows) ];
}

header('Content-Type: application/json');
echo json_encode($response);