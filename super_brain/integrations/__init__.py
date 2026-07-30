"""Integration adapters the Super Brain connects both hemispheres through."""
from .analytics import Analytics
from .base import Integration
from .calendar import Calendar
from .crm import CRM
from .email import Email
from .finance import Finance
from .web_builder import WebBuilder

__all__ = [
    "Integration",
    "CRM",
    "WebBuilder",
    "Email",
    "Finance",
    "Analytics",
    "Calendar",
]
