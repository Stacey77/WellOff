# Super Brain

A standalone Python package implementing a two-hemisphere business
intelligence and execution system. It is completely independent of the PWA
digital business card and the `robot_agi/` package that also live in this
repo.

## Concept

The Super Brain has two hemispheres joined by a shared integration layer:

- **Company Intelligence** (the company's *edge*) — strategy, customer data,
  goals, knowledge, and brand. This is what the company knows about itself
  and its market.
- **Agent** (the *doing* side) — research, create, outreach, follow-up, and
  optimize. This is what acts on that knowledge.

Both hemispheres read and write through one **integration layer**: CRM, web
builder, email, finance, analytics, and calendar. That layer is what lets the
brain **think** (build context from the company edge), **connect** (wire
both hemispheres to real systems), and **execute** (run the agent pipeline
against that context and those systems).

```mermaid
flowchart LR
    subgraph CI["Company Intelligence (edge)"]
        strategy[Strategy]
        customers[Customer Data]
        goals[Goals]
        knowledge[Knowledge]
        brand[Brand]
    end

    subgraph Agent["Agent"]
        research[Research]
        create[Create]
        outreach[Outreach]
        followup[Follow-up]
        optimize[Optimize]
        research --> create --> outreach --> followup --> optimize
    end

    subgraph Hub["Integration Hub"]
        crm[CRM]
        web[Web Builder]
        email[Email]
        finance[Finance]
        analytics[Analytics]
        calendar[Calendar]
    end

    CI -- snapshot / edge --> Agent
    Agent -- reads + acts --> Hub
    Hub -- results feed back --> optimize
    optimize -. informs next cycle .-> CI
```

## How the loop runs

1. **Think** — `CompanyIntelligence.snapshot()` collects the current state of
   strategy, customer data, goals, knowledge, and brand into one "edge"
   context object for a given objective.
2. **Connect** — `IntegrationHub.connect_all()` wires up CRM, web builder,
   email, finance, analytics, and calendar so both hemispheres can act
   through real systems (adapters are stubbed in-memory today; swap each
   adapter's internals for a real API client without touching the rest of
   the brain).
3. **Execute** — `AgentSide.execute_pipeline()` runs the five agent stages in
   order, each stage reading the edge and/or prior stage output and acting
   through the hub:
   - **Research** — reads CRM pipeline + analytics history + strategic
     priorities to understand the objective.
   - **Create** — drafts an on-brand asset (voice/tone from Brand,
     facts from Knowledge) and publishes it via the web builder.
   - **Outreach** — emails the relevant customer segment and logs the touch
     in the CRM.
   - **Follow-up** — schedules a calendar touchpoint for everyone reached.
   - **Optimize** — reads analytics + finance results back and recommends
     whether to scale or gather more data — closing the loop back to
     Company Intelligence for the next cycle.

## Structure

```
super_brain/
├── core/
│   ├── brain.py            # SuperBrain: think() / connect() / execute()
│   └── integration_hub.py  # Owns and connects the six integrations
├── company_intelligence/    # strategy, customer_data, goals, knowledge, brand
├── agent/                   # research, create, outreach, follow_up, optimize
├── integrations/            # crm, web_builder, email, finance, analytics, calendar
└── tests/
    └── test_brain.py
```

## Usage

```python
from super_brain import SuperBrain

brain = SuperBrain()

# Populate the company edge once.
brain.company_intelligence.strategy.set_positioning("AI ops partner for local service businesses")
brain.company_intelligence.customer_data.upsert_record("cust-1", {"email": "lead@example.com"})
brain.company_intelligence.brand.set_voice("direct, confident, no fluff", ["clear", "bold"])

# Think, connect, and execute against an objective.
report = brain.execute("Launch fall tune-up campaign")
```

`report` contains the company edge used, the status of every integration,
and each agent stage's output — a full record of what the brain knew,
connected to, and did.

## Running tests

From the repo root:

```bash
python3 -m unittest discover -s super_brain/tests -v
```

## Running in a container (Podman / Rancher Desktop / Docker)

A `Containerfile` at the repo root packages `super_brain/` as a standalone
image with no dependencies beyond the Python standard library. Building it
also runs the full test suite — the build fails if a test fails.

```bash
# Podman (or Podman Desktop's embedded CLI, or Rancher Desktop set to the
# Podman/moby backend):
podman build -t super-brain -f Containerfile .
podman run --rm super-brain

# Docker works identically:
docker build -t super-brain -f Containerfile .
docker run --rm super-brain
```

The default command runs `super_brain/demo.py`, which populates a sample
company edge (strategy, one customer record, a goal, a knowledge entry,
brand voice) and executes one full think → connect → execute cycle,
printing the resulting report as JSON.

## Extending with real integrations

Every adapter in `integrations/` extends `Integration` (`integrations/base.py`),
which only requires a `connect()` call before use. Replace an adapter's
in-memory logic with a real API client (e.g. a CRM's REST API, an ESP for
email, a scheduling API for calendar) and the rest of the brain — both
hemispheres and the pipeline — keeps working unchanged.
