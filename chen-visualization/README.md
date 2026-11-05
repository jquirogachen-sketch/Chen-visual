# Chen Visualization — copia local independiente

## Cambios actuales

El dormitorio de Belgrano sigue destacado en la portada y aparece también en Selected Work. El portfolio contiene ocho imágenes en dos columnas y cuatro filas, sin contador ni acciones de View Project; las imágenes tienen un zoom suave al pasar el mouse. No hay visor ni enlaces en las imágenes.

Packages y Contacto tienen títulos de tamaño consistente y espacios más compactos. Contacto presenta cuatro botones en una fila en escritorio y dos columnas en pantallas pequeñas: email, teléfono, WhatsApp y Google Calendar.

El carrusel comparador y el formulario siguen preservados y ocultos en #archived-components. El carrusel solo se inicializa al retirar el ocultamiento antes de cargar la página. How It Works mantiene su fondo oscuro hasta los bordes y no se muestra EN.

Reconstruida el 21/10/2026 a partir de https://chen-visualization.facusacca.chatgpt.site/.

## Abrir en esta computadora

Abrí `index.html` con Chrome o Edge. El diseño, las ocho imágenes, las imágenes y los estilos funcionan sin instalar dependencias. El formulario necesita un servidor.

## Subir al hosting

Subí el contenido de esta carpeta a la carpeta pública del servidor (por ejemplo `public_html`). `index.html` debe quedar en la raíz pública. También podés subirlo a una subcarpeta: las rutas son relativas.

No hace falta npm, React, Node, compilar ni usar Sites. No subas este README si no querés publicarlo.

## Formulario de contacto

Se incluye un endpoint nuevo `contact.php`, independiente del servidor de Sites. Requiere **PHP 8.1 o superior**, la extensión `fileinfo` y el servicio `mail()` del hosting. No se recuperó el backend original.

1. Configurá la variable de entorno `CONTACT_FROM_EMAIL` con una casilla del dominio que tu hosting permita usar como remitente. El administrador del hosting puede configurarla en el entorno PHP. También podés reemplazar `getenv('CONTACT_FROM_EMAIL') ?: ''` en `contact.php` por esa dirección entre comillas.
2. El destinatario es `jquirogachen@gmail.com`, igual al contacto publicado. Para cambiarlo, configurá `CONTACT_TO_EMAIL` o editá ese valor en `contact.php`.
3. Para adjuntos de hasta 15 MiB en total, configurá `upload_max_filesize=16M`, `post_max_size=20M`, `max_file_uploads=5` y `memory_limit=128M` o superior. El proveedor de correo puede imponer límites adicionales.
4. Hacé un envío de prueba desde el dominio definitivo y comprobá que llegue a la casilla y que permita responder al remitente. Que `mail()` acepte el envío no garantiza su entrega. Configurá SPF/DKIM según tu proveedor.

Hasta configurar el remitente, el formulario muestra un error claro y ofrece el email directo. En un hosting puramente estático necesitás reemplazar este endpoint por un servicio de formularios. Los enlaces de email, WhatsApp, teléfono y Google Calendar funcionan independientemente.

## Archivos y edición

- `index.html`: contenido y estructura.
- `styles.css`: hoja de estilos recuperada de la versión publicada, incluida su cabecera de licencia Tailwind.
- `local.css`: ajustes de la versión independiente.
- `app.js`: carrusel, slider, galería, selección de paquetes y envío del formulario.
- `contact.php`: recepción y correo con adjuntos, validación y límite básico de frecuencia.
- `work/`: ocho renders originales descargados.
- `favicon.svg`: ícono original.

Esta es una reconstrucción editable de la web publicada; no es el repositorio React/Vinext original ni contiene su historial. Conserva textos, recursos y estilos observables. Las interacciones se reimplementaron sin dependencias. El comparador publicado utiliza la misma imagen en escala de grises como base temporal; esta copia conserva ese comportamiento. Para mostrar un antes/después real hay que agregar renders base distintos.

No se enviaron consultas reales ni se probó entrega de correo. La activación y prueba de correo se deben hacer en el hosting definitivo.
