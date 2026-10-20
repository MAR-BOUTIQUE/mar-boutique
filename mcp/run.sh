#!/usr/bin/env bash
# Lanza el MCP de inventario con el Node de .nvmrc.
# Claude no carga nvm por sí solo, por eso se hace aquí.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# nvm.sh imprime a stdout en algunos casos; stdout es el canal del protocolo.
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh" >/dev/null 2>&1
nvm use >/dev/null 2>&1 || { echo "Node de .nvmrc no instalado: corre 'nvm install'" >&2; exit 1; }

# --env-file requiere Node >= 20.6
exec node --env-file=.env.local --import tsx mcp/inventory/stdio.mts
