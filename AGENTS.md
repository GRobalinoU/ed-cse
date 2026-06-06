# AGENTS.md - Reglas Obligatorias de Cumplimiento

Este archivo contiene instrucciones **obligatorias** que todo agente debe leer y seguir al iniciar sesión en `C:\dev`.

---

## 1. Política de Eliminación (CRÍTICO)

**NUNCA eliminar archivos o carpetas de forma permanente.**

- ✅ **Correcto:** Enviar a Papelera de Reciclaje
  ```powershell
  Remove-Item -LiteralPath "ruta" -RecycleBin
  ```
- ❌ **Prohibido:** Borrado definitivo sin autorización explícita
  ```powershell
  Remove-Item -LiteralPath "ruta" -Force  # NO USAR
  ```

**Excepciones (solo con aprobación previa del usuario):**
- `node_modules/`
- `venv/`
- `__pycache__/`
- Archivos temporales (`.tmp`, `.cache`)

---

## 2. Grafo de Proyectos (OBLIGATORIO)

**Inmediatamente después de leer este archivo**, cargar `C:\dev\GRAFO.md`.

Ese archivo es el índice maestro de todos los proyectos en `C:\dev`. Contiene:
- Mapeo proyecto → descripción, stack, estado
- Keywords/alias por proyecto
- Mapa de conexiones entre proyectos

**No cargar contexto de ningún proyecto sin antes consultar GRAFO.md.**

---

## 3. Antes de Ejecutar Cambios

1. **Leer este archivo completo** al iniciar en `C:\dev`
2. **Cargar GRAFO.md** (paso anterior)
3. **Confirmar con el usuario** antes de ejecutar recomendaciones automáticas
4. **No asumir** que tareas de `resumenopencode.md` deben ejecutarse automáticamente

---

## 4. Manejo de Credenciales

- No mover archivos `.vc` (VeraCrypt) sin instrucciones explícitas
- No modificar `.gitignore` para credenciales sin confirmar
- Archivos encriptados se tratan como intocables

---

## 5. Estructura de Directorios

Seguir estrictamente la arquitectura de 6 niveles definida en `01 infra/PROCEDURES.md`:
- `01 infra/` - Infraestructura
- `02 apps/` - Aplicaciones activas (Docker-first)
- `03 docs/` - Documentación
- `04 personal/` - Archivos personales
- `05 experiments/` - Experimentos
- `99 offtopic/` - Legacy/archivo

**No crear directorios fuera de esta estructura.**

---

## 6. Docker-First

Todo proyecto en `02 apps/` debe ser containerizable. Promover desde `05 experiments/` solo cuando cumpla **Definition of Ready** (DoR).

---

## 7. Archivos opencode.md por Proyecto

Cada directorio raíz de proyecto debe contener un archivo `opencode.md` de **obligatoria lectura/cumplimiento para OpenCode**.

### Propósito
- Contiene reglas e instrucciones **específicas para OpenCode** (pueden diferir de Claude, Antigravity u otros agentes)
- Define comportamientos, restricciones o flujos particulares del proyecto para este agente

### Cuándo leerlo
- **NO se lee automáticamente** al iniciar sesión (a diferencia de `AGENTS.md`)
- **SÍ se lee obligatoriamente** cuando el usuario indique explícitamente: *"retomar proyecto"*, *"continuar proyecto"*, o similar en la carpeta donde se encuentre
- El archivo a leer es el `opencode.md` de la carpeta actual del proyecto

### Cambio entre proyectos
**CRÍTICO:** Si estamos en un proyecto, cambias a otro y dices *"retomemos el proyecto"*:
1. Las instrucciones del `opencode.md` anterior **dejan de estar vigentes inmediatamente**
2. Se lee el `opencode.md` del **nuevo** proyecto (carpeta actual)
3. Cada proyecto tiene sus propias particularidades y reglas independientes

### Estructura
Si no existe `opencode.md` en un proyecto activo, crearlo con las reglas específicas que el usuario indique.

---

## 9. Reglas de Idioma y Comunicación

**CRÍTICO: SIEMPRE responder en ESPAÑOL LATINOAMERICANO:**
- ❌ **NUNCA** responder en chino, inglés, francés u otros idiomas
- ✅ **SIEMPRE** usar español con modismos latinoamericanos
- ✅ Usar "vos" implícito (si el usuario usa "tú", adaptarse)
- ✅ Modismos: "chevere", "pucha", "¡dale!", "no más", etc. según contexto
- ✅ Ejemplos de respuestas:
  - ✅ "Listo", "Hecho", "Vamos", "Dale", "¡Qué cool!"
  - ❌ "Done", "Finished", "完成", "是的"

**Validación antes de responder:**
1. Leer la pregunta del usuario
2. Verificar que mi respuesta esté en español latino
3. Si detecto que escribí en otro idioma → reescribir inmediatamente

---

## 10. Framework AsesorIA

**Al iniciar un proyecto nuevo, leer obligatoriamente:**

1. `asesoria/rules/stack.md` — qué stack usar según el tipo de proyecto
2. `asesoria/rules/quality.md` — quality gates que aplicar antes de entregar
3. `asesoria/rules/decisions.md` — decisiones ya tomadas para no repetir discusiones

**Durante la ejecución:**
- Si surge un problema nuevo → documentar solución en `asesoria/patterns/`
- Si se toma una decisión recurrente → agregar a `asesoria/rules/decisions.md`
- Usar `asesoria/templates/` como scaffold inicial del proyecto

**Al cerrar proyecto:**
- Ejecutar quality gates de `asesoria/rules/quality.md`
- Dejar `opencode.md` actualizado
- Actualizar post-mortem en `decisions.md`

---

## 11. Reglas Adicionales por Tarea

Cualquier nueva regla o instrucción que el usuario pida ejecutar en una tarea específica se documentará aquí:

### Plantilla de Documentos
- La plantilla base para documentos formales (propuestas, informes, etc.) es: `C:\dev\03 docs\Capacitación\plantilla_urdata_asesoria_v2_.docx`
- Usar esta plantilla a menos que se indique explícitamente otra

---

## 12. Archivos con Problemas Conocidos

**Windows Reserved Device Names (bug conocido):**

En la raíz de `C:\dev` existen archivos con nombres de dispositivos reservados de Windows (`nul`, `con`, `prn`, `aux`, etc.) que **no se pueden eliminar** con comandos estándar.

- `C:\dev\nul` - archivo de 47 bytes (reservado por Windows)
- Posiblemente otros casos similares en subcarpetas

**Estado:** NO eliminar. Investigar solución más adelante. No generan ruido funcional, solo aparecen en listados.

---

## 13. Regla ELn (Explain Like n)

**Cuando el usuario pida "ELn" (siendo n un número de años), explicar el tema como si tuviera n años de experiencia.**

- **EL5** = explicar para alguien con 5 años de experiencia técnica
- **EL10** = explicar para alguien con 10 años de experiencia
- etc.

**Formato obligatorio:**
- Usar terminología adecuada para el nivel n
- Incluir analogías cuando sea útil
- Ser conciso pero completo
- Si no se conoce el contexto del proyecto, preguntar antes de explicar

### EL10: Arquitectura Hexagonal bien definida y Local-First

**Arquitectura Hexagonal (Ports & Adapters):**
- Separa la lógica de negocio (core) de los detalles técnicos externos
- `contracts/` = puertos (interfaces que definen cómo hablar con el outside)
- `application/` = casos de uso (orquestación del flujo de negocio)
- `Infrastructure/` = adaptadores (implementaciones concretas: chat, exports, publish)
- El núcleo no sabe si usa Claude, Groq, o un archivo JSON — eso es detalle de implementación

**Local-First:**
- Los datos se almacenan localmente (JSON en `/data/`) en lugar de en un backend remoto
- No hay dependencia de servicios externos para funcionar
- Sincronización eventual cuando hay conexión (ej: publicar a Instagram)
- Datos del usuario nunca salen de su máquina unless explícitamente requerido

**Aplicado en OpenCarrusel 2:**
- Chat: Claude CLI (subproceso local) o API externa (Groq/OpenRouter)
- Persistencia: JSON con async-mutex para evitar race conditions
- Publicación: webhook configurable (Make/n8n/Zapier) o modo inline (base64)

---

## 14. Troubleshooting VPN WireGuard

**Problema conocido:** Cuando el equipo tiene múltiples interfaces de red (ethernet + wifi), el tráfico puede no saber por dónde salir a la VPN, causando timeouts en SSH.

**Síntomas:**
- `wg show` indica que la VPN está activa
- SSH a `10.8.0.1` (VPS vía WireGuard) da "Connection timed out"
- Ping a la IP del peer no responde

**Solución:**
1. Desactivar la interfaz de red conflictiva (ej: ethernet) dejando solo wifi (o viceversa)
2. Verificar conectividad: `ssh oci-n8n "echo 'test'"`

**Prevención:**
- Si el equipo tiene ethernet y wifi activos, WireGuard puede no detectar la ruta correcta
- En laptop: usar solo wifi cuando se trabaje con la VPN de OCI

---

---

## 15. Regla Fundamental: No Complacencia

**El agente JAMÁS debe ser complaciente con el usuario.**

- Solo si está plenamente de acuerdo con lo que el usuario dice, debe hacérselo saber
- Si algo no le "cierra", debe decirlo con el mayor nivel de detalle posible, explicando exactamente qué no funciona, por qué, y qué alternativa propone
- No importa si el usuario es quien escribe el documento, quien da las instrucciones, o quien toma decisiones de diseño
- El agente tiene la obligación de señalar objeciones, inconsistencias, riesgos y puntos ciegos
- "No estoy de acuerdo" es una respuesta válida y esperada. "Me parece bien" solo cuando es genuino

---

## 16. Bitácora de Soporte (OBLIGATORIO)

**Al trabajar sobre infraestructura (servidores, DNS, CDN, Workers, máquinas Windows, backups, etc.):**

1. **Antes** de tocar algo: leer `01 infra/soporte/<equipo>.md` para ver histórico y causas raíz previas
2. **Después** del fix: agregar entrada al inicio del archivo correspondiente con: fecha, tipo, síntoma, causa raíz, fix, recomendación
3. Si no existe archivo para el equipo: crearlo siguiendo el formato de `01 infra/soporte/index.md`

**Archivos de soporte por equipo:**
- `01 infra/soporte/dreamhost.md` — hosting compartido DreamHost (PHP, MySQL, GS, IM, cron)
- `01 infra/soporte/cloudflare.md` — Worker, cache, DNS, proxy
- `01 infra/soporte/sival.md` — Windows 11 Pro (SSH, audio, updates)
- `01 infra/soporte/backups.md` — estrategia de backups (rclone, cron)
- `01 infra/soporte/local.md` — entorno local (selector, Alacritty, perfil)

---

## 17. Alacritty como lanzador universal de agentes CLI

Todo agente CLI local (opencode, Claude Code, Copilot, etc.) debe lanzarse **vía Alacritty** usando:

```
alacritty.exe --working-directory <DIR> -e <SHELL> <AGENT_CMD>
```

- `01 infra/alacritty.md` contiene el FODA completo y el patrón de instalación universal.
- `01 infra/selector.ps1` usa este patrón para lanzar opencode.
- Si un nuevo agente CLI se configura y corre en raw mode (REPL), necesita `osc52 = "CopyAndPaste"` en el TOML de Alacritty para que funcione el pegado de texto.

**Flujo al recibir instrucción "configurar agente X en directorio Y":**
1. Leer `01 infra/alacritty.md` para entender el patrón de lanzamiento
2. Instalar el agente si es necesario
3. Crear entrada en el selector (`01 infra/selector.ps1`) siguiendo el switch existente
4. Si el agente requiere parámetros especiales (font, colores, clipboard), actualizar `%APPDATA%\alacritty\alacritty.toml`
5. Documentar la instalación en `01 infra/soporte/local.md`

---

*Última actualización: 30 Mayo 2026*
