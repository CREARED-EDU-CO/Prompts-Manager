# 📝 Prompt Manager

Una aplicación web moderna y completa para gestionar, organizar y exportar tus prompts de IA de manera eficiente.

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

### 🏷️ **Sistema de Etiquetas**
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
- **Paginación automática** para mejor rendimiento
- **Configuración de elementos** por página (5, 10, 20, 50)
- **Navegación** con botones Anterior/Siguiente
- **Indicador visual** de página actual
- **Optimización** para grandes colecciones de prompts

### 💾 **Importación y Exportación**
- **Exportación JSON** con nombre automático por fecha (`prompts-export-YYYY-MM-DD.json`)
- **Selector de carpeta** moderno para elegir ubicación de guardado
- **Importación JSON** con validación de formato
- **Opciones de importación**:
  - **Reemplazar**: Sustituye todos los datos actuales
  - **Fusionar**: Combina datos importados con existentes
- **Exportación filtrada**: Solo exporta prompts visibles según filtros aplicados
- **Compartir con otros usuarios**: Exporta e importa colecciones de prompts entre usuarios
- **Archivos privados**: Mantén archivos JSON personales en carpetas privadas para cargar cuando necesites

### ⚠️ **Recordatorio Inteligente de Backup**
- **Recordatorio dinámico** basado en actividad:
  - **2 días**: Sugerencia de backup opcional
  - **5 días**: Recomendación de exportación
  - **10+ días**: Advertencia urgente de backup
- **Mensajes contextuales** que incluyen número de prompts

### 🌐 **Internacionalización**
- **Soporte completo** para español e inglés
- **Cambio dinámico** de idioma sin recargar
- **Persistencia** de preferencia de idioma
- **Traducción completa** de interfaz y mensajes

### 🎨 **Temas y Personalización**
- **Modo oscuro/claro** con toggle visual
- **Persistencia** de preferencia de tema
- **Aplicación automática** al iniciar la app
- **Transiciones suaves** entre temas

### 📱 **Diseño Responsivo**
- **Adaptable** a dispositivos móviles y desktop
- **Interfaz optimizada** para touch y mouse
- **Layout flexible** que se ajusta al contenido
- **Experiencia consistente** en todos los dispositivos

## 🔒 Privacidad y Seguridad

- **Almacenamiento local**: Todos los datos permanecen en tu perfil del navegador que usas y/o de tu cuenta de usuario en el computador que usas
- **Sin servidor**: No se envían datos a servidores externos
- **Sin tracking**: No se recopila información personal
- **Backup manual**: Control total sobre tus datos
- **Archivos portables**: Los archivos JSON exportados son completamente portables
- **Compartir selectivo**: Decide exactamente qué prompts compartir mediante filtros antes de exportar

## 🚀 Instalación y Uso

### Instalación
1. Clona o descarga el repositorio
2. Abre `index.html` en tu navegador web
3. ¡Listo! No requiere servidor ni instalación adicional

### Primer Uso
1. **Crea tu primera carpeta** usando el formulario "Nueva carpeta"
2. **Añade prompts** seleccionando la carpeta creada
3. **Organiza con etiquetas** para facilitar la búsqueda
4. **Exporta regularmente** para mantener backups seguros

### Gestión de Archivos JSON
- **Exportar para compartir**: Crea archivos JSON para compartir tus prompts con otros usuarios
- **Importar de otros**: Carga archivos JSON de otros usuarios para expandir tu colección
- **Archivos privados**: Guarda archivos JSON en carpetas privadas de tu sistema para diferentes contextos
- **Colecciones temáticas**: Mantén archivos JSON separados en carpetas diferentes por temas (trabajo, personal, proyectos específicos)

### **Casos de Uso para Importación/Exportación**

#### **Compartir con Otros Usuarios**
1. **Exporta tu colección**: Usa los filtros para seleccionar prompts específicos y exporta
2. **Comparte el archivo**: Envía el archivo JSON a otros usuarios por email, chat, etc.
3. **Importa colecciones**: Recibe archivos JSON de otros y elige fusionar o reemplazar

#### **Gestión de Archivos Privados**
- **Carpetas temáticas**: Guarda archivos JSON en carpetas como `Prompts-Trabajo`, `Prompts-Personal`
- **Proyectos específicos**: Mantén archivos separados para diferentes clientes o proyectos
- **Versiones de respaldo**: Crea múltiples versiones de tus prompts en diferentes fechas usando las carpetas y etiquetas
- **Sincronización manual**: Usa servicios de nube personal (Google Drive, Dropbox) para sincronizar tus archivos JSON

#### **Flujo de Trabajo Recomendado**
1. **Exporta regularmente** tus prompts a una carpeta privada
2. **Organiza por contexto**: Separa prompts profesionales, personales, experimentales
3. **Comparte selectivamente**: Filtra y exporta solo los prompts que quieres compartir
4. **Importa y fusiona**: Combina prompts de otros usuarios con tu colección existente

## 💾 Capacidad de Almacenamiento

### Límites por Navegador
- **Chrome/Edge**: ~10 MB por dominio
- **Firefox**: ~10 MB por dominio  
- **Safari**: ~5-10 MB por dominio
- **Navegadores móviles**: ~2-5 MB por dominio

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
- **Limpieza**: Elimina prompts obsoletos periódicamente

## 🛠️ Arquitectura Técnica

### Tecnologías Utilizadas
- **HTML5** semántico y accesible
- **CSS3** con variables personalizadas y grid/flexbox
- **JavaScript ES6+** modular y orientado a eventos
- **LocalStorage** para persistencia de datos
- **File System Access API** para exportación moderna

### Estructura del Proyecto
```
├── index.html                 # Página principal
├── css/
│   ├── variables.css         # Variables CSS personalizadas
│   ├── base.css             # Estilos base y reset
│   ├── layout.css           # Layout y estructura
│   ├── components.css       # Componentes reutilizables
│   ├── forms.css            # Estilos de formularios
│   ├── modals.css           # Ventanas modales
│   ├── utilities.css        # Clases de utilidad
│   ├── responsive.css       # Media queries
│   └── dark-mode.css        # Tema oscuro
├── js/
│   ├── app.js              # Inicialización principal
│   ├── constants.js        # Constantes globales
│   ├── eventBus.js         # Sistema de eventos
│   ├── performance.js      # Utilidades de rendimiento
│   ├── i18n.js            # Internacionalización
│   ├── storage.js         # Gestión de localStorage
│   ├── domUtils.js        # Utilidades DOM
│   ├── utils.js           # Utilidades generales
│   ├── view.js            # Gestión de vistas
│   ├── controller.js      # Controlador principal
│   ├── promptsModel.js    # Modelo de prompts
│   ├── foldersModel.js    # Modelo de carpetas
│   └── controllers/
│       ├── filtersController.js
│       ├── foldersController.js
│       ├── importExportController.js
│       ├── paginationController.js
│       ├── promptContainerController.js
│       └── promptFormController.js
```

### Patrones de Diseño
- **MVC (Model-View-Controller)**: Separación clara de responsabilidades
- **Event Bus**: Comunicación desacoplada entre componentes
- **Module Pattern**: Encapsulación de funcionalidades
- **Observer Pattern**: Reactividad en cambios de datos

## 🔧 Funcionalidades Avanzadas

### Sistema de Eventos
- **EventBus centralizado** para comunicación entre módulos
- **Manejo de errores** robusto con fallbacks
- **Optimización de rendimiento** con debounce y throttle
- **Lazy loading** para elementos no críticos

### Optimizaciones de Rendimiento
- **Paginación** para manejar grandes volúmenes de datos
- **Debounce** en búsquedas para evitar consultas excesivas
- **Memoización** de operaciones costosas
- **Batch DOM updates** para mejor rendimiento visual

### Gestión de Estado
- **Persistencia automática** en localStorage
- **Validación de datos** en importación/exportación
- **Manejo de errores** con mensajes contextuales
- **Recuperación de estado** al recargar la página

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
- **SaaS/Cloud**: Ofrecer Prompt Manager como servicio online
- **Consultoría**: Implementar y personalizar para clientes
- **Soporte**: Brindar servicios de mantenimiento y soporte
- **Hosting**: Proporcionar instalaciones gestionadas

Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias:

1. **Exporta tus datos** regularmente como medida de seguridad
2. **Revisa la consola** del navegador para errores técnicos
3. **Verifica la compatibilidad** de tu navegador
4. **Limpia el caché** si experimentas comportamientos extraños

---

**¡Disfruta organizando tus prompts de manera eficiente! 🚀**