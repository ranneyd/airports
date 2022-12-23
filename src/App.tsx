/** @jsxImportSource @emotion/react */
import { useCallback, useState } from "react";
import * as R from "ramda";
import { AppBar, Button, Container, Toolbar, Typography } from "@mui/material";
import { AirportAutocomplete } from "./AirportAutocomplete";
import { GoogleMap } from "./GoogleMap";

let counter = 0;
// For our list in react, we need each item to have a unique ID we can use as the key.
// It doesn't matter what it is so long as it's unique. This updates a counter and
// returns the result, so it will do nicely.
const getNewId = () => ++counter;

export interface Airport {
  id: number;
  name: string;
}

const App = () => {
  const [airports, setAirports] = useState<Airport[]>([
    { name: "", id: getNewId() },
    { name: "", id: getNewId() },
  ]);
  const setAirportAtI = useCallback(
    (i: number, name: string) =>
      setAirports(R.adjust(i, (airport) => ({ ...airport, name }))),
    []
  );
  const deleteAirportAtI = useCallback(
    (i: number) =>
      setAirports((airports) =>
        airports.length > 2 ? R.remove(i, 1, airports) : airports
      ),
    []
  );
  const addAirport = useCallback(
    () => setAirports(R.append({ name: "", id: getNewId() })),
    []
  );

  return (
    <div
      css={{
        minHeight: "100vh",
        maxHeight: "100vh",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="static">
        <Toolbar css={{ display: "flex", justifyContent: "center" }}>
          <Typography variant="h5">Airports!</Typography>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="sm"
        css={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div css={{ marginBottom: "1rem" }}>
          <p>Find out information about the distance between airports!</p>
          {airports.map((airport, i) => {
            return (
              <div
                key={airport.id}
                css={{
                  display: "flex",
                  flexDirection: "row",
                  marginBottom: "1rem",
                }}
              >
                <AirportAutocomplete
                  css={{ flex: 1 }}
                  placeholder={`Airport #${i + 1}`}
                  onChange={(val) => setAirportAtI(i, val)}
                />
                {/* We can only delete airports if there are more than 2 */}
                {airports.length > 2 && (
                  <Button
                    color="error"
                    variant="contained"
                    disableElevation
                    css={{ marginLeft: "0.5rem" }}
                    onClick={() => deleteAirportAtI(i)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            );
          })}
          <Button variant="contained" onClick={addAirport}>
            Add an Airport!
          </Button>
        </div>
        <div
          css={{
            flex: 1,
            display: "flex",
          }}
        >
          <GoogleMap airports={airports} />
        </div>
      </Container>
    </div>
  );
};

export default App;
