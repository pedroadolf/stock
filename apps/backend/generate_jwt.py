import jwt
import time
import secrets
import json

jwt_secret = secrets.token_urlsafe(32)

anon_payload = {
    "role": "anon",
    "iss": "supabase",
    "iat": int(time.time()),
    "exp": 1893456000 # ~2030
}

service_payload = {
    "role": "service_role",
    "iss": "supabase",
    "iat": int(time.time()),
    "exp": 1893456000
}

anon_key = jwt.encode(anon_payload, jwt_secret, algorithm="HS256")
service_key = jwt.encode(service_payload, jwt_secret, algorithm="HS256")

print("JWT_SECRET:", jwt_secret)
print("ANON_KEY:", anon_key)
print("SERVICE_ROLE_KEY:", service_key)
