from pathlib import Path

from django.conf import settings
from django.http import Http404, HttpResponse


def service_worker(request):
    path = Path(settings.BASE_DIR) / "static" / "pwa" / "sw.js"
    if not path.exists():
        raise Http404("Service worker file not found")
    response = HttpResponse(path.read_text(encoding="utf-8"), content_type="application/javascript")
    response["Cache-Control"] = "no-cache"
    return response
