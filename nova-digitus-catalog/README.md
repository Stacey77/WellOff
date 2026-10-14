# Catalog generator (not published)

- `catalog_data.py`: every app, its buyer group, public description, and the "Most requested" flag. Edit this to add, move or reword apps.
- `links.py` + `gallery.json`: AI Studio IDs for each app, plus `PUBLIC_URLS`, the public "Try it" addresses. Only apps listed there get a Try it button.
- `build.py`: writes `../nova-digitus-site/apps/`.

Rebuild: `python3 nova-digitus-catalog/build.py`, then commit. The Netlify Action publishes on push to main.
