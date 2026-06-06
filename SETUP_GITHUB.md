# Vinculación a GitHub

## Pasos para conectar este repo a GitHub

### 1. Crear el repositorio en GitHub
- Ir a https://github.com/new
- Cuenta: gustavo.robalino@proton.me
- Nombre del repo: `ed-cse`
- Descripción: `Event-Driven Canonical State Engine — FSM + Event Sourcing framework`
- Visibilidad: **Public**
- ❌ NO inicializar con README (ya tenemos uno)
- ❌ NO agregar .gitignore (ya tenemos uno)
- Licencia: **NO agregar** (ya tenemos MIT)

### 2. Conectar el repo local
```bash
# Pararse en el directorio del proyecto
cd "C:\dev\05 experiments\ED-CSE"

# Agregar el remote (reemplazar TU_USUARIO con tu username de GitHub)
git remote add origin https://github.com/TU_USUARIO/ed-cse.git

# Renombrar branch a main (Git moderno ya usa main, pero por si acaso)
git branch -M main

# Push inicial
git push -u origin main
```

### 3. Configurar GitHub Actions (automático)
El CI ya está en `.github/workflows/ci.yml` y se activará con el primer push.

### 4. Configurar el repo en GitHub (recomendado)
En Settings del repo:
- Topics: `state-machine`, `event-sourcing`, `typescript`, `fintech`, `fsm`, `framework`
- Website: (dejar vacío por ahora)
- Habilitar Discussions (para preguntas de la comunidad)
- Branch protection en `main`: require PR + CI checks

### 5. Crear la organización en npm (cuando sea momento de publicar)
```bash
# Login en npm con la cuenta asociada
npm login

# Crear el scope @ed-cse (requiere organización en npmjs.com)
# Ir a https://www.npmjs.com/org/create y crear la org "ed-cse"
```
