---
doc_id: 9789240116191-eng
doc_title: "Digital transformation handbook for health product catalogue"
section_id: sec-003-introduction
section_title: "Introduction"
section_number: null
pages: 10-19
source_pdf: 9789240116191-eng.pdf
source_sha256: 9cc9ca42d30db9eb
toc_source: inferred
---
# Introduction

Health products pass through multiple supply chain partners and processes as they move from manufacturers to end-users. For transactions to be seamless, all stakeholders must consistently identify health products using standardized information.

For example, if a country’s central warehouse receives a shipment of vaccines with identifiers that do not match its standardized data, manual reconciliation will be required. This can lead to delays, errors, and distribution disruptions, ultimately impacting health outcomes.

Uniform and standardized product information builds trust among supply chain partners. By matching standardized data with physical products, partners can validate the source of health products. Most importantly, accurate, reliable, and consistent product information enables health facilities and individuals to verify product authenticity and use them with confidence.

## What is Product Master Data?

Data plays a crucial role in the efficient management of health supply chains, ensuring that essential health products reach the right location at the right time and cost. High-quality, timely data provides supply chain leaders with critical insights, enabling informed decision-making that improves health outcomes.

Product master data consists of standardized information that accurately describes a health product’s characteristics. This data remains consistent across all instances of a product. Examples include product description, dosage, pharmaceutical strength, manufacturer details, and shelf life. In contrast, transactional data—such as batch numbers, manufacturing dates, and serial numbers—varies with each specific instance of the product.

Fig. 1: Product master data

| Category | Attributes / Examples |
| --- | --- |
| **General Information** | Product identifier, Name, Description, Unit of measure |
| **Classification** | Product characteristics/specifications; ICD, ATC |
| **Pharmaceutical Information** | Dosage, Strength, Route of administration, Doses per vial |
| **Logistical Information** | Packaging, Volumetrics; Shelf life, Storage temperature |

## Why is Product Master Data important?

Product master data is central to all operational processes across supply chain partners. It ensures that each entity uniformly understands the transactional information exchanged throughout the supply chain. Acting as a common language, product master data links all supply chain data—including orders, shipments, and inventory—from manufacturing to dispensing. This standardization helps supply chain partners, processes, and systems interoperate effectively. Similarly, facility master data plays a critical role in enabling national supply chain partners to coordinate the delivery of health products to the correct locations.

Fig. 2: Importance of product master data

| SUPPLY CHAIN PARTNERS | PRODUCT MASTER DATA | SUPPLY CHAIN PROCESSES |
| --- | --- | --- |
| • Manufacturers<br>• Procurers<br>• Ministry of Health / Programs<br>• Donors<br>• Shippers<br>• Regulatory Authority<br>• Central / Regional / District Warehouses<br>• Health Facilities<br>• Patients | • **General Information:** Product Code, Name, Description, Unit of Measure<br>• **Classification Details:** Category, Product Characteristics/Specifications, Attributes<br>• **Pharmaceutical Information:** Dosage, Strength, Route of Administration<br>• **Logistical Information:** Packaging, Shelf life, Storage Temp.<br>• **Other Information** | • Forecasting and Supply Planning<br>• Procurement<br>• Ordering / Re-ordering<br>• Inventory Management<br>• Distribution<br>• Dispensing<br>• Product Recalls<br>• Finance / Insurance |

Health products that are inconsistently identified by different supply chain partners create barriers to data sharing, interpretation, and interoperability. Inconsistent product information leads to inefficiencies such as duplicate datasets for the same product, increased manual reconciliation efforts, and data quality issues. As shown in Figure 3, variations in product identification across the supply chain hinder seamless information exchange, reducing end-to-end visibility and complicating product tracking and tracing.

Fig. 3: Impact of inconsistent product information

| Supply chain node | System / record | Example product code |
| --- | --- | --- |
| **Manufacturers** | Manufacturer system | `Product code: 123123` |
| **Central warehouse** | Warehouse management system | `Product code: A1232` |
| **Health facilities** | eLMIS | `Product code: P44545` |
| **Community health workers → Patients** | Paper forms | `Product code: AM545` |

## Digital implementation investment guide (DIIG)

Given the critical role of master data in the health supply chain, adopting a standardized approach to product master data management is essential. This handbook provides guidance on implementing standardized product master data management. It has been developed using the framework and approaches from the Digital implementation investment guide (DIIG).

The DIIG supports governments and technical partners in planning digital health implementations that align with national health system goals. This handbook complements the DIIG by providing a structured approach to implementing a national product catalogue (NPC) for standardized product master data management. Standardized product master data enables interoperability between digital health systems, regulatory frameworks, and supply chain platforms.

Effective master data management helps integrate health information with supply chain data, improving key areas such as:

- Product recalls
- Detection of falsified products
- Pharmacovigilance
- Monitoring Adverse effects following immunisation (AEFI)

By leveraging standardized product master data, health systems can enhance data accuracy, improve decision-making, and strengthen overall supply chain efficiency.

Fig. 4: Planning and implementing a digital health enterprise: phases, steps and resources

| Phase | Steps | Representative resources |
| --- | --- | --- |
| **PHASE 01: ASSESSING THE CURRENT STATE AND ENABLING ENVIRONMENT** | • Conduct an inventory of existing or previously used software applications, ICT systems and other tools to better understand the requirements for reuse and interoperability | WHO core indicator sets; Global digital health index; WHO digital health atlas; Digital health investment review tool; HIS stages of continuous improvement |
| **PHASE 02: ESTABLISHING A SHARED UNDERSTANDING AND STRATEGIC PLANNING** | • Develop a national digital health strategy outlining overarching needs, desired activities and outcomes<br>• Define a vision for how the health system will be strengthened through the use of digital technology<br>• Formulate a digital health investment roadmap to support the national digital health strategy | WHO–ITU national eHealth strategy toolkit; WHO handbook for health supply chain architecture; Guidance for investing in digital health |
| **PHASE 03: DEFINING THE FUTURE STATE** | • Plan and identify appropriate digital interventions, alongside the health and data content, to improve health system processes and address programmatic needs | WHO classification of digital health interventions; WHO guideline: recommendations on digital interventions for health system strengthening; UNICEF human-centred design toolkit; World Bank digital identity toolkit; WHO digital clearinghouse; Principles for digital development |
| **PHASE 04: PLANNING THE ENTERPRISE ARCHITECTURE** | • Review the current state and develop an architecture blueprint for the design of the digital health implementations<br>• Identify validated open standards to ensure data exchange, systems integration and future-proofing of digital health implementations | ITU digital health platform handbook; ITU SDG digital investment framework (eGov); Open Health Information Exchange (OpenHIE); The Open Group Architecture Framework (TOGAF) |
| **PHASE 05: DETERMINING HEALTH CONTENT REQUIREMENTS** | • Identify validated health content appropriate for the implementation context<br>• Ensure use of content aligned with identified standards for the future state | WHO SMART guidelines (Machine-readable recommendations, Digital adaptation kits) |
| **PHASE 06: M&E OF DIGITAL HEALTH IMPLEMENTATIONS AND FOSTERING DATA USE** | • Monitor implementation to ensure digital implementations are functioning as intended and having the desired effect<br>• Foster data-driven adaptive change management within the overall health system | PATH Defining and building a data use culture; MEASURE data demand and use of resources; WHO SCORE; WHO M&E digital health interventions |
| **PHASE 07: IMPLEMENTING, MAINTAINING AND SCALING** | • Maintain and sustain digital health implementations<br>• Identify risks and appropriate mitigations | Digital implementation investment guide; Asian Development Bank total cost of ownership tool; WHO handbook for health supply chain architecture; WHO handbook for health product catalogue (this document); WHO MAPS toolkit; WHO handbook for digitalizing primary health care; Be He@lthy, Be Mobile handbooks; Digital Square global goods guidebook; Principles for donor alignment |

*Source: adapted from the 2020 WHO Digital Implementation Investment Guide (1).*

## SMART Guidelines

This handbook is developed to complement the WHO’s Standards-based, Machine-readable, Adaptive, Requirements-based, and Testable (SMART) Guidelines initiative by providing guidance on NPC implementations that align with digital health implementations.

SMART Guidelines are a structured approach to integrating recommended public health and clinical practices into digital systems. They represent the WHO’s approach to systematising and accelerating the consistent application of recommended, life-saving interventions in the digital age.

SMART Guidelines offer a comprehensive set of reusable digital health components, following a five-step model that progressively increases in complexity to advance the adoption of best clinical and data practices. The five knowledge layers include:

1. **L1 – Narrative:** enhanced clinical, public health guidelines and structured data recommendations.
2. **L2 – Operational:** Digital Adaptation Kits (DAKs) for local implementation.
3. **L3 – Machine-Readable:** guidelines in structured, computable formats.
4. **L4 – Executable:** reference applications and interoperable digital services.
5. **L5 – Dynamic:** precision health models for evolving health system needs.

These layers guide stakeholders on translating recommendations into specifications and standards, technical specialists on integrating recommendations into updatable digital systems, and countries on localising, institutionalising, and updating digital systems while maintaining consistency with evidence-based recommendations (Figure 5).15

Fig. 5: WHO SMART Guidelines Approach

| Layer | Knowledge layers and associated products (RESEARCH AND EVIDENCE BASE) | Country implementation (LOCALISATION) |
| --- | --- | --- |
| **L1: Narrative** | Guideline and data recommendations: Enhanced guidelines | **L1: Adaptation** — National policies, guidelines, data, and operational procedures |
| **L2: Operational** | Semi-structured documentation of operational and functional requirements: Digital adaptation kits | **L2: Adaptation** — Localised requirements |
| **L3: Machine readable** | Structured, software-neutral, specifications, code, terminology and interoperability standards: Machine-readable recommendations | **L3: Adaptation** — Localised machine readable code and standards |
| **L4: Executable** | Software that is able to execute static algorithms and interoperable digital components and deliver operational and functional requirements: Reference software | **L4: Adaptation** — Localised static digital services and applications within a digital health enterprise |
| **L5: Dynamic** | Executable dynamic algorithms that are trained and optimised with advanced analytics to achieve prioritised outcomes: Precision health models | **L5: Adaptation** — Dynamic digital applications and services trained and optimised for prioritised local outcomes |

The focus of SMART Guidelines is on digital capabilities for healthcare. Specifically, they define recommended public health and clinical business processes using structured, task-based workflows. Many of these workflows intersect with product information management within the supply chain (Figure 6).

Fig. 6: Example of an Antenatal Care Business clinical workflow with highlighted connections to supply chain

*Source: Digital Adaptation Kit for Antenatal Care: Operational requirements for implementing WHO recommendations in digital systems*

Effective healthcare delivery relies on the timely availability of high-quality health products. Standardized product master data enhances the interoperability of health, regulatory, and digital supply chain systems, ensuring seamless data exchange and promoting the timely supply of essential health products.

This handbook complements the digital capabilities supported by SMART Guidelines by providing guidance on L1 adaptations for the management of standardized product master data.

## Digital health supply chain (DHSC) architectural components

The Digital Transformation Handbook for Health Supply Chain Architecture16 outlines an architectural framework that includes various components such as foundational, data services, interoperability, and health supply chain information systems. Foundational architectural components, such as facility registry, product registry, and supplier registry, play a crucial role in establishing an effective DHSC.

These components ensure accurate and timely data exchange, promoting seamless integration and interoperability across various health information systems. The product registry, in particular, is essential for maintaining standardized product master data, facilitating efficient supply chain operations, and enhancing healthcare delivery.

The primary focus of this handbook is to offer guidance on the implementation and management of the foundational product registry component. Although it predominantly addresses health products, it does not cover specific considerations for medical devices. Future publications are expected to provide dedicated guidelines for medical devices and other products requiring specialised attention.

Fig. 7: Digital health supply chain architecture framework

| Layer / Component Group | Subcomponents |
| --- | --- |
| **Foundational components (SHARED SERVICES)** | Facility registry; Product registry; Supplier registry |
| **DATA SERVICES** | Analytics (Supply chain reports, Data warehouse); Traceability (Track and trace, Product verification) |
| **INTEROPERABILITY LAYER (Enabling components)** | Authentication; Orchestration; Encryption; Validation; Transformation; Translation |
| **HEALTH SUPPLY CHAIN INFORMATION SYSTEMS** | Forecasting & planning; Order management; Warehouse management; Cold chain management; Procurement; Supplier and contract management; Transportation management; Dispensing |
| **Digital Ecosystems** | Quality systems; Health mgmt. info systems; Regulatory systems; Finance and insurance systems |
| **External systems** | Global platforms; Manufacturer systems; Data repositories |

## How to use this handbook

This handbook provides a stepwise approach to implementing standardized NPC and product master data management processes.

- **Chapter 1** outlines guidance on establishing the necessary regulatory framework to support and promote product master data standardization.
- **Chapter 2** addresses policies and considerations for product master data management.
- **Chapter 3** presents technology specifications and implementation considerations.
- **Chapter 4** highlights the importance of robust change management and governance.
- **Chapter 5** explores approaches for building human resource capacity to sustainably manage NPC.
- **Chapter 6** provides details on WHO hosted instance of the open-source product catalogue management tool (PCMT).
- **Chapter 7** explains how countries can share data as a global good to WHO’s hosted instance and benefit from aggregated product master data.

## How this handbook was developed

This handbook was developed from the experiences and feedback of a variety of experts compiled through:

- **Stakeholder consultations** were conducted through a series of in-country and virtual sessions with stakeholders who have supported DHSC implementations in countries such as Ethiopia, Malawi, Nigeria, Rwanda, and Zambia. These discussions focused on identifying challenges related to product master data management and data standardization, exploring country approaches to aligning with global standards, and capturing lessons learned from country experiences.
- **DHSC Small Working Group (DHSC SWG):** a subgroup under the Digital Health and Interoperability Working Group (DH&I WG). The DH&I WG is a volunteer community of practice committed to strengthening health systems through the appropriate and responsible use of digital health technologies. Its membership includes over 250 individuals from governments, donors, multilateral organizations, academia, the private sector, and Non-Governmental Organizations (NGOs). The DHSC SWG members met monthly to review the handbook and provide input as individual experts, collaboratively shaping its structure and content.
- **Insights from NPC Implementations:** practical experiences of NPCs across different contexts were analysed and integrated.
- **Alignment with Established Frameworks:** the steps outlined in this handbook are informed by the Principles for Digital Development (Annex 1). Some methodologies and templates have been adapted from established sources such as:
  - DIIG
  - WHO/ITU National eHealth Strategy Toolkit
  - Supply chain information systems maturity model (SCISMM)
  - OpenHIE Framework

Decision-making was collaborative and consensus-based, with stakeholder feedback synthesized and validated through DHSC SWG meetings. Drafts were iteratively reviewed, revised, and agreed upon to ensure diverse perspectives were reflected and aligned with global frameworks.

## Target users

This handbook has been developed for countries, organizations, and teams seeking to plan and implement standardized product master data management processes and systems. It provides guidance to various target audiences across different implementation phases and areas, as outlined in the table below.

| HANDBOOK CHAPTERS | ILLUSTRATIVE TARGET ORGANIZATIONS | ILLUSTRATIVE TARGET USER TEAMS AND ROLES | PURPOSE OF THE CHAPTER |
| --- | --- | --- | --- |
| **Chapter 1 - Establishing regulatory policies to promote product master data standardization** | • Ministry of Health<br>• National Regulatory Authority (NRA) | • Senior Management/Leaders<br>• Regulatory staff | To help in defining the regulatory policies that are necessary to support adoption of standardized product master data |
| **Chapter 2 - Instituting data management and governance policies** | • Ministry of Health<br>• NRA<br>• Central Medical Stores<br>• Other data users such as funders and implementation partners | • Senior Management/Leaders<br>• Regulatory staff<br>• Data officers<br>• Data management staff | To help in defining and operationalizing master data management procedures and data governance mechanisms |
| **Chapter 3 - Deploying appropriate technology to manage product master data** | • Ministry of Health<br>• NRA<br>• Donors and Funding partners<br>• Implementation partners | • Chief Digital Officers<br>• Project sponsors<br>• Project managers<br>• Technical/System/Enterprise Architects and Team<br>• Supply Chain/Operational Leaders and Team | To help in identifying and implementing appropriate technology tools for NPC |
| **Chapter 4 - Creating protocols for managing change** | • Ministry of Health<br>• NRA<br>• Central Medical Stores<br>• Donors and Funding partners<br>• Implementation partners | • Senior Management/Leaders<br>• Regulatory staff<br>• Project managers<br>• Data management staff<br>• Technical/System/Enterprise Architects and Team<br>• Supply Chain/Operational Leaders and Team<br>• Regulatory/Monitoring/Pharmacovigilance teams | To help in developing and implementing robust change management and governance mechanisms to facilitate the smooth transition of processes, people, and technology toward the utilisation of standardized data |
| **Chapter 5 - Building capacity to sustainably manage NPC** | • Ministry of Health<br>• NRA<br>• Central Medical Stores<br>• Donors and Funding partners<br>• Implementation partners | • Senior Management/Leaders<br>• Chief Digital Officers<br>• Supply Chain/Operational Leaders and Team<br>• Project sponsors | To help in identifying human resource needs and developing a comprehensive plan to build capacity that can be sustained |
| **Chapter 6 - Leveraging the WHO-hosted PCMT** | • Ministry of Health<br>• NRA<br>• Digital Health Departments | • Senior Management/Leaders<br>• Chief Digital Officers | To share details of WHO’s PCMT instance that countries could use for their product master data management needs, if necessary |
| **Chapter 7 - Sharing product master data as a global good** | • Ministry of Health<br>• NRA | • Senior Management/Leaders<br>• Chief Digital Officers<br>• Data officers<br>• Data management staff | To outline details of product master dataset that can be shared and used by countries |

## When to use this handbook

This handbook would be a useful resource in the following scenarios.

- When establishing standardized product master data management to support interoperability of health supply chain systems and processes.
- When taking a comprehensive approach to digitalizing supply chain processes such as receiving and shipping with adoption of automatic identification and data capture (AIDC) utilizing globally standardized data carriers and barcode labels.
- When there are disparate and varied sets of product information including identifiers managed across different health, regulatory and supply chain entities, processes and systems, hindering interoperability.
- When investing in new supply chain and regulatory information systems that need to interoperate and exchange data.
- When developing a holistic DHSC strategy and architecture.
