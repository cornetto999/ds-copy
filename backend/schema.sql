-- PHINMA COC Deliberation System Schema (MySQL)
-- Uses versioned MySQL comment-wrappers to remain executable by MySQL
-- while avoiding parser complaints from generic SQL linters.

/*!40100 CREATE DATABASE IF NOT EXISTS deliberation CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
/*!40100 USE deliberation */;

-- Programs
/*!40100 CREATE TABLE IF NOT EXISTS programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  program_code VARCHAR(32) NOT NULL UNIQUE,
  program_name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  duration_years TINYINT NOT NULL DEFAULT 4,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 */;

-- Students
/*!40100 CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL UNIQUE,
  first_name VARCHAR(64) NOT NULL,
  last_name VARCHAR(64) NOT NULL,
  middle_name VARCHAR(64) NULL,
  email VARCHAR(128) NULL,
  program_id INT NULL,
  year_level TINYINT NOT NULL DEFAULT 1,
  semester ENUM('1st','2nd','summer') NOT NULL DEFAULT '1st',
  academic_year VARCHAR(9) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  zone ENUM('green','yellow','red') NOT NULL DEFAULT 'green',
  at_risk TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_students_program_id (program_id),
  CONSTRAINT fk_students_programs FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 */;

-- Teachers
/*!40100 CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id VARCHAR(64) NOT NULL,
  first_name VARCHAR(64) NOT NULL,
  last_name VARCHAR(64) NOT NULL,
  middle_name VARCHAR(64) NULL,
  email VARCHAR(128) NULL,
  department VARCHAR(128) NOT NULL,
  position VARCHAR(128) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  zone ENUM('green','yellow','red') NOT NULL DEFAULT 'green',
  notes TEXT NULL,
  enrolled_students INT NOT NULL DEFAULT 0,
  failed_students INT NOT NULL DEFAULT 0,
  failure_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  p1_failed INT NOT NULL DEFAULT 0,
  p1_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  p1_category VARCHAR(64) NOT NULL DEFAULT 'GREEN (0.01%-10%)',
  p2_failed INT NOT NULL DEFAULT 0,
  p2_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  p2_category VARCHAR(64) NOT NULL DEFAULT 'GREEN (0.01%-10%)',
  p3_failed INT NOT NULL DEFAULT 0,
  p3_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  p3_category VARCHAR(64) NOT NULL DEFAULT 'GREEN (0.01%-10%)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 */;

-- Subjects (aligns with GradeModel expectations)
/*!40100 CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_code VARCHAR(32) NOT NULL UNIQUE,
  subject_name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  units INT NOT NULL DEFAULT 3,
  year_level TINYINT NOT NULL DEFAULT 1,
  semester ENUM('1st','2nd','summer') NOT NULL DEFAULT '1st',
  program_id INT NULL,
  cutoff_grade DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subjects_program_id (program_id),
  CONSTRAINT fk_subjects_programs FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 */;

-- Student Grades
/*!40100 CREATE TABLE IF NOT EXISTS student_grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NULL,
  subject_id INT NULL,
  teacher_id INT NULL,
  academic_year VARCHAR(9) NOT NULL,
  semester ENUM('1st','2nd','summer') NOT NULL DEFAULT '1st',
  midterm_grade DECIMAL(5,2) NULL,
  final_grade DECIMAL(5,2) NULL,
  final_rating DECIMAL(5,2) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Failed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grades_student_id (student_id),
  INDEX idx_grades_subject_id (subject_id),
  INDEX idx_grades_teacher_id (teacher_id),
  CONSTRAINT fk_grades_students FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_grades_subjects FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_grades_teachers FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 */;