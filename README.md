# Sistema de Evaluación de Reportes - MARDOM

Sistema web para la evaluación y clasificación de reportes corporativos mediante códigos de acceso departamentales.

## Características Principales

- **Acceso por Códigos**: Sistema de autenticación mediante códigos únicos por departamento
- **Panel de Gerente**: Visualización y clasificación de reportes por prioridad
- **Panel de Administrador**: Carga de datos, generación de códigos y descarga de resultados
- **Importación Excel**: Carga de datos desde archivos Excel con la hoja "PowerBI_Reportes"
- **Exportación de Resultados**: Descarga de evaluaciones en formato Excel
- **Almacenamiento Local**: Persistencia de datos mediante localStorage

## Tecnologías Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- [SheetJS](https://sheetjs.com/) - Librería para manipulación de archivos Excel

## 📋 Requisitos Previos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Archivo Excel con una hoja llamada "PowerBI_Reportes" que contenga las columnas:
  - Departamento
  - Nombre del Reporte
  - URL del Reporte
  - Prioridad (opcional)

## 🔧 Instalación

1. Clone este repositorio:
```bash
git clone https://github.com/tu-usuario/evaluacion-reportes-mardom.git
```

2. Navegue al directorio del proyecto:
```bash
cd evaluacion-reportes-mardom
```

3. Abra el archivo `index.html` en su navegador web

**Nota**: Este es un proyecto totalmente frontend que no requiere instalación de dependencias ni servidor.

### Servidor local opcional (para publicar códigos automáticamente)

Si quieres que los códigos generados estén disponibles para otros usuarios simplemente compartiendo el enlace (sin subir manualmente `dept_codes.json` al repositorio), puedes ejecutar un pequeño servidor local que permite publicar `dept_codes.json` desde la interfaz de administrador.

Requisitos: `node` y `npm` instalados.

Comandos:
```bash
npm install
npm start
# luego abre http://localhost:3000 en el navegador
```

Flujo recomendado:
- Inicia el servidor con `npm start`.
- Entra como administrador (`Haraujo1324`) en la web.
- Carga el Excel y pulsa `Guardar datos` para generar códigos.
- Pulsa `Publicar códigos` en el panel de administrador; el servidor guardará `dept_codes.json` en la raíz del proyecto.
- Cualquier gerente que acceda a la misma URL (por ejemplo `http://tu-servidor/deploy`) podrá iniciar sesión con su código.

Nota: para producción, despliega el mismo servidor en un VPS o servicio de alojamiento que soporte Node.js y asegúrate de proteger el endpoint de publicación (aquí se usa un código de administrador simple).

## 💻 Uso

### Para Administradores

1. Ingrese el código de administrador: `Haraujo1324`
2. Cargue el archivo Excel con los reportes
3. El sistema generará automáticamente códigos únicos para cada departamento
4. Comparta los códigos generados con los gerentes correspondientes
5. Descargue los resultados de las evaluaciones en formato Excel

### Para Gerentes de Departamento

1. Ingrese el código proporcionado por el administrador
2. Visualice los reportes asignados a su departamento
3. Clasifique cada reporte según su prioridad:
   - **Crítica**: Reportes de alta prioridad
   - **Media**: Reportes de prioridad intermedia
   - **Baja**: Reportes de baja prioridad
4. Acceda a los reportes mediante los enlaces proporcionados
5. Guarde y salga cuando termine

## 📁 Estructura del Proyecto

```
.
├── index.html          # Página principal
├── script.js           # Lógica de la aplicación
├── style.css           # Estilos de la interfaz
├── assets/             # Recursos (imágenes, iconos)
│   ├── icon.png
│   └── fondo.jpg
└── README.md           # Este archivo
```

## 🔒 Seguridad

- El código de administrador está hardcodeado en el archivo `script.js`
- Los datos se almacenan localmente en el navegador del usuario
- No hay transmisión de datos a servidores externos
- **Importante**: Para entornos de producción, considere implementar autenticación backend

### Compartir códigos con gerentes (sitios alojados)

- Nota: los códigos de departamento (`DEPT_CODES`) se guardan inicialmente en el navegador del administrador (localStorage) y NO están disponibles automáticamente para otros usuarios cuando el sitio se aloja como página estática. Si compartes la carpeta en GitHub Pages o similar, los gerentes no tendrán los códigos a menos que éstos estén expuestos públicamente.
- Para hacer los códigos utilizables por todos los gerentes, sigue estos pasos después de generar los códigos (botón "Guardar datos") en el panel de administrador:
  1. Descarga el archivo `dept_codes.json` (el sistema ofrece descargar `dept_codes.json`).
  2. Añade `dept_codes.json` al repositorio en la raíz y haz commit/push o súbelo al servidor donde alojas la web.
  3. Cuando los gerentes abran la página alojada, el script intentará cargar `/dept_codes.json` y los códigos estarán disponibles para login.

Si prefieres una solución más robusta, considera exponer los datos desde un backend o una API compartida en lugar de un archivo estático.

## ⚙️ Funcionalidades Detalladas

### Generación Automática de Códigos
- Códigos aleatorios de 6 letras mayúsculas
- Un código único por departamento
- Los códigos persisten entre sesiones

### Clasificación de Reportes
Cada reporte puede ser clasificado en tres niveles:
- **Crítica** (rojo): Requiere atención inmediata
- **Media** (amarillo): Prioridad moderada
- **Baja** (verde): Puede revisarse posteriormente

### Almacenamiento de Datos
- `reportData`: Datos cargados desde el Excel
- `DEPT_CODES`: Mapeo de códigos a departamentos
- `evaluations`: Clasificaciones realizadas por los gerentes
 - `Excel (archivo original)`: El archivo Excel subido se guarda de forma persistente en IndexedDB del navegador. Desde el panel de administrador se puede descargar, y las acciones de "Borrar datos" no eliminarán este archivo persistente.

## 🎨 Personalización

### Cambiar Colores Corporativos
Edite las variables CSS en `style.css`:
```css
:root {
    --primary: #003366;    /* Color principal */
    --accent: #00a8e8;     /* Color de acento */
    --critical: #d9534f;   /* Color crítico */
    --medium: #f0ad4e;     /* Color medio */
    --low: #5cb85c;        /* Color bajo */
}
```

### Cambiar Código de Administrador
Modifique la constante en `script.js`:
```javascript
const ADMIN_CODE = "TuNuevoCodigo";
```

## 📱 Responsividad

El sistema está optimizado para dispositivos móviles y de escritorio, adaptándose automáticamente al tamaño de la pantalla.

## 🐛 Problemas Conocidos

- Los datos se almacenan en localStorage, por lo que limpiar la caché del navegador eliminará toda la información
- No hay mecanismo de recuperación de códigos perdidos
- El sistema funciona únicamente en el navegador donde se cargaron los datos

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Cree una rama para su función (`git checkout -b feature/NuevaFuncion`)
3. Commit sus cambios (`git commit -m 'Agregar nueva función'`)
4. Push a la rama (`git push origin feature/NuevaFuncion`)
5. Abra un Pull Request

## 📄 Licencia

Este proyecto es de uso interno corporativo para MARDOM.

## 👥 Autor

Desarrollado para MARDOM

## 📞 Soporte

Para soporte o preguntas, contacte al departamento de TI.

---

**Nota**: Este README asume que el proyecto será alojado en un repositorio Git. Ajuste las URLs y nombres según sea necesario.
