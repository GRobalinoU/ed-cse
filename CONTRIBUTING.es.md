# Contribuir a ED-CSE

**[Read in English →](./CONTRIBUTING.md)**

Gracias por tu interés en contribuir. Este documento explica cómo empezar y qué esperamos de los contribuidores.

---

## Código de Conducta

Este proyecto sigue nuestro [Código de Conducta](./CODE_OF_CONDUCT.es.md). Al participar, aceptás cumplirlo.

---

## Formas de Contribuir

- **Reporte de bugs** — abrí un issue con una reproducción mínima
- **Solicitudes de features** — abrí un issue describiendo el caso de uso, no solo la feature
- **Contribuciones de código** — corrección de bugs, nuevas features, mejoras de rendimiento
- **Documentación** — mejoras al README, docs inline, o al futuro sitio de documentación
- **Tests** — aumentar cobertura, casos borde

---

## Configuración de Desarrollo

### Prerrequisitos

- Node.js `>=20.0.0`
- pnpm `>=9.0.0`

```bash
# Clonar el repo
git clone https://github.com/GRobalinoU/ed-cse.git
cd ed-cse

# Instalar dependencias
pnpm install

# Compilar todos los paquetes
pnpm build

# Correr todos los tests
pnpm test:run
```

---

## Estructura del Proyecto

```
packages/core/      # Motor core — acá vive la lógica importante
packages/sdk-node/  # SDK Node.js (depende de core)
packages/cli/       # Herramienta CLI
apps/docs/          # Sitio de documentación
apps/playground/    # Sandbox interactivo
```

Si tenés dudas sobre dónde empezar, arrancá por `packages/core`.

---

## Flujo de Trabajo

1. **Fork** del repositorio
2. **Crear una branch** desde `main`:
   ```bash
   git checkout -b feat/nombre-de-tu-feature
   ```
3. **Hacer tus cambios** — commits pequeños y enfocados
4. **Agregar o actualizar tests** — todo comportamiento nuevo debe tener tests
5. **Correr las verificaciones** antes de hacer push:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:run
   ```
6. **Abrir un Pull Request** contra `main` con una descripción clara

---

## Convención de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar policy engine para guards de transición
fix: corregir precisión de timestamp en eventos
docs: actualizar ejemplo de inicio rápido
chore: actualizar vitest a 3.x
test: agregar casos borde para replay de FSM
refactor: extraer log de eventos a módulo separado
```

Los PRs con mensajes de commit que no sigan esta convención serán pedidos a hacer rebase antes de mergear.

---

## Checklist de Pull Request

- [ ] La branch está actualizada con `main`
- [ ] Todos los tests pasan (`pnpm test:run`)
- [ ] TypeScript compila sin errores (`pnpm typecheck`)
- [ ] El lint pasa (`pnpm lint`)
- [ ] El nuevo comportamiento está cubierto por tests
- [ ] Los cambios en la API pública están reflejados en el README
- [ ] Los mensajes de commit siguen Conventional Commits

---

## Reportar Bugs

Abrí un issue e incluí:

1. Una **reproducción mínima** — mientras más pequeña, mejor
2. **Comportamiento esperado** vs **comportamiento actual**
3. Tu versión de Node.js y pnpm
4. Mensajes de error o stack traces relevantes

---

## Solicitudes de Features

Antes de abrir una solicitud, verificá si ya existe un issue similar.

Al abrirla, describí:
- El **caso de uso** que estás intentando resolver
- Por qué las soluciones existentes no te sirven
- Cualquier idea de API que tengas (opcional)

Priorizamos features que resuelven problemas reales en producción, especialmente en fintech y logística.

---

## Preguntas

Abrí una [Discusión](https://github.com/GRobalinoU/ed-cse/discussions) en lugar de un issue para preguntas generales.
