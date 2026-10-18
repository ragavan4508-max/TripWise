# TripWise – Smart Travel Planner

## Project Overview
TripWise is a travel-planning web app where users can explore 158 destinations from around the world, search and filter them, sort the results, open a destination to see its details, and add places to a personal trip (itinerary). The itinerary can be viewed and edited on the "My Trip" page and stays saved after a refresh. The app shows clear loading, empty and error states, and works on desktop and mobile.

- Live site: https://ragavan4508-max.github.io/TripWise/

## Chosen Track
**Frontend Development**

## Technologies Used
- HTML5
- CSS3 (Grid, Flexbox, responsive design)
- JavaScript (ES6, fetch API, async/await)
- Browser localStorage (for saving the itinerary)

## API Details
No API keys are needed.

| API | Purpose | Endpoint |
|---|---|---|
| Open-Meteo Geocoding API | Destination data: name, country, region, coordinates, population, elevation, time zone | `https://geocoding-api.open-meteo.com/v1/search` |
| Open-Meteo Forecast API | Current weather for a destination | `https://api.open-meteo.com/v1/forecast` |
| Wikipedia REST API | Short description of a destination | `https://en.wikipedia.org/api/rest_v1/page/summary/{title}` |
| Flagcdn | Country flag images | `https://flagcdn.com/w320/{code}.png` |

The 158 destinations are fetched from the Open-Meteo Geocoding API when the site first loads. Weather data is by Open-Meteo.com.

## Setup / Run Instructions
1. Clone the repository:
   ```
   git clone https://github.com/ragavan4508-max/TripWise
   ```
2. Open the project folder in VS Code.
3. Run `index.html` with the **Live Server** extension (right-click → Open with Live Server), or open `index.html` directly in a browser.

An internet connection is required. No installation or build step is needed.

## Database Configuration
Not applicable (Frontend track). Itinerary data is saved in the browser's localStorage.
