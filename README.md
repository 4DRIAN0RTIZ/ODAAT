# Reflexiones Diarias API

API en FastAPI que sirve las 365 reflexiones diarias de AA scrapeadas de [aa.org/es/daily-reflections](https://www.aa.org/es/daily-reflections) (no existe API oficial funcional: el sitio referencia `reflections_api_url` en `drupalSettings` pero responde 404).

Datos ya scrapeados en `data/reflections.json`. La API los sirve directo desde ahí, sin pegarle al sitio en cada request.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Correr

```bash
.venv/bin/uvicorn app.main:app --reload --port 8811
```

## Probar

```bash
# todas las reflexiones
curl http://127.0.0.1:8811/reflections

# reflexión de hoy
curl http://127.0.0.1:8811/reflections/today

# por mes-día
curl http://127.0.0.1:8811/reflections/09-14

# una al azar
curl http://127.0.0.1:8811/reflections/random
```

Docs interactivas (Swagger): http://127.0.0.1:8811/docs

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/reflections` | Lista completa (365) |
| GET | `/reflections/today` | Reflexión del día actual (fecha del servidor) |
| GET | `/reflections/random` | Una reflexión al azar |
| GET | `/reflections/{month}-{day}` | Reflexión por mes/día (ej. `09-14`) |

Cada reflexión: `{month, day, date_label, title, paragraphs, text, source_url}`.

`data/reflections.json` ya viene generado; este repo solo sirve el server de la API.
