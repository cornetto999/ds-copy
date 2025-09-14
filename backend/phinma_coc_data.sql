-- PHINMA COC Real Data Import
-- This file contains actual faculty and student data from PHINMA COC

USE school_db;

-- Insert PHINMA COC Programs
INSERT INTO programs (program_code, program_name, description, duration_years) VALUES
('BSCRIM', 'Bachelor of Science in Criminology', '4-year degree program in Criminology', 4),
('BSPSYCH', 'Bachelor of Science in Psychology', '4-year degree program in Psychology', 4),
('BSIT', 'Bachelor of Science in Information Technology', '4-year degree program in IT', 4),
('BSBA', 'Bachelor of Science in Business Administration', '4-year degree program in Business', 4),
('BSEd', 'Bachelor of Secondary Education', '4-year degree program in Education', 4),
('BSHM', 'Bachelor of Science in Hospitality Management', '4-year degree program in Hospitality', 4),
('BSA', 'Bachelor of Science in Accountancy', '4-year degree program in Accountancy', 4),
('BSCS', 'Bachelor of Science in Computer Science', '4-year degree program in Computer Science', 4);

-- Insert PHINMA COC Faculty (Real Data)
INSERT INTO teachers (teacher_id, first_name, last_name, middle_name, email, department, position, status, zone, notes, enrolled_students, failed_students, failure_percentage) VALUES
('14-007-F', 'MACARIO', 'CORRALES', 'ADORMIE', 'macario.corrales@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Excellent performance - 9.78% failure rate', 184, 18, 9.78),
('24-219-F', 'LAROSA', 'VIADOR', 'ALEXIS', 'alexis.viador@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Outstanding performance - 2.93% failure rate', 307, 9, 2.93),
('24-077-F', 'ACAYLAR', 'ANN', 'AMBER', 'amber.acaylar@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 7.96% failure rate', 201, 16, 7.96),
('24-069-F', 'LAMPITAO', 'BONGLAY', 'ANGEL THRIENA MAE', 'angel.lampitao@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Excellent performance - 2.38% failure rate', 252, 6, 2.38),
('24-210-F', 'LLEMIT', 'SAGA-AD', 'ARNEL', 'arnel.llemit@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 15.2% failure rate', 204, 31, 15.2),
('24-121-F', 'PANGAN', 'LLIDO', 'ARVIN', 'arvin.pangan@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 5.77% failure rate', 52, 3, 5.77),
('24-155-F', 'LERION', 'ANGANA', 'BIGVAI HEZIR', 'bigvai.lerion@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 4.71% failure rate', 191, 9, 4.71),
('19-051-F', 'MARTINEZ', 'MEE', 'CHARRY', 'charry.martinez@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 7.16% failure rate', 405, 29, 7.16),
('24-075-F', 'WABE', 'JOY', 'CHIERICA', 'chierica.wabe@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 7.23% failure rate', 83, 6, 7.23),
('24-115-F', 'TRASONA', 'APDIAN', 'CINDY MAE', 'cindy.trasona@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 17.39% failure rate', 92, 16, 17.39),
('24-107-F', 'DRAGON', 'ROPIO', 'CLAIRE', 'claire.dragon@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 17.35% failure rate', 196, 34, 17.35),
('A-2024081280', 'CRUZ', 'ESPANTO', 'CONRAD ROY', 'conrad.cruz@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 8.33% failure rate', 12, 1, 8.33),
('12-016-F', 'GALUDO', 'MEHILA', 'DARWIN', 'darwin.galudo@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 4.95% failure rate', 101, 5, 4.95),
('25-073-F', 'DOLLERA', 'EVANGELINE', 'FAITH', 'faith.dollera@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 6.17% failure rate', 486, 30, 6.17),
('24-054-F', 'EBUEZA', 'CONUGAN', 'GICIE LOU', 'gicie.ebueza@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 9.17% failure rate', 109, 10, 9.17),
('24-041-F', 'CANTILA', 'OPURA', 'GRACHAEL', 'grachael.cantila@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Excellent performance - 4.15% failure rate', 410, 17, 4.15),
('24-067-F', 'OPISO', 'MURING', 'IRISH', 'irish.opiso@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 6.45% failure rate', 248, 16, 6.45),
('19-014-F', 'AGOT', 'JAN', 'JAEZELL', 'jaezell.agot@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'red', 'Critical - 100% failure rate, requires immediate intervention', 2, 2, 100.0),
('19-035-F', 'BELMES', 'RAMIREZ', 'JAYSON', 'jayson.belmes@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 13.18% failure rate', 349, 46, 13.18),
('17-058-F', 'SIMO', 'JEREMIAH', '', 'jeremiah.simo@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 12.43% failure rate', 177, 22, 12.43),
('24-007-F', 'ESTROGA', 'NGOHO', 'JOHNBERT', 'johnbert.estroga@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'red', 'Critical - 48.97% failure rate, requires intervention', 194, 95, 48.97),
('23-031-P', 'MALAPONGIT', 'ALVASIR', 'JUN', 'jun.malapongit@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 12.63% failure rate', 198, 25, 12.63),
('24-068-F', 'RANAN', 'LADERA', 'KIVEN', 'kiven.ranan@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Outstanding performance - 0.98% failure rate', 205, 2, 0.98),
('24-161-F', 'RANARA', 'BALBIDO', 'LEILANI', 'leilani.ranara@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 12.96% failure rate', 247, 32, 12.96),
('21-005-F', 'ACTUB', 'CERO', 'LORD NEIL', 'lordneil.actub@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'red', 'Critical - 56.74% failure rate, requires immediate intervention', 215, 122, 56.74),
('16-062-F', 'VILLANUEVA', 'JEAN', 'LOVE', 'love.villanueva@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 13.21% failure rate', 212, 28, 13.21),
('AU2025-00591-COC', 'SANTIAGO JR', 'FRANCISCO', 'LUISITO', 'luisito.santiago@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 12.5% failure rate', 8, 1, 12.5),
('24-132-F', 'SAURA', 'DAGATAN', 'MARISTELLA', 'maristella.saura@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Excellent performance - 2.59% failure rate', 116, 3, 2.59),
('24-124-F', 'OPERIO', 'GIO', 'MARK ANTHONY', 'mark.operio@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 6.38% failure rate', 47, 3, 6.38),
('22-023-F', 'VELASQUEZ', 'MELONA', '', 'melona.velasquez@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Outstanding performance - 0.99% failure rate', 202, 2, 0.99),
('12-015-F', 'CAPAQUE', 'CASILLA', 'MOSHEH CYRIL', 'mosheh.capaque@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 3.47% failure rate', 202, 7, 3.47),
('25-218-P', 'GORDO', 'MADRIAGA', 'REMBRANDT', 'rembrandt.gordo@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'red', 'Critical - 65.52% failure rate, requires immediate intervention', 87, 57, 65.52),
('22-051-F', 'DONAIRE', 'RICARDO', 'RENE', 'rene.donaire@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 22.22% failure rate', 9, 2, 22.22),
('18-035-F', 'CAINGLET', 'ESTOLOGA', 'RIEL JUN', 'riel.cainglet@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'yellow', 'Needs improvement - 10.29% failure rate', 136, 14, 10.29),
('23-070-F', 'MALAZARTE', 'RONEL', '', 'ronel.malazarte@phinma.edu.ph', 'General Education', 'Faculty', 'Active', 'green', 'Good performance - 7.41% failure rate', 81, 6, 7.41);

-- Insert PHINMA COC Students (Sample data for each program)
INSERT INTO students (student_id, first_name, last_name, middle_name, email, program_id, year_level, semester, academic_year, status, zone, at_risk, notes) VALUES
-- BSCRIM Students
('2024-BSCRIM-001', 'Juan', 'Santos', 'Miguel', 'juan.santos@phinma.edu.ph', 1, 1, '1st', '2024-2025', 'Active', 'green', FALSE, 'Excellent academic performance'),
('2024-BSCRIM-002', 'Maria', 'Garcia', 'Luna', 'maria.garcia@phinma.edu.ph', 1, 2, '1st', '2024-2025', 'Active', 'yellow', TRUE, 'Needs improvement in Physical Education'),
('2024-BSCRIM-003', 'Jose', 'Reyes', 'Antonio', 'jose.reyes@phinma.edu.ph', 1, 3, '1st', '2024-2025', 'Active', 'green', FALSE, 'Consistent high performer'),
('2024-BSCRIM-004', 'Ana', 'Cruz', 'Isabel', 'ana.cruz@phinma.edu.ph', 1, 4, '1st', '2024-2025', 'Active', 'red', TRUE, 'Multiple failed subjects, requires intervention'),
-- BSPSYCH Students
('2024-BSPSYCH-001', 'Carlos', 'Mendoza', 'Luis', 'carlos.mendoza@phinma.edu.ph', 2, 1, '1st', '2024-2025', 'Active', 'green', FALSE, 'Strong in psychology subjects'),
('2024-BSPSYCH-002', 'Sofia', 'Torres', 'Elena', 'sofia.torres@phinma.edu.ph', 2, 2, '1st', '2024-2025', 'Active', 'yellow', TRUE, 'Struggling with statistics'),
('2024-BSPSYCH-003', 'Miguel', 'Lopez', 'Carlos', 'miguel.lopez@phinma.edu.ph', 2, 3, '1st', '2024-2025', 'Active', 'green', FALSE, 'Leadership potential'),
('2024-BSPSYCH-004', 'Isabella', 'Martinez', 'Rose', 'isabella.martinez@phinma.edu.ph', 2, 4, '1st', '2024-2025', 'Active', 'yellow', FALSE, 'Good in clinical subjects'),
-- BSIT Students
('2024-BSIT-001', 'Diego', 'Hernandez', 'Manuel', 'diego.hernandez@phinma.edu.ph', 3, 1, '1st', '2024-2025', 'Active', 'green', FALSE, 'Passionate about programming'),
('2024-BSIT-002', 'Valentina', 'Gonzalez', 'Carmen', 'valentina.gonzalez@phinma.edu.ph', 3, 2, '1st', '2024-2025', 'Active', 'red', TRUE, 'Poor performance in major subjects'),
('2024-BSIT-003', 'Alejandro', 'Perez', 'Jose', 'alejandro.perez@phinma.edu.ph', 3, 3, '1st', '2024-2025', 'Active', 'green', FALSE, 'Excellent in web development'),
('2024-BSIT-004', 'Camila', 'Sanchez', 'Maria', 'camila.sanchez@phinma.edu.ph', 3, 4, '1st', '2024-2025', 'Active', 'yellow', TRUE, 'Needs improvement in database subjects'),
-- BSBA Students
('2024-BSBA-001', 'Santiago', 'Ramirez', 'Luis', 'santiago.ramirez@phinma.edu.ph', 4, 1, '1st', '2024-2025', 'Active', 'green', FALSE, 'Strong in business concepts'),
('2024-BSBA-002', 'Natalia', 'Flores', 'Elena', 'natalia.flores@phinma.edu.ph', 4, 2, '1st', '2024-2025', 'Active', 'yellow', TRUE, 'Struggling with accounting'),
('2024-BSBA-003', 'Sebastian', 'Gomez', 'Carlos', 'sebastian.gomez@phinma.edu.ph', 4, 3, '1st', '2024-2025', 'Active', 'green', FALSE, 'Good in marketing subjects'),
('2024-BSBA-004', 'Gabriela', 'Diaz', 'Isabel', 'gabriela.diaz@phinma.edu.ph', 4, 4, '1st', '2024-2025', 'Active', 'yellow', FALSE, 'Needs improvement in finance'),
-- BSEd Students
('2024-BSEd-001', 'Mateo', 'Herrera', 'Jose', 'mateo.herrera@phinma.edu.ph', 5, 1, '1st', '2024-2025', 'Active', 'green', FALSE, 'Passionate about teaching'),
('2024-BSEd-002', 'Valeria', 'Jimenez', 'Carmen', 'valeria.jimenez@phinma.edu.ph', 5, 2, '1st', '2024-2025', 'Active', 'red', TRUE, 'Poor performance in major subjects'),
('2024-BSEd-003', 'Nicolas', 'Moreno', 'Luis', 'nicolas.moreno@phinma.edu.ph', 5, 3, '1st', '2024-2025', 'Active', 'green', FALSE, 'Excellent in teaching methods'),
('2024-BSEd-004', 'Ximena', 'Alvarez', 'Maria', 'ximena.alvarez@phinma.edu.ph', 5, 4, '1st', '2024-2025', 'Active', 'yellow', TRUE, 'Needs improvement in assessment');

-- Insert PHINMA COC Subjects (Real subjects for each program)
INSERT INTO subjects (subject_code, subject_name, description, units, year_level, semester, program_id, enrolled_students, passing_students, cutoff_grade, zone) VALUES
-- BSCRIM Subjects
('CRIM-101', 'Introduction to Criminology', 'Basic concepts and principles of criminology', 3, 1, '1st', 1, 45, 42, 60.00, 'green'),
('CRIM-102', 'Criminal Law', 'Study of criminal laws and procedures', 3, 1, '1st', 1, 45, 38, 60.00, 'yellow'),
('CRIM-201', 'Criminal Investigation', 'Techniques and methods of criminal investigation', 3, 2, '1st', 1, 40, 35, 60.00, 'yellow'),
('CRIM-202', 'Forensic Science', 'Application of science in criminal investigation', 3, 2, '1st', 1, 40, 32, 60.00, 'red'),
-- BSPSYCH Subjects
('PSYC-101', 'General Psychology', 'Introduction to psychological principles', 3, 1, '1st', 2, 50, 48, 60.00, 'green'),
('PSYC-102', 'Developmental Psychology', 'Human development across lifespan', 3, 1, '1st', 2, 50, 45, 60.00, 'green'),
('PSYC-201', 'Abnormal Psychology', 'Study of psychological disorders', 3, 2, '1st', 2, 45, 40, 60.00, 'yellow'),
('PSYC-202', 'Social Psychology', 'Individual behavior in social contexts', 3, 2, '1st', 2, 45, 38, 60.00, 'yellow'),
-- BSIT Subjects
('IT-101', 'Programming Fundamentals', 'Introduction to programming concepts', 3, 1, '1st', 3, 60, 55, 60.00, 'green'),
('IT-102', 'Database Management', 'Database design and implementation', 3, 1, '1st', 3, 60, 45, 60.00, 'yellow'),
('IT-201', 'Web Development', 'Frontend and backend web technologies', 3, 2, '1st', 3, 55, 50, 60.00, 'green'),
('IT-202', 'Data Structures', 'Advanced programming concepts', 3, 2, '1st', 3, 55, 42, 60.00, 'red'),
-- BSBA Subjects
('BUS-101', 'Principles of Management', 'Basic management concepts', 3, 1, '1st', 4, 40, 38, 60.00, 'green'),
('BUS-102', 'Business Mathematics', 'Mathematical applications in business', 3, 1, '1st', 4, 40, 35, 60.00, 'yellow'),
('BUS-201', 'Marketing Principles', 'Fundamentals of marketing', 3, 2, '1st', 4, 35, 32, 60.00, 'green'),
('BUS-202', 'Financial Management', 'Financial analysis and planning', 3, 2, '1st', 4, 35, 28, 60.00, 'red'),
-- BSEd Subjects
('EDUC-101', 'Foundations of Education', 'Historical and philosophical foundations', 3, 1, '1st', 5, 30, 28, 60.00, 'green'),
('EDUC-102', 'Child and Adolescent Development', 'Developmental psychology for educators', 3, 1, '1st', 5, 30, 26, 60.00, 'yellow'),
('EDUC-201', 'Teaching Methods', 'Pedagogical approaches and strategies', 3, 2, '1st', 5, 25, 22, 60.00, 'yellow'),
('EDUC-202', 'Educational Assessment', 'Assessment and evaluation techniques', 3, 2, '1st', 5, 25, 20, 60.00, 'red'),
-- General Education Subjects
('MATH-101', 'College Algebra', 'Advanced algebraic concepts', 3, 1, '1st', NULL, 200, 150, 60.00, 'red'),
('ENG-101', 'Communication Arts', 'English communication skills', 3, 1, '1st', NULL, 200, 180, 60.00, 'yellow'),
('PE-101', 'Physical Education 1', 'Basic physical fitness', 2, 1, '1st', NULL, 200, 190, 60.00, 'green'),
('NSTP-101', 'National Service Training Program', 'Civic consciousness and defense preparedness', 3, 1, '1st', NULL, 200, 195, 60.00, 'green');
