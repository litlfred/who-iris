Feature: The pages gen-iris-pages writes
  The docs pages, the catalogue page's inputs, the library's withheld list and
  the one page left of the IRIS replica, its home page, as committed and as the
  generator's helpers produce them.

  @test:scripts/tests/gen-iris-pages.test.ts::every_.html_committed_under_docs/_is_one_the_generator_would_write
  Scenario: every .html committed under docs/ is one the generator would write
    Given every .html file committed in site/ and docs/
    And the wanted set: index.html, the generator's fixed docs pages, and the rendering of each authored docs page
    Then there are more than 3 committed pages
    And no committed page is outside the wanted set
    And no wanted page is missing from the committed pages

  @test:scripts/tests/gen-iris-pages.test.ts::OWNED_matches_what_the_generator_emits
  Scenario: OWNED matches what the generator emits
    Given every .html file committed in site/ and docs/
    Then the OWNED pattern matches each of them

  @test:scripts/tests/gen-iris-pages.test.ts::OWNED_spares_what_the_generator_did_NOT_write
  Scenario: OWNED spares what the generator did NOT write
    Then the OWNED pattern matches none of "hand-authored.html", ".nojekyll", "README.md", "assets" and "index.json"

  @test:scripts/tests/gen-iris-pages.test.ts::every_requirement_in_the_skill_reaches_the_page
  Scenario: every requirement in the skill reaches the page
    Given the iris-dspace skill and the committed ingestion-notes page
    When the requirements are read from the skill
    Then there are more than 10
    And the page has a table header cell for every requirement id
    And the page states the requirement count in bold

  @test:scripts/tests/gen-iris-pages.test.ts::refuses_rather_than_rendering_an_empty_table_when_the_source_moves
  Scenario: refuses rather than rendering an empty table when the source moves
    When requirements are read from a skill with no requirements table
    Then it throws an error saying no rows were found

  @test:scripts/tests/gen-iris-pages.test.ts::ids_are_unique_and_the_numbering_has_no_gaps
  Scenario: ids are unique and the numbering has no gaps
    When the requirement ids are read from the iris-dspace skill
    Then no id repeats
    And they are R1, R2, ... in order with no gaps

  @test:scripts/tests/gen-iris-pages.test.ts::carries_no_WHO_emblem_and_no_photograph
  Scenario: carries no WHO emblem and no photograph
    Given the replica's home page in site/
    Then it does not contain "who_logo"
    And it does not contain ".jpg"
    And it does not contain "emblem.svg", ignoring case

  @test:scripts/tests/gen-iris-pages.test.ts::the_emblem_is_absent_from_the_BYTES,_not_merely_undisplayed
  Scenario: the emblem is absent from the BYTES, not merely undisplayed
    Given every masked region declared on a bitstream of a catalogue node
    Then the committed file's SHA-256 equals the declared fixity digest
    And the file is a readable PNG and the region fits within its real width and height
    And when the pymupdf backend is available, every pixel in the region is the single colour 128, 128, 128
    And at least one masked region was checked
    And when the backend is available, every declared region was also pixel-checked

  @test:scripts/tests/gen-iris-pages.test.ts::inlines_the_architecture_drawing_rather_than_linking_across_mount_routes
  Scenario: inlines the architecture drawing rather than linking across mount routes
    Given the committed kg-to-portal page
    Then it contains an inline "<svg"
    And it contains "did:web"
    And it does not contain "cat-harness/docs/assets"

  @test:scripts/tests/gen-iris-pages.test.ts::names_WHO's_signing_DID_via_did:web_+_x5c_as_the_trust_anchor,_not_a_GDHCN_trust_list_(#104)
  Scenario: names WHO's signing DID via did:web + x5c as the trust anchor, not a GDHCN trust list (#104)
    Given the committed kg-to-portal page
    Then it contains "WHO signing DID — did:web + x5c chain"
    And it contains "publicKeyJwk.x5c"
    And it contains "No GDHCN trust list is assumed."
    And it does not say the trust anchor is to be GDHCN

  @test:scripts/tests/gen-iris-pages.test.ts::does_not_claim_a_stage_this_instance_has_not_built
  Scenario: does not claim a stage this instance has not built
    Given the committed kg-to-portal page
    Then for each of the stages Package, Sign and Verify there is a table row
    And that row contains "not built"

  @test:scripts/tests/gen-iris-pages.test.ts::states_the_upstream_figures_from_the_catalogue,_not_from_prose
  Scenario: states the upstream figures from the catalogue, not from prose
    Given the committed kg-to-portal page and catalogue/catalogue.json
    Then the page contains the catalogue's upstream item total, formatted with en-US thousands separators
    And it contains the catalogue's upstream file total, formatted the same way

  @test:scripts/tests/gen-iris-pages.test.ts::says_readers_are_not_measured_rather_than_inventing_a_count
  Scenario: says readers are not measured rather than inventing a count
    Given the committed kg-to-portal page
    Then it contains "not measured"

  @test:scripts/tests/gen-iris-pages.test.ts::every_committed_page_lets_inline_code_break_rather_than_widen_the_page
  Scenario: every committed page lets inline code break rather than widen the page
    Given every .html page committed in docs/
    Then there is at least one
    And every one contains the rule ":not(pre) > code { overflow-wrap: anywhere; }"

  @test:scripts/tests/gen-iris-pages.test.ts::every_committed_page_in_docs/_carries_the_generator_banner
  Scenario: every committed page in docs/ carries the generator banner
    Given every .html page committed in docs/
    Then there is at least one
    And every one contains "Do not hand-edit: the next run overwrites it"

  @test:scripts/tests/gen-iris-pages.test.ts::holds_no_page,_so_no_mount_copies_it
  Scenario: holds no page, so no mount copies it
    Then library/ contains no .html file

  @test:scripts/tests/gen-iris-pages.test.ts::withholds_every_item_whose_original's_publication_gates_block,_and_no_other
  Scenario: withholds every item whose original's publication gates block, and no other
    Given library/withheld.json and the catalogue nodes that have a library id
    And an item counts as blocked when a materialized ORIGINAL bitstream has a publication gate blocking
    Then at least one item is not blocked
    And every blocked item's library directory is listed in withheld.json
    And no unblocked item's library directory is listed

  @test:scripts/tests/gen-iris-pages.test.ts::every_withheld_path_exists_under_library/_—_a_stale_entry_would_hide_nothing
  Scenario: every withheld path exists under library/ — a stale entry would hide nothing
    Given library/withheld.json
    Then every listed path exists under library/

  @test:scripts/tests/gen-iris-pages.test.ts::every_catalogue_is_complete,_unfuzzy_and_keeps_its_placeholders_and_markup
  Scenario: every catalogue is complete, unfuzzy and keeps its placeholders and markup
    Then the site has at least one translatable string
    And the catalogue check reports no problems

  @test:scripts/tests/gen-iris-pages.test.ts::a_page_carries_the_pattern
  Scenario: a page carries the pattern
    Given the committed ingestion-notes page
    Then it carries a site-root regular expression

  @test:scripts/tests/gen-iris-pages.test.ts::${path}_→_${root}
  Scenario Outline: ${path} → ${root}
    Given the site-root regular expression read out of the committed ingestion-notes page
    When it is matched against the path "<path>"
    Then the captured site root is "<root>"

    Examples:
      | path                                         | root               |
      | /who-iris/item-x.html                        | /                  |
      | /docs/who-iris/ingestion-notes.html          | /                  |
      | /folio-assistant/who-iris/item-x.html        | /folio-assistant/  |
      | /STAGING/branch/who-iris/item-x.html         | /STAGING/branch/   |
      | /who-iris/who-iris/item-x.html               | /who-iris/         |
      | /who-iris/who-iris/fr/item-x.html            | /who-iris/         |
      | /who-iris/docs/who-iris/ingestion-notes.html | /who-iris/         |

  @test:scripts/tests/gen-iris-pages.test.ts::derives_them_from_the_directory:_titled_by_first_heading;_README_and_front-matter_pages_left_out
  Scenario: derives them from the directory: titled by first heading; README and front-matter pages left out
    Given a temporary directory holding README.md, a site-home.md with front matter, style-guide.md headed "The WHO style guide", notes.md with no heading, and index.html
    When the authored docs are derived from it
    Then they are exactly notes.md titled "notes" and style-guide.md titled "The WHO style guide", in that order

  @test:scripts/tests/gen-iris-pages.test.ts::every_authored_page_is_rendered,_and_the_committed_landing_page_links_the_rendering_(owner's_option_1)
  Scenario: every authored page is rendered, and the committed landing page links the rendering (owner's option 1)
    Given the authored pages in docs/ and the committed docs landing page
    Then each authored page's .html rendering exists in docs/
    And the landing page links the .html rendering
    And the landing page does not link the .md source

  @test:scripts/tests/gen-iris-pages.test.ts::renders_GFM_tables_and_points_sibling_.md_links_at_their_renderings,_leaving_other_links_alone
  Scenario: renders GFM tables and points sibling .md links at their renderings, leaving other links alone
    Given Markdown with a GFM table, a link to sibling style-guide.md#x and a link to ../library/README.md
    When it is rendered with style-guide.md as a known sibling and no repository
    Then the output contains a table
    And the sibling link points at "style-guide.html#x"
    And the "../library/README.md" link is unchanged

  @test:scripts/tests/gen-iris-pages.test.ts::cites_a_file_OUTSIDE_docs/_by_repository,_since_only_docs/_is_published_(who-iris's_own_site)
  Scenario: cites a file OUTSIDE docs/ by repository, since only docs/ is published (who-iris's own site)
    Given Markdown linking ../library/README.md#a, ../skills/voices/ and ../../AGENTS.md
    When it is rendered for the repository "example/who-iris"
    Then the library link becomes the GitHub blob URL of library/README.md#a at HEAD
    And the voices link becomes the GitHub tree URL of skills/voices/ at HEAD
    And the "../../AGENTS.md" link, which climbs out of the instance, is left as it is

  @test:scripts/tests/gen-iris-pages.test.ts::lists_the_held_nodes_first,_labels_each_gate_count_inside_its_pill,_and_links_no_viewer_on_a_site_without_one
  Scenario: lists the held nodes first, labels each gate count inside its pill, and links no viewer on a site without one
    Given every catalogue node
    When the catalogue viewer page is rendered without a library viewer
    Then its node table has one state cell per node
    And the states are ordered materialized, then referenced, then unknown
    And the first state is materialized
    And the gates section shows each count as "<label>: <n> of <m>" inside its pill, with no number after the pill
    And the page has no "library/who-iris/#" link
    And rendering with the default options does contain a "library/who-iris/#" link

  @test:scripts/tests/gen-iris-pages.test.ts::each_language_has_a_home_page_and_nothing_else:_the_item,_collection_and_community_pages_are_gone
  Scenario: each language has a home page and nothing else: the item, collection and community pages are gone
    Then the only .html file in site/ is index.html
    And for every site locale, the only .html file in its directory is index.html

  @test:scripts/tests/gen-iris-pages.test.ts::each_held_item_links_to_its_library_entry_page,_and_no_link_names_a_retired_page
  Scenario: each held item links to its library entry page, and no link names a retired page
    Given the catalogue's item nodes whose library directory exists
    Then there is at least one
    And the replica's home page links each to "../en/cat-harness/library/who-iris/<libraryId>/"
    And it has no link to an item-, collection- or community-list page
    And it links "../who-iris/catalogue/"

  @test:scripts/tests/gen-iris-pages.test.ts::written_for_the_instance's_own_site_root,_its_links_are_said_from_there
  Scenario: written for the instance's own site root, its links are said from there
    Given HTML with links to ../who-iris/catalogue/, index.html, fr/index.html, ../en/cat-harness/library/who-iris/x/ and an image ../library/x-cover.png
    When it is rebased to the instance's own site root
    Then the links become catalogue/, ./, who-iris/fr/index.html and en/cat-harness/library/who-iris/x/
    And the image source becomes library/x-cover.png

  @test:scripts/tests/gen-iris-pages.test.ts::re-bases_the_links_the_page_carries_as_JSON,_so_the_rail's_"On_this_page"_list_resolves
  Scenario: re-bases the links the page carries as JSON, so the rail's "On this page" list resolves
    Given a visualiser-nav JSON script with hrefs index.html, ../who-iris/catalogue/, ../en/cat-harness/library/who-iris/x/ and https://example.org/
    When it is rebased to the instance's own site root
    Then the hrefs become ./, catalogue/ and en/cat-harness/library/who-iris/x/
    And the https://example.org/ href is unchanged
    And no href starts with "../"
