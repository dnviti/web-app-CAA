# Documentation

This directory contains the MkDocs documentation for Web App CAA.

## Local Development

To work on the documentation locally:

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Serve locally:**
   ```bash
   mkdocs serve
   ```
   
   The documentation will be available at http://localhost:8000

3. **Build static site:**
   ```bash
   mkdocs build
   ```

## Automatic Deployment

The documentation is automatically built and deployed to GitHub Pages when:

- Changes are pushed to the `main` branch in the `docs/` directory
- The workflow is manually triggered from the GitHub Actions tab

The live documentation is available at: https://dnviti.github.io/web-app-CAA

## Structure

```
docs/
├── mkdocs.yml              # MkDocs configuration
├── requirements.txt        # Python dependencies
├── index.md               # Homepage
├── getting-started/       # Getting started guides
├── architecture/          # Architecture documentation
├── api/                  # API reference
├── deployment/           # Deployment guides
└── development/          # Development guides
```

## Contributing

When adding new documentation:

1. Create new markdown files in the appropriate directory
2. Update the `nav` section in `mkdocs.yml` if needed
3. Test locally with `mkdocs serve`
4. Commit and push - deployment is automatic!
