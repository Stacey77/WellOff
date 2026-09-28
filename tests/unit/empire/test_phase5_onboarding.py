import pytest

from src.empire.onboarding import OnboardingError, Proposal, Stage
from src.empire.platform import EmpirePlatform


def _p(**kw):
    base = dict(client_name="Acme Dental", contact_email="ops@acme.test")
    return Proposal(**{**base, **kw})


def test_run_to_live_end_to_end():
    p = EmpirePlatform()
    t = p.onboarding.accept(_p())
    t, key = p.onboarding.run_to_live(t.id)
    assert t.stage is Stage.LIVE
    assert key and key.startswith("nk_acme-dental_")
    assert p.tenant_for_key(key) == t.id
    assert key not in str(t.to_dict())
    assert t.app_id in p.foundry.apps and t.deployment_id in p.factory.deployments
    assert [h["stage"] for h in t.history] == [s.value for s in Stage]
    assert len(t.mcp_tools) == 9
    ok, _ = p.audit.verify()
    assert ok and len(p.audit.for_tenant(t.id)) == 7


def test_advance_is_one_stage_at_a_time_and_idempotent_at_live():
    p = EmpirePlatform()
    t = p.onboarding.accept(_p())
    t, _ = p.onboarding.advance(t.id)
    assert t.stage is Stage.TENANT_CREATED
    p.onboarding.run_to_live(t.id)
    t, key = p.onboarding.advance(t.id)
    assert t.stage is Stage.LIVE and key is None


def test_failed_stage_is_resumable():
    p = EmpirePlatform()
    t = p.onboarding.accept(_p(mcp_tools=["bogus"]))
    with pytest.raises(OnboardingError):
        p.onboarding.run_to_live(t.id)
    assert t.stage is Stage.AUTH_BOOTSTRAPPED and "bogus" in t.last_error
    t.proposal.mcp_tools = ["platform_snapshot"]
    t, _ = p.onboarding.run_to_live(t.id)
    assert t.stage is Stage.LIVE and t.last_error is None


def test_token_mode_tenant_gets_env_var_not_secret():
    p = EmpirePlatform()
    t = p.onboarding.accept(_p(auth_mode="enterprise_token"))
    t, _ = p.onboarding.run_to_live(t.id)
    assert t.auth.env_var == "NOVA_ACME_DENTAL_TOKEN"


def test_duplicate_slugs_and_validation():
    p = EmpirePlatform()
    a = p.onboarding.accept(_p())
    b = p.onboarding.accept(_p())
    assert a.slug != b.slug
    with pytest.raises(ValueError):
        _p(contact_email="nope")
