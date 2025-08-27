#!/bin/sh
set -e

# Gera /usr/share/nginx/html/env.js a partir do template e variáveis de ambiente
envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

# Executa o entrypoint padrão do nginx
exec "$@"






