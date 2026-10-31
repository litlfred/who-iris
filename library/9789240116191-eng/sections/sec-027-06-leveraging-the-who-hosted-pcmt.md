---
doc_id: 9789240116191-eng
doc_title: "Digital transformation handbook for health product catalogue"
section_id: sec-027-06-leveraging-the-who-hosted-pcmt
section_title: "Leveraging the WHO-hosted PCMT"
section_number: 6
pages: 45-47
source_pdf: 9789240116191-eng.pdf
source_sha256: 9cc9ca42d30db9eb
toc_source: inferred
---
# 06. Leveraging the WHO-hosted PCMT

Countries planning to implement a digital tool to manage product master data may consider using the WHO–hosted PCMT as an initial option. This tool can serve as a starting point to manage national health product master data while countries build the necessary technical resources and capacity to implement an in-country–hosted solution. Alternatively, countries may continue using the WHO-hosted PCMT if it meets their ongoing needs.

The WHO-hosted PCMT will be available in 2026. Fig. 14 illustrates a conceptual model of how countries can leverage the PCMT to manage their respective health product catalogues.

Fig. 14: Illustration of how countries can leverage WHO hosted PCMT

| Component in WHO-hosted PCMT (WHO INFRASTRUCTURE) | Attributes / Scope | Users & Data Flow |
| --- | --- | --- |
| **GLOBAL CATALOGUE** | • Global identifier<br>• Unit of use<br>• Pharmaceutical information dosage form, route of administration, strength etc.<br>• Trade item information<br>• Manufacturer, country of origin, shelf life etc. | Common product information derived by Country Catalogues |
| **COUNTRY CATALOGUE A** | • Country identifiers<br>• Country specific product information. E.g., registration number | Accessed by **Country A Users**; derives common product information from the Global Catalogue |
| **COUNTRY CATALOGUE B** | • Country identifiers<br>• Country specific product information. E.g., registration number | Accessed by **Country B Users**; derives common product information from the Global Catalogue |

The PCMT will implement appropriate data access and security controls to support product catalogues for multiple countries and organizations. Each country’s or organization’s catalogue will be maintained as a separate dataset through access permissions based on specific user categories.

## Illustrative details of catalogue setup and access structure

In PCMT, users can be grouped into User Groups, which are assigned to Categories that define their level of access (view, edit, or own). Permissions are assigned to product records by linking them to categories.

### Example access model

| Catalogue | Managed by | Category | View permission | Edit permission | Own (approve/reject) permission |
| --- | --- | --- | --- | --- | --- |
| **Global Catalogue** | `WHOGroup` | `Catalogues → WHO` | All users | `WHOGroup` | `WHOGroup` |
| **Country A Catalogue** | `CAGroup` | `Catalogues → CA` | `CAGroup` | `CAGroup` | `CAGroup` |
| **Country B Catalogue** | `CBGroup` | `Catalogues → CB` | `CBGroup` | `CBGroup` | `CBGroup` |

- Although each catalogue is distinct, user groups may categorize products using any category system available in the platform. However, a reserved category tree labeled “Catalogues” is used specifically to separate catalogues and assign user-level access.
- When importing, creating, or editing products, users must ensure that their designated Catalogue Category is selected.
- Cross-catalogue associations are also supported. For example, a user from Country A may associate a product in the Country A Catalogue with a product from the Global Catalogue, thereby enabling linkages between national and global product information (e.g., for regulatory or market authorization purposes).
- Products may also be copied from one catalogue to another manually or via automated copy rules, allowing, for instance, a country user to replicate trade item data from the Global Catalogue into their own national catalogue.
