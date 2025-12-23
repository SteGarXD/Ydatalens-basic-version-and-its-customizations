#!/bin/bash
# Создание патчей для интеграции кастомизаций в DataLens

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

CUSTOMIZATIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PATCHES_DIR="$CUSTOMIZATIONS_DIR/customizations/patches/@datalens"

log "Creating patches for DataLens integration..."

mkdir -p "$PATCHES_DIR"

# Создать патч для главного файла приложения
cat > "$PATCHES_DIR/datalens-ui+0.3498.0.patch" << 'PATCH'
diff --git a/src/index.tsx b/src/index.tsx
index 0000000..1111111 100644
--- a/src/index.tsx
+++ b/src/index.tsx
@@ -1,3 +1,9 @@
+// AeronavigatorBI Customizations
+import { initializeCustomizations } from './customizations/integration';
+
+// Initialize customizations before app initialization
+initializeCustomizations().catch(err => console.error('[AeronavigatorBI] Failed to initialize:', err));
+
 // Original DataLens code continues here...
PATCH

log "✓ Patch created: datalens-ui+0.3498.0.patch"
log ""
log "To apply patches:"
log "  cd frontend && npx patch-package"

