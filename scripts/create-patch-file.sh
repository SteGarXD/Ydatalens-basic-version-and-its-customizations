#!/bin/bash
# Создание патча для интеграции в DataLens UI

set -e

CUSTOMIZATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PATCHES_DIR="$CUSTOMIZATIONS_DIR/customizations/patches"

echo "📝 Создание патча для DataLens UI..."
echo ""

# Создать директорию для патчей
mkdir -p "$PATCHES_DIR/@datalens"

# Создать патч файл
PATCH_FILE="$PATCHES_DIR/@datalens/datalens-ui+0.3498.0.patch"

cat > "$PATCH_FILE" << 'PATCH_EOF'
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
PATCH_EOF

echo "✓ Патч создан: $PATCH_FILE"
echo ""
echo "Для применения патча выполните:"
echo "  npm install"
echo "  npx patch-package @datalens/datalens-ui"
echo ""

