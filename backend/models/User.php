<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/connection.php';

class UserModel {
    public function __construct(private PDO $pdo) {}

    public static function withDefaultConnection(): self {
        $db = new DatabaseConnection();
        $model = new self($db->pdo());
        $model->bootstrap();
        $model->ensureDefaultAdmin();
        return $model;
    }

    private function bootstrap(): void {
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    }

    public function findByUsername(string $username): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(string $username, string $password): int {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        // Detect column for password storage
        $col = $this->hasColumn('users', 'password_hash') ? 'password_hash' : 'password';
        $stmt = $this->pdo->prepare("INSERT INTO users (username, {$col}) VALUES (?, ?)");
        $stmt->execute([$username, $col === 'password_hash' ? $hash : $password]);
        return intval($this->pdo->lastInsertId());
    }

    public function setPassword(string $username, string $password): bool {
        $col = $this->hasColumn('users', 'password_hash') ? 'password_hash' : 'password';
        $value = ($col === 'password_hash') ? password_hash($password, PASSWORD_DEFAULT) : $password;
        $stmt = $this->pdo->prepare("UPDATE users SET {$col} = ? WHERE username = ?");
        return $stmt->execute([$value, $username]);
    }

    public function verify(string $username, string $password): ?array {
        $user = $this->findByUsername($username);
        if (!$user) { return null; }
        // Support legacy schemas with `password` column
        if (isset($user['password_hash'])) {
            if (!password_verify($password, $user['password_hash'])) { return null; }
            return $user;
        }
        if (isset($user['password'])) {
            if ($user['password'] !== $password) { return null; }
            return $user;
        }
        return null;
    }

    private function hasColumn(string $table, string $column): bool {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?');
        $stmt->execute([$table, $column]);
        $row = $stmt->fetch();
        return intval($row['cnt'] ?? 0) > 0;
    }

    private function ensureDefaultAdmin(): void {
        // Create default admin if not present; credentials in setup docs
        $existing = $this->findByUsername('admin');
        if ($existing) { return; }
        $this->create('admin', 'admin123');
    }
}