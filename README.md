<a name="readme-top"></a>

<p align="center">
  <a href="https://anythingllm.com">
    <img src="https://github.com/Mintplex-Labs/anything-llm/blob/master/images/wordmark.png?raw=true" alt="AnythingLLM logo" width="500">
  </a>
</p>

<p align="center">
  <b>Fork personalizado de <a href="https://github.com/Mintplex-Labs/anything-llm">AnythingLLM</a></b><br/>
  <sub>Mejoras de interfaz — sidebar siempre visible, navegación fija, orden de chats, prevención de duplicados, corrección de bugs en streaming y detección automática de scripts.</sub>
</p>

---

## 🛠 ¿Qué cambia respecto al original?

Este fork mantiene la **funcionalidad completa** de AnythingLLM, pero redefine la experiencia de usuario en el sidebar para maximizar la productividad:

| Elemento | Comportamiento Original | Mejora en este Fork |
| :--- | :--- | :--- |
| **Botón Nuevo Chat** | Se pierde al hacer scroll | **Sticky (siempre fijo arriba)** |
| **Lista de Workspaces** | Se mezcla con el historial | **Sección independiente y fija** |
| **Indicador Activo** | Desaparece al navegar | **Header fijo sobre el historial** |
| **Historial de Chats** | Scroll global único | **Scroll interno independiente** |

### 📱 Estructura Visual

```text
┌───────────────────────────┐
│  ⊕  Nuevo chat            │ ← Siempre visible
│  🔍 Buscar           [+]  │ ← Siempre visible
├───────────────────────────┤
│  :: Workspace 1           │ ← Lista de 
│  :: Workspace 2           │   Workspaces
│  :: Workspace 3           │   Fija
├───────────────────────────┤
│  WORKSPACE 3 (ACTIVO)     │ ← Indicador fijo
│ ┌───────────────────────┐ │
│ │  chat reciente 1      │ │ ↑ Solo esta
│ │  chat reciente 2      │ │ ↕ zona tiene
│ │  chat reciente 3      │ │ ↓ scroll
│ └───────────────────────┘ │
├───────────────────────────┤
│  🐙   📖   💬   🔧       │ ← Footer fijo
└───────────────────────────┘
```

## 📁 Archivos modificados

### Interfaz del Sidebar
**3 archivos** respecto al original:

```
frontend/src/components/Sidebar/index.jsx
frontend/src/components/Sidebar/ActiveWorkspaces/index.jsx
frontend/src/components/Sidebar/ActiveWorkspaces/ThreadContainer/index.jsx
```

### Mejoras de Estabilidad y Rendimiento del Chat
Se corrigieron **4 bugs** que causaban parpadeo y desaparición de mensajes con textos largos (fix a issue #5539 / PR #5473), y se añadió colapso persistente para mensajes del usuario:

- **PromptReply** — Comparación explícita en `memo()` para actualizar el DOM durante el streaming
- **HistoricalMessage** — Se eliminó `TruncatableContent` que truncaba las respuestas del asistente a `250px`
- **ChatHistory** — Keys estables (`uuid`/`chatId`) en lugar de `index` del array, evitando remontas innecesarias
- **RenderChatContent** — Sin parpadeo de `1-frame` al medir desbordamiento
- **CollapsibleContent** — Toggle "Mostrar más/menos" con estado persistente vía `Map` module-level, sin parpadeo durante streaming

Archivos modificados:

```
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/index.jsx
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/HistoricalMessage/index.jsx
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/PromptReply/index.jsx
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/CollapsibleContent/index.jsx
```

### Mensajes de Usuario Colapsables
Se añadió un toggle "Mostrar más/Mostrar menos" para mensajes largos del usuario (>200 caracteres):
- **Colapsado por defecto** — mensajes se muestran con `max-height: 300px`
- **Persistente** — el estado se mantiene al hacer clic (expandir/colapsar)
- **Sin parpadeo** — usa `useRef` + `Map` module-level para preservar el estado durante streaming de respuestas AI
- **Solo en mensajes del usuario** — las respuestas del AI no se ven afectadas

Archivos modificados:

```
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/HistoricalMessage/index.jsx
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/CollapsibleContent/index.jsx
frontend/src/components/WorkspaceChat/ChatContainer/index.jsx
```

### Detección Automática de Scripts de Shell
Se añadió preprocesamiento del mensaje del usuario para detectar scripts de shell y envolverlos en bloques de código:

- **Shebang** (`#!/bin/bash`, `#!/usr/bin/env zsh`, etc.) — Detecta el tipo de shell y envuelve automáticamente con triple comilla invertida (` ``` `) para evitar que markdown interprete `#` como títulos
- **Heurística de comentarios** — Si el texto tiene 3+ líneas que empiezan con `# `, se asume que es un script bash y se envuelve automáticamente
- **Evita doble-envolvimiento** — Si el mensaje ya está entre triple comilla invertida, no lo modifica

Archivos modificados:

```
frontend/src/components/WorkspaceChat/ChatContainer/index.jsx
frontend/src/utils/chat/index.js
```

### Orden de Threads y Gestión de Chats Vacíos
Se corrigió el orden de los threads en el sidebar y se evitan chats vacíos duplicados:

- **Orden descendente por fecha** — Los threads se listan por `lastUpdatedAt` (más recientes primero) en lugar de orden de inserción. Los chats nuevos aparecen arriba
- **Nombre por defecto en español** — Los nuevos threads se crean con el nombre "Nuevo chat" en lugar de "Thread"
- **Prevención de duplicados** — Al hacer clic en "Nuevo chat" cuando ya existe un chat vacío, se navega a ese en lugar de crear otro. Se muestra un toast informativo para que el usuario entienda la situación

Archivos modificados:

```
server/endpoints/workspaceThreads.js
server/models/workspaceThread.js
frontend/src/components/Sidebar/index.jsx
frontend/src/utils/toast.js
```

### Toast en la Parte Superior
Se movió la posición de los mensajes toast de `bottom-center` a `top-center` para mayor visibilidad:

- **Todos los toasts** ahora aparecen arriba al centro
- Incluye mensajes de info, error, éxito y advertencia

Archivos modificados:

```
frontend/src/utils/toast.js
```

## 🔄 Cómo mantenerse actualizado con el proyecto original

```bash
# Agregar el remoto original (solo la primera vez)
git remote add upstream https://github.com/Mintplex-Labs/anything-llm.git

# Actualizar tu fork
git fetch upstream
git checkout main
git merge upstream/main
git checkout mi-interfaz
git rebase main
```

> ⚠️ Si hay conflictos, revisa los **12 archivos** listados en las secciones anteriores (3 del sidebar + 4 del chat + 2 del script auto-detect + 3 del orden de chats + 1 de toast).

## 🚀 Instalación y uso

Idéntico al proyecto original. Consulta las instrucciones completas en [BARE_METAL.md](./BARE_METAL.md) o sigue estos pasos:

```powershell
# Construir el frontend
cd frontend
yarn build
cd ..
Copy-Item -Path "frontend\dist\*" -Destination "server\public\" -Recurse -Force

# Iniciar la aplicación
.\start-anythingllm.ps1
```

---

## 📦 Proyecto original

Todo lo demás corresponde al proyecto original de **Mintplex Labs**.

> **AnythingLLM:** The all-in-one AI app you were looking for.  
> Chat with your docs, use AI Agents, hyper-configurable, multi-user, & no frustrating setup required.

→ [Repo original](https://github.com/Mintplex-Labs/anything-llm) | [Docs](https://docs.anythingllm.com) | [Discord](https://discord.gg/6UyHPeGZAC)

---

<p align="center">
  Copyright © 2026 <a href="https://github.com/mintplex-labs">Mintplex Labs</a>. Proyecto bajo licencia <a href="./LICENSE">MIT</a>.
</p>