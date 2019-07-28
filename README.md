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

Each document shares the same, simply declarative structure.  For example, `app-top.yaml` looks like:
```yaml

```

# Developing
This project uses Skaffold and Google Cloud Build to CD to k8s, but can also be run locally without any of that stuff.

## Using Skaffold
### Prerequisites
*  You will need `kubectl` installed, and have a `current-context` selected that you can push to.
*  You will need the `skaffold` binary installed ([see here](https://skaffold.dev/docs/getting-started/))

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

That's all we need!

### Running
To build everything and push it to your k8s cluster, run:

```bash
make skaffold-run
```

This will cause the Dockerfile to be built in Google Cloud Build.  When it is done, the `k8s/*.yaml` files will be templated and deployed to the `current-context` of your `kubectl` env.

## Customizing
### Your Own Documentation
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
