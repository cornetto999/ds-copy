<?php
// Debug upload endpoint
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo "Debug upload endpoint\n";
echo "Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "Files: " . json_encode($_FILES) . "\n";
echo "POST: " . json_encode($_POST) . "\n";

if (isset($_FILES['file'])) {
    $file = $_FILES['file'];
    echo "File details:\n";
    echo "Name: " . $file['name'] . "\n";
    echo "Type: " . $file['type'] . "\n";
    echo "Size: " . $file['size'] . "\n";
    echo "Error: " . $file['error'] . "\n";
    echo "Tmp name: " . $file['tmp_name'] . "\n";
    
    if ($file['error'] === UPLOAD_ERR_OK) {
        echo "File uploaded successfully\n";
        echo "File content:\n";
        echo file_get_contents($file['tmp_name']);
    } else {
        echo "File upload error: " . $file['error'] . "\n";
    }
} else {
    echo "No file uploaded\n";
}
?>


