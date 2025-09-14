<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/connection.php';

class TeacherModel {
    public function __construct(private PDO $pdo) {}

    public static function withDefaultConnection(): self {
        $db = new DatabaseConnection();
        return new self($db->pdo());
    }

    public function all(): array {
        $stmt = $this->pdo->query('
            SELECT t.*, 
                   COUNT(s.id) as enrolled_students,
                   COUNT(CASE WHEN s.zone = "red" THEN 1 END) as failed_students,
                   ROUND(COUNT(CASE WHEN s.zone = "red" THEN 1 END) * 100.0 / NULLIF(COUNT(s.id), 0), 2) as failure_percentage
            FROM teachers t 
            LEFT JOIN subjects sub ON t.id = sub.teacher_id
            LEFT JOIN students s ON sub.id = s.subject_id
            GROUP BY t.id 
            ORDER BY t.created_at DESC
        ');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->pdo->prepare('
            SELECT t.*, 
                   COUNT(s.id) as enrolled_students,
                   COUNT(CASE WHEN s.zone = "red" THEN 1 END) as failed_students,
                   ROUND(COUNT(CASE WHEN s.zone = "red" THEN 1 END) * 100.0 / NULLIF(COUNT(s.id), 0), 2) as failure_percentage
            FROM teachers t 
            LEFT JOIN subjects sub ON t.id = sub.teacher_id
            LEFT JOIN students s ON sub.id = s.subject_id
            WHERE t.id = ?
            GROUP BY t.id
        ');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO teachers (teacher_id, first_name, last_name, middle_name, email, 
                                department, position, status, zone, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['teacher_id'] ?? '',
            $data['first_name'] ?? '',
            $data['last_name'] ?? '',
            $data['middle_name'] ?? null,
            $data['email'] ?? null,
            $data['department'] ?? '',
            $data['position'] ?? null,
            $data['status'] ?? 'Active',
            $data['zone'] ?? 'green',
            $data['notes'] ?? null,
        ]);
        return intval($this->pdo->lastInsertId());
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        
        if (isset($data['teacher_id'])) {
            $fields[] = 'teacher_id = ?';
            $values[] = $data['teacher_id'];
        }
        if (isset($data['first_name'])) {
            $fields[] = 'first_name = ?';
            $values[] = $data['first_name'];
        }
        if (isset($data['last_name'])) {
            $fields[] = 'last_name = ?';
            $values[] = $data['last_name'];
        }
        if (isset($data['middle_name'])) {
            $fields[] = 'middle_name = ?';
            $values[] = $data['middle_name'];
        }
        if (isset($data['email'])) {
            $fields[] = 'email = ?';
            $values[] = $data['email'];
        }
        if (isset($data['department'])) {
            $fields[] = 'department = ?';
            $values[] = $data['department'];
        }
        if (isset($data['position'])) {
            $fields[] = 'position = ?';
            $values[] = $data['position'];
        }
        if (isset($data['status'])) {
            $fields[] = 'status = ?';
            $values[] = $data['status'];
        }
        if (isset($data['zone'])) {
            $fields[] = 'zone = ?';
            $values[] = $data['zone'];
        }
        if (isset($data['notes'])) {
            $fields[] = 'notes = ?';
            $values[] = $data['notes'];
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = 'UPDATE teachers SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare('DELETE FROM teachers WHERE id = ?');
        return $stmt->execute([$id]);
    }
}



