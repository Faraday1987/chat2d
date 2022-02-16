# Chat2D - Canvas Avatar WebSockets 1.0

[Demo CHAT] (https://chat2dapp.web.app/)

[Demo SERVER] (https://serverchat2d.herokuapp.com/)
 

_Chat 2d Gràfico Avatares Version 1.0_

## Comenzando 🚀

_Instrucciones._

Mira **Instalación** para conocer como desplegar el proyecto.

### Instalación 🔧

_Servidor de chat es independiente por si solo folder SERVER_

_Primero Instalar dependencias, ejecutar el comando npm install, se arranca como cualquier app de node, luego ingresar a la pagina http://127.0.0.1:8888/ tiene que ver el mensaje: AvatarChat 2D 1.0 y listo ya tienes el servidor funcionando_

```
npm install
node app.js
localhost:8888
```

_La parte gràfica de chat avatar_

_Se tiene que abrir el archvio config.xml y editar la ruta del servidor que pusimos anteriormente 127.0.0.1:8888_

```
config.xml 
<server>127.0.0.1:8888</server> cambiar esta linea

```
_Agregar idiomas_

_Se tiene que abrir el archvio config.xml y agregar los idiomas que se quieran_

_Agregar ROOMS o salas de chat_

_Se tiene que abrir el archvio config.xml y cambiar <rooms>6</rooms> por la cantidad de salas que se quieran_
```
config.xml 
<rooms>6</rooms>

```

_El config xml, se agregan emijis, lenguajes, salas etc.._

_Panel Administrador_

_Cuenta con panel administrador, para bannear o expulsar usuarios, y mandar mensajes globales a todas las salas como administrador._

_http://127.0.0.1:5500/chat/admpan/_

_pide password, la contraseña por default es: faraday, ese valor se cambia en el Server/app.js_


## Despliegue 💫

_Corriendo el servidor en cualquier lugar remoto y solo sube los archivos a tu servidor, el servidor debe correr en node._

## Wiki 📖

Wiki [TODO](https://github.com/)

## Versionado 📌

Usamos [SemVer](http://semver.org/) para el versionado.

## Autores y Agradecimientos ✒️

_Personas que ayudaron a levantar el proyecto desde sus inicios_

* **Chat 2D en Java Applet de ticketmaster elfoco.com año 1998** - *Idea original* - [Ticketmaster](https://www.ticketmaster.com/)

* **Jesus estrada chavez** - *Ilustrador*

## Licencia 📄

Este proyecto está bajo la Licencia (MIT) - mira el archivo [LICENSE.md](LICENSE.md) para detalles

---
 con ❤️ por [Faraday](https://github.com/faraday1987) 😊
