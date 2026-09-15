# AGENTS.md — Mapa de navegación para agentes de IA

> Punto de entrada para cualquier agente que trabaje en este repositorio.
> NO es una biblia de reglas: es un **mapa**. Lee solo lo que necesites
> cuando lo necesites (divulgación progresiva).

ODAAT es un monorepo: API FastAPI de reflexiones diarias (`backend/`) +
cliente Astro que la consume (`frontend/`).

## 1. Antes de empezar

1. Si vas a orquestar trabajo por tareas/issues, ejecutá `./.harness/init.sh`
   y leé `.harness/AGENTS.md` — el arnés vive ahí, está gitignoreado y
   nunca se commitea. El backlog es GitHub Issues (label `roadmap`), no
   un JSON local.
2. Si es una tarea puntual sin pasar por el arnés, igual aplican las
   reglas duras de §3.

## 2. Mapa del repositorio

| Archivo / carpeta         | Qué contiene                                              | Cuándo leerlo |
|----------------------------|--------------------------------------------------------------|---------------|
| `.harness/AGENTS.md`       | Arnés multiagente (backlog vía Issues, subagentes, checkpoints) | Al orquestar trabajo por tareas |
| `backend/README.md`        | Setup, endpoints y estructura de la API FastAPI               | Al tocar `backend/` |
| `frontend/AGENTS.md`       | Convenciones propias de Astro (dev server, rutas, componentes) | Al tocar `frontend/` |
| `README.md`                | Qué es el proyecto, estructura del monorepo                    | Orientación general |

## 3. Reglas duras (no negociables)

El usuario está aprendiendo Astro/frontend. Escribe el código él mismo.

- Nunca des código completo o copiable/pegable para `frontend/` o `backend/`.
- Da pseudocódigo (pasos lógicos, no sintaxis final) y lista qué métodos/APIs
  usar (nombre + para qué sirve), sin mostrar la implementación.
- No "masticar": el usuario arma la sintaxis exacta, decide nombres de
  variables, estructura el código.
- Está bien explicar CONCEPTOS a fondo (qué hace Astro SSR, por qué
  `PUBLIC_` prefix, etc.) — la restricción es sobre código, no sobre
  explicaciones.
- Comandos de shell (`npm`, `git`, `pnpm astro add ...`) sí se pueden dar
  completos — no son "el código de la app".

## 4. Si te bloqueas

Relee `backend/README.md` o `frontend/AGENTS.md` según el área. Si el
bloqueo requiere una decisión de producto, dejala para el usuario.
