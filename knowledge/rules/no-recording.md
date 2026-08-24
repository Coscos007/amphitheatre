---
type: Rule
title: No recording
description: Session recording is out of scope. Do not enable LiveKit Egress or OME File/DVR.
tags: [scope, privacy, media]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: compose
    resource: docker-compose.yml
    title: Recording comment omitted
  - id: livekit-yaml
    resource: infra/livekit/livekit.yaml
    title: No egress in the YAML
  - id: product
    resource: /product/out-of-scope/out-of-scope.md
    title: Out of scope
---

# Rule

Do not implement, enable, test, or “use the load test to record”:

- LiveKit Egress (room composite, track egress, recording RTMP ingress)
- OME File publisher, DVR, dump, rewind
- Writing MP4/HLS to a Docker volume “to analyze later”

If a test scenario asks for VOD of what already happened, the scenario is wrong.

Do not add Record buttons in the UI.

# Related

- [Out of scope](/product/out-of-scope/out-of-scope.md)
- [Load testing docs](/changes/2026-08-22/load-testing-docs/load-testing-docs.md)

[^compose]: Recording comment omitted
[^livekit-yaml]: No egress in the YAML
