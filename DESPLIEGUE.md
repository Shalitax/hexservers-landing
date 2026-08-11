# Despliegue

Hay dos caminos y sólo hace falta uno:

- **Servidor propio** (Debian/Ubuntu, nginx, systemd) — es el resto de esta guía.
- **Coolify u otro PaaS** — salta a la [sección final](#despliegue-en-coolify-u-otro-paas).

Los dos acaban en lo mismo: el servidor de Node sirviendo la web y guardando en
disco lo que edites desde el panel.

---

## Servidor propio: Debian / Ubuntu

Guía para dejar la web funcionando en un servidor propio, con HTTPS y arranque
automático. Probada mentalmente contra Debian 12 y Ubuntu 22.04/24.04; los
comandos son idénticos en ambos salvo donde se indica.

Al terminar tendrás:

- La web servida por `nginx` con certificado de Let's Encrypt.
- El contenido que edites desde el panel guardado en el **disco del servidor**, así
  que lo verán todos los visitantes.
- El servicio arrancando solo al reiniciar la máquina.

Tiempo estimado: 20 minutos. Necesitas un dominio apuntando a la IP del servidor
y acceso `sudo`.

---

## 1. Node 20

Los repositorios de Debian y Ubuntu traen versiones de Node demasiado viejas para
Vite (el proyecto pide **Node 20 o superior**; Ubuntu 22.04 trae la 12). Se
instala desde NodeSource:

```bash
sudo apt update && sudo apt install -y curl git
```

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

```bash
sudo apt install -y nodejs && node -v
```

Debe imprimir `v20.x` o superior. Si sale una versión menor, el `npm run build`
fallará más adelante con errores poco claros.

---

## 2. Un usuario para el servicio

No ejecutes la web como `root`. Un usuario sin login propio limita el daño si
algún día se encuentra un fallo en el servidor:

```bash
sudo adduser --system --group --home /opt/hexservers hexservers
```

---

## 3. Clonar y compilar

```bash
sudo -u hexservers git clone https://github.com/Shalitax/hexservers-landing.git /opt/hexservers/app
```

```bash
cd /opt/hexservers/app && sudo -u hexservers -H npm ci && sudo -u hexservers -H npm run build
```

`npm ci` en lugar de `npm install`: instala exactamente las versiones del
`package-lock.json`, que es lo que quieres en un servidor. El `-H` de `sudo` pone
`HOME` en la carpeta del usuario del servicio; sin él npm intenta escribir su
caché en el home de `root` y falla por permisos.

Falta la carpeta `data/`, donde vivirá el contenido. El servidor la crearía solo
al primer guardado, pero hay que adelantarse: el servicio del paso 5 la declara
como su única ruta de escritura, y systemd se niega a arrancar si no existe.

```bash
sudo -u hexservers mkdir -p /opt/hexservers/app/data && sudo chown -R hexservers:hexservers /opt/hexservers/app
```

---

## 4. La contraseña del panel

Va en un archivo que solo puede leer `root`, no en el archivo del servicio (que es
legible por cualquiera del sistema):

```bash
sudo install -m 600 -o root -g root /dev/null /etc/hexservers.env
```

Genera una contraseña larga y guárdala:

```bash
printf 'HEX_ADMIN_PASSWORD=%s\n' "$(openssl rand -base64 24)" | sudo tee /etc/hexservers.env >/dev/null
```

Ahora **léela y apúntala en tu gestor de contraseñas**, porque es con la que vas a
entrar al panel:

```bash
sudo cat /etc/hexservers.env
```

> El servidor se niega a arrancar sin esta variable. No hay contraseña por defecto
> a propósito: una clave de fábrica en un servicio que escribe en disco es una
> puerta abierta con un cartel indicando dónde está.

---

## 5. El servicio de systemd

```bash
sudo tee /etc/systemd/system/hexservers.service >/dev/null <<'UNIT'
[Unit]
Description=HexServers landing
After=network.target

[Service]
Type=simple
User=hexservers
Group=hexservers
WorkingDirectory=/opt/hexservers/app
EnvironmentFile=/etc/hexservers.env

# Sólo escucha en local: quien habla con el exterior es nginx.
Environment=HOST=127.0.0.1
Environment=PORT=8080

ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=5

# Endurecimiento: el servicio sólo necesita escribir en su carpeta de datos.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/hexservers/app/data

[Install]
WantedBy=multi-user.target
UNIT
```

`HOST=127.0.0.1` es importante: sin eso el puerto 8080 quedaría accesible desde
fuera y alguien podría saltarse nginx y el HTTPS.

Arranca y comprueba:

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now hexservers
```

```bash
sudo systemctl status hexservers --no-pager
```

```bash
curl -sI http://127.0.0.1:8080 | head -1
```

Debe responder `HTTP/1.1 200 OK`.

---

## 6. nginx como proxy inverso

```bash
sudo apt install -y nginx
```

Sustituye `tudominio.com` por el tuyo en todo el bloque:

```bash
sudo tee /etc/nginx/sites-available/hexservers >/dev/null <<'CONF'
server {
    listen 80;
    listen [::]:80;
    server_name tudominio.com www.tudominio.com;

    # El panel envía el contenido entero en cada guardado, con las imágenes
    # incrustadas en base64. El texto solo ya son ~93 KB, y una imagen del
    # tamaño máximo que acepta el panel (1,5 MB) pasa de 2 MB al codificarse:
    # con el límite por defecto de nginx (1 MB) el guardado fallaría con un 413.
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
CONF
```

```bash
sudo ln -sf /etc/nginx/sites-available/hexservers /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

> **Ese `location /` que lo manda todo al servidor de Node no es opcional.** La
> web navega por rutas reales (`/producto/minecraft`), y quien las resuelve —y
> quien escribe el título y la tarjeta de enlace de cada página— es el servidor.
> Servir `dist/` directamente con nginx daría un 404 en cualquier ruta que no sea
> la portada.

> **`client_max_body_size` no es opcional.** Es el fallo más probable de este
> despliegue: todo parece ir bien —el texto se guarda, son 93 KB— hasta que subes
> el primer logo y el guardado empieza a fallar con un 413 que solo se ve en la
> consola del navegador. Los 12 MB dejan margen sobre los 8 MB que acepta el
> servidor; ponerlo por debajo de esos 8 MB sería trasladar el problema a nginx.

---

## 7. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
```

```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Certbot edita la configuración de nginx y programa la renovación automática. La
contraseña del panel viaja en el cuerpo de la petición de login: **sin TLS iría en
claro por la red**, así que este paso no se salta.

---

## 8. Cortafuegos

```bash
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
```

Comprueba desde otra máquina que el 8080 **no** responde:

```bash
curl -m 5 http://tudominio.com:8080
```

Debe agotar el tiempo de espera. Si contesta, revisa `HOST=127.0.0.1` en el
servicio.

---

## 9. Primera configuración

Entra a `https://tudominio.com`, pulsa `Ctrl` + `Shift` + `A` y usa la contraseña
del paso 4. Solo pide contraseña, sin usuario: es la señal de que detectó el
servidor.

Con el panel abierto, la barra inferior te dice dónde queda cada cambio:

| Indicador | Significado |
| --------- | ----------- |
| **En el servidor** | Hay servidor y sesión válida |
| **Guardando…** | El cambio va de camino |
| **Publicado** | Guardado en disco: los visitantes lo verán al recargar |
| **Sin guardar** | Falló. Pasa el ratón por encima para ver el motivo |
| **Sólo local** (ámbar) | No detectó servidor: estás guardando solo en tu navegador |

Si ves *Sólo local* en el dominio, algo va mal en el proxy — revisa el paso 6.

Comprueba de paso que el SEO salió bien:

```bash
curl -s https://tudominio.com/producto/minecraft | grep -E '<title>|og:image'
```

Debe dar el título **de ese producto**, no el de la portada. Y en el panel →
pestaña **SEO**, lo primero de todo: escribir la URL pública del sitio.

Lo primero que conviene configurar, porque hoy son datos de ejemplo inventados:
los PID de WHMCS de cada plan, los precios, las cifras de la portada, el hardware
y el equipo de soporte del Hub, y los enlaces legales del footer.

---

## 10. Copias de seguridad

**Todo tu contenido es un único archivo**: `/opt/hexservers/app/data/content.json`.
No está en el repo, así que si lo pierdes vuelves al contenido de ejemplo.

Una copia diaria con rotación de 30 días:

```bash
sudo tee /etc/cron.daily/hexservers-backup >/dev/null <<'CRON'
#!/bin/sh
set -e
mkdir -p /var/backups/hexservers
cp /opt/hexservers/app/data/content.json \
   "/var/backups/hexservers/content-$(date +%F).json"
find /var/backups/hexservers -name 'content-*.json' -mtime +30 -delete
CRON
sudo chmod +x /etc/cron.daily/hexservers-backup
```

También puedes descargar una copia desde el propio panel → pestaña **Datos** →
*Exportar JSON*, que sirve para llevarte el contenido a otra instalación.

---

## Operación diaria

**Actualizar a la última versión del repo:**

```bash
cd /opt/hexservers/app && sudo -u hexservers git pull && sudo -u hexservers -H npm ci && sudo -u hexservers -H npm run build && sudo systemctl restart hexservers
```

El contenido de `data/` no se toca al actualizar: `git pull` no lo conoce.

**Ver los registros:**

```bash
sudo journalctl -u hexservers -f
```

**Cambiar la contraseña del panel:**

```bash
sudo nano /etc/hexservers.env && sudo systemctl restart hexservers
```

Reiniciar cierra todas las sesiones abiertas, porque viven en memoria.

---

## Si algo falla

| Síntoma | Causa probable |
| ------- | -------------- |
| `502 Bad Gateway` | El servicio no está arrancado. `sudo journalctl -u hexservers -n 50` |
| El servicio no arranca y el log dice «Falta HEX_ADMIN_PASSWORD» | `/etc/hexservers.env` vacío o mal escrito |
| El servicio no arranca y el log habla de `namespace` o `ReadWritePaths` | Falta la carpeta `data/` (paso 3). Créala y `systemctl restart hexservers` |
| «No hay build. Ejecuta: npm run build» | Falta compilar, o `dist/` no es legible por el usuario `hexservers` |
| La barra dice **Sólo local** en el dominio | nginx no está pasando `/api/` al servidor: revisa el `location /` |
| Al guardar sale **Sin guardar** y en la consola un 413 | Falta `client_max_body_size` en nginx (paso 6) |
| Al guardar sale **Sin guardar** y un 401 | La sesión caducó (12 h) o se reinició el servicio. Vuelve a entrar |
| `npm run build` falla con errores raros de sintaxis | Node demasiado viejo. `node -v` debe dar 20 o más |

---

## Despliegue en Coolify (u otro PaaS)

Coolify, Dokploy, Railway y compañía construyen una imagen a partir del repo y la
ejecutan. El riesgo de todos ellos es el mismo: **adivinan mal qué es este
proyecto**. Ven Vite y una carpeta `dist/` y lo despliegan como sitio estático,
que funciona a medias — la web se ve perfectamente, pero no hay nadie
respondiendo a `/api/`, así que el panel no encuentra servidor, no usa
`HEX_ADMIN_PASSWORD` y vuelve a guardar sólo en el navegador de quien edita.

Por eso el repo trae un `Dockerfile`: deja escrito qué versión de Node, qué
comando y qué puerto, y no queda nada que adivinar.

### Los cuatro ajustes

| Ajuste | Valor |
| ------ | ----- |
| **Build Pack** | `Dockerfile` |
| **Port** (*Ports Exposes*) | `8080` |
| **Environment Variables** | `HEX_ADMIN_PASSWORD` = tu contraseña larga |
| **Persistent Storage** | un volumen montado en `/app/data` |

> No lo despliegues como **sitio estático**. Con Nixpacks hay un interruptor
> *«Is it a static site?»* que lo hace: sirve `dist/` con Caddy y nunca ejecuta
> el servidor. La web se ve, pero no hay `/api/`, el panel no encuentra servidor,
> `HEX_ADMIN_PASSWORD` no la lee nadie y todas las páginas comparten el mismo
> título. Con el `Dockerfile` ese interruptor no existe.

Sobre los dos últimos, que son los que suelen fallar:

**La variable tiene que ser de ejecución, no de construcción.** En Coolify, la
casilla *Build Variable* la pasa sólo al `docker build` y el contenedor arranca
sin ella; el servidor entonces se niega a arrancar. Déjala sin marcar.

**El volumen no es opcional si piensas editar contenido.** Todo lo que guardas
desde el panel vive en `data/content.json`, dentro del contenedor. Sin volumen,
el siguiente despliegue lo borra y vuelves al catálogo de ejemplo. En Coolify:
*Storages* → *Add* → tipo **Volume**, *Destination Path* `/app/data`.

Que sea un *Volume* y no un *Bind Mount* importa: el proceso no corre como root
—corre como el usuario `node`, UID 1000—, y un volumen con nombre hereda los
permisos que la imagen ya le dio a esa carpeta. Un bind mount hereda los del
host, que suelen ser de root, y entonces el panel guarda y falla con *Sin
guardar*. Si necesitas un bind mount, un `chown -R 1000:1000` en la carpeta del
host lo arregla.

### Comprobar que de verdad hay servidor

Esta es la prueba que distingue «desplegado» de «desplegado bien»:

```bash
curl -i https://tudominio.com/api/content
```

| Lo que responde | Qué significa |
| --------------- | ------------- |
| `204 No Content` | Correcto. Hay servidor y aún no has guardado nada |
| `200` con `content-type: application/json` | Correcto. Hay servidor y hay contenido guardado |
| `200` con `content-type: text/html` | **Se desplegó como estático.** Te está devolviendo el `index.html` |
| `502` / `503` | El contenedor no arranca. Mira los registros del despliegue |

Si sale HTML, el panel dirá *Sólo local* por mucho que la variable esté puesta:
no es que no la detecte, es que no hay ningún proceso de Node que pueda leerla.

### Si prefieres Nixpacks en vez del Dockerfile

Funciona, pero hay que decirle dos cosas a mano:

- **Start Command**: `npm start`
- **Port**: `8080`

Y asegurarte de que el recurso es de tipo aplicación, no *Static Site*. La
versión de Node la toma del `engines` del `package.json`, que pide **20 o
superior**.

> El aviso de `client_max_body_size` del despliegue con nginx no aplica aquí:
> Traefik, el proxy de Coolify, no limita el tamaño del cuerpo por defecto.

---

## Notas sobre el modelo de seguridad

- El login **con servidor** sí protege el contenido: la contraseña la valida el
  servidor y sin token no se puede escribir nada. Se limitan los intentos a 10 por
  IP cada 10 minutos.
- `GET /api/content` es **público** — es el contenido de la web y lo lee cada
  visitante. Por eso el hash de la contraseña y las claves de la API de WHMCS se
  vacían antes de escribir el archivo.
- Las sesiones viven en memoria y caducan a las 12 horas.
- Lo que no cubre esto: no hay registro de quién cambió qué, ni varios usuarios,
  ni historial de versiones. Si algún día hacen falta, toca una base de datos de
  verdad.
