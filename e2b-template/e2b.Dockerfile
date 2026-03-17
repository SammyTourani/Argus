FROM e2b/code-interpreter:latest

# Copy pre-configured Vite React app
COPY package.json vite.config.js tailwind.config.js postcss.config.js index.html /home/user/app/
COPY src/ /home/user/app/src/

WORKDIR /home/user/app

# Install base dependencies at build time (cached in template image)
RUN npm install --legacy-peer-deps

# Pre-install commonly used packages that cloned sites frequently need
# This avoids npm install during sandbox runtime for most projects
RUN npm install --legacy-peer-deps \
  react-router-dom \
  lucide-react \
  framer-motion \
  clsx \
  tailwind-merge \
  @headlessui/react \
  react-icons
