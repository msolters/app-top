# app-top

Graphically browse arbitrarily defined and documented service dependencies.

`app-top` is an application topology visualizer. You curate a library of YAML
files describing the pieces of your system and how they depend on one another;
the app renders that library as a browsable, filterable dependency graph with
full markdown documentation attached to every node and every edge.

Everything is driven by the YAML in [`app/docs/`](app/docs). There is no
backend, no database, and no API: the docs are compiled into the bundle at
build time and the whole app runs client-side.

Live at **https://app-top.pages.dev** (and, once DNS is pointed, at
`app-top.marksolters.com`).

---

## Quick start

```bash
nvm use          # Node 22, pinned in .nvmrc
make install     # install app/ dependencies
make dev         # http://localhost:3000, with hot reload
```

`make` with no target prints the full list:

| Target | What it does |
| --- | --- |
| `make install` | Install `app/` dependencies (`npm ci`) |
| `make dev` | Dev server with hot reload on `http://localhost:3000` |
| `make watch` | Recompile `documentation.json` whenever `app/docs` changes |
| `make build` | Production bundle into `app/build/` |
| `make preview` | Serve the built bundle through the Cloudflare runtime on `:8788` |
| `make deploy` | Build, then deploy to Cloudflare Pages by hand |
| `make clean` | Remove `app/build/` and the generated `documentation.json` |
| `make clean-all` | Also remove `app/node_modules` |

Overridable: `make dev PORT=4000`, `make preview PREVIEW_PORT=8080`,
`make deploy PAGES_PROJECT=app-top-staging`.

### Prerequisites

* **Node 22** — pinned in `.nvmrc`, and the single version used for the build,
  the dev server and wrangler alike. With [nvm](https://github.com/nvm-sh/nvm),
  `nvm use` in the repo root is enough. Anything older is rejected by `make`
  with a message telling you so.
* **A Cloudflare login** — only for `make deploy`. Run `npx wrangler login`
  once. CI deploys with its own credentials and needs nothing from you.

One build quirk is handled inside the Makefile so you never have to remember it:
`app/src/templateDocs.js` compiles `app/docs/**/*.yaml` into
`app/src/documentation.json`. That file is generated and gitignored, and it must
exist before the bundler runs. Every relevant target regenerates it.

The app is bundled by [Vite](https://vite.dev). There is no `NODE_OPTIONS` flag
and no `CI=false` override anywhere in the build; `make build` does the same
thing on a laptop and in GitHub Actions.

---

## Writing documentation

All `app-top` documents are stored in folders by type:

```
app/docs$ ls -l
drwxr-xr-x  DNS Record
drwxr-xr-x  Endpoint
drwxr-xr-x  Feature
drwxr-xr-x  Service
```

```
app/docs$ ls -l Service/
-rw-r--r--  app-top.yaml
-rw-r--r--  gcp.yaml
-rw-r--r--  gke.yaml
-rw-r--r--  moniker.yaml
```

Each document shares the same, simply declarative structure. For example,
`docs/Feature/app-top.yaml` looks like:

```yaml
---
name: app-top
doc: |-
  # About
  `app-top` is a documentation visualizer.  It allows you to curate a library of YAML files which may contain declarative relationship information.

  These relationships are then browsable graphically.  This can be used for illustrating cloud computing topologies and systems at an architectural yet easily accessible level.

depends:
  DNS Record:
    app-top.marksolters.com: |-
      This hostname must resolve for the app to be reachable.
  Service:
    app-top: |-
      The `app-top` web app is served by the `app-top` deployment
```

So we're looking at the following properties to make a doc:

* `name`: The name of the thing
* `doc`: A multiline chunk of markdown describing the thing
* `depends`: A relational dictionary used to forge directional connections
  between documents

The contents of `name` and `doc` are simple enough. `depends` requires a bit of
explanation.

Every document has a `name` (clearly) and a `type`, which is given to it by the
name of its parent folder. So `docs/Feature/app-top.yaml` has `type: Feature`.

Using these two variables is how the `depends` property works. You can define
structures of the form:

```yaml
depends:
  type:
    name: "Description of relationship"
    name2: "Description of this relationship"
  type2:
    name3: "Description of relationship"
```

This signifies that the document in question should have downstream
dependencies on `type/name`, `type/name2`, `type2/name3`, et cetera.

It's optional to provide an actual description of the relationship. Note that
the descriptions can *also* be multiline and support full markdown!

However, it's always recommended to fully document relationship descriptions as
the context of these is often far more valuable than a description of the
services individually. Don't be afraid to put a lot of detail in these
sections.

### When does something depend?

Whenever the hell you want.

Recommended relationships are systems with hard dependencies, such as Google
Buckets depending on Google Cloud Platform. However, these can be abused for
any purpose whatsoever, such as making chronologically sequential yet not
directly linked asynchronous workers "depend" on each other in order to cause
the resulting network to represent the "flow" of data through the system.

### Editing the docs

Run `make dev` and edit YAML — the dev server regenerates `documentation.json`
on start, but not on every file change. To pick up doc edits live, run
`make watch` in a second terminal alongside `make dev`.

---

## Deploying

The app is hosted on **Cloudflare Pages**, project `app-top`.

### Automatically, on push

`.github/workflows/deploy.yml` builds and deploys on every push to `master`
(and on demand via *Actions → Deploy to Cloudflare Pages → Run workflow*). It
runs the very same `make install` / `make build` a developer runs, so CI cannot
drift from local.

It needs two repository secrets — *Settings → Secrets and variables → Actions*:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | An API token with the **Cloudflare Pages: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account ID that owns the Pages project |

```bash
gh secret set CLOUDFLARE_API_TOKEN   # paste the token when prompted
gh secret set CLOUDFLARE_ACCOUNT_ID  # paste the account ID when prompted
```

Neither value belongs in the repo. Nothing in this tree contains a credential,
and nothing should.

### By hand

```bash
npx wrangler login   # once
make deploy
```

This builds and pushes straight to production using your own Cloudflare
credentials. Handy for a hotfix; CI is the normal path.

### Configuration

[`wrangler.toml`](wrangler.toml) is the whole Pages configuration: the project
name and `pages_build_output_dir = "app/build"`. There are no Pages Functions,
no bindings, and no environment variables.

The app uses `HashRouter`, so every route lives behind `#/...` on `index.html`
and **no SPA fallback or `_redirects` rule is needed**.

---

## Custom domain

`marksolters.com` is a Cloudflare zone, so attaching the hostname is a single
step and involves the registrar not at all:

**Workers & Pages → app-top → Custom domains → Set up a custom domain**, enter
`app-top.marksolters.com`.

Cloudflare creates the DNS record in the zone and issues the TLS certificate
itself. Nothing to add by hand, nothing to wait on at Moniker.

---

## Customizing

### Your own documentation

All documentation is stored in `app/docs`. The documentation provided here is
meant only as an example. Simply overwrite the contents of `app/docs` with
whatever you want.

### Application settings

`app-top` places most of its initial configuration in
[`app/src/Configuration.js`](app/src/Configuration.js):

```js
export default {
  baseColors: {
    up: "red",
    down: "green",
    active: "#ffffff"
  },
  traversalDirection: 'both',
  githubOrgName: 'msolters',
  defaultKey: '👌',
  graphRadius: 1,
  detailView: {
    open: true,
    default: {
      name: 'app-top',
      doc: `...markdown shown when nothing is selected...`,
      depends: {}
    }
  }
}
```

Most of these settings should be self-explanatory after using the app once. 👀

---

## Repository layout

```
.nvmrc                       Node version (22)
Makefile                     every command you need — `make` for the list
wrangler.toml                Cloudflare Pages project config
.github/workflows/deploy.yml build + deploy on push to master
app/index.html               the Vite entry point
app/vite.config.mjs          bundler configuration
app/docs/                    the documentation library — the actual content
app/src/                     the React app
app/src/templateDocs.js      docs/*.yaml -> src/documentation.json (prebuild)
```

The project previously deployed to GKE via Docker, Skaffold, Kustomize and
Google Cloud Build. That scaffolding has been removed in favour of Cloudflare
Pages; it remains in git history if you ever want it back.

---

## License

See [`license`](license).
