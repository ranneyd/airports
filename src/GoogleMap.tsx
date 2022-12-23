/** @jsxImportSource @emotion/react */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as R from "ramda";
import { Status, Wrapper } from "@googlemaps/react-wrapper";
import {
  Alert,
  CircularProgress,
  Snackbar,
  Typography,
  useTheme,
} from "@mui/material";
import { getDistance } from "./haversine";
import { memoize } from "lodash";
import { Airport } from "./App";
import { TurnLeft, TurnRight } from "@mui/icons-material";

let geocoder: google.maps.Geocoder | undefined;
const getLocation = memoize(async (address: string) => {
  if (!geocoder) {
    geocoder = new google.maps.Geocoder();
  }
  console.log("address", address);
  const res = await geocoder.geocode({
    address,
  });
  if (!res.results.length) {
    throw new Error(`Could not find the position of "${address}".`);
  }
  const locat = res.results[0].geometry.location;
  const pos = {
    lat: locat.lat(),
    lng: locat.lng(),
  };
  return pos;
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface PosItem {
  coordinates: Coordinates;
  distanceToPrevious: number | null;
}

interface GoogleMapProps {
  airports: Airport[];
}

const InternalGoogleMap = React.memo<GoogleMapProps>(({ airports }) => {
  const { palette } = useTheme();
  // Map-rendering stuff
  const divRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const routeLineRef = useRef<google.maps.Polyline | null>(null);

  useLayoutEffect(() => {
    if (divRef.current && !map) {
      setMap(new window.google.maps.Map(divRef.current));
    }
  }, [map]);

  // This will be a map of airport IDs (the ones that determine the order in the list)
  // and google maps markers.
  const markerMapRef = useRef<Record<string, google.maps.Marker>>({});

  // Logic/state
  const [posMap, setPosMap] = useState<Record<string, PosItem>>({});

  const [errorMessage, setErrorMessage] = useState("");
  const onClearError = useCallback(() => setErrorMessage(""), []);

  useMemo(() => {
    // We'll fetch them all at once, even if only one changes, but the function is
    // memoized so nbd
    (async () => {
      const map: Record<string, PosItem> = {};
      // Get all the locations
      await Promise.all(
        airports.map(async (airport) => {
          if (!airport.name) {
            return;
          }
          try {
            const pos = await getLocation(airport.name);
            map[airport.id] = { coordinates: pos, distanceToPrevious: null };
          } catch (e) {
            setErrorMessage((e as Error).message);
          }
        })
      );

      // Calculate all the distances.
      let prevPos: Coordinates | undefined;
      for (const airport of airports) {
        const pos = map[airport.id].coordinates;
        if (prevPos) {
          const distance = getDistance(
            prevPos.lat,
            prevPos.lng,
            pos.lat,
            pos.lng
          );
          map[airport.id].distanceToPrevious = distance;
        }
        prevPos = pos;
      }
      setPosMap(map);
    })();
  }, [airports]);

  useEffect(() => {
    if (map) {
      // https://stackoverflow.com/a/19304625
      const bounds = new google.maps.LatLngBounds();

      for (const marker of R.values(markerMapRef.current)) {
        marker.setMap(null);
      }

      for (const id of R.keys(posMap)) {
        const { coordinates } = posMap[id];
        const newMarker = new google.maps.Marker({
          map,
          position: coordinates,
        });
        markerMapRef.current[id] = newMarker;
        bounds.extend(coordinates);
      }

      map.fitBounds(bounds);

      // Remove the old line, if it exists
      routeLineRef.current?.setMap(null);

      routeLineRef.current = new google.maps.Polyline({
        path: airports.reduce((items, { id }) => {
          if (posMap[id]) {
            return [...items, posMap[id].coordinates];
          }
          return items;
        }, [] as Coordinates[]),
        strokeColor: palette.primary.main,
        // https://developers.google.com/maps/documentation/javascript/symbols#arrows
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            },
            offset: "100%",
            // https://stackoverflow.com/a/45035435
            repeat: "50px",
          },
        ],
        map,
      });
    }
  }, [airports, map, palette, posMap]);

  const totalDistance = useMemo(() => {
    let distance = 0;
    for (const item of R.values(posMap)) {
      distance += item.distanceToPrevious || 0;
    }
    return distance;
  }, [posMap]);

  return (
    <div
      css={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        css={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          marginBottom: "1rem",
        }}
      >
        {airports.map((airport) => {
          // Shouldn't be possible, but best to be safe.
          if (!posMap[airport.id]) {
            return <React.Fragment key={airport.id} />;
          }
          const { coordinates, distanceToPrevious } = posMap[airport.id];

          return (
            <React.Fragment key={airport.id}>
              {!R.isNil(distanceToPrevious) && (
                <Typography
                  variant="h6"
                  css={{
                    margin: "1rem 0",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <TurnLeft
                    css={{ transform: "rotate(180deg)", fontSize: "2rem" }}
                  />
                  ~{Math.round(distanceToPrevious).toLocaleString("en-us")}{" "}
                  Nautical Miles
                  <TurnRight
                    css={{ transform: "rotate(90deg)", fontSize: "2rem" }}
                  />
                </Typography>
              )}
              <Typography variant="h6">{airport.name}</Typography>
              <div>
                {posMap[airport.id] ? (
                  <>
                    {coordinates.lat} Latitude, {coordinates.lng} Longitude
                  </>
                ) : (
                  "Loading..."
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div css={{ margin: "1rem 0" }}></div>
        <Typography variant="h4">Total Journey:</Typography>
        <Typography variant="h6">
          ~{Math.round(totalDistance).toLocaleString("en-us")} Nautical Miles
        </Typography>
      </div>
      <div ref={divRef} id="map" css={{ height: "300px", width: "100%" }} />
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={1000}
        onClose={onClearError}
      >
        <Alert severity="error" variant="filled" onClose={onClearError}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
});

const GoogleMapWrapper = React.memo<GoogleMapProps>(({ airports }) => {
  // We have a data contract that says we'll have at least two items in this array. But
  // it's better safe than sorry.
  if (!(airports[0]?.name && airports[1]?.name)) {
    return (
      <Typography variant="h6" css={{ textAlign: "center" }}>
        Enter some airports to see a pretty map!
      </Typography>
    );
  }
  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        flex: 1,
      }}
    >
      <Wrapper
        apiKey={process.env.REACT_APP_GMAPS_API_KEY || ""}
        render={(status) => {
          if (status === Status.FAILURE) {
            return (
              <Alert severity="error">Could not load Google Maps api :(</Alert>
            );
          }
          return <CircularProgress />;
        }}
      >
        <InternalGoogleMap airports={airports} />
      </Wrapper>
    </div>
  );
});

export const GoogleMap = GoogleMapWrapper;
