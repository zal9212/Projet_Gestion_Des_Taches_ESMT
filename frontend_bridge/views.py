from django.shortcuts import render
from django.conf import settings
import os
from django.http import HttpResponse

from django.contrib.auth.decorators import login_required

@login_required
def portal_view(request):
    """
    Sert l'app Angular à l'intérieur du layout Django pour une cohérence parfaite.
    """
    return render(request, 'portal_bridge.html')

def angular_static_proxy(request, path):
    """
    Sert les fichiers statiques d'Angular s'ils sont demandés sans le préfixe /static/
    (Utile car Angular index.html utilise des chemins relatifs par défaut)
    """
    static_file = os.path.join(settings.BASE_DIR, 'static', 'angular', 'browser', path)
    if os.path.exists(static_file):
        with open(static_file, 'rb') as f:
            content_type = "application/javascript" if path.endswith('.js') else "text/css" if path.endswith('.css') else "text/html"
            return HttpResponse(f.read(), content_type=content_type)
    return HttpResponse(status=404)
