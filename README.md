<a name="readme-top"></a>

<p align="center">
  <a href="https://anythingllm.com">
    <img src="https://github.com/Mintplex-Labs/anything-llm/blob/master/images/wordmark.png?raw=true" alt="AnythingLLM logo" width="500">
  </a>
</p>

<p align="center">
  <b>Fork personalizado de <a href="https://github.com/Mintplex-Labs/anything-llm">AnythingLLM</a></b><br/>
  <sub>Mejoras de interfaz — sidebar siempre visible, navegación fija, corrección de bugs en streaming y detección automática de scripts.</sub>
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
Se corrigieron **4 bugs** que causaban parpadeo y desaparición de mensajes con textos largos (fix a issue #5539 / PR #5473):

- **PromptReply** — Comparación explícita en `memo()` para actualizar el DOM durante el streaming
- **HistoricalMessage** — Se eliminó `TruncatableContent` que truncaba las respuestas del asistente a `250px`
- **ChatHistory** — Keys estables (`uuid`/`chatId`) en lugar de `index` del array, evitando remontas innecesarias
- **RenderChatContent** — Sin parpadeo de `1-frame` al medir desbordamiento

Archivos modificados:

```
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/index.jsx
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/HistoricalMessage/index.jsx
frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/PromptReply/index.jsx
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

> ⚠️ Si hay conflictos, revisa los **8 archivos** listados en las secciones anteriores (3 del sidebar + 3 del chat + 2 del script auto-detect).

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