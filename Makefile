# app-top — build, preview, and deploy the topology visualizer.
#
# The React app lives in app/ and is a create-react-app (react-scripts 3)
# bundle. Two things about it are easy to forget, so this Makefile always
# does them for you:
#
#   1. `node src/templateDocs.js` compiles app/docs/**/*.yaml into
#      app/src/documentation.json. That file is generated, gitignored, and
#      must exist before the bundler runs.
#   2. react-scripts 3 hashes assets with MD4, which OpenSSL 3 refuses.
#      NODE_OPTIONS=--openssl-legacy-provider re-enables it.
#
# Overrides:
#   make dev PORT=4000
#   make preview PREVIEW_PORT=8080
#   make deploy PAGES_PROJECT=app-top-staging

APP_DIR       := app
BUILD_DIR     := $(APP_DIR)/build
DOCS_JSON     := $(APP_DIR)/src/documentation.json
NODE_MAJOR    := 22
PAGES_PROJECT ?= app-top
PORT          ?= 3000
PREVIEW_PORT  ?= 8788
WRANGLER      := npx --yes wrangler@latest

# react-scripts 3 uses an MD4 webpack hash that modern OpenSSL rejects.
LEGACY_SSL := NODE_OPTIONS=--openssl-legacy-provider

# GitHub Actions sets CI=true, which makes react-scripts promote every lint
# warning to a build error. Pinning it false keeps CI building exactly what a
# developer builds locally.
BUILD_ENV := CI=false $(LEGACY_SSL)

.DEFAULT_GOAL := help
.PHONY: help check-node check-deps check-build install template watch dev build preview deploy clean clean-all

help:
	@echo "app-top — a YAML-driven application topology visualizer"
	@echo
	@echo "  make install    install app/ dependencies (npm ci, Node $(NODE_MAJOR))"
	@echo "  make dev        run the dev server with hot reload on http://localhost:$(PORT)"
	@echo "  make watch      rebuild documentation.json whenever app/docs changes"
	@echo "  make build      produce a production bundle in $(BUILD_DIR)/"
	@echo "  make preview    serve the built bundle on http://localhost:$(PREVIEW_PORT)"
	@echo "  make deploy     build, then deploy to the '$(PAGES_PROJECT)' Cloudflare Pages project"
	@echo "  make clean      remove $(BUILD_DIR)/ and the generated documentation.json"
	@echo "  make clean-all  also remove $(APP_DIR)/node_modules"
	@echo
	@echo "  Docs are the YAML files in $(APP_DIR)/docs/ — edit those, not the app."
	@echo "  Pushing to the default branch deploys automatically; 'make deploy' is"
	@echo "  the manual escape hatch and needs 'npx wrangler login' once."
	@echo
	@echo "  PORT=$(PORT)  PREVIEW_PORT=$(PREVIEW_PORT)  PAGES_PROJECT=$(PAGES_PROJECT)"

# ---------------------------------------------------------------- prerequisites

check-node:
	@command -v node >/dev/null 2>&1 || { \
	    echo "error: node not found. Install Node $(NODE_MAJOR) (see .nvmrc)."; exit 1; }
	@major=$$(node -p "process.versions.node.split('.')[0]"); \
	if [ "$$major" -lt 18 ]; then \
	    echo "error: Node $$(node --version) is too old — react-scripts needs 18 or newer."; \
	    echo "       This repo pins Node $(NODE_MAJOR) in .nvmrc:"; \
	    echo "         nvm use    # or: nvm install $(NODE_MAJOR)"; \
	    exit 1; \
	fi

check-deps:
	@[ -d $(APP_DIR)/node_modules ] || { \
	    echo "error: $(APP_DIR)/node_modules is missing. Run 'make install' first."; exit 1; }

check-build:
	@[ -f $(BUILD_DIR)/index.html ] || { \
	    echo "error: no bundle in $(BUILD_DIR). Run 'make build' first."; exit 1; }

# ---------------------------------------------------------------------- develop

# `npm ci` installs exactly the tree in app/package-lock.json. The peer-dep
# leniency old create-react-app needs lives in app/.npmrc, not in this command.
install: check-node
	cd $(APP_DIR) && npm ci
	@echo "dependencies installed. Next: make dev"

# Compile app/docs/**/*.yaml -> app/src/documentation.json.
# templateDocs.js resolves its paths relative to the working directory, so it
# has to run from inside app/.
template: check-node
	cd $(APP_DIR) && node src/templateDocs.js

# Keep documentation.json in sync while you edit YAML in another window.
watch: check-node check-deps
	cd $(APP_DIR) && npx watch 'node src/templateDocs.js' docs/ -d

dev: check-node check-deps template
	cd $(APP_DIR) && PORT=$(PORT) $(LEGACY_SSL) npx react-scripts start

# ------------------------------------------------------------------ ship it

build: check-node check-deps template
	cd $(APP_DIR) && $(BUILD_ENV) npx react-scripts build
	@echo "built $(BUILD_DIR)/ — preview it with 'make preview'"

# Serve the bundle through the same runtime Cloudflare Pages uses, so what you
# see locally is what the edge will serve.
preview: check-node check-build
	$(WRANGLER) pages dev --port $(PREVIEW_PORT)

# Manual production deploy. CI does this automatically on push to the default
# branch (see .github/workflows/deploy.yml) using repository secrets; this
# target uses your own `wrangler login` credentials instead.
deploy: build
	$(WRANGLER) pages deploy --project-name $(PAGES_PROJECT)

# -------------------------------------------------------------------- tidy up

clean:
	rm -rf $(BUILD_DIR) $(DOCS_JSON)

clean-all: clean
	rm -rf $(APP_DIR)/node_modules
