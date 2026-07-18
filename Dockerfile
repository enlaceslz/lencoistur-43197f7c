FROM node:20-bookworm-slim AS build

WORKDIR /usr/src/app

ARG VITE_SITE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Build Vite
RUN npx vite build

# Install Playwright's Chromium with system deps for prerender
RUN npx playwright install --with-deps chromium 2>&1

# Prerender static routes
RUN node scripts/prerender.mjs

# --- Build Brotli module for Nginx ---
FROM nginx:stable-alpine AS brotli

RUN apk add --no-cache git gcc make musl-dev pcre2-dev zlib-dev linux-headers brotli-dev

ARG NGINX_VERSION=1.30.4
RUN wget -q https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz \
  && tar xzf nginx-${NGINX_VERSION}.tar.gz

RUN git clone --depth 1 --recursive https://github.com/google/ngx_brotli.git /tmp/ngx_brotli

RUN cd nginx-${NGINX_VERSION} \
  && ./configure --with-compat --add-dynamic-module=/tmp/ngx_brotli 2>&1 \
  && make modules 2>&1

# --- Stage 3: serve static assets with Nginx ---
FROM nginx:stable-alpine
COPY --from=brotli /nginx-1.30.4/objs/ngx_http_brotli_filter_module.so /usr/lib/nginx/modules/
COPY --from=brotli /nginx-1.30.4/objs/ngx_http_brotli_static_module.so /usr/lib/nginx/modules/
COPY --from=brotli /usr/lib/libbrotli*.so* /usr/lib/
RUN sed -i '1i load_module /usr/lib/nginx/modules/ngx_http_brotli_filter_module.so;\nload_module /usr/lib/nginx/modules/ngx_http_brotli_static_module.so;' /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
