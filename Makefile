.PHONY: up down logs ome-up ome-down ome-only smoke ps restart ffmpeg-ome help

SCRIPTS := infra/scripts

help:
	@echo "Amphitheatre infra"
	@echo "  make up          Valkey + LiveKit (no OME)"
	@echo "  make ome-up      also start OvenMediaEngine"
	@echo "  make ome-down    stop OME only (voice/chat keep working)"
	@echo "  make ome-only    start OME on top of an already-running stack"
	@echo "  make down        stop all profiles"
	@echo "  make logs        follow logs (all running services)"
	@echo "  make smoke       health checks"
	@echo "  make ffmpeg-ome  RTMP test pattern (needs ffmpeg + OME)"
	@echo "  make ps          compose ps"

up:
	@$(SCRIPTS)/up.sh

down:
	@$(SCRIPTS)/down.sh

logs:
	@$(SCRIPTS)/logs.sh $(ARGS)

ome-up:
	@$(SCRIPTS)/ome-up.sh

ome-down:
	@$(SCRIPTS)/ome-down.sh

ome-only: ome-up

smoke:
	@$(SCRIPTS)/smoke.sh

ffmpeg-ome:
	@$(SCRIPTS)/ffmpeg-ome-fixture.sh $(ROOM)

ps:
	@docker compose --profile ome --profile caddy ps

restart:
	@docker compose restart livekit redis
