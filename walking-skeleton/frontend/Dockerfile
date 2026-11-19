FROM node:22-alpine

WORKDIR /app

# Copiamos primero solo los manifiestos: Docker cachea esta capa y `npm ci`
# no se repite mientras no cambien las dependencias (builds mucho más rápidos).
COPY package.json package-lock.json ./

# `npm ci` instala exactamente lo que dice el lockfile: builds reproducibles.
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0: sin esto Vite solo escucha dentro del contenedor y no se ve desde tu máquina.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
