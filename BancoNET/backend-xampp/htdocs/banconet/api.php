<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

/* OPTION for CORS
no se que haga pero algo hace */
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];

// Manejo de la autenticación básica
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

// Instrucción RESET para reiniciar la base de datos (solo para desarrollo)
if ($method == 'POST' && isset($_GET['reset'])) {
    if (!isDevelopmentEnvironment()) {
        http_response_code(403);
        echo json_encode(['error' => 'Acceso prohibido']);
        exit;
    }
    
    resetDatabase();
    echo json_encode(['message' => 'Base de datos reiniciada']);
    exit;
}

/* Endpoints compatibles con Frontend "BancoNET-npm" */


// GET /accounts/:id (alias de /cuenta/:numero_cuenta)
if ($method == 'GET' && isset($request[0]) && $request[0] == 'accounts' && isset($request[1]) && !isset($request[2])) {
    $numero_cuenta = $request[1];
    $cuenta = obtenerCuenta($numero_cuenta);
    
    // Transformar a formato del frontend
    $response = [
        'id' => $cuenta['id'],
        'accountNumber' => $cuenta['numero_cuenta'],
        'balance' => (float)$cuenta['saldo'],
        'ownerName' => $cuenta['cliente_nombre']
    ];
    
    echo json_encode($response);
    exit;
}

// GET /account_verifications/:id (verificar si existe)
if ($method == 'GET' && isset($request[0]) && $request[0] == 'account_verifications' && isset($request[1])) {
    $numero_cuenta = $request[1];
    $pdo = getPDO();
    $stmt = $pdo->prepare("SELECT id FROM cuentas WHERE numero_cuenta = ?");
    $stmt->execute([$numero_cuenta]);
    $exists = $stmt->fetch() ? true : false;
    
    echo json_encode(['exists' => $exists]);
    exit;
}

// POST /auth/login (simulación de autenticación)
if ($method == 'POST' && isset($request[0]) && $request[0] == 'auth' && isset($request[1]) && $request[1] == 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $accountId = $data['accountId'];
    
    $pdo = getPDO();
    $stmt = $pdo->prepare("SELECT c.id, cl.nombre FROM cuentas c JOIN clientes cl ON c.cliente_id = cl.id WHERE c.numero_cuenta = ?");
    $stmt->execute([$accountId]);
    $cuenta = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$cuenta) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        exit;
    }
    
    // Crear un token simple (en producción usarías JWT)
    $token = bin2hex(random_bytes(32));
    
    echo json_encode([
        'token' => $token,
        'user' => [
            'id' => $cuenta['id'],
            'name' => $cuenta['nombre']
        ]
    ]);
    exit;
}

// POST /accounts/:id/deposit (abono de dinero a una cuenta)
if ($method == 'POST' && isset($request[0]) && $request[0] == 'accounts' && isset($request[1]) && isset($request[2]) && $request[2] == 'deposit') {
    $numero_cuenta = $request[1];
    $data = json_decode(file_get_contents('php://input'), true);
    $monto = $data['amount'] ?? 0;

    if ($monto <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'El monto debe ser mayor a cero']);
        exit;
    }

    $resultado = realizarAbono($numero_cuenta, $monto);

    if ($resultado['success']) {
        echo json_encode(['message' => 'Depósito realizado correctamente']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $resultado['error']]);
    }
    exit;
}

// GET /accounts/:id/transactions (alias de /transacciones/:numero_cuenta)
if ($method == 'GET' && isset($request[0]) && $request[0] == 'accounts' && isset($request[1]) && 
    isset($request[2]) && $request[2] == 'transactions') {
    
    $numero_cuenta = $request[1];
    $transacciones_db = obtenerTransacciones($numero_cuenta);
    
    // Transformar a formato del frontend
    $transacciones = [];
    foreach ($transacciones_db as $t) {
        // Determinar si es entrada o salida
        $isOutgoing = ($t['tipo'] == 'retiro' || $t['tipo'] == 'transferencia_envio');
        
        // En una transferencia real, buscaríamos la cuenta origen/destino
        $otherAccountId = $isOutgoing ? "destino-" . rand(1000, 9999) : "origen-" . rand(1000, 9999);
        
        $transacciones[] = [
            'id' => $t['id'],
            'fromAccountId' => $isOutgoing ? $numero_cuenta : $otherAccountId,
            'toAccountId' => $isOutgoing ? $otherAccountId : $numero_cuenta,
            'amount' => (float)$t['monto'],
            'description' => ucfirst($t['tipo']),
            'timestamp' => $t['fecha'],
            'status' => 'completed'
        ];
    }
    
    echo json_encode($transacciones);
    exit;
}

// POST /transactions (transferencia de dinero)
if ($method == 'POST' && isset($request[0]) && $request[0] == 'transactions') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Adaptar formato del frontend al backend
    $cuenta_origen = $data['fromAccountId'];
    $cuenta_destino = $data['toAccountId'];
    $monto = $data['amount'];
    
    $resultado = realizarTransferencia($cuenta_origen, $cuenta_destino, $monto);
    
    if ($resultado['success']) {
        // Si la transferencia fue exitosa, crear un objeto de transacción
        // para retornar en formato compatible con el frontend
        $transaccion = [
            'id' => uniqid('tr-'),
            'fromAccountId' => $cuenta_origen,
            'toAccountId' => $cuenta_destino,
            'amount' => $monto,
            'description' => $data['description'] ?? 'Transferencia',
            'timestamp' => date('Y-m-d H:i:s'),
            'status' => 'completed'
        ];
        
        echo json_encode($transaccion);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $resultado['error']]);
    }
    exit;
}

// POST /accounts (crear cuenta nueva)
if ($method == 'POST' && isset($request[0]) && $request[0] == 'accounts' && !isset($request[1])) {
    $data = json_decode(file_get_contents('php://input'), true);
    $nombre = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $deposito_inicial = isset($data['initialDeposit']) ? (float)$data['initialDeposit'] : 0;
    
    if (empty($nombre) || empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Nombre y email son requeridos']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email inválido']);
        exit;
    }
    
    $pdo = getPDO();
    
    try {
        $pdo->beginTransaction();
        
        // Verificar si el email ya existe
        $stmt = $pdo->prepare("SELECT id FROM clientes WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            throw new Exception("El email ya está registrado");
        }
        
        // Insertar cliente nuevo
        $stmt = $pdo->prepare("INSERT INTO clientes (nombre, email) VALUES (?, ?)");
        $stmt->execute([$nombre, $email]);
        $cliente_id = $pdo->lastInsertId();
        
        // Generar número de cuenta (en producción usarías un sistema más robusto)
        $numero_cuenta = mt_rand(0, 999);
        
        // Verificar que el número de cuenta no exista
        $stmt = $pdo->prepare("SELECT id FROM cuentas WHERE numero_cuenta = ?");
        $stmt->execute([$numero_cuenta]);
        while ($stmt->fetch()) {
            $numero_cuenta = mt_rand(0, 999);
            $stmt->execute([$numero_cuenta]);
        }
        
        // Crear cuenta
        $stmt = $pdo->prepare("INSERT INTO cuentas (cliente_id, numero_cuenta, saldo) VALUES (?, ?, ?)");
        $stmt->execute([$cliente_id, $numero_cuenta, $deposito_inicial]);
        $cuenta_id = $pdo->lastInsertId();
        
        // Si hay depósito inicial, registrar transacción
        if ($deposito_inicial > 0) {
            $stmt = $pdo->prepare("INSERT INTO transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, 'abono', ?, NOW())");
            $stmt->execute([$cuenta_id, $deposito_inicial]);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Cuenta creada exitosamente',
            'accountNumber' => $numero_cuenta
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// Si no coincide con ninguna ruta
http_response_code(404);
echo json_encode(['success' => false, 'error' => 'Endpoint no encontrado', 'method' => $method, 'request' => $request]);

// ===== FUNCIONES DE LA API =====

function isDevelopmentEnvironment() {
    return $_SERVER['SERVER_NAME'] == 'localhost' || $_SERVER['SERVER_ADDR'] == '127.0.0.1';
}

function obtenerSaldo($numero_cuenta) {
    $pdo = getPDO();
    $stmt = $pdo->prepare("SELECT saldo FROM cuentas WHERE numero_cuenta = ?");
    $stmt->execute([$numero_cuenta]);
    $cuenta = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$cuenta) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Cuenta no encontrada']);
        exit;
    }
    
    return $cuenta['saldo'];
}

function obtenerCuenta($numero_cuenta) {
    $pdo = getPDO();
    $stmt = $pdo->prepare("
        SELECT c.id, c.numero_cuenta, c.saldo, cl.nombre as cliente_nombre
        FROM cuentas c
        JOIN clientes cl ON c.cliente_id = cl.id
        WHERE c.numero_cuenta = ?
    ");
    $stmt->execute([$numero_cuenta]);
    $cuenta = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$cuenta) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Cuenta no encontrada']);
        exit;
    }
    
    return $cuenta;
}

function realizarAbono($numero_cuenta, $monto) {
    $pdo = getPDO();
    
    try {
        $pdo->beginTransaction();
        
        // 1. Verificar cuenta
        $stmt = $pdo->prepare("SELECT id FROM cuentas WHERE numero_cuenta = ? FOR UPDATE");
        $stmt->execute([$numero_cuenta]);
        $cuenta = $stmt->fetch();
        
        if (!$cuenta) {
            throw new Exception("Cuenta no encontrada");
        }
        
        // 2. Actualizar saldo
        $stmt = $pdo->prepare("UPDATE cuentas SET saldo = saldo + ? WHERE numero_cuenta = ?");
        $stmt->execute([$monto, $numero_cuenta]);
        
        // 3. Registrar transacción
        $stmt = $pdo->prepare("INSERT INTO transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, 'abono', ?, NOW())");
        $stmt->execute([$cuenta['id'], $monto]);
        
        $pdo->commit();
        
        return ['success' => true, 'message' => 'Abono realizado correctamente'];
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(400);
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function realizarRetiro($numero_cuenta, $monto) {
    $pdo = getPDO();
    
    try {
        $pdo->beginTransaction();
        
        // 1. Verificar cuenta y saldo
        $stmt = $pdo->prepare("SELECT id, saldo FROM cuentas WHERE numero_cuenta = ? FOR UPDATE");
        $stmt->execute([$numero_cuenta]);
        $cuenta = $stmt->fetch();
        
        if (!$cuenta) {
            throw new Exception("Cuenta no encontrada");
        }
        
        if ($cuenta['saldo'] < $monto) {
            throw new Exception("Saldo insuficiente");
        }
        
        // 2. Actualizar saldo
        $stmt = $pdo->prepare("UPDATE cuentas SET saldo = saldo - ? WHERE numero_cuenta = ?");
        $stmt->execute([$monto, $numero_cuenta]);
        
        // 3. Registrar transacción
        $stmt = $pdo->prepare("INSERT INTO transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, 'retiro', ?, NOW())");
        $stmt->execute([$cuenta['id'], $monto]);
        
        $pdo->commit();
        
        return ['success' => true, 'message' => 'Retiro realizado correctamente'];
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(400);
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function realizarTransferencia($cuenta_origen, $cuenta_destino, $monto) {
    $pdo = getPDO();
    
    try {
        $pdo->beginTransaction();
        
        // 1. Verificar cuentas
        $stmt = $pdo->prepare("SELECT id, saldo FROM cuentas WHERE numero_cuenta = ? FOR UPDATE");
        $stmt->execute([$cuenta_origen]);
        $origen = $stmt->fetch();
        
        $stmt->execute([$cuenta_destino]);
        $destino = $stmt->fetch();
        
        if (!$origen || !$destino) {
            throw new Exception("Una de las cuentas no existe");
        }
        
        if ($origen['saldo'] < $monto) {
            throw new Exception("Saldo insuficiente");
        }
        
        // 2. Realizar transferencia
        // Retiro de cuenta origen
        $stmt = $pdo->prepare("UPDATE cuentas SET saldo = saldo - ? WHERE numero_cuenta = ?");
        $stmt->execute([$monto, $cuenta_origen]);
        
        // Abono a cuenta destino
        $stmt = $pdo->prepare("UPDATE cuentas SET saldo = saldo + ? WHERE numero_cuenta = ?");
        $stmt->execute([$monto, $cuenta_destino]);
        
        // 3. Registrar transacciones
        $stmt = $pdo->prepare("INSERT INTO transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, 'transferencia_envio', ?, NOW())");
        $stmt->execute([$origen['id'], $monto]);
        
        $stmt = $pdo->prepare("INSERT INTO transacciones (cuenta_id, tipo, monto, fecha) VALUES (?, 'transferencia_recibo', ?, NOW())");
        $stmt->execute([$destino['id'], $monto]);
        
        $pdo->commit();
        
        return ['success' => true, 'message' => 'Transferencia realizada correctamente'];
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(400);
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function obtenerTransacciones($numero_cuenta) {
    $pdo = getPDO();
    
    // Assuming your table might have a different column name or structure
    // You might need to adjust this query based on your actual table structure
    $stmt = $pdo->prepare("
        SELECT t.id, t.tipo, t.monto, t.fecha
        FROM transacciones t, cuentas c
        WHERE c.numero_cuenta = ? AND t.cuenta_id = c.id
        ORDER BY t.fecha DESC
        LIMIT 50
    ");
    $stmt->execute([$numero_cuenta]);
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function resetDatabase() {
    $pdo = getPDO();
    
    try {
        $pdo->beginTransaction();
        
        // Deshabilitar restricciones de clave foránea temporalmente
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // Truncar tablas
        $pdo->exec("TRUNCATE TABLE transacciones");
        $pdo->exec("TRUNCATE TABLE cuentas");
        $pdo->exec("TRUNCATE TABLE clientes");
        
        // Volver a habilitar restricciones
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        // Insertar datos iniciales
        $pdo->exec("INSERT INTO clientes (nombre, email) VALUES 
                    ('Juan Pérez', 'juan@example.com'),
                    ('María García', 'maria@example.com')");
        
        $pdo->exec("INSERT INTO cuentas (cliente_id, numero_cuenta, saldo) VALUES
                    (1, '123456', 1000.00),
                    (2, '654321', 500.00)");
        
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}




?>