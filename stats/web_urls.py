from django.urls import path
from . import web_views

urlpatterns = [
    path('stats-primes/', web_views.StatsPrimesView.as_view(), name='stats_primes'),
    path('stats/generate/', web_views.generate_stats_view, name='generate_stats'),
]
