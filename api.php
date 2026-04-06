<?php
/**
 * En Territorio Verde - Unified Backend API
 * Handles data persistence, logins, and file uploads.
 */

header('Content-Type: application/json');

// --- CONFIGURATION ---
const DATA_ROOT = __DIR__ . '/data/';
const AUTH_CONFIG = __DIR__ . '/Administrador/auth.json';

// --- REQUEST PARSING ---
$action     = $_GET['action'] ?? '';
$section    = $_GET['section'] ?? '';
$method     = $_SERVER['REQUEST_METHOD'];

// Helper for JSON responses
function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Ensure section exists (safe directory traversal)
if ($section && !preg_match('/^[a-zA-Z0-9_-]+$/', $section)) {
    respond(["error" => "Sección inválida"], 400);
}

// --- ENDPOINTS ---

// 1. DATA PERSISTENCE (GET / POST)
if ($action === 'data') {
    $filePath = DATA_ROOT . $section . '/config.json';

    if ($method === 'GET') {
        if (!file_exists($filePath)) respond(["error" => "Archivo no encontrado"], 404);
        echo file_get_contents($filePath);
        exit;
    }

    if ($method === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input);

        if (json_last_error() !== JSON_ERROR_NONE) respond(["error" => "JSON inválido"], 400);

        $dir = dirname($filePath);
        if (!is_dir($dir)) mkdir($dir, 0777, true);

        if (file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))) {
            respond(["status" => "success", "message" => "Guardado correctamente"]);
        } else {
            respond(["error" => "No se pudo escribir en el disco"], 500);
        }
    }
}

// 2. FILE UPLOADS (POST)
if ($action === 'upload' && $method === 'POST') {
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        respond(["error" => "Error en la subida del archivo"], 400);
    }

    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'm3u'])) {
        respond(["error" => "Formato de archivo no permitido"], 400);
    }

    $newFileName = time() . '_' . uniqid() . '.' . $ext;
    $uploadDir = DATA_ROOT . $section . '/';
    
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $newFileName)) {
        respond(["url" => "data/$section/$newFileName"]);
    } else {
        respond(["error" => "Error interno al mover el archivo"], 500);
    }
}

// 3. ADMINISTRATOR LOGIN (POST)
if ($action === 'login' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user = $data['user'] ?? '';
    $pass = $data['pass'] ?? '';

    if (file_exists(AUTH_CONFIG)) {
        $auth = json_decode(file_get_contents(AUTH_CONFIG), true);
        if ($user === $auth['user'] && $pass === $auth['pass']) {
            respond(["status" => "success", "token" => "logged_in"]);
        }
    }
    respond(["error" => "Credenciales inválidas"], 401);
}

// Default 404
respond(["error" => "Endpoint no encontrado"], 404);
