---
doc_id: 9789240116191-eng
doc_title: "Digital transformation handbook for health product catalogue"
section_id: sec-021-41-step-1-develop-a-change-management-plan-to-in
section_title: "Step 1. Develop a change management plan to institutionalise use of NPC"
section_number: 4.1
pages: 39-40
source_pdf: 9789240116191-eng.pdf
source_sha256: 9cc9ca42d30db9eb
toc_source: inferred
---
## Step 1. Develop a change management plan to institutionalise use of NPC

| INPUTS | STEPS | RESOURCES | OUTPUTS |
| --- | --- | --- | --- |
| • Standardized master data coding schemes and structures.<br>• Master data management procedures including master data governance policies.<br>• Data sharing and data use policies. | 1. Identify all the systems and processes that need standardized product master data.<br>2. Identify and define the specific changes needed to institutionalize the use of standardized product master data across people, processes, and systems. These may include:<br>  - Process changes to ensure that standardized product master data is uniformly referenced across all operational processes, including forecasting, procurement, inventory receipt and management, shipping, and dispensing.<br>  - System enhancements across all health and supply chain information systems to enable them to receive, store, and use standardized product master data in all transactions.<br>  - Data structure and model changes to accommodate standardized product master data and enable linkage with existing datasets where necessary.<br>  - Data exchange mechanisms and event triggers such as data additions and updates—for sharing standardized product master data across all relevant systems. | — | • Change management plan for all systems and processes to use NPC. |

### Best practices

When global identifiers such as GTINs are not available—e.g., if a manufacturer has not yet subscribed for a GTIN—it is recommended to use a local identifier for trade items. These local identifiers can later be mapped to GTINs once they become available.

- In the example below, GTINs are mapped to a local identifier attribute called Country Trade Item Identifier. This attribute is designed to default to GTINs when they are available. In the absence of GTINs, the attribute generates and maintains a local identifier, which can be replaced with a GTIN once it is assigned to the trade item.

Fig. 13: Transitional approach to adopting globally unique trade item numbers

#### Generic product (National Product Code)

| National Product Code | Description | Dosage Form | Route of Administration |
| --- | --- | --- | --- |
| `NPC01101001` | Lamivudine 50 Mg tablet | TA | Oral |

#### Trade items with GS1 GTINs (Manufacturer `MFR001`)

| GTIN | Country Trade Item Identifier | Child GTIN | Child SKU | Child Quantity | Quantity of Eaches | Shelf Life | Manufacturer | Country of Origin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `58904093825793` | `58904093825793` | `58904093825700` | `58904093825700` | 100 | 3000 | 670 | MFR001 | IN |
| `58904093825700` | `58904093825700` | `58904093825600` | `58904093825600` | 10 | 3000 | 670 | MFR001 | IN |

#### Trade items without GTINs using transitional Country Trade Item Identifiers (Manufacturer `MFR002`)

| GTIN | Country Trade Item Identifier | Child GTIN | Child SKU | Child Quantity | Quantity of Eaches | Shelf Life | Manufacturer | Country of Origin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | `P006008` | — | `P006009` | 120 | 7200 | 1095 | MFR002 | KE |
| — | `P006009` | — | — | 30 | 7200 | 1095 | MFR002 | KE |

*Additional resource for reference - Product master data management – lessons learned from country implementations*
