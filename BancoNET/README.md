# BancoNET

![BancoNET](image.webp)

## Instalar con Git
```bash
git clone https://github.com/RainBWP/BancoNET.git
git checkout -b FrontBank origin/FrontBank
```

## Ejecutar Frontend
```bash
cd front-end-banco-express
npm install
npm run preview
```

## Ejecutar Frontend con mosh-db
Es posible que se tenga que usar otro fork
```bash
cd front-end-banco-express
npm install
npm run dev+mock
```

## Donde me ejecuto?
Puedes ingresar al backend desde las siguientes direcciones
```cmd
 ➜  Local:   http://localhost:[PORT]/
 ➜  Network: http://[DEVICE_IP]:[PORT]/
 ➜  Network: http://[ROUTER_IP]:[PORT]/
```

## Como quiere acceder al backend?
El API del backend estará disponible en `localhost` usando el puerto `8080`. Asegúrate de que no esté bloqueado.