# 🌌 pensum_dinamico.vibecoding

> *"#soy mejor que tu porque creo en la pacha mama"*

> **Nota**: Este proyecto fue creado a puro **vibecoding**. No me responsabilizo de lo que haya detrás del telón.

Visualizador dinámico, interactivo e inteligente de la Malla Curricular y Grafo DAG de Prerrequisitos de la **Carrera de Ingeniería de Sistemas y Computación (UNAL Bogotá · Acuerdo 11 de 2023)**.

---

## 🌟 Características Principales

### 📐 1. Algoritmo Correlacional Bidireccional de Posicionamiento ($X^*$)
- **Baricentro Bidireccional 2-Vías**: Posiciona cada materia considerando de forma continua la posición horizontal de sus asignaturas antecedente (padres) y subsecuentes (hijos).
- **Jerarquía Universal de Conectividad**: Las materias de alta conectividad (*Arquitectura de Software*, *Sistemas de Información Gerencial*, *Sistemas Operativos*, *Trabajo de Grado*) ocupan la columna central del mapa ($X \approx 0$). Las electivas independientes ($D = 0$) se desplazan automáticamente hacia la periferia exterior.
- **Distribución Equidistante Normalizada (`185px`)**: Garantiza una cuadrícula perfectamente alineada, limpia y 100% libre de superposición de cajas.
- **Preservación de Altura Canónica ($Y$-Coordinates)**: En cualquier vista de enfoque o selección aislada, cada materia mantiene su nivel canónico del pensum por semestre.

### 🎮 2. Interacción y Usabilidad
- **Selección de Materias (Clic Izquierdo / Clic Derecho)**:
  - **Clic Izquierdo**: Marca una materia como aprobada/seleccionada. Evalúa de forma instantánea si cumple con sus prerrequisitos directos y con los contadores de créditos exigidos por componente.
  - **Clic Derecho**: Deselecciona la materia seleccionada.
- **Detección Automática de Estado Visual (Bordes Limpios)**:
  - 🟢 **Borde Verde (`#22c55e`)**: Materia seleccionada que cumple con todos sus prerrequisitos y créditos exigidos.
  - 🔴 **Borde Rojo (`#ef4444`)**: Materia seleccionada a la que le faltan prerrequisitos directos o créditos previos.
  - ⚪ **Borde Blanco (`#ffffff`)**: Materia activa bajo inspección.

### 🎛️ 3. Modos de Vista y Enfoque Flotante
- **🔍 Botón Lupa (`btn-float-focus-active`)**: Aísla el árbol local de prerrequisitos antecedente de la materia activa.
- **🎓 Botón Birrete (`btn-float-focus-selection`)**: Aísla e ilustra exclusivamente las materias seleccionadas en tu tray manteniendo su altura por nivel semestral original.
- **🎨 Botón Libre Elección Externa**: Permite sumar o restar créditos de asignaturas de libre elección fuera del pensum (+3 créditos con clic izquierdo, -3 créditos con clic derecho).
- **👁️ Alternar Todos los Grupos**: Botón en la leyenda para activar o desactivar la visibilidad de todos los grupos con 1 solo clic.

### 📥 4. Importación y Exportación `.txt` (100% Client-Side)
- **`📤 Exportar .txt`**: Descarga instantánea de un archivo `mi_seleccion_pensum.txt` con la lista de códigos SIA de tus materias elegidas.
- **`📥 Importar .txt`**: Carga cualquier archivo `.txt` y reconstruye la selección al instante.
- **100% Estático para GitHub Pages**: Funciona mediante `Blob` y `FileReader` nativos del navegador sin necesidad de servidor ni backend.

---

## 🧭 Estructura del Panel Derecho (De Arriba a Abajo)

1. **Detalle de Materia (`#info`)**: Ficha técnica con código SIA, créditos, estado de validación y lista de prerrequisitos.
2. **Buscador de Cursos (`#search-section`)**: Búsqueda en tiempo real por código SIA o nombre con desplegable de sugerencias y enfoque automático de cámara (*zoom/pan*).
3. **Materias Seleccionadas (`#selected-tray-section`)**: Bandeja con listado compacto, créditos acumulados y botón de eliminación individual (`✕`).
4. **🗑️ Deseleccionar todo (`#reset-btn`)**: Limpia la selección completa con 1 solo clic.
5. **📤 Exportar / 📥 Importar `.txt` (`.panel-export-block`)**: Fondo del panel para guardar y cargar planes de estudio.

---

## 🛠️ Tecnologías Utilizadas

- **Core**: HTML5, JavaScript ES6+ Vanilla.
- **Estilos**: Vanilla CSS3 (Variables HSL, Glassmorphism, Micro-animaciones).
- **Visualización DAG**: [vis.js Network](https://visjs.org/) (Canvas / SVG Renderer).
- **Favicon Vectorial**: SVG nativo `icono.svg` + convertidores ico/png.

---

## 🚀 Despliegue en GitHub Pages

Este proyecto es **100% estático** y no requiere compilación ni servidor Node.js.

Para desplegarlo en GitHub Pages:
```bash
git add .
git commit -m "feat: pensum_dinamico.vibecoding"
git push origin main
```
Luego ve a **Settings > Pages** en tu repositorio de GitHub y selecciona la rama `main` como origen de publicación.
