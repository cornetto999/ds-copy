<?php
class Subject {
    private $conn;
    private $table = 'subjects';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT s.*, p.program_name FROM {$this->table} s LEFT JOIN programs p ON s.program_id = p.id ORDER BY s.subject_code";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $subjects = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $subjects[] = [
                'id' => (int)$row['id'],
                'subject_code' => $row['subject_code'],
                'subject_name' => $row['subject_name'],
                'description' => $row['description'],
                'units' => (int)$row['units'],
                'year_level' => (int)$row['year_level'],
                'semester' => $row['semester'],
                'program_id' => isset($row['program_id']) ? (int)$row['program_id'] : null,
                'program_name' => $row['program_name'] ?? null,
                'enrolled_students' => 0,
                'passing_students' => 0,
                'cutoff_grade' => isset($row['cutoff_grade']) ? (float)$row['cutoff_grade'] : 60.0,
                'zone' => 'green',
                'created_at' => $row['created_at']
            ];
        }
        
        return $subjects;
    }

    public function getById($id) {
        $query = "SELECT s.*, p.program_name FROM {$this->table} s LEFT JOIN programs p ON s.program_id = p.id WHERE s.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            return [
                'id' => (int)$row['id'],
                'subject_code' => $row['subject_code'],
                'subject_name' => $row['subject_name'],
                'description' => $row['description'],
                'units' => (int)$row['units'],
                'year_level' => (int)$row['year_level'],
                'semester' => $row['semester'],
                'program_id' => isset($row['program_id']) ? (int)$row['program_id'] : null,
                'program_name' => $row['program_name'] ?? null,
                'enrolled_students' => 0,
                'passing_students' => 0,
                'cutoff_grade' => isset($row['cutoff_grade']) ? (float)$row['cutoff_grade'] : 60.0,
                'zone' => 'green',
                'created_at' => $row['created_at']
            ];
        }
        
        return null;
    }

    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (subject_code, subject_name, description, units, year_level, semester, program_id, cutoff_grade) 
                  VALUES (:subject_code, :subject_name, :description, :units, :year_level, :semester, :program_id, :cutoff_grade)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':subject_code', $data['subject_code']);
        $stmt->bindParam(':subject_name', $data['subject_name']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':units', $data['units']);
        $stmt->bindParam(':year_level', $data['year_level']);
        $stmt->bindParam(':semester', $data['semester']);
        $stmt->bindParam(':program_id', $data['program_id']);
        $stmt->bindParam(':cutoff_grade', $data['cutoff_grade']);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        
        throw new Exception('Failed to create subject');
    }

    public function update($id, $data) {
        $query = "UPDATE {$this->table} 
                  SET subject_code = :subject_code, 
                      subject_name = :subject_name, 
                      description = :description, 
                      units = :units, 
                      year_level = :year_level, 
                      semester = :semester, 
                      program_id = :program_id, 
                      cutoff_grade = :cutoff_grade,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':subject_code', $data['subject_code']);
        $stmt->bindParam(':subject_name', $data['subject_name']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':units', $data['units']);
        $stmt->bindParam(':year_level', $data['year_level']);
        $stmt->bindParam(':semester', $data['semester']);
        $stmt->bindParam(':program_id', $data['program_id']);
        $stmt->bindParam(':cutoff_grade', $data['cutoff_grade']);
        
        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function getByProgram($program_id) {
        $query = "SELECT s.*, p.program_name 
                  FROM {$this->table} s 
                  LEFT JOIN programs p ON s.program_id = p.id 
                  WHERE s.program_id = :program_id 
                  ORDER BY s.subject_code";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':program_id', $program_id);
        $stmt->execute();
        
        $subjects = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $subjects[] = [
                'id' => (int)$row['id'],
                'subject_code' => $row['subject_code'],
                'subject_name' => $row['subject_name'],
                'description' => $row['description'],
                'units' => (int)$row['units'],
                'year_level' => (int)$row['year_level'],
                'semester' => $row['semester'],
                'program_id' => (int)$row['program_id'],
                'program_name' => $row['program_name'],
                'enrolled_students' => 0,
                'passing_students' => 0,
                'cutoff_grade' => (float)$row['cutoff_grade'],
                'zone' => 'green', // Will be calculated based on pass rate
                'created_at' => $row['created_at']
            ];
        }
        
        return $subjects;
    }
}
?>
