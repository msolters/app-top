.PHONY: all build release

repo=app-top
shorthash=`git rev-parse --short HEAD`
registry=<YOUR REPO GOES HERE>
base=$(registry)/$(repo)
branch=$${BRANCH_NAME:-`git rev-parse --abbrev-ref HEAD`}
image=$(base):$(shorthash)

all: build release

skaffold-run:
	DOCKER_REPO=$(registry) GIT_HASH=$(shorthash) bash kustomize.sh
	DOCKER_REPO=$(registry) GIT_HASH=$(shorthash) skaffold run

build:
	docker build -t $(image) .
	docker tag $(image) $(base):$(branch)

release:
	docker push $(image)
	docker push $(base):$(branch)

template:
	cd app/ && yarn watch

run:
	cd app/ && yarn install && yarn start

local-docker: build
	docker run -p5000:5000 $(image)

exec: build
	docker run -it -p5000:5000 $(image) bash
