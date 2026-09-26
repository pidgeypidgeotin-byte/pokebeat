# PokéBeat Pet Overlay

Módulo Android nativo local para mantener una mascota visible fuera de la aplicación.

El usuario debe activar manualmente **Mostrar sobre otras aplicaciones**. Al iniciar se crea una notificación foreground persistente y una ventana `TYPE_APPLICATION_OVERLAY` arrastrable. Si el permiso no se concede, el servicio no dibuja sobre otras apps y la notificación sigue siendo el fallback.

Android 15/16 impone restricciones al inicio de foreground services desde background; por eso el servicio se inicia desde una acción visible del usuario dentro de PokéBeat y conserva una notificación de baja prioridad.
