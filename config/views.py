from django.shortcuts import render
from django.conf import settings
import os

def angular_app(request):
    """
    Sert l'application Angular pré-construite.
    """
    return render(request, 'angular_index.html')
