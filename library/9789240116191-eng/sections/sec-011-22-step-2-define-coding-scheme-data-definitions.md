---
doc_id: 9789240116191-eng
doc_title: "Digital transformation handbook for health product catalogue"
section_id: sec-011-22-step-2-define-coding-scheme-data-definitions
section_title: "Step 2. Define coding scheme, data definitions and structures to organize and maintain product master data"
section_number: 2.2
pages: 27-31
source_pdf: 9789240116191-eng.pdf
source_sha256: 9cc9ca42d30db9eb
toc_source: inferred
---
## Step 2. Define coding scheme, data definitions and structures to organize and maintain product master data

| INPUTS | STEPS | RESOURCES | OUTPUTS |
| --- | --- | --- | --- |
| • Data harmonization activities plan<br>• Master data management procedures including master data governance policies | 1. Conduct data harmonization activities such as establishing a standardized coding scheme, master data definitions and structures* to organize and maintain master data consistently and persistently:<br>  - Data harmonization activities must consider all sources of product data, as well as the systems, processes, and organizations or stakeholders that will utilize this data. It is essential to consider the data needs of all stakeholders to ensure that the data structures and definitions are thorough and inclusive.<br>2. Map country product identifiers to open standard and global standard structures such as Health Level Seven® (HL7) Fast Healthcare Interoperability Resources® (FHIR), identification of medicinal products (IDMP), and GS1’s global trade item numbers (GTIN), if available.<br>3. Review the harmonised coding schemes, and structures with all relevant stakeholders and facilitate approvals. | • Fig. 11 | • Standardized master data coding schemes and structures<br>• Updated master data management procedures |

### Potential risks and mitigation

| POTENTIAL RISKS | MITIGATION |
| --- | --- |
| Different systems—such as health information systems, insurance systems, regulatory systems, and supply chain systems—each using their own product coding scheme, leading to fragmentation and challenges in interoperability. | • Engage all stakeholders to review their respective system needs and current product coding mechanisms.<br>• Adopt a collaborative approach to define a common coding scheme that meets the data needs of all systems.<br>• Develop a change management strategy to ensure a smooth transition for all affected systems from the existing data structures and coding frameworks. This may include mapping current codes to new ones to maintain data integrity and enable cross-referencing for both ongoing and historical transactions. |

### Classifications, products, and trade items

*Master data definitions and structures should include provisions for maintaining product classifications, generic product information, and trade item details.

- **Classifications** such as the anatomical therapeutic chemical classification system with defined daily doses (ATC/DDD) and the international statistical classification of diseases (ICD) categorize diseases, pathogens, or health products to assist with morbidity and mortality statistics and support healthcare decision-making.
- **Generic products** can be described as generic items that conceal the brand or manufacturer information. Countries typically identify products with generic national product codes to facilitate forecasting, quantification, and planning at an aggregate level rather than at specific brand or manufacturer trade item level. These generalized codes are not associated with any particular manufacturer brand, simplifying requisition processes from downstream facilities by eliminating the need for brand-specific orders.
- **Trade items** are manufacturer-specific branded health products that are identifiable and unique to a particular brand or manufacturer. A trade item is a product that can be uniquely identified and treated as a single unit for purposes such as ordering, inventory, dispensing, billing, and traceability. A trade item is assigned a unique identifier, such as a GTIN, which ensures accurate tracking and management across the supply chain. Trade items play a crucial role in healthcare logistics by enabling efficient inventory control, distribution, and procurement processes. Fig. 8 shows the linkage across product classifications, generic products and trade items.
- **A Regulated Trade Item** represents an authorization of a Trade item within a given jurisdiction under a Product Authorization.

Fig. 8: Linkage across classifications, generic products and trade items

| Aspect | CLASSIFICATION (STRATEGIC) | PRODUCT (TACTICAL) | TRADE ITEM (OPERATIONAL) |
| --- | --- | --- | --- |
| **USE** | Data aggregation and analysis | Forecasting, procurement planning and visibility at aggregate level | Inventory management and control, distribution, tracking, tracing, pharmacovigilance and adverse effect following immunization (AEFI) analysis |
| **Key attributes / scope** | Classes or groups of diseases / pathogens / drugs | • Name/INN<br>• Strength<br>• Dosage form<br>• Route of administration | • Unique identifier (for e.g., GTIN)<br>• Brand name<br>• Manufacturer<br>• Country of origin<br>• Packaging details<br>• Volumetrics<br>• Shelf life |
| **EXAMPLE** | Nervous system → Analgesics → Other analgesics and antipyretics → Anilides → Paracetamol | Paracetamol 500 mg tablet | **Brand name - Ceta123 (ABC Manufacturing Ltd.):**<br>• Unique ID – `14201415202906` (Unit - Case)<br>• Unique ID – `14201415202907` (Unit – Inner pack; Quantity - 100)<br><br>**Brand name - ParaXYZ (XYZ Manufacturing Ltd.):**<br>• Unique ID – `16201213204905` (Unit - Case)<br>• Unique ID – `16201213204906` (Unit – Inner pack; Quantity - 50)<br>• Unique ID – `16201213204907` (Unit – Each; Quantity - 10) |

In addition to the above mapping, Fig 9 shows the relationship between generic products, trade items and regulated trade item using HL7 FHIR resource.

Fig. 9: Relationship between generic product, trade item and regulated trade item

| GENERIC PRODUCT (`1` → `0..*` TRADE ITEM) | TRADE ITEM (`1` → `0..*` REGULATED TRADE ITEM) | REGULATED TRADE ITEM |
| --- | --- | --- |
| • `identifier` `0..*`<br>• `status` `1..1`<br>• `name` `1..*`<br>  - `nameType` `1..1`<br>  - `nameValue` `1..1`<br>• `description` `0..1`<br>• `classification` `0..*`<br>• `unitOfUse` `1..1`<br>• `dosageForm` `0..1`<br>• `strength` `0..1`<br>• `routeOfAdministration` `0..*`<br>• `manufacturer` `0..1`<br>• `countryOfOrigin` `0..1`<br>• `shelfLife` `0..1`<br>• `doseQuantity` `0..1`<br>• `attribute` `0..*`<br>  - `type` `1..1`<br>  - `value[x]` `1..1`<br>• `associatedProduct` `0..*`<br>  - `product` `1..1`<br>  - `relationship` `1..*`<br>  - `quantity` `1..1` | • `identifier` `1..*`<br>• `status` `1..1`<br>• `tradeItemName` `0..*`<br>  - `nameType` `1..1`<br>  - `name` `1..1`<br>• `description` `0..1`<br>• `classification` `0..*`<br>• `manufacturer` `0..1`<br>• `countryOfOrigin` `1..1`<br>• `shelfLife` `0..1`<br>• `associatedGenericProduct` `0..*`<br>  - `genericProduct` `1..1`<br>  - `quantity` `1..1`<br>• `contains` `0..*`<br>  - `tradeItem` `1..1`<br>  - `quantity` `1..1`<br>• `attribute` `0..*`<br>  - `type` `1..1`<br>  - `value[x]` `1..1` | • `identifier` `1..*`<br>• `status` `1..1`<br>• `jurisdiction` `1..*`<br>• `authorisationHolder` `1..1`<br>• `validityPeriod` `0..1`<br>• `authorisedTradeItem` `1..1`<br>• `attribute` `0..*`<br>  - `type` `1..1`<br>  - `value[x]` `1..1`<br>• `associatedProduct` `0..*`<br>  - `product` `1..1`<br>  - `relationship` `1..*`<br>  - `quantity` `1..1` |

### Best practices

- It is generally recommended to avoid including product classification or product characteristics such as dosage and strength in the generic national product code. Instead, a system-generated sequential numeric or alphanumeric code should be used.
- Product characteristics such as dosage, strength, pack size, and route of administration should be defined as attributes and linked to the product codes. This combination of attributes and codes facilitates comprehensive identification of products.
- Generic national product codes, including drug codes and medicinal product identifiers (when using the WHO Drug Dictionary), should be mapped to trade item-specific identifiers, such as GTINs, or similar unique identifiers where GTINs are not available.
- The product coding system should maintain uniform code lengths and ensure scalability to accommodate an increasing number of unique products.
- Product master data structures should support the mapping of one generic national product code to multiple corresponding trade items. In addition, the data structure should organize multiple packaging levels and quantity relationships across those.
- Packaging hierarchies and quantity conversions across these levels—along with packaging variations among different brand items—are critical for countries to effectively manage supply chain operations such as inventory control and distribution. Fig. 11 illustrates packaging variations across brand items and how they will link to standardized generic product information.

The WHODrug data dictionary is an international reference for medicinal product information including unique identifiers and ATC codes. WHODrug also works as the link between local medicinal product identifiers and global IDMP medicinal product identifiers. National Regulatory Authorities can consider the use of WHODrug data dictionary at no charge, to identify and organise generic product information in a globally standardized manner. As noted in the WHODrug web page (https://who-umc.org/whodrug/whodrug-global/) “WHODrug Global is the international reference for medicinal product information, and it is maintained by the Swedish foundation UMC. With its unique drug code hierarchy and extensive coverage, it provides a consistent drug dictionary with exact terminology when coding concomitant medications. The dictionary is used to identify drug names and evaluate medicinal product information, including active ingredients and products’ anatomical and therapeutic classifications, from nearly 150 countries”.

Fig. 10: Product packaging hierarchy

- **PRIMARY**
- **SECONDARY**
- **SECONDARY OR TERTIARY**
- **TERTIARY**
- *Source: GS1.org*

Fig. 11: Example of packaging variations across manufacturers

| PRODUCT | Manufacturer | Pack configuration |
| --- | --- | --- |
| **Paracetamol 500 mg tablet** (Procured from two different manufacturers with different pack configurations) | **MFR A** | **1 CASE:** 12 packs of 50 tablets each |
| **Paracetamol 500 mg tablet** (Procured from two different manufacturers with different pack configurations) | **MFR B** | **1 CASE:** 10 packs of 100 tablets each |

Fig. 12: Mapping across product packaging hierarchy using FHIR resource

Below is an example of mapping a generic product to various trade items with different packaging using the FHIR `inventoryItem` resource.

| FHIR `InventoryItem` record | Packaging level | `identifier` | Elements & `quantity` | Associated target |
| --- | --- | --- | --- | --- |
| **GENERIC PRODUCT** | Generic product (unit of use) | `MR001` | `description`, `name`, `characteristic`, `association` | Associates to **TRADE ITEM (MFR A)** (`17801415202675`) and **TRADE ITEM (MFR B) Tertiary (Pallet)** (`18901415202906`) |
| **TRADE ITEM (MFR A)** | Trade item | `17801415202675` | `description`, `name`, `characteristic`, `association` | Linked from **GENERIC PRODUCT** (`MR001`) |
| **TRADE ITEM (MFR B)** | Tertiary (Pallet) | `18901415202906` | `description`, `name`, `characteristic`, `association` | Associates to **TRADE ITEM (MFR B) Tertiary (Case)** (`08901415202908`) |
| **TRADE ITEM (MFR B)** | Tertiary (Case) | `08901415202908` | `description`, `name`, `characteristic`, `association`, `quantity 100` | Associates to **TRADE ITEM (MFR B) Secondary (Inner pack)** (`08901415202910`) |
| **TRADE ITEM (MFR B)** | Secondary (Inner pack) | `08901415202910` | `description`, `name`, `characteristic`, `association`, `quantity 50` | Innermost packaged trade item in MFR B hierarchy |
