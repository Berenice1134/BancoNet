CREATE TABLE clientes (
  id int(11) NOT NULL AUTO_INCREMENT,
  nombre varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  fecha_registro timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cuentas (
  id int(11) NOT NULL AUTO_INCREMENT,
  cliente_id int(11) NOT NULL,
  numero_cuenta varchar(20) NOT NULL,
  saldo decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (id),
  UNIQUE KEY numero_cuenta (numero_cuenta),
  KEY cliente_id (cliente_id),
  CONSTRAINT cuentas_ibfk_1 FOREIGN KEY (cliente_id) REFERENCES clientes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE transacciones (
  id int(11) NOT NULL AUTO_INCREMENT,
  cuenta_id int(11) NOT NULL,
  tipo enum('abono','retiro','transferencia_envio','transferencia_recibo') NOT NULL,
  monto decimal(10,2) NOT NULL,
  fecha timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY cuenta_id (cuenta_id),
  CONSTRAINT transacciones_ibfk_1 FOREIGN KEY (cuenta_id) REFERENCES cuentas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;