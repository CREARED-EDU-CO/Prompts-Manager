# 📝 Prompts Manager - Administrador de Prompts

Una aplicación web local, moderna y completa para gestionar, organizar y exportar e importar prompts para usar de manera eficiente una Inteligencia Artificial Generativa (GenAI) como ChatGPT, Gemini, Claude, etc. En la carpeta PROMPTS hay un banco de archivos JSON para que importes muchos prompts para diferentes actividades escolares y tareas académicas.

## ✨ Características Principales

### 🗂️ **Gestión de Prompts**
- **Crear prompts** con texto personalizado
- **Editar prompts** existentes de forma inline
- **Eliminar prompts** con confirmación de seguridad
- **Copiar prompts** al portapapeles con un clic
- **Sistema de favoritos** para marcar prompts importantes
- **Contador de uso** que rastrea la frecuencia de uso de cada prompt

### 📁 **Organización por Carpetas**
- **Crear carpetas** personalizadas para categorizar prompts
- **Editar nombres** de carpetas existentes
- **Eliminar carpetas** (solo si están vacías)
- **Asignación obligatoria** de carpeta para cada prompt
- **Vista expandible** de carpetas con contador de prompts

### 🏷️ **Sistema de Etiquetas y favoritos**
- **Favoritos** se marcan o desmercan en la estrella de cada prompt
- **Etiquetas personalizadas** separadas por comas
- **Filtrado por etiquetas** para búsqueda rápida
- **Autocompletado** de etiquetas existentes
- **Gestión visual** de etiquetas por prompt

### 🔍 **Búsqueda y Filtrado Avanzado**
- **Búsqueda de texto** en tiempo real
- **Filtro por carpetas** específicas
- **Filtro por etiquetas** individuales
- **Filtro de favoritos** exclusivamente
- **Ordenamiento múltiple**:
  - Por fecha de creación (más reciente primero)
  - Por fecha de edición (más reciente primero)
  - Por frecuencia de uso (más usado primero)
- **Limpieza de filtros** con un botón

### 📄 **Paginación Inteligente**
- **Fragmento de prompt** se muestra los primeros 500 caracteres de cada prompt, si quiere leer todo el prompt haga clic sobre el texto del prompt
- **Paginación automática** para mejor rendimiento
- **Configuración de elementos** por página (5, 10, 20, 50)
- **Navegación** con botones Anterior/Siguiente
- **Indicador visual** de página actual
- **Optimización** para grandes colecciones de prompts

### 💾 **Importación y Exportación**
- **Exportación JSON** con nombre automático por fecha (prompts-export-YYYY-MM-DD.json)
- **Selector de carpeta** moderno para elegir ubicación de guardado
- **Importación JSON** con validación de formato
- **Opciones de importación**:
  - **Reemplazar**: Sustituye todos los datos actuales
  - **Fusionar**: Combina datos importados con existentes
- **Exportación filtrada**: Solo exporta prompts visibles según filtros aplicados
- **Compartir con otros usuarios**: Exporta e importa colecciones de prompts entre usuarios
- **Archivos privados**: Mantén archivos JSON personales en carpetas privadas para cargar cuando necesites

### 🌐 **Personalización**
- **Soporte completo** para español e inglés y puede añadir en el archvo i18n.js otros idiomas pero debe enviarnos los cambios por la Licencia AGPL v3.0
- **Modo oscuro/claro** con toggle visual
- **Interfaz optimizada** para touch y mouse
- **Layout flexible** que se ajusta al contenido

## 🔒 Privacidad y Seguridad

- **Almacenamiento local**: Todos los datos permanecen solo en tu perfil del navegador en tu cuenta de usuario del computador que usas
- **Sin servidor**: No se envían datos a servidores externos
- **Sin tracking**: No se recopila información personal
- **Backup manual**: Control total sobre tus datos
- **Archivos portables**: Los archivos JSON exportados son completamente portables
- **Compartir selectivo**: Decide exactamente qué prompts compartir mediante filtros antes de exportar

## 🚀 Instalación y Uso

### Instalación
1. Descarga en un archivo ZIP el administrador de prompts usando el botón verde "< > Code" que esta en la parte de arriba de esta página web de GitHub
2. Descomprime el archivo ZIP en tu computador y abre la carpeta que contiene el archivo index.html 
3. Dale click al archivo index.html y abre en tu navegador web el administrador de prompts
4. ¡Listo! No requiere servidor ni instalación adicional

- Puede crear un acceso directo a este archivo index.html haciendo click derecho en el archivo index.html y abrir el menú contextual para llegar a esa funcíón
- Puede abrir el archivo index.html como una app web haciendo click derecho al acceso directo creado y copiando en "Destino" la siguiente línea reemplazado la ruta de acceso a la de su archivo index.html en su computador. Solo debe cambiar la ultima parte con la nueva ruta a su archivo index.html y mantener igual las comillas dobles. Ejemplo:
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --profile-directory="Default" --start-maximized --app="file:///C:/Users/USUARIO/CARPETA/CARPETA/CARPETA/index.html"
- Puede cambiar el nombre y el icono al acceso directo creado para que sea más visible y copiarlo en el escritorio de su PC para que este disponible muy facíl y rápido

### Primer Uso
1. **Crea tu primera carpeta** usando el formulario "Nueva carpeta"
2. **Añade prompts** seleccionando la carpeta creada
3. **Organiza con etiquetas** para facilitar la búsqueda
4. **Exporta regularmente** para mantener backups seguros
5. **Borrar Carpetas** debe estar vacia por lo que primero tiene que borrar los prompts o pasarlos a otra carpeta

### Gestión de Archivos JSON
- **Exportar para compartir**: Crea archivos JSON para compartir tus prompts con otros usuarios y usa los filtros para seleccionar prompts específicos para exportar
- **Importar de otros**: Carga archivos JSON de otros usuarios para añadir a tu colección o reemplaza todos los prompts para un trabajo especifíco
- **Archivos privados**: Guarda archivos JSON en carpetas privadas de tu sistema para cargar los prompts solo contextos muy personales. No olvides exportar antes de borrar todos los prompts personales.
- **Colecciones temáticas**: Mantén archivos JSON separados en carpetas diferentes por temas (trabajo, tareas, proyectos específicos)

### **Casos de Uso para Importación/Exportación**

#### **Compartir con Otros Usuarios**
1. **Exporta tu colección**: Usa los filtros para seleccionar prompts específicos y exporta
2. **Comparte el archivo**: Envía el archivo JSON a otros usuarios por email, chat, etc.
3. **Importa colecciones**: Recibe archivos JSON de otros y elige entre fusionar con tus prompts actuales o reemplazar todos tus prompts con los nuevos prompts

#### **Flujo de Trabajo Recomendado**
1. **Exporta regularmente** tus prompts a una carpeta privada
2. **Organiza por contexto**: Separa prompts profesionales, personales, experimentales
3. **Comparte selectivamente**: Filtra y exporta solo los prompts que quieres compartir
4. **Importa y fusiona**: Combina prompts de otros usuarios con tu colección existente

## 💾 Capacidad de Almacenamiento

### Estimaciones de Capacidad
| Tamaño de Prompt | Capacidad Estimada | Uso Típico |
|------------------|-------------------|------------|
| **Pequeño** (100 caracteres) | ~50,000 prompts | Comandos cortos |
| **Mediano** (300 caracteres) | ~25,000 prompts | Instrucciones típicas |
| **Grande** (1000 caracteres) | ~9,000 prompts | Prompts complejos |
| **Muy Grande** (5000 caracteres) | ~2,000 prompts | Plantillas extensas |

### Recomendaciones de Uso
- **Uso normal**: 10,000-15,000 prompts (límite seguro)
- **Backup regular**: Exporta cada 2-5 días según actividad
- **Monitoreo**: Observa los recordatorios de backup automáticos
- **Limpieza**: Elimina prompts obsoletos periódicamente porque la IA cambia muy rápido

## 📄 Licencia

Este proyecto está bajo **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### ✅ Permitido
- **Uso personal, educativo y comercial** libre
- **Modificar y expandir** la aplicación
- **Distribuir y compartir** con otros
- **Crear servicios comerciales** basados en el software
- **Vender servicios** de hosting, soporte o consultoría

### 📋 Requisitos Obligatorios
- ✅ **Mantener código abierto**: Todas las modificaciones deben ser públicas
- ✅ **Misma licencia**: Los trabajos derivados deben usar AGPL-3.0
- ✅ **Acceso al código fuente**: Si ofreces el servicio online, debes proporcionar el código fuente
- ✅ **Atribución completa**: Créditos y avisos de copyright
- ✅ **Documentar cambios**: Indicar claramente las modificaciones realizadas

### 🎯 Filosofía de la Licencia
**"Comercial SÍ, Privatización NO"**
- Puedes generar ingresos con servicios basados en este software
- Pero nunca puedes cerrar el código o crear versiones propietarias
- Todas las mejoras deben beneficiar a la comunidad

### 💡 Casos de Uso Comerciales Permitidos
- **SaaS/Cloud**: Ofrecer Prompt Manager como servicio online siempre dandonos la atribucíon y el código fuente mejorado
- **Consultoría**: Implementar y personalizar para clientes siempre dandonos la atribucíon y el código fuente mejorado
- **Soporte**: Brindar servicios de mantenimiento y soporte siempre dandonos la atribucíon y el código fuente mejorado
- **Hosting**: Proporcionar instalaciones gestionadas siempre dandonos la atribucíon y el código fuente mejorado

Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias:

1. **Exporta tus datos** regularmente como medida de seguridad
2. **Revisa la consola** del navegador para errores técnicos
3. **Verifica la compatibilidad** de tu navegador
4. **Limpia el caché** si experimentas comportamientos extraños

---

**¡Disfruta organizando tus prompts de manera eficiente! 🚀**
