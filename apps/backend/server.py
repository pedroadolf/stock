import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Cargamos el archivo .env de la raíz
load_dotenv("../../.env")

# Crearemos el router en el siguiente paso
from app.api.trades import router as trades_router

app = FastAPI(
    title="Stock Agent MCP Server",
    description="Servidor de agentes y análisis de portafolios financieros para Stock",
    version="1.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restringir en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registramos el router de operaciones
app.include_router(trades_router, prefix="/api/trades", tags=["Trades"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "stock-agent-mcp"}

if __name__ == "__main__":
    import uvicorn
    # Puerto por defecto 8000
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
