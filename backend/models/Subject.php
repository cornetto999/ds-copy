<?php
class Subject {
    private $conn;
    private $table = 'subjects';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM {$this->table} ORDER BY code";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $subjects = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Calculate enrolled and passing students (mock data for now)
            $enrolled = rand(20, 50);
            $passing = rand(15, $enrolled);
            $passRate = $enrolled > 0 ? round(($passing / $enrolled) * 100) : 0;
            
            $subjects[] = [
                'id' => (int)$row['id'],
                'subject_code' => $row['code'],
                'subject_name' => $row['name'],
                'description' => $row['description'],
                'units' => (int)$row['units'],
                'year_level' => (int)$row['grade_level'],
                'semester' => $row['semester'],
                'program_id' => 1, // Default program
                'program_name' => $row['program'],
                'enrolled_students' => $enrolled,
                'passing_students' => $passing,
                'cutoff_grade' => (float)$row['cutoff'],
                'zone' => $passRate >= 80 ? 'green' : ($passRate >= 60 ? 'yellow' : 'red'),
                'created_at' => $row['created_at']
            ];
        }
        
        return $subjects;
    }

    public function getById($id) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $enrolled = rand(20, 50);
            $passing = rand(15, $enrolled);
            $passRate = $enrolled > 0 ? round(($passing / $enrolled) * 100) : 0;
            
            return [
                'id' => (int)$row['id'],
                'subject_code' => $row['code'],
                'subject_name' => $row['name'],
                'description' => $row['description'],
                'units' => (int)$row['units'],
                'year_level' => (int)$row['grade_level'],
                'semester' => $row['semester'],
                'program_id' => 1, // Default program
                'program_name' => $row['program'],
                'enrolled_students' => $enrolled,
                'passing_students' => $passing,
                'cutoff_grade' => (float)$row['cutoff'],
                'zone' => $passRate >= 80 ? 'green' : ($passRate >= 60 ? 'yellow' : 'red'),
                'created_at' => $row['created_at']
            ];
        }
        
        return null;
    }

    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (code, name, description, units, grade_level, semester, program, cutoff) 
                  VALUES (:code, :name, :description, :units, :grade_level, :semester, :program, :cutoff)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':code', $data['subject_code']);
        $stmt->bindParam(':name', $data['subject_name']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':units', $data['units']);
        $stmt->bindParam(':grade_level', $data['year_level']);
        $stmt->bindParam(':semester', $data['semester']);
        $stmt->bindParam(':program', $data['program_name'] ?? 'BSIT');
        $stmt->bindParam(':cutoff', $data['cutoff_grade']);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        
        throw new Exception('Failed to create subject');
    }

    public function update($id, $data) {
        $query = "UPDATE {$this->table} 
                  SET code = :code, 
                      name = :name, 
                      description = :description, 
                      units = :units, 
                      grade_level = :grade_level, 
                      semester = :semester, 
                      program = :program, 
                      cutoff = :cutoff,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':code', $data['subject_code']);
        $stmt->bindParam(':name', $data['subject_name']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':units', $data['units']);
        $stmt->bindParam(':grade_level', $data['year_level']);
        $stmt->bindParam(':semester', $data['semester']);
        $stmt->bindParam(':program', $data['program_name'] ?? 'BSIT');
        $stmt->bindParam(':cutoff', $data['cutoff_grade']);
        
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
                'enrolled_students' => rand(20, 50), // Mock data
                'passing_students' => rand(15, 45), // Mock data
                'cutoff_grade' => (float)$row['cutoff_grade'],
                'zone' => 'green', // Will be calculated based on pass rate
                'created_at' => $row['created_at']
            ];
        }
        
        return $subjects;
    }
}
?>
