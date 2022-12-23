/** @jsxImportSource @emotion/react */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Status, Wrapper } from "@googlemaps/react-wrapper";
import {
  Alert,
  CircularProgress,
  Snackbar,
  Typography,
  useTheme,
} from "@mui/material";
import { getDistance } from "./haversine";
import { isUndefined } from "lodash";

let geocoder: google.maps.Geocoder | undefined;
const getGeoCoder = () => {
  if (!geocoder) {
    geocoder = new google.maps.Geocoder();
  }
  return geocoder;
};

interface Coordinates {
  lat: number;
  lng: number;
}

interface GoogleMapProps {
  source: string;
  destination: string;
}

const InternalGoogleMap = React.memo<GoogleMapProps>(
  ({ source, destination }) => {
    const { palette } = useTheme();
    // Map-rendering stuff
    const divRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<google.maps.Map>();

    useLayoutEffect(() => {
      if (divRef.current && !map) {
        setMap(new window.google.maps.Map(divRef.current));
      }
    }, [map]);

    const srcMarkerRef = useRef<google.maps.Marker | null>(null);
    const destMarkerRef = useRef<google.maps.Marker | null>(null);
    const routeLineRef = useRef<google.maps.Polyline | null>(null);

    // Logic/state
    const [srcPos, setSrcPos] = useState<Coordinates>();
    const [destPos, setDestPos] = useState<Coordinates>();

    const [errorMessage, setErrorMessage] = useState("");
    const onClearError = useCallback(() => setErrorMessage(""), []);

    // I'm putting this logic in its own function and doing two useEffects below because
    // this logic can be agnostic of whether it's source or destination, and it doesn't
    // make sense to recompute one if only the other changes.
    const setPosForAddress = useCallback(
      // "address" is really just a google maps search term. Google should be able to
      // figure out all our airport names.
      async (address: string, setter: (pos: Coordinates) => void) => {
        const geocoder = getGeoCoder();
        const res = await geocoder.geocode({
          address,
        });
        if (!res.results.length) {
          setErrorMessage(`Could not find the position of "${address}".`);
          return;
        }
        const locat = res.results[0].geometry.location;
        const pos = {
          lat: locat.lat(),
          lng: locat.lng(),
        };
        setter(pos);
      },
      []
    );

    useEffect(() => {
      setPosForAddress(source, setSrcPos);
    }, [setPosForAddress, source]);
    useEffect(() => {
      setPosForAddress(destination, setDestPos);
    }, [destination, setPosForAddress]);

    const distance = useMemo(
      () =>
        srcPos &&
        destPos &&
        getDistance(srcPos.lat, srcPos.lng, destPos.lat, destPos.lng),
      [srcPos, destPos]
    );

    // Whenever the source or destination change, or once we've first created the map,
    // draw all the things.
    useEffect(() => {
      if (srcPos && destPos && map) {
        // https://stackoverflow.com/a/19304625
        const bounds = new google.maps.LatLngBounds();

        // Removes old marker, if there was one
        srcMarkerRef.current?.setMap(null);
        srcMarkerRef.current = new google.maps.Marker({
          map,
          position: srcPos,
        });

        bounds.extend(srcPos);

        // Same for dest
        destMarkerRef.current?.setMap(null);
        destMarkerRef.current = new google.maps.Marker({
          map,
          position: destPos,
        });

        bounds.extend(destPos);

        map.fitBounds(bounds);

        // Remove the old line, if it exists
        routeLineRef.current?.setMap(null);

        routeLineRef.current = new google.maps.Polyline({
          path: [srcPos, destPos],
          strokeColor: palette.primary.main,
          // https://developers.google.com/maps/documentation/javascript/symbols#arrows
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              },
              offset: "100%",
            },
          ],
          map,
        });
      }
    }, [srcPos, destPos, map, palette.primary]);

    return (
      <div
        css={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div>
          {(
            [
              [source, srcPos],
              [destination, destPos],
            ] as const
          ).map(([name, coords], i) => (
            <div key={`${name}_${i}`}>
              {coords ? (
                <>
                  <Typography variant="h6">{name}</Typography>
                  <p>
                    {coords.lat} Latitude, {coords.lng} Longitude
                  </p>
                </>
              ) : (
                "Loading..."
              )}
            </div>
          ))}
          <Typography variant="h6">Distance</Typography>
          <p>
            {isUndefined(distance)
              ? "Loading..."
              : `~${Math.round(distance).toLocaleString(
                  "en-us"
                )} Nautical Miles`}
          </p>
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
  }
);

const GoogleMapWrapper = React.memo<GoogleMapProps>(
  ({ source, destination }) => {
    if (!source || !destination) {
      return (
        <Typography variant="h6" css={{ textAlign: "center" }}>
          Enter your airports to see a pretty map!
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
                <Alert severity="error">
                  Could not load Google Maps api :(
                </Alert>
              );
            }
            return <CircularProgress />;
          }}
        >
          <InternalGoogleMap source={source} destination={destination} />
        </Wrapper>
      </div>
    );
  }
);

export const GoogleMap = GoogleMapWrapper;
