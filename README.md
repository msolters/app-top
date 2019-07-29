# app-top
Graphically browse arbitrarily defined and documented service dependencies.

## Visualize

## Document
All `app-top` documents are stored in folders by type:
```
~/github/app-top/app/docs$ ls -l
total 12
drwxr-xr-x 2 msolters msolters 4096 Jul 28 04:22 DNS Record
drwxr-xr-x 2 msolters msolters 4096 Jul 28 04:20 Feature
drwxr-xr-x 2 msolters msolters 4096 Jul 28 04:21 Service
```

```
~/github/app-top/app/docs$ ls -l Service/
total 16
-rw-r--r-- 1 msolters msolters 344 Jul 28 04:03 app-top.yaml
-rw-r--r-- 1 msolters msolters  87 Jul 28 04:05 gcp.yaml
-rw-r--r-- 1 msolters msolters 234 Jul 28 04:05 gke.yaml
-rw-r--r-- 1 msolters msolters  99 Jul 28 04:21 moniker.yaml
```

Each document shares the same, simply declarative structure.  For example, `docs/Feature/app-top.yaml` looks like:
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
      This hostname must be resolve for the app to be reachable.
  Service:
    app-top: |-
      The `app-top` web app is served by the `app-top` `deployment`

```

So we're looking at the following properties to make a doc:
*  `name`: The name of the thing
*  `doc`: A multiline chunk of markdown describing the thing
*  `depends`: A relational dictionary used to forge directional connections between documents

The contents of `name` and `doc` are simple enough.  `depends` requires a bit of explanation.

Every document has a `name` (clearly) and a `type`, which is given to it by the name of its parent folder.  So `docs/Feature/app-top.yaml` has `type: Feature`.

Using these two variables is how the `depends` property works.  You can define structures of the form:

```yaml
depends:
  type:
    name: "Description of relationship"
    name2: "Description of this relationship"
  type2:
    name3: "Description of relationship"
```

This signifies that the document in question should have downstream dependencies on `type/name`, `type/name2`, `type2/name3`, et cetera.

It's optional to provide an actual description of the relationship.  Note that the descriptions can *also* be multiline and support full markdown!

However, it's always recommended to fully document relationship descriptions as the context of these is often far more valuable than a description of the services individually.  Don't be afraid to put a lot of detail in these sections.

### When Does Something Depend?
Whenever the hell you want.

Recomended relationships are systems with a hard dependencies, such as Google Buckets depending on Google Cloud Platform.  However, these can be abused for any purpose whatsoever, such as making chronologically sequential yet not directly linked asynchronous workers "depend" on each other in order to cause the resulting network to represent the "flow" of data through the system.

# Developing
This project uses Skaffold and Google Cloud Build to CD to k8s, but can also be run locally without any of that stuff.

## Local Dev
Start a local web server with `make run`.

Once you start modifying `app/docs` files, keep your changes in sync by running `make template` in the background.

## Skaffold Dev
### Prerequisites
*  You will need `gcloud` authed on your host, and able to write to your private Docker registry.
*  You will need `kubectl` installed, and have a `current-context` selected that you can push to.
*  You will need `kustomize` binary installed ([kustomize docs](https://github.com/kubernetes-sigs/kustomize/blob/master/docs/INSTALL.md))
*  You will need the `skaffold` binary installed ([skaffold docs](https://skaffold.dev/docs/getting-started/))

If you already have a working `kubectl` all you have to do is:

```bash
# Installing kustomize
wget https://github.com/kubernetes-sigs/kustomize/releases/download/v3.1.0/kustomize_3.1.0_linux_amd64
chmod +x kustomize_3.1.0_linux_amd64
sudo mv kustomize_3.1.0_linux_amd64 /usr/local/bin/kustomize

# Installing skaffold
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
chmod +x skaffold
sudo mv skaffold /usr/local/bin
```

### Configuring
We need to tell Skaffold what Google Cloud Project we want to use Cloud Build in, so update `skaffold.yaml` to use your project ID:

Example:
```yaml
# skaffold.yaml
build:
  googleCloudBuild:
    projectId: my-project-492014
```

Then, we need to tell Skaffold the specific Docker registry we intend to use to pull our images into k8s.  We can accomplish this be updating the registry definition in the `Makefile`:

Example:
```yaml
# Makefile
registry=gcr.io/my-project-492014
```

That's all we need to perform a cloud build.

### Running
To build everything and push it to your k8s cluster, run:

```bash
make skaffold-run
```

This will cause the Dockerfile to be built in Google Cloud Build.  When it is done, the `k8s/*.yaml` files will be templated and deployed to the `current-context` of your `kubectl` env.

# Customizing
### Your Own Documentation
All documentation is stored in `app/docs`.  The documentation provided here is meant only as an example.

Simply overwrite the contents of `app/docs` with whatever you want!

### Changing Hostname
This repo expects to be hosted at `app-top.marksolters.com`.  To change this, simply update `k8s/nginx-configmap.yaml` to whitelist a different hostname:

Example:
```
auto_ssl:set("allow_domain", function(domain, auto_ssl, ssl_options)
    return ngx.re.match(domain, "^(hostname.resolving.toyourservice)$", "i")
end)
```

When you deploy to k8s, you will create a `LoadBalancer` type `service` named `app-top`.  Make sure `hostname.resolving.toyourservice` has an A record pointing to the external IP of this service!

### Application Settings
The `app-top` app itself places most of its initial configuration information in `app/src/Configuration.js`.

These settings can all be overriden:

```
module.exports = {
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
      doc: `
# Welcome!
\`app-top\` is a tool for creating relational documentation.  It allows you to write markdown documentation, which can then create dependency links to other pieces of documentation.

\`app-top\` will then render graphical networks depicting the dependencies of your system.  These networks can be analyzed, rearranged, and filtered by depth or direction.

It is intended to be used to document e.g. the relationships between core areas of a business product (such as what may appear on a status page), and myriad backend dependencies that such products entail: DNS records correctly configured, specific microservices running healthily, other network constructs such as endpoints and so on.
`,
      depends: {}
    }
  }
}
```

Most of these settings should be self-explanatory after using the app once. 👀
