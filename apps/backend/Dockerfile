FROM python:3.11-slim

WORKDIR /app

# 1. Instalar dependencias del sistema (compiladores si yfinance o langchain los requieren)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Copiar e instalar requerimientos de Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copiar código fuente
COPY . .

EXPOSE 8000

ENV PORT=8000
ENV HOST=0.0.0.0

# Arrancar servidor con Uvicorn en producción
CMD ["python", "server.py"]
