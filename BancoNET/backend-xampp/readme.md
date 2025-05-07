# Backend con XAMPP
Se requiere XAMPP como backend para el programa

Se proporcionan los archivos necesarios para levantar el `Apache` server y el `SQL`

No es necesario cambiar puertos, ya que `Node` y `Axios` no lo requiere

## Instalacion de Apache
Dentro de tu instalacion Raiz de XAMPP poner la carpeta `htdocs` del repositorio dentro de tu `/xampp/htdocs/`

Debe quedar tu carpeta raiz de la siguiente forma
```
\xampp\
├── htdocs
    ├── banconet
        ├── api.php
        ├── cliente.html
        └── dp.php
    |
    .
    .
    .
    └── applications.html
```

### Que es `Cliente.html`
Es una aplicacion de prueba del backend, es posible que no sirva dado que se cambiaron las peticiones a la hora de hacerlo compatible con el frontend

Aunque ya no se use esta pagina, se deja por haber sido util en `DEV`

## Instalacion de SQL
En la carpeta SQL se proporcionan las tablas que se pueden importar al SQL `tables.sql` tambien se puede usar `db.sql` en caso de que quieras empezar con datos de ejemplo

