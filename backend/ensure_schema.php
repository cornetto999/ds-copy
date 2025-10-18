<?php
// Ensure required columns exist for current backend models
require_once __DIR__ . '/config/connection.php';

$db = new DatabaseConnection();
$pdo = $db->pdo();

function hasColumn(PDO $pdo, string $table, string $column): bool {
    $stmt = $pdo->prepare('SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?');
    $stmt->execute([$table, $column]);
    $row = $stmt->fetch();
    return intval($row['cnt'] ?? 0) > 0;
}

// Students: ensure zone, at_risk, notes
if (!hasColumn($pdo, 'students', 'zone')) {
    $pdo->exec("ALTER TABLE students ADD COLUMN zone ENUM('green','yellow','red') NOT NULL DEFAULT 'green' AFTER status");
    echo "Added students.zone\n";
}
if (!hasColumn($pdo, 'students', 'at_risk')) {
    $pdo->exec("ALTER TABLE students ADD COLUMN at_risk TINYINT(1) NOT NULL DEFAULT 0 AFTER zone");
    echo "Added students.at_risk\n";
}
if (!hasColumn($pdo, 'students', 'notes')) {
    $pdo->exec("ALTER TABLE students ADD COLUMN notes TEXT NULL AFTER at_risk");
    echo "Added students.notes\n";
}

echo "Schema checks completed.\n";