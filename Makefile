USER_ID = $(shell id -u)
GROUP_ID = $(shell id -g)

build:
	docker build -t gucheen/status --build-arg USER_ID=$(USER_ID) --build-arg GROUP_ID=$(GROUP_ID) .
update:
	docker-compose up --force-recreate --build -d --remove-orphan