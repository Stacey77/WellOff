# Standalone container for the Super Brain package (super_brain/).
# Works with Podman, Podman Desktop, Rancher Desktop, or Docker:
#   podman build -t super-brain -f Containerfile .
#   podman run --rm -p 8000:8000 super-brain
#   -> open http://localhost:8000 for the HTML dashboard
#
# For the one-shot CLI report instead of the web GUI:
#   podman run --rm super-brain python3 -m super_brain.demo
FROM python:3.12-slim

WORKDIR /app
COPY super_brain/ ./super_brain/

# Fail the build if the test suite doesn't pass.
RUN python3 -m unittest discover -s super_brain/tests -v

EXPOSE 8000
CMD ["python3", "-m", "super_brain.web.server"]
