#!/usr/bin/env bash
# Portão de qualidade da migração: para no primeiro erro.
set -euo pipefail
npm run lint
npm run typecheck
npm run test
npm run build
npm run cf:build
