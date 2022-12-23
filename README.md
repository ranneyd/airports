# Airports!

This is a very simple app. You put in two or more airports, it gives you the coordinates of each, the distance in nautical miles between each airport in the path (as well as the final sum), and a google map with all the points plotted.

## Functionality

There are two or more auto-complete input fields. It will find an airport from:

- IATA Code (LAX)
- Airport Name (Los Angeles International Airport)
- City

Once it has two or more locations, it will find (and display) their exact coordinates, calculate (and display) their distance in nautical miles, and render a Google Map showing all points with a line connecting them (in order).

## Airport Search

I get the airport data from a website called [AIR-PORT-CODES](https://www.air-port-codes.com/). It has a very nice "auto-complete" endpoint.

Note: I discovered the API has a huge security flaw. It inserts user input into a raw SQL query, so it's susceptible to SQL injection. Unfortunately, this means that search strings with `'` characters in them cause the API to 500 because it breaks the query, so you cannot search for O'Hare by name (though you can, of course, find it with `ORD` or `Chicago`).

## Airport Coordinates

I find the coordinates of the airports via the Google Maps API I'm already using to display the maps. There is a geocoding API that takes an "address", and returns the latitude and longitude. The "address" does not have to be an actual address; it can be what you'd put in the search bar in Google Maps. I put the full airports names in, and Google Maps is smart enough to locate them.

## Distance

I use the [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula) to compute the distance between the points. I borrowed the code from [this excellent stack overflow answer](https://stackoverflow.com/a/27943).

## Google Maps

I followed the Google Maps API documentation very carefully. They have [an entire article](https://developers.google.com/maps/documentation/javascript/react-map) about using it with React
