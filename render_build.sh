#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Iniciando despliegue de TiBACK en Render.com..."

# ===== FRONTEND (Node.js) =====
echo "🔧 Instalando dependencias de Node.js..."
npm install --production=false

# Instalar dependencias específicas que podrían no estar en package.json
echo "📦 Instalando dependencias adicionales..."
npm install socket.io-client@4.7.4
npm install @cloudinary/react@^1.14.3
npm install @cloudinary/url-gen@^1.22.0
npm install @google-cloud/speech@^7.2.0
npm install @react-google-maps/api@^2.20.7
npm install react-chartjs-2@^5.3.0
npm install chart.js@^4.5.0
npm install @emailjs/browser@^4.4.1

echo "🏗️ Construyendo frontend..."
npm run build

# ===== BACKEND (Python) =====
echo "🐍 Instalando dependencias de Python..."
pip install --upgrade pip
pip install -r requirements.txt

# ===== CONFIGURACIÓN FLASK =====
echo "⚙️ Configurando Flask..."
export FLASK_APP=src/app.py
export FLASK_ENV=production

# ===== MIGRACIONES =====
echo "🗄️ Ejecutando migraciones de base de datos..."
flask db upgrade

# ===== VERIFICACIÓN =====
echo "🔍 Verificando instalación..."
python -c "import flask, flask_sqlalchemy, flask_socketio; print('✅ Dependencias principales importadas correctamente')"


# ===== DATOS DE PRUEBA (OPCIONAL) =====
echo "📊 Insertando datos de prueba..."
flask insert-test-data

echo "✅ Despliegue completado exitosamente!"
echo "🌐 La aplicación está lista para ejecutarse con: gunicorn --bind 0.0.0.0:\$PORT src.wsgi:app"
