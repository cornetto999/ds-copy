<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/connection.php';

class StudentModel {
    public function __construct(private PDO $pdo) {}

    public static function withDefaultConnection(): self {
        $db = new DatabaseConnection();
        return new self($db->pdo());
    }

    public function all(): array {
        $stmt = $this->pdo->query('
            SELECT s.*, p.program_name, p.program_code
            FROM students s 
            LEFT JOIN programs p ON s.program_id = p.id 
            ORDER BY s.created_at DESC
        ');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->pdo->prepare('
            SELECT s.*, p.program_name, p.program_code
            FROM students s 
            LEFT JOIN programs p ON s.program_id = p.id 
            WHERE s.id = ?
        ');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO students (student_id, first_name, last_name, middle_name, email, program_id, 
                                year_level, semester, academic_year, status, zone, at_risk, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['student_id'] ?? '',
            $data['first_name'] ?? '',
            $data['last_name'] ?? '',
            $data['middle_name'] ?? null,
            $data['email'] ?? null,
            $data['program_id'] ?? null,
            $data['year_level'] ?? 1,
            $data['semester'] ?? '1st',
            $data['academic_year'] ?? date('Y') . '-' . (date('Y') + 1),
            $data['status'] ?? 'Active',
            $data['zone'] ?? 'green',
            $data['at_risk'] ?? false,
            $data['notes'] ?? null,
        ]);
        return intval($this->pdo->lastInsertId());
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        
        if (isset($data['student_id'])) {
            $fields[] = 'student_id = ?';
            $values[] = $data['student_id'];
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
        if (isset($data['program_id'])) {
            $fields[] = 'program_id = ?';
            $values[] = $data['program_id'];
        }
        if (isset($data['year_level'])) {
            $fields[] = 'year_level = ?';
            $values[] = $data['year_level'];
        }
        if (isset($data['semester'])) {
            $fields[] = 'semester = ?';
            $values[] = $data['semester'];
        }
        if (isset($data['academic_year'])) {
            $fields[] = 'academic_year = ?';
            $values[] = $data['academic_year'];
        }
        if (isset($data['status'])) {
            $fields[] = 'status = ?';
            $values[] = $data['status'];
        }
        if (isset($data['zone'])) {
            $fields[] = 'zone = ?';
            $values[] = $data['zone'];
        }
        if (isset($data['at_risk'])) {
            $fields[] = 'at_risk = ?';
            $values[] = $data['at_risk'];
        }
        if (isset($data['notes'])) {
            $fields[] = 'notes = ?';
            $values[] = $data['notes'];
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = 'UPDATE students SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare('DELETE FROM students WHERE id = ?');
        return $stmt->execute([$id]);
    }
}



