# pensum_dinamico.vibecoding

> Este proyecto fue generado mediante IA (vibecoding). No me responsabilizo de lo que haya detrás del telón.

Visualizador interactivo de la malla curricular y prerrequisitos de la carrera de Ingeniería de Sistemas y Computación (UNAL Bogotá, Acuerdo 11 de 2023).

---

## Cómo Funciona y Guía de Uso

### 1. Selección y Verificación de Materias
- **Clic Izquierdo en una caja**: Selecciona o aprueba una asignatura.
- **Clic Derecho en una caja**: Deselecciona la asignatura.
- **Validación Automática de Bordes**:
  - **Borde Verde**: Materia seleccionada que cumple con todos sus prerrequisitos y créditos exigidos.
  - **Borde Rojo**: Materia seleccionada a la que le faltan prerrequisitos directos o créditos previos exigidos.
  - **Borde Blanco**: Materia activa en inspección.

### 2. Panel Derecho (De Arriba a Abajo)
1. **Detalle de Materia**: Muestra el nombre, código SIA, créditos, estado de prerrequisitos y créditos acumulados exigidos.
2. **Buscador de Cursos**: Permite buscar por nombre o código SIA. Al hacer clic en un resultado, se ubica y enfoca la materia en el mapa.
3. **Materias Seleccionadas**: Lista todas las materias que has seleccionado con su conteo de créditos y botón para quitar de la lista.
4. **Deseleccionar todo**: Botón para limpiar la selección completa de materias.
5. **Exportar / Importar .txt**:
   - **Exportar .txt**: Descarga un archivo de texto con la lista de códigos de materias seleccionadas.
   - **Importar .txt**: Carga un archivo de texto previamente guardado para restaurar tu selección.

### 3. Botones Flotantes de Vista
- **Botón Lupa**: Enfoca el árbol de prerrequisitos de la materia activa.
- **Botón Birrete (Mi Selección)**: Muestra únicamente las materias que tienes seleccionadas en tu lista, conservando su nivel por semestre.
- **Botón Libre Elección Externa**: Permite agregar o quitar créditos de materias de libre elección cursadas fuera del pensum (Clic izquierdo: +3 créditos, Clic derecho: -3 créditos).

### 4. Barra Lateral Izquierda (Filtros)
- **Contador de Componentes**: Muestra el avance de créditos en Fundamentación, Disciplinar y Libre Elección.
- **Filtros por Grupo / Subgrupo**: Permite ocultar o mostrar grupos de materias. Incluye un botón para alternar la visibilidad de todos los grupos.

---

## Despliegue en GitHub Pages

Este proyecto es una aplicación web estática que funciona directamente en el navegador sin necesidad de servidor.

Para publicar en GitHub Pages:
1. Sube el código al repositorio de GitHub.
2. Ve a Settings > Pages.
3. Selecciona la rama main y la carpeta root como origen de publicación.
