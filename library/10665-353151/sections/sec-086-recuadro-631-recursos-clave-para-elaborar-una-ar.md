---
doc_id: 10665-353151
doc_title: "Guía para la inversión en la implementación digital (DIIG)"
section_id: sec-086-recuadro-631-recursos-clave-para-elaborar-una-ar
section_title: "Recuadro 6.3.1. Recursos clave para elaborar una arquitectura del emprendimiento de salud digital"
section_number: null
pages: 101-102
source_pdf: 10665-353151.pdf
source_sha256: 8bb0b6ab5e83cb7e
toc_source: inferred
---
» Digital health platform handbook: building a digital information infrastructure (infostructure) for health se 
centra en combinar las intervenciones de salud digital en un conjunto interoperable, identificando las normas 
y los requisitos de interoperabilidad que dan lugar a una arquitectura coherente del emprendimiento de salud 
digital (14).
	» OpenHIE describe un marco de arquitectura reutilizable que aprovecha las normas de información de salud, 
permite la implementación flexible con socios del país y admite el intercambio de componentes individuales 
(consulte la Fig. 6.3.2). OpenHIE también sirve como comunidad global de práctica para apoyar a los países 
para un “desarrollo abierto y colaborativo y apoyo de arquitecturas de información de salud a gran escala 
impulsadas por el país” (18).
	» TOGAF es una metodología de arquitectura institucional estándar del sector que proporciona guía detallada 
para apoyar el establecimiento de una jerarquía flexible e integrada de arquitecturas institucionales, de datos, 
aplicaciones y tecnologías a fin de optimizar las intervenciones de salud digital (92). 
Fig. 6.3.2.	
	Diagrama estructural de OpenHIE que ilustra los mecanismos de interoperabilidad 
entre las diferentes aplicaciones 
Fuente: La figura y la leyenda se adaptaron de OpenHIE architecture v2, 2019 (93).
Servicios del ámbito empresarial
Servicios de registro
SISTEMA DE  
INFORMACIÓN DE  
GESTIÓN LOGÍSTICA
SERVICIOS  
DE TERMINOLOGÍA
REGISTRO DE  
PACIENTES
REGISTRO DE  
CENTROS MÉDICOS
REGISTRO DE 
TRABAJADORES  
SANITARIOS
REGISTRO DE  
PRODUCTOS
REGISTROS  
DE SALUD  
COMPARTIDOS
SISTEMA DE  
INFORMACIÓN  
DE GESTIÓN  
SANITARIA
Autenticación
Sistema  
de servicio  
móvil
Historia 
clínica  
electrónica
Sistema de 
información  
de gestión  
sanitaria
Sistema de 
laboratorios
Sistema  
de farmacias
Sistema de  
información  
de gestión  
logística
Nivel de componentes  
de OpenHIE
Nivel de servicios  
de interoperabilidad
Punto de servicio
Nivel de interoperabilidad
Servicio de  
interconexión
Asignación  
de entidades
PLATAFORMA 
DE SALUD 
DIGITAL
Referencias
1.	 El sistema de información de gestión logística (SIGL)  almacena 
y agrega datos de rutina de la cadena de suministro y facilita su 
análisis para mejorar la administración de la cadena de suministro.
2.	 El registro de salud compartido (RSC) es un repositorio que 
contiene la versión normalizada del contenido creado en la 
comunidad después de validarlo comparándolo con los registros 
anteriores. Es una recopilación de registros centrados en la persona 
para pacientes con información en intercambio.
3.	 El sistema de información sobre administración sanitaria (HMIS) 
almacena datos de salud totales recopilados de forma rutinaria y 
facilita su análisis con la meta de mejorar la calidad de los servicios 
de salud. 
4.	 Los servicios de terminología (ST) sirven como autoridad central 
para identificar de forma exclusiva las actividades clínicas que 
ocurren dentro del proceso de prestación de la atención al mantener 
un conjunto de terminología que se correlaciona con las normas 
internacionales, como ICO10, NCIOL, SNOMED y otros.
5.	 El registro de pacientes (RP) administra la identidad única de los 
ciudadanos que reciben servicios de salud en el país. 
6.	 El registro de centros [de salud] (RCS) sirve como autoridad 
central para identificar de forma exclusiva todos los lugares donde 
se administran servicios de salud en el país. 
7.	 El registro de trabajadores sanitarios (RTS) es la autoridad central 
para mantener las identidades únicas de los proveedores sanitarios 
del país.
8.	 El registro de productos (RP) es la autoridad central para definir los 
productos, como los productos médicos y sanitarios básicos, y para 
su categorización.
9.	 El nivel de servicios de interoperabilidad recibe todas las 
comunicaciones de los servicios externos dentro de una región 
sanitaria y coordina el procesamiento de intercambio de datos 
entre los sistemas externos y el nivel de componentes de OpenHIE.
10.	 Las [aplicaciones] de punto de servicio, como el sistema de 
historias clínicas electrónicas OpenMRS y la herramienta de 
comunicaciones RapidPro, son lo que los médicos y los agentes de 
salud comunitarios usan para acceder a la información de salud 
del paciente compartida y centrada en la persona, actualizarla y 
registrar las transacciones de atención médica, y para comunicarse 
de forma interactiva, respectivamente.
1
4
7
2
5
8
3
6
9
10
