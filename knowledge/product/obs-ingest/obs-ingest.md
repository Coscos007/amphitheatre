---
type: Product
title: OBS ingest
description: OBS settings (Windows/macOS, encoders, rate control) for the OME stage. Bypass vs transcode. Not an API contract.
tags: [obs, ome, ingest, encoder]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T18:35:00Z }
sources:
  - id: ome-xml
    resource: infra/ome/origin_conf/Server.xml
    title: Active OutputProfile abr_stream
  - id: ome-product
    resource: /product/ome-broadcast/ome-broadcast.md
    title: Stream key = {roomId}-{secret}
  - id: infra
    resource: infra/README.md
    title: RTMP and playback
---

# OBS ingest — Amphitheatre

Operational guide for anyone broadcasting on the OME stage. The room contract remains in [OME broadcast](/product/ome-broadcast/ome-broadcast.md): Server `rtmp://HOST:1935/app`, stream key `{roomId}-{secret}`.

State **today**: OME in **ABR** (`abr_stream`): bypass of OBS 1080 + transcode 720/480. SPA playback is **OvenPlayer** (WebRTC first, LL-HLS fallback). LL-HLS `SegmentDuration` = 2 s.

There is no recording (rule [no-recording](/rules/no-recording.md)).

# Windows or macOS

OBS is the same app. What changes is the available **hardware encoder**.

| | Windows | macOS |
|---|---|---|
| Software H.264 | x264 | x264 |
| Software AV1 | AOM AV1 and/or SVT-AV1 (plugin/build) | same, rarer and heavier |
| NVIDIA | NVENC H.264, HEVC, AV1 (Ada/40-series+) | NVENC if there is an NVIDIA eGPU (uncommon) |
| Apple | — | Apple VT H264, Apple VT HEVC (Apple Silicon or T2/AMD on Intel) |
| AMD / Intel | AMF H.264/HEVC, QSV | — |

**Recommended in this repo (classic RTMP, bypass, viewers in a browser):**

- Windows with NVIDIA: **NVENC H.264**
- Windows without NVIDIA: **x264**
- Mac: **Apple VT H264** (Apple Silicon) or **x264** if VT fails on RTMP

Do not use HEVC/AV1 on the **default** ingest for this theater while the stage is LL-HLS + WebRTC H.264/Opus. See the codecs section.

Path in OBS: `Settings` → `Output` → `Output Mode: Advanced` → `Streaming` tab. `Simple` hides B-frames, keyframe, and extra options.

# What each encoder is

## x264 (software H.264)

Libx264 on the CPU. Best quality per bitrate among H.264 options, highest CPU cost. Compatible with classic RTMP, LL-HLS, and WebRTC.

**When to use:** Intel Mac without stable VT, PC without NVENC, or when CPU is spare and the GPU is busy with the game/capture.

**Ideal for this stage (live, bypass):**

| Field | Value |
|---|---|
| Encoder | x264 |
| Rate Control | CBR |
| Bitrate | see the bitrate table below |
| Keyframe Interval | `2` (1 s if the target is sub-second WebRTC) |
| CPU Preset | `veryfast` (headroom machine: `faster` / `fast`) |
| Tune | `zerolatency` |
| Profile | `high` or `main` |
| x264 Options | `bframes=0` and, to pin GOP: `keyint=60` (30 fps) or `keyint=120` (60 fps) |
| B-frames | 0 (via options; x264 can still emit B-frames even with a 2 s keyframe) |

Do not use preset `placebo`/`veryslow` on live. Do not use Tune `film`/`animation` together with `zerolatency` (the live Tune wins).

## NVENC (NVIDIA)

Encode on the GPU. Quality a bit below x264 at the same bitrate; CPU stays free. NVENC H.264 is the **best Windows default** for this product.

**Ideal H.264 (RTMP + bypass):**

| Field | Value |
|---|---|
| Encoder | NVIDIA NVENC H.264 |
| Rate Control | CBR |
| Bitrate | table below |
| Keyframe Interval | `2` |
| Max B-frames | `0` |
| Preset | P5 / Quality (not Max Quality if the GPU is already at the limit) |
| Multipass | Quarter or disabled (full pass increases latency) |
| Look-ahead | Off for minimum latency |
| Psycho Visual Tuning | Off for minimum latency; On if quality > delay |
| Profile | high |
| Tune | ll / low latency if the driver exposes it |

**NVENC HEVC:** better compression, poor for browser WebRTC. It would only make sense with LL-HLS/Safari and OME transcode to H.264 — today OME does **not** transcode video.

**NVENC AV1:** Ada+ GPU only. Same AV1 caveat below. Not the default ingest.

## Apple VT H264 / HEVC

VideoToolbox. On Apple Silicon it is the NVENC analogue: cheap on CPU, good enough quality for live.

**Apple VT H264 — ideal:**

| Field | Value |
|---|---|
| Encoder | Apple VT H264 Hardware Encoder |
| Rate Control | CBR (if OBS offers it; otherwise Average with cap = target bitrate) |
| Bitrate | table below |
| Keyframe Interval | `2` |
| B-frames | 0 if the menu exists; live VT H264 is usually low-delay |
| Profile | Main/High |
| Hardware | on |

**Apple VT HEVC:** same limitation as NVENC HEVC. Do not use on the current stage (bypass + WebRTC/LL-HLS H.264).

If the stream “connects in OBS and OME cannot find video”, switch VT HEVC → VT H264 or x264. HEVC on classic RTMP is fragile; Enhanced RTMP (E-RTMP) on OME 0.21 is experimental and is **not** enabled in this repo.

## AOM AV1 (libaom, software)

Best quality per bitrate in theory. CPU cost is **very** high. Classic RTMP does **not** carry AV1; it needs **Enhanced RTMP** or **WHIP**. OME 0.21 *can* ingest AV1 in those modes, but:

- The current SPA plays OvenPlayer (WebRTC ABR + LL-HLS fallback); AV1 on HLS/WebRTC is still uneven (Safari/iOS).
- Bypass would deliver raw AV1 to the viewer.
- libaom at 1080p60 live is unrealistic on most machines.

**Not recommended** as ingest for this theater right now. If it ever is: WHIP or E-RTMP, OME transcode to H.264+AAC+Opus, not bypass.

SVT-AV1 (if it appears in OBS) is faster than AOM and still heavy; same transport restriction.

# Rate control: CBR, ABR, VBR, CRF (and CQP)

**OBS ABR is not OME/HLS ABR.** In OBS, ABR = *Average Bitrate* (average over time). In OME, ABR = *Adaptive Bitrate* (several 1080/720/480 renditions). They are different things.

| Mode | What it does | Live on this stage | VOD / file |
|---|---|---|---|
| **CBR** | Near-constant bitrate. Predictable network. | **Default.** Use it. | Wastes bits on a still scene |
| **ABR (OBS)** | Average over time; peaks above the average | Acceptable if CBR is unavailable; peaks can blow a viewer’s 4G | Ok |
| **VBR** | Bitrate rises/falls with the scene | Bad for live: a peak drops the uplink and the player | Good for files |
| **CRF** (x264) | Quality target (18–23). Bitrate unconstrained | **Not** on live RTMP: a camera cut can spike to 20 Mbps | Best for recording |
| **CQP / CQ** (NVENC) | Constant quantization, CRF analogue | Avoid on live | Recording |

**Ideal live → OME:** always **CBR**.

If the uplink fluctuates, OBS has **Dynamic Bitrate** (freeze/quality drop when the network saturates). That is CBR with a flexible cap, not HLS ABR.

# Target bitrate (CBR, H.264)

Audio separately: AAC **160–192 kbps**, 48 kHz, stereo.

| Resolution / fps | Video CBR bitrate | Cap if the uplink is tight |
|---|---|---|
| 480p30 | 0.8–1.5 Mbps | 1.0 Mbps |
| 720p30 | 2.5–4 Mbps | 2.5 Mbps |
| 720p60 | 4–6 Mbps | 4 Mbps |
| 1080p30 | 4.5–6 Mbps | 4.5 Mbps |
| 1080p60 | 7–10 Mbps | 6–7 Mbps |

HEVC/AV1, *if* the whole pipeline supported them, would use ~30–50 % less. **Do not apply that reduction to H.264.**

Uplink: video bitrate + audio + ~20 % headroom. 1080p30 at 6 Mbps needs ~7.5 Mbps real.

# Bypass vs transcode

## What each one is

| | 1080 bypass (today, on the ABR ladder) | 720/480 transcode (today, on the same `abr_stream`) |
|---|---|---|
| Video on OME | Copies the OBS encode | Re-encodes 720 and 480; 1080 can stay bypass |
| Viewer | A single quality | LL-HLS playlist with renditions; the player switches on its own |
| OME CPU | Almost zero on video (+ Opus encode) | High (OME OSS after v0.20.5 **without** NVENC) |
| Latency | Minimum | Transcode queue (tens to hundreds of ms extra) |
| 1080p60 on a phone | The phone struggles or drops | The phone takes 480p30 |

Audio: even with video bypass, OME **already** generates Opus for WebRTC. OBS AAC continues on LL-HLS.

## Can you choose dynamically by URL before connecting?

**Ingest (OBS): no.** The URL is always `rtmp://HOST:1935/app` and the key is `{roomId}`. There is no `?bypass=1` or `?codec=av1` on that RTMP. The encoder is chosen **in OBS**, not in the URL. What OME does with the frame is defined in `Server.xml` of application `app`.

**Playback (viewer): in part, and only when there is more than one profile/playlist.**

- Today: ABR on. LL-HLS at `http://HOST:3333/app/{roomId}/llhls.m3u8` and WebRTC ABR at `ws://HOST:3333/app/{roomId}` (default Opus playlist; **not** `/llhls`). The SPA uses OvenPlayer (WebRTC first). There is no query to “turn off transcode”.
- OME publishes a **Playlist** (`FileName` `llhls`). The viewer chooses the HLS playlist, not OBS. WebRTC vs HLS is another URL, not a bypass flag.
- Two OME apps (`app` bypass vs `app_abr` transcode) would yield different RTMP (`…/app` vs `…/app_abr`). That would be server config + ingest UI, **not** a magic parameter on the default URL.

OME **TranscodeWebhook** can change encodes based on *input* (detected resolution). That is a server rule, not an OBS URL.

Conclusion: **the streamer cannot choose bypass vs transcode on the current connection URL.** `Server.xml` chooses (and, in the future, maybe the SPA at *play* time).

# Other ideal stream settings

## Video in OBS

- Canvas = output (1080 or 720). Do not upscale 720 → 1080.
- Color Format `NV12`, Color Space `709`, Color Range `Partial` (Limited). Full/RGB blows bitrate and breaks players.
- Integer FPS: 30 or 60. Avoid 59.94 on simple live.
- Expensive filters (stacked NVIDIA Broadcast, blur) increase delay.
- Process Priority: High. On Windows, Game Mode is ok; close overlays that capture the window twice.

## GOP / keyframe (required on this stage)

- Keyframe **1–2 s**, B-frames **0**.
- OBS default GOP (~8 s / 250 frames) breaks the LL-HLS packager (segment without IDR). OME `SegmentDuration` is **2 s**; GOP must be 1–2 s.

## Network

- Ethernet. Wi-Fi 6 only if there is no cable.
- Do not put a VPN on the RTMP path.
- TCP port 1935 open on the OME host firewall.
- One publisher per `roomId` (`BlockDuplicateStreamName`). A second OBS with the same key is rejected.

## Audio

- Tracks: one mix for the stream (Watch, Discord, mic) so you do not send 6 RTMP tracks.
- Sample rate 48 kHz in OBS and on the devices.

## What not to send

- Record and stream on the same encoder with CRF on the stream.
- Dual output RTMP + WHIP to the same roomId.
- A huge Replay Buffer competing with NVENC on the same Max Quality preset.

# Ready presets (this repo)

**A — Windows NVIDIA, 1080p30, bypass (recommended)**  
NVENC H.264, CBR 6000, keyframe 2, B-frames 0, look-ahead off, AAC 160, 48 kHz.

**B — Windows NVIDIA, 1080p60**  
NVENC H.264, CBR 8000–9000, keyframe 2, B-frames 0. Only if the uplink and viewers can handle it **without** ABR.

**C — Windows without NVIDIA**  
x264, CBR, preset veryfast, Tune zerolatency, `bframes=0`, same bitrates as the table.

**D — Mac Apple Silicon, 1080p30**  
Apple VT H264, CBR 6000, keyframe 2, AAC 160.

**E — Mac, VT unstable on RTMP**  
Same as C (x264).

**F — Minimum latency (recommended with OvenPlayer)**  
Keyframe **1 s**, B-frames 0, Tune zerolatency, CBR. WebRTC ABR player; LL-HLS fallback only.

**G — Phones in the audience (on in `abr_stream`)**  
OBS 1080p30 CBR 4500–6000. OME delivers transcoded 720/480. Avoid 1080p60 with three 60 fps ladders in software on the same host.

# Related

- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [No recording](/rules/no-recording.md)

[^ome-xml]: Active OutputProfile abr_stream
[^ome-product]: Stream key = roomId
[^infra]: RTMP and playback
