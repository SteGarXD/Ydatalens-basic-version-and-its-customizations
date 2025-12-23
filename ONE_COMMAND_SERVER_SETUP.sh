#!/bin/bash
# ОДНА КОМАНДА - ВСЁ АВТОМАТИЧЕСКИ
# Скопируйте и выполните эту команду на сервере Linux Ubuntu

cd /opt && \
git clone https://github.com/SteGarXD/Ydatalens-basic-version-and-its-customizations.git 2>/dev/null || (cd Ydatalens-basic-version-and-its-customizations && git pull) && \
cd Ydatalens-basic-version-and-its-customizations && \
git checkout customizations 2>/dev/null || git fetch origin customizations:customizations && \
chmod +x scripts/auto-setup-server.sh && \
./scripts/auto-setup-server.sh

