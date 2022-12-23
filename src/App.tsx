/** @jsxImportSource @emotion/react */
import { AppBar, Container, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import { AirportAutocomplete } from "./AirportAutocomplete";
import { GoogleMap } from "./GoogleMap";

const App = () => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
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
        <div>
          <p>Find out information about the distance between two airports!</p>
          <AirportAutocomplete
            placeholder="Starting airport"
            onChange={setSource}
          />
          <AirportAutocomplete
            placeholder="Destination airport"
            onChange={setDestination}
          />
        </div>
        <div
          css={{
            flex: 1,
            display: "flex",
          }}
        >
          <GoogleMap source={source} destination={destination} />
        </div>
      </Container>
    </div>
  );
};

export default App;
