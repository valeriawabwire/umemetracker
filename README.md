# Umeme Tracker

A web app for Kenyan households to track KPLC prepaid tokens, calculate real daily electricity use from meter readings, predict when units will run out, and see which appliances and charges cost the most.

Built for the Intro to Web Development semester project with plain HTML, CSS and JavaScript (no frameworks) and a Django + SQLite backend.

## Run it locally

    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py runserver

Then open http://127.0.0.1:8000

See PROJECT_GUIDE.md for how the code works.
