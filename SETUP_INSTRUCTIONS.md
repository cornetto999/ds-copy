# PHINMA COC Deliberation System - Setup Instructions

## Overview

This is a comprehensive deliberation system for PHINMA COC that tracks student performance, teacher effectiveness, and academic programs with zone-based performance monitoring.

## Features

- **Student Management**: Track student information, academic performance, and risk status
- **Teacher Management**: Monitor faculty performance and teaching effectiveness
- **Program Management**: Manage academic programs and track program performance
- **Grade Management**: Record and track student grades across subjects
- **Subject Management**: Manage course offerings and track subject performance
- **Zone-based Performance**: Green/Yellow/Red zone classification for performance tracking
- **Dashboard**: Comprehensive overview of academic metrics and performance indicators

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Node.js 16+ (for frontend development)

## Database Setup

### Option 1: Automatic Setup (Recommended)

1. Place the project files in your web server directory (e.g., `htdocs/deliberation/`)
2. Run the setup script in your browser: `http://localhost/deliberation/setup_database.php`
3. Or run from command line: `php setup_database.php`

### Option 2: Manual Setup

1. Create a MySQL database named `school_db`
2. Import the schema: `mysql -u root -p school_db < backend/schema.sql`
3. Import sample data: `mysql -u root -p school_db < backend/phinma_coc_data.sql`

## Configuration

### Database Configuration

Update `backend/config/connection.php` with your database credentials:

```php
private $host = 'localhost';
private $dbname = 'school_db';
private $username = 'root';
private $password = 'your_password';
```

### Frontend Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Default Login Credentials

- **Username**: admin
- **Password**: admin123

## API Endpoints

### Students

- `GET /backend/routes/students.php` - Get all students
- `POST /backend/routes/students.php` - Create new student
- `PUT /backend/routes/students.php?id={id}` - Update student
- `DELETE /backend/routes/students.php?id={id}` - Delete student

### Teachers

- `GET /backend/routes/teachers.php` - Get all teachers
- `POST /backend/routes/teachers.php` - Create new teacher
- `PUT /backend/routes/teachers.php?id={id}` - Update teacher
- `DELETE /backend/routes/teachers.php?id={id}` - Delete teacher

### Programs

- `GET /backend/routes/programs.php` - Get all programs
- `POST /backend/routes/programs.php` - Create new program
- `PUT /backend/routes/programs.php?id={id}` - Update program
- `DELETE /backend/routes/programs.php?id={id}` - Delete program

### Grades

- `GET /backend/routes/grades.php` - Get all grades
- `GET /backend/routes/grades.php?student_id={id}` - Get grades by student
- `GET /backend/routes/grades.php?subject_id={id}` - Get grades by subject
- `POST /backend/routes/grades.php` - Create new grade
- `PUT /backend/routes/grades.php?id={id}` - Update grade
- `DELETE /backend/routes/grades.php?id={id}` - Delete grade

### Subjects

- `GET /backend/routes/subjects.php` - Get all subjects
- `POST /backend/routes/subjects.php` - Create new subject
- `PUT /backend/routes/subjects.php?id={id}` - Update subject
- `DELETE /backend/routes/subjects.php?id={id}` - Delete subject

## Database Schema

### Key Tables

- **users**: System users and authentication
- **programs**: Academic programs (BSCRIM, BSIT, etc.)
- **students**: Student records with performance tracking
- **teachers**: Faculty records with performance metrics
- **subjects**: Course offerings and subject information
- **student_grades**: Grade records linking students to subjects

### Zone Classification

- **Green Zone**: High performance, low risk
- **Yellow Zone**: Moderate performance, needs attention
- **Red Zone**: Poor performance, requires intervention

## Usage

1. **Login**: Use admin credentials to access the system
2. **Dashboard**: View overall performance metrics and statistics
3. **Students**: Add, edit, and track student performance
4. **Teachers**: Manage faculty and monitor teaching effectiveness
5. **Programs**: Manage academic programs and track program performance
6. **Grades**: Record and manage student grades
7. **Subjects**: Manage course offerings and subject information

## Troubleshooting

### Common Issues

1. **Database Connection Error**: Check database credentials in `backend/config/connection.php`
2. **CORS Issues**: Ensure CORS headers are properly set in PHP routes
3. **File Permissions**: Ensure web server has read/write access to project files
4. **PHP Errors**: Check PHP error logs for detailed error messages

### Support

For technical support or questions, please contact the development team.

## License

This project is proprietary software for PHINMA COC internal use only.





