FROM node:22-alpine

WORKDIR /app

# Copiamos primero solo los manifiestos: Docker cachea esta capa y `npm ci`
# no se repite mientras no cambien las dependencias (builds mucho más rápidos).
COPY package.json package-lock.json ./

# `npm ci` instala exactamente lo que dice el lockfile: builds reproducibles.
RUN npm ci

COPY . .

EXPOSE 3000

# Modo desarrollo: tsx watch recarga al detectar cambios en el código montado.
CMD ["npm", "run", "dev"]
