---
doc_id: 9789240116191-eng
doc_title: "Digital transformation handbook for health product catalogue"
section_id: sec-028-07-sharing-product-master-data-as-a-global-good
section_title: "Sharing product master data as a global good"
section_number: 7
pages: 48-50
source_pdf: 9789240116191-eng.pdf
source_sha256: 9cc9ca42d30db9eb
toc_source: inferred
---
# 07. Sharing product master data as a global good

Sharing health product master data with a global repository—such as the WHO Global Product Catalogue—holds significant value and importance as a global good for several reasons:

- **Access to accurate information:** A centralized repository enables health professionals and organizations worldwide to access accurate and up-to-date information on health products.
- **Standardization:** A global repository aggregates master data from multiple sources for the same or similar products and facilitates the harmonization of data differences to support standardization.
- **Reduced redundancy:** Sharing data at a global level reduces duplication of effort in the creation and maintenance of health product master data. Countries can benefit from each other’s efforts, enhancing overall efficiency.
- **Crisis management:** During public health emergencies—such as pandemics—access to globally standardized data enables coordinated responses and the efficient distribution of essential health products.
- **Equal access:** Sharing data ensures that all countries, regardless of their economic status, have access to critical health product information.
- **Capacity building:** Low- and middle-income countries can strengthen their capacity by leveraging global data and best practices shared through the repository.

Countries may choose to share their product master data with the WHO Global Catalogue through the PCMT. This mechanism can support global harmonization efforts and contribute to improved data quality and interoperability.

The figure below presents a conceptual model illustrating how countries—both those using the WHO-hosted PCMT instance and those using an in-country tool—can share master data globally.

Fig. 15: Illustration of how countries can share data with the WHO hosted PCMT

| Component in WHO-hosted PCMT (WHO INFRASTRUCTURE) | Attributes / Scope | Bidirectional Data Flow |
| --- | --- | --- |
| **OTHER COUNTRIES** | External national product catalogues | Contribute **PRODUCT MASTER DATA** into the Global Catalogue |
| **GLOBAL CATALOGUE** | • Global identifier<br>• Unit of use<br>• Pharmaceutical information dosage form, route of administration, strength etc.<br>• Trade item information<br>• Manufacturer, country of origin, shelf life etc. | Receives **Product master data** from Country Catalogues A & B and Other Countries; provides common product information to Country Catalogues |
| **COUNTRY CATALOGUE A** | • Country identifiers<br>• Country specific product information. E.g., registration number | Used by **Country A Users**; derives common product information from the Global Catalogue and shares **Product master data** back to the Global Catalogue |
| **COUNTRY CATALOGUE B** | • Country identifiers<br>• Country specific product information. E.g., registration number | Used by **Country B Users**; derives common product information from the Global Catalogue and shares **Product master data** back to the Global Catalogue |
