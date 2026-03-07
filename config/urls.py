"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static



from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from projects import views

urlpatterns = [
    path('admin/', admin.site.urls),

    #Endpoint JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


# Vos API
    path('api/', include('projects.urls')),
    path('api/', include('stats.urls')),
    path('api/', include('accounts.urls_api')),
    path('api/chat/', include('chat.urls_api')),
    
    # Authentification Web
    path('accounts/', include('accounts.urls')),
    
    # Interface Web Projets (Dashboard)
    path('', include('projects.web_urls')),
    
    # Interface Web Tâches
    path('', include('tasks.web_urls')),

    # Interface Web Stats & Primes
    path('', include('stats.web_urls')),
]

from frontend_bridge.views import portal_view, angular_static_proxy
from django.urls import re_path

urlpatterns += [
    # Proxy pour les fichiers JS/CSS relatifs demandés par l'index.html
    re_path(r'^portal/(?P<path>.*\.(js|css|png|jpg|ico|woff2|json))$', angular_static_proxy),
    # Portal Routing
    path('portal/', portal_view, name='portal'),
    re_path(r'^portal/.*$', portal_view), # Catch-all pour le routing Angular
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
