#!/usr/bin/env bash
# Output the kustomization file

cat <<EOF >kustomization.yaml
---
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: default
resources:
  - k8s/deploy.yaml
  - k8s/svc.yaml
  - k8s/nginx-configmap.yaml
images:
  - name: auto-ssl # match images with this name
    newName: ${DOCKER_REPO}/auto-ssl # override the name
    newTag: master # override the tag
  - name: app-top
    newName: ${DOCKER_REPO}/app-top
    newTag: ${GIT_HASH}
EOF
