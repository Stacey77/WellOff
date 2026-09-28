import pytest

from src.empire.auth_mode import AuthError, AuthMode, ProviderAuth
from src.empire.factory import AIFactory, CapacityError
from src.empire.foundry import AIFoundry
from src.empire.infra import InfraRegistry
from src.empire.studio import AgenticStudio


def test_local_auth_is_api_less_and_needs_no_secret():
    a = ProviderAuth(AuthMode.LOCAL)
    assert a.api_less and a.ready and a.resolve() is None and a.headers() == {}


def test_token_auth_reads_env_and_never_leaks(monkeypatch):
    a = ProviderAuth(AuthMode.ENTERPRISE_TOKEN, "GITEA_TOKEN")
    monkeypatch.delenv("GITEA_TOKEN", raising=False)
    assert not a.ready
    with pytest.raises(AuthError):
        a.resolve()
    monkeypatch.setenv("GITEA_TOKEN", "s3cret")
    assert a.headers() == {"Authorization": "token s3cret"}
    assert "s3cret" not in str(a.to_dict())


def test_api_key_mode_requires_env_var_and_is_not_api_less():
    with pytest.raises(AuthError):
        ProviderAuth(AuthMode.API_KEY)
    assert not ProviderAuth(AuthMode.API_KEY, "OPENAI_API_KEY").api_less


def test_auth_roundtrip():
    a = ProviderAuth(AuthMode.ENTERPRISE_TOKEN, "X", "http://h")
    b = ProviderAuth.from_dict(a.to_dict())
    assert (b.mode, b.env_var, b.base_url) == (a.mode, a.env_var, a.base_url)


def test_infra_defaults():
    r = InfraRegistry()
    assert r.get("podman").auth.mode is AuthMode.LOCAL
    assert r.get("gitea").auth.env_var == "GITEA_TOKEN"
    with pytest.raises(KeyError):
        r.get("aws")


def test_foundry_scaffold_renders_files_without_secrets(monkeypatch):
    monkeypatch.setenv("TOK", "topsecret")
    f = AIFoundry()
    app = f.scaffold("Acme Docs!", "rag-assistant",
                     auth=ProviderAuth(AuthMode.ENTERPRISE_TOKEN, "TOK"))
    assert app.name == "acme-docs"
    assert set(app.files) == {"app.py", "ingest.py", "Containerfile"}
    assert all("topsecret" not in v for v in app.files.values())
    assert "TOK" in app.files["app.py"]
    with pytest.raises(KeyError):
        f.scaffold("x", "nope")


def test_factory_env_binding_and_capacity():
    fac = AIFactory()
    assert fac.deploy("a", "dev").backend == "podman"
    prod = fac.deploy("a", "prod", cpus=2)
    assert prod.backend == "rancher"
    assert fac.pools["local-cpu"].free_cpus == 5
    with pytest.raises(CapacityError):
        fac.deploy("a", "dev", cpus=99)
    fac.teardown(prod.id)
    fac.teardown(prod.id)  # idempotent
    assert fac.pools["local-cpu"].free_cpus == 7


def test_studio_gitea_urls():
    s = AgenticStudio("http://git.local/")
    ses = s.open_session("/nova/app/", kind="ide")
    assert ses.repo_url == "http://git.local/nova/app.git"
    with pytest.raises(ValueError):
        s.open_session("r", kind="vm")
    assert s.close_session(ses.id).status == "closed"
