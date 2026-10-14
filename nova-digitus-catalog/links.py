# AI Studio app IDs for each catalog app ("Try it" buttons). Collected from Stacey's AI Studio gallery, Oct 14 2026.
import re
import json, os
GALLERY = json.load(open(os.path.join(os.path.dirname(__file__), "gallery.json")))
# Catalog name -> gallery name, where they differ (renames) or the name is shared by several apps
OVERRIDE_ID = {
  "Wealth in Health: Sound Healing": "3c8cd9d2-1631-4318-87ca-7d6a2addd067",
  "Wealth in Health Index": "bfb6cee5-546c-4301-9838-58c9f815a11b",
  "Nova Digitus Agent Dashboard": "1e6b8307-b40a-4a1e-9fac-6360e05c3462",
  "Nova Digitus Conversational AI": "3a23ef4c-d011-403b-9674-622b090a923f",
  "AI Agentic Brain: Digital Illustration Platform": "c292afb7-1efd-4159-8d97-ca793f318eb7",
}
ALIAS = {
  "Engineering Orchestrator": "Nova Digitus: Engineering Orchestrator",
  "OmniNet AI: Network Diagnostics & Self-Healing": "OmniNet AI - Agentic Swarm, IP Diagnostic Scanner & Self-Healing Resolver",
  "Stratum MCP: Cloud Resource Control Plane": "Stratum MCP — Cloud Resource Control Plane",
  "Unified Cybersecurity Platform": "Heimdal Security - Unified Cybersecurity Platform",
  "TrackerShield: Hidden Tracker Detection": "TrackerShield - SmartTag & AirTag Detection & Safety Inspector",
  "AgentForge: GenAI Studio": "AgentForge - GenAI Studio",
  "Agentic Architecture Sandbox (Azure AI Foundry + Claude)": "Azure AI Agentic Sandbox",
  "Flash UI: AI Swarm Vibecoding Studio": "Flash UI - AI Swarm Vibecoding Studio",
  "UI Visionary": "UI Visionary GPT",
  "Kimi Research Assistant": "Kimi Platform",
  "Pulse: Live Transcription & Content Analysis": "Gemini Pulse",
  "Donor Services Resolution Swarm": "Vehicles For Veterans — Agentic Resolution Swarm",
  "AquaFlow: Water Delivery Operations": "AquaFlow - Water Exchange Platform",
  "AI Swarm: B2B Outreach Planner": "AI Swarm",
  "Virtual Try-On": "Yatta's Design - Virtual Try-On",
  "Medica Herbalista": "Medica Herbalista: Sacred Eternal Wisdom",
  "90 Days of Quiet": "90 Days of Quiet — Equinox to Solstice",
  "Herbal Digestives & Pastilles Lab": "Herbal Antibiotics & Bitter Pastilles Lab",
  "Copper-Infused Water Lab": "Copper-Infused Structured Water Lab",
  "Syzygy: The Hermetic Matrix": "Syzygy - The Hermetic Matrix Fracture",
  "AuraDJ": "AuraDJ - The Genetic AI Virtuoso",
  "Photo Animator": "Veo Animator",
  "The Roaring Discourse: Talking Lion": "The Roaring Discourse: AI Talking Lion",
  "Lyrics to Music Studio": "Lyria Melodies",
  "Eve: Multimodal Companion": "Eve - Multimodal Companion",
  "Robot Assistant Builder": "Prime Assistant Builder",
}
def app_id(name):
    if name in OVERRIDE_ID: return OVERRIDE_ID[name]
    target = ALIAS.get(name, name)
    hits = [i for n, i in GALLERY if n == target]
    if len(hits) == 1: return hits[0]
    if len(hits) > 1: raise ValueError(f"ambiguous: {name}")
    return None
def try_url(name):
    i = app_id(name)
    return f"https://aistudio.google.com/apps/{i}?showPreview=true&showAssistant=false" if i else None

# Public "Try it" addresses. AI Studio links above only open for Stacey (apps are Restricted),
# so the site shows a Try it button only for apps listed here. Add an app's public URL to turn its button on.
PUBLIC_URLS = {
    # "TerraFleet Autonomous Garden Robotics": "https://apps.novadigitus.example/terrafleet/",
}
def public_try_url(name):
    return PUBLIC_URLS.get(name)
