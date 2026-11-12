---
doc_id: 10665-353150
doc_title: "Guide d’investissement pour la mise en oeuvre numérique (DIIG) : intégrer les interventions numériques dans les programmes de santé"
section_id: sec-090-schéma-632-diagramme-architectural-openhie-illus
section_title: "Schéma 6.3.2. Diagramme architectural OpenHIE illustrant les mécanismes pour l'interopérabilité entre différentes applications"
section_number: null
pages: 101-103
source_pdf: 10665-353150.pdf
source_sha256: a3a569001e34bbfd
toc_source: inferred
---
l'interopérabilité entre différentes applications. 
Source : Schéma et légende adaptées de l'architecture v2 de l'OpenHIE, 2019 (93).
Services du domaine commercial
SYSTÈME 
D'INFORMATIONS 
RELATIVES À LA 
GESTION DE LA 
LOGISTIQUE
SERVICES 
TERMINOLOGIQUES
REGISTRE  
DU CLIENT
REGISTRE DE 
L'ÉTABLISSEMENT
REGISTRE DU 
PROFESSIONNEL 
DE LA SANTÉ
REGISTRE  
DU PRODUIT
DOSSIER  
MÉDICAL  
PARTAGÉ
SYSTÈME 
D'INFORMATIONS 
RELATIVES À  
LA GESTION DE  
LA SANTÉ
Authentification
Système 
mobile
Dossier  
médical  
électronique
Système 
d'informations 
relatives à la 
gestion de la santé
Système de 
laboratoire
Système 
pharmaceutique
Système 
d'informations 
relatives à la 
gestion de la 
logistique
Niveau de 
composants OpenHIE
Niveau de services 
d'interopérabilité
Point de service
Niveau d'interopérabilité
Service  
d'interconnexion
Cartographie  
des entités
PLATEFORME 
DE SANTÉ 
NUMÉRIQUE
Légende
1.	 Le système d'information pour la gestion logistique (SIGL) stocke 
et ajoute des données relatives à la chaîne d'approvisionnement 
habituelle et simplifie leur analyse afin d'améliorer la gestion de la 
chaîne d'approvisionnement.
2.	 Le dossier médical partagé (DMP) est un recueil composé de la 
version standardisée des contenus créés au sein de la communauté 
après être validés par rapport à chacun des enregistrements 
précédents. Il s'agit d'une collection des enregistrements axés sur 
les patients avec des informations en échange.
3.	 Le système d'informations relatives à la gestion de la santé (SIGS) 
stocke les données sanitaires agrégés et régulièrement collectées et 
simplifie leur analyse dans le but d'améliorer la qualité des services 
de santé. 
4.	 Le service terminologique (ST)fonctionne comme une autorité 
centrale permettant d'identifier de manière unique les activités 
cliniques qui surviennent au cours du processus de prestation des 
soins en maintenant un ensemble terminologique aligné aux normes 
internationales, telles que CIM-10, LOINC, SNOMED, entre autres.
5.	 Le registre du client (RC) gère l'identité unique des citoyens 
bénéficiant des services de santé au sein du pays. 
6.	 Le registre de l'établissement [de santé] (RES) fonctionne comme 
une autorité centrale permettant d'identifier de manière unique tous 
les lieux où les services de santé ont été administrés au sein du pays. 
7.	 Le registre du professionnel de la santé (RPS) est l'autorité 
centrale responsable de l'entretien des identités uniques des 
professionnels de la santé du pays.
8.	 Le registre du produit (RP) est l'autorité centrale responsable de la 
définition des produits, tels que les produits de santé et médicaux 
de base et leur catégorisation.
9.	 Le niveau de services d'interopérabilité reçoit toutes les 
communications des services externes au sein de la zone sanitaire 
géographique et gère le processus d'échange des données entre les 
systèmes externes et les composants de l'OpenHIE.
10.	 [Les applications de] point de service, telles que le système 
de dossiers médicaux électronique OpenMRS et l'outil de 
communications RapidPro, sont utilisées par les médecins et la 
communauté de professionnels de la santé pour accéder et mettre 
à jour les informations sanitaires partagées axées sur le patient, 
enregistrer les opérations de prestation de soins de santé et 
communiquer de manière interactive, respectivement.
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
Fig. 6.3.3. 	 Exemple d'un plan d'architecture d'entreprise de santé numérique nationale en Birmanie. 
En l'état de la situation actuel, les normes relatives à 
l'échange des données sont utilisées de manière restreinte 
et les systèmes numériques utilisent une connexion directe 
(intégrée) avec les services partagés. Dans l'état de la 
situation futur, les normes relatives à l'échange des données 
et les composants favorables seront utilisés pour simplifier 
l'interopérabilité à travers les différentes mises en œuvre de 
la santé numérique et les divers services partagés. 
ÉTAT DE LA SITUATION FUTUR
Plateforme de santé numérique
ENTREPRISE
NATURE 
INTER- 
OPÉRABLE
Composants 
favorables
APPLICATIONS DE SANTÉ NUMÉRIQUE AVEC DES INTERVENTIONS NUMÉRIQUES POUR : 
Programmes de santé/cas d'utilisation
Paludisme
VIH/SIDA
Tuberculose
Portail du patient
SYSTÈMES EXTERNES
SYSTÈMES EXTERNES
APPLICATIONS DE POINT DE SERVICE
Authentification
File d'attente
Cryptage
Validation
Transformation
Traduction
SERVICES PARTAGÉS
SERVICES PARTAGÉS
SERVICES DE DONNÉES
SOURCES DE DONNÉES
Services partagés
Services partagés
Services d'informations 
sanitaires et sources 
de données basés sur 
l'institution
Services 
d'informations sanitaires 
et sources de données 
basés sur l'institution
Services d'informations 
sanitaires et sources de 
données basés sur la 
population
Services 
d'informations sanitaires 
et sources de données 
basés sur la population
Analytiques, tableaux 
de bord et outils 
numériques
Analytiques, tableaux 
de bord, outils, recueils 
CURRENT STATE
Accès MS
Suivi PWID
GeneX
FUCHIA
QuanTB
DHIS2
DHIS2
DHIS2
GIS
OpenMRS
OpenMRS
Portail du 
patient
Dossier médical 
partagé
Enregistrement des faits 
d'état civil et statistiques 
démographiques
Enquêtes sur les foyers 
(enquêtes de santé et 
démographiques, STEPS, 
autres)
Entrepôt de données
Gouvernance électronique
Agriculture
Registre des établissements 
de santé
Système d'informations 
pharmaceutiques 
électronique (DME et système 
d'informations sanitaires)
Dossiers médicaux 
électroniques (DME)
Registre des professionnels 
de la santé
Recensement
Tableaux de bord du site du 
Ministère de la santé
SIGL électronique 
(mSupply, Logistimo)
Tablettes (applications du 
professionnel de la santé)
SRMNIA, MNT, 
ATR et blessures
TB (OpenMRS, GeneX Alert, 
QuanTB)
GIS
Enquêtes sur les 
établissements (SARA)
Enquête RCDC
SIS électronique (DHIS2)
Base de données RCSC
Centre de données DITT
Registre des professionnels 
de la santé
Services terminologiques 
(HDD)
Registre des établissements 
de santé
Enquêtes sur les 
établissements (SARA)
SIGL électronique 
(mSupply, Logistimo)
SIMR
SIS électronique (DHIS2)
Recensement
Tableaux de bord du site du 
Ministère de la santé
GIS
Base de données RCSC
Centre de données DITT
A
B
C
D
Applications de point de service
Investissement 
dans un nouveau 
logiciel
Logiciel financé 
en cours de 
développement 
Investissement dans 
l'amélioration du 
logiciel 
Logiciel de 
désactivation 
Logiciel 
complètement 
fonctionnel financé 
Investissement dans 
l'échelonnement du 
logiciel fonctionnel
LÉGENDE
Application de 
point de service 
réutilisée
Application de 
point de service 
unique
