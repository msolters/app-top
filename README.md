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
