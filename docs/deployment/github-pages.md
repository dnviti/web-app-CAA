# GitHub Pages Deployment

This guide covers deploying the MkDocs documentation to GitHub Pages, making your Web App CAA documentation publicly available.

## Overview

GitHub Pages provides free hosting for static websites generated from your repository. This documentation site can be automatically built and deployed using GitHub Actions.

## Setup GitHub Pages

### 1. Enable GitHub Pages

1. Go to your repository settings on GitHub
2. Scroll down to **"Pages"** section
3. Under **"Source"**, select **"GitHub Actions"**
4. This enables GitHub Pages with custom workflows

### 2. Repository Structure

Ensure your repository has the documentation structure:

```
web-app-CAA/
├── docs/                    # Documentation source
│   ├── mkdocs.yml          # MkDocs configuration
│   ├── index.md            # Homepage
│   ├── getting-started/    # Getting started guides
│   ├── architecture/       # Architecture docs
│   ├── api/               # API reference
│   ├── deployment/        # Deployment guides
│   └── development/       # Development guides
├── .github/
│   └── workflows/
│       └── docs.yml       # GitHub Actions workflow
└── README.md
```

## GitHub Actions Workflow

Create the workflow file **`.github/workflows/docs.yml`**:

```yaml
name: Deploy Documentation

on:
  # Trigger on push to main/master branch
  push:
    branches: [main, master]
    paths:
      - 'docs/**'
      - '.github/workflows/docs.yml'
  
  # Allow manual trigger
  workflow_dispatch:

# Set permissions for GitHub Pages deployment
permissions:
  contents: read
  pages: write
  id-token: write

# Ensure only one deployment runs at a time
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          # Fetch full history for git-revision-date-localized plugin
          fetch-depth: 0
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          pip install -r docs/requirements.txt
      
      - name: Build documentation
        run: |
          cd docs
          mkdocs build --strict
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./docs/site

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

## Python Dependencies

Create **`docs/requirements.txt`** with the required packages:

```txt
mkdocs>=1.5.0
mkdocs-material>=9.0.0
mkdocs-git-revision-date-localized-plugin>=1.2.0
pymdown-extensions>=10.0.0
```

## MkDocs Configuration

Update **`docs/mkdocs.yml`** with GitHub Pages specific settings:

```yaml
site_name: Web App CAA Documentation
site_description: Documentation for Web App CAA - Comunicazione Aumentativa e Alternativa
site_author: Daniele
site_url: https://dnviti.github.io/web-app-CAA

repo_name: dnviti/web-app-CAA
repo_url: https://github.com/dnviti/web-app-CAA

# GitHub Pages deployment
use_directory_urls: true

theme:
  name: material
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.suggest
    - search.highlight
    - search.share
    - content.code.copy
    - content.code.annotate
  palette:
    # Palette toggle for light mode
    - scheme: default
      primary: blue
      accent: blue
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    # Palette toggle for dark mode
    - scheme: slate
      primary: blue
      accent: blue
      toggle:
        icon: material/brightness-4
        name: Switch to light mode

markdown_extensions:
  - toc:
      permalink: true
  - admonition
  - pymdownx.details
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format
  - pymdownx.highlight:
      anchor_linenums: true
      line_spans: __span
      pygments_lang_class: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - pymdownx.tabbed:
      alternate_style: true
  - pymdownx.emoji:
      emoji_index: !!python/name:materialx.emoji.twemoji
      emoji_generator: !!python/name:materialx.emoji.to_svg

plugins:
  - search:
      lang: en
  - git-revision-date-localized:
      type: date
      enable_creation_date: true

nav:
  - Home: index.md
  - Getting Started:
    - Quick Start: getting-started/quick-start.md
    - Installation: getting-started/installation.md
    - Configuration: getting-started/configuration.md
  - Architecture:
    - Overview: architecture/overview.md
    - Project Structure: architecture/structure.md
    - Database Schema: architecture/database.md
  - API Reference:
    - Authentication: api/authentication.md
    - Grid Management: api/grid.md
    - AI Services: api/ai.md
  - Deployment:
    - Docker: deployment/docker.md
    - Production: deployment/production.md
    - GitHub Pages: deployment/github-pages.md
  - Development:
    - Setup: development/setup.md
    - Testing: development/testing.md
    - Contributing: development/contributing.md

copyright: Copyright &copy; 2025 Daniele

extra:
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/dnviti/web-app-CAA
  version:
    provider: mike
```

## Deployment Process

### Automatic Deployment

Once the workflow is set up, documentation will be automatically deployed when:

1. **Push to main/master**: Changes to `docs/` directory trigger deployment
2. **Manual trigger**: Use GitHub Actions "Run workflow" button

### Manual Deployment

You can also deploy manually from your local machine:

```bash
# Install MkDocs and dependencies
pip install -r docs/requirements.txt

# Build and deploy to GitHub Pages
cd docs
mkdocs gh-deploy --force
```

## Verification

### Check Deployment Status

1. Go to **Actions** tab in your GitHub repository
2. Check the **"Deploy Documentation"** workflow
3. Ensure both **build** and **deploy** jobs completed successfully

### Access Documentation

Your documentation will be available at:

```
https://dnviti.github.io/web-app-CAA
```

Replace `dnviti` with your GitHub username.

### Test Locally

Before deploying, test the documentation locally:

```bash
cd docs

# Install dependencies
pip install -r requirements.txt

# Serve locally
mkdocs serve

# Access at http://localhost:8000
```

## Custom Domain (Optional)

### Setup Custom Domain

1. **Add CNAME file**: Create `docs/CNAME` with your domain:
   ```
   docs.example.com
   ```

2. **Update DNS**: Add CNAME record pointing to `username.github.io`

3. **Update MkDocs config**:
   ```yaml
   site_url: https://docs.example.com
   ```

4. **GitHub Settings**:
   - Go to repository **Settings > Pages**
   - Enter your custom domain
   - Enable **"Enforce HTTPS"**

## Advanced Configuration

### Version Management

Use **mike** for documentation versioning:

```yaml
# Install mike
pip install mike

# Deploy version
mike deploy --push --update-aliases 1.0 latest

# Set default version
mike set-default --push latest

# List versions
mike list
```

### Search Enhancement

Enable advanced search with **mkdocs-material**:

```yaml
plugins:
  - search:
      lang: en
      separator: '[\s\-,:!=\[\]()"`/]+|\.(?!\d)|&[lg]t;|(?!\b)(?=[A-Z][a-z])'
```

### Social Cards

Generate social media cards:

```yaml
plugins:
  - social:
      cards_layout_options:
        background_color: "#1976d2"
        color: "#ffffff"
```

## Troubleshooting

### Common Issues

**Build Failures:**

```bash
# Check Python version
python --version

# Install exact dependency versions
pip install -r requirements.txt

# Test build locally
mkdocs build --strict
```

**Permission Errors:**

Ensure GitHub Actions has correct permissions in repository settings:
- Settings > Actions > General > Workflow permissions
- Select "Read and write permissions"

**404 Errors:**

1. Check **site_url** in mkdocs.yml
2. Ensure **use_directory_urls: true**
3. Verify GitHub Pages source is set to "GitHub Actions"

**Styling Issues:**

```yaml
# Fix Material theme issues
theme:
  name: material
  palette:
    scheme: default
    primary: blue
```

### Debug Mode

Enable debug output:

```yaml
# In workflow
- name: Build documentation
  run: |
    cd docs
    mkdocs build --strict --verbose
```

## Maintenance

### Regular Updates

```bash
# Update dependencies
pip list --outdated
pip install --upgrade mkdocs mkdocs-material

# Update requirements.txt
pip freeze > docs/requirements.txt
```

### Content Updates

1. **Edit documentation files** in `docs/` directory
2. **Test locally** with `mkdocs serve`
3. **Commit and push** to trigger automatic deployment
4. **Verify deployment** at your GitHub Pages URL

### Monitoring

- **GitHub Actions**: Monitor workflow runs
- **GitHub Pages**: Check deployment status
- **Analytics**: Consider adding Google Analytics for usage metrics

---

Your documentation is automatically deployed to GitHub Pages! Each time you update the documentation and push to the main branch, it will be automatically rebuilt and deployed.

The documentation will be available at: `https://dnviti.github.io/web-app-CAA`
