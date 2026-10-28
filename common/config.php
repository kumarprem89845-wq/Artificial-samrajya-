<?php
// PHP Centered Database Connection for ARTIFICIAL SAMARAJYA eSPORTS
// Host: 127.0.0.1, User: root, Pass: root

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$db_host = '127.0.0.1';
$db_user = 'root';
$db_pass = 'root';
$db_name = 'artificial_samrajya';

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // If database doesn't exist, connect to MySQL server to let install.php handle database creation
    try {
        $conn = new PDO("mysql:host=$db_host;charset=utf8mb4", $db_user, $db_pass);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $err) {
        die("❌ Database connection failure: " . $err->getMessage());
    }
}
?>
