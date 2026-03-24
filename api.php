<?php
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$section = $_GET['section'] ?? 'global';

if ($action === 'data') {
    $filePath = __DIR__ . '/data/' . $section . '/config.json';
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!file_exists($filePath)) {
            http_response_code(404);
            echo json_encode(["error" => "No encontrado"]);
            exit;
        }
        echo file_get_contents($filePath);
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        
        $dir = dirname($filePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        
        $data = json_decode($input);
        if (json_last_error() === JSON_ERROR_NONE) {
            file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            echo json_encode(["status" => "success", "message" => "Guardado correctamente"]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "JSON Invalido"]);
        }
        exit;
    }
}

if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["error" => "No file uploaded"]);
        exit;
    }
    
    $fileTmpPath = $_FILES['image']['tmp_name'];
    $fileName = $_FILES['image']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    $newFileName = time() . '.' . $fileExtension;
    
    $uploadFileDir = __DIR__ . '/data/' . $section . '/';
    if (!is_dir($uploadFileDir)) {
        mkdir($uploadFileDir, 0777, true);
    }
    
    $dest_path = $uploadFileDir . $newFileName;
    
    if (move_uploaded_file($fileTmpPath, $dest_path)) {
        $relativePath = 'data/' . $section . '/' . $newFileName;
        echo json_encode(["url" => $relativePath]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error guardando imagen"]);
    }
    exit;
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $user = $data['user'] ?? '';
    $pass = $data['pass'] ?? '';
    
    $authPath = __DIR__ . '/Administrador/auth.json';
    if (file_exists($authPath)) {
        $auth = json_decode(file_get_contents($authPath), true);
        if ($user === $auth['user'] && $pass === $auth['pass']) {
            echo json_encode(["status" => "success", "token" => "logged_in"]);
            exit;
        }
    }
    http_response_code(401);
    echo json_encode(["error" => "Credenciales incorrectas"]);
    exit;
}

http_response_code(404);
echo json_encode(["error" => "Endpoint not found"]);
