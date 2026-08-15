#!/bin/sh
set -e

# Defaults
export SUPABASE_KONG_HOST=${SUPABASE_KONG_HOST:-supabase-kong}
export SUPABASE_KONG_PORT=${SUPABASE_KONG_PORT:-8000}

# Process nginx.conf template with environment variables
if [ -f /etc/nginx/conf.d/default.conf.template ]; then
    envsubst '${SUPABASE_KONG_HOST} ${SUPABASE_KONG_PORT}' \
        < /etc/nginx/conf.d/default.conf.template \
        > /etc/nginx/conf.d/default.conf
    echo "nginx.conf gerado com SUPABASE_KONG_HOST=${SUPABASE_KONG_HOST} SUPABASE_KONG_PORT=${SUPABASE_KONG_PORT}"
fi

exec "$@"