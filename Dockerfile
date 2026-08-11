# Imagen de la landing, pensada para Coolify, Dokploy, Railway o cualquier PaaS.
#
# Existe para quitarle al servidor de despliegue la parte adivinatoria. Sin este
# archivo, quien construye la imagen tiene que deducir qué versión de Node usar,
# si esto es un sitio estático o un servicio, y con qué comando se arranca. Se
# equivoca con facilidad: un proyecto con Vite y una carpeta `dist/` se parece
# mucho a un estático, y si lo despliega como tal el panel de administración
# pierde el servidor y vuelve a guardar sólo en el navegador de quien edita.
#
# Aquí las tres cosas están escritas: Node 20, `node server/index.js`, puerto 8080.

# --------------------------------- compilación --------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# El lockfile aparte del resto: mientras no cambien las dependencias, esta capa
# se reaprovecha y el despliegue no repite la instalación entera.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------- ejecución ---------------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# El servidor no tiene dependencias: le basta su propio código y el `dist/`. Así
# la imagen final no arrastra ni el `node_modules` ni el código fuente.
#
# `shared/` no es opcional: de ahí salen las rutas y las meta que el servidor
# escribe en cada página. Sin esa carpeta el proceso no llega ni a arrancar.
# `package.json` tampoco, porque su `"type": "module"` es lo que hace que Node
# lea todo esto como ESM.
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY package.json ./

# Aquí escribe el panel. Monta un volumen en esta ruta desde el PaaS: sin él, el
# contenido vive dentro del contenedor y el siguiente despliegue se lo lleva por
# delante. Se crea ya con dueño porque el proceso no corre como root.
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 8080

# La contraseña no va aquí: se inyecta como variable de entorno desde el panel.
# El servidor se niega a arrancar sin ella, que es justo lo que se quiere.
CMD ["node", "server/index.js"]
