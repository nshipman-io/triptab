# DigitalOcean Container Registry
REGISTRY := registry.digitalocean.com/nshipman
REPO := triptab

# Image names
FRONTEND_IMAGE := $(REGISTRY)/$(REPO):frontend
API_IMAGE := $(REGISTRY)/$(REPO):api

# Git commit hash for versioning
GIT_SHA := $(shell git rev-parse --short HEAD)
FRONTEND_IMAGE_SHA := $(REGISTRY)/$(REPO):frontend-$(GIT_SHA)
API_IMAGE_SHA := $(REGISTRY)/$(REPO):api-$(GIT_SHA)

# Google OAuth Client ID (for frontend build) - read from environment or .env.prod
GOOGLE_CLIENT_ID ?= $(shell grep GOOGLE_CLIENT_ID deploy/.env.prod 2>/dev/null | cut -d= -f2)

.PHONY: help build build-frontend build-api push push-frontend push-api login all clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

login: ## Login to DigitalOcean Container Registry
	doctl registry login

build: build-frontend build-api ## Build all images

build-frontend: ## Build frontend image
	docker build \
		--platform linux/amd64 \
		-f frontend/Dockerfile \
		--target production \
		--build-arg VITE_GOOGLE_CLIENT_ID=$(GOOGLE_CLIENT_ID) \
		-t $(FRONTEND_IMAGE) \
		-t $(FRONTEND_IMAGE_SHA) \
		./frontend

build-api: ## Build API image
	docker build \
		--platform linux/amd64 \
		-f backend/Dockerfile \
		-t $(API_IMAGE) \
		-t $(API_IMAGE_SHA) \
		./backend

push: push-frontend push-api ## Push all images to registry

push-frontend: ## Push frontend image to registry
	docker push $(FRONTEND_IMAGE)
	docker push $(FRONTEND_IMAGE_SHA)

push-api: ## Push API image to registry
	docker push $(API_IMAGE)
	docker push $(API_IMAGE_SHA)

all: login build push ## Login, build, and push all images

clean: ## Remove local images
	docker rmi $(FRONTEND_IMAGE) $(FRONTEND_IMAGE_SHA) $(API_IMAGE) $(API_IMAGE_SHA) 2>/dev/null || true

# Development helpers
dev: ## Start development environment
	docker-compose up -d

dev-down: ## Stop development environment
	docker-compose down

dev-logs: ## Show development logs
	docker-compose logs -f

# Production deployment (run on server)
prod-pull: ## Pull latest images from registry
	docker-compose -f docker-compose.prod.yml pull

prod-up: ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-restart: ## Restart production services
	docker-compose -f docker-compose.prod.yml restart

prod-deploy: prod-pull prod-up ## Pull and deploy latest images

# Ansible deployment (run locally)
ANSIBLE_DIR := deploy/ansible

setup-server: ## Initial server setup (run once)
	cd $(ANSIBLE_DIR) && ansible-playbook playbooks/setup.yml

deploy: build push ansible-deploy ## Build, push, and deploy to production

ansible-deploy: ## Deploy latest to production via Ansible
	cd $(ANSIBLE_DIR) && ansible-playbook playbooks/deploy.yml

ansible-logs: ## View production logs via Ansible
	cd $(ANSIBLE_DIR) && ansible-playbook playbooks/logs.yml

ssh: ## SSH into production server
	ssh root@165.227.191.10

ssh-logs: ## SSH and tail logs
	ssh root@165.227.191.10 "cd /opt/triptab && docker compose logs -f"

# Database commands
prod-seed: ## Run seed script on production
	ssh root@165.227.191.10 "cd /opt/triptab && docker compose exec backend python -m app.seed_guides"

prod-migrate: ## Run migrations on production
	ssh root@165.227.191.10 "cd /opt/triptab && docker compose exec backend alembic upgrade head"

prod-shell: ## Open Python shell on production backend
	ssh -t root@165.227.191.10 "cd /opt/triptab && docker compose exec backend python"
