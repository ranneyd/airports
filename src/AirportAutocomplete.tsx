/** @jsxImportSource @emotion/react */
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Autocomplete, Snackbar, TextField } from "@mui/material";
import { useEffect } from "react";
import { fetchAirportInfo } from "./fetchUtils";

// Comes from API
const MINIMUM_SEARCH_CHARACTERS = 3;
// If the search term is longer than this, it returns a CORS error. Weird API
const MAXIMUM_SEARCH_CHARACTERS = 20;

interface AirportOption {
  label: string;
  name: string;
}

interface AirportAutocompleteProps {
  placeholder: string;
  onChange: (name: string) => void;
}

export const AirportAutocomplete = React.memo<AirportAutocompleteProps>(
  ({ placeholder, onChange }) => {
    // Dropdown options. Will be constantly updated as we type and get new options from
    // API
    const [options, setOptions] = useState<AirportOption[]>([]);

    // Value of the text input. AKA the search term
    const [inputValue, setInputValue] = useState("");

    // If the api gives us an error, we'll stick it in here so we can show a little
    // toast
    const [errorMessage, setErrorMessage] = useState("");
    const onClearError = useCallback(() => setErrorMessage(""), []);

    // API loading state.
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      // Don't even bother fetching if we don't have enough characters. I know the API
      // will just reject it.
      if (inputValue.length >= MINIMUM_SEARCH_CHARACTERS) {
        // If we have too many characters, the API will reject it. That's ok; if they
        // typed 20 characters I'm sure whatever options we already have will be good
        // enough. We do this here instead of comboing with above if so that we don't
        // reset options.
        if (inputValue.length >= MAXIMUM_SEARCH_CHARACTERS) {
          return;
        }
        (async () => {
          try {
            setLoading(true);
            const airports = await fetchAirportInfo(inputValue);
            if (airports) {
              setLoading(false);
              setOptions(
                airports.map((airport) => ({
                  name: airport.name,
                  label: `${airport.name} (${airport.iata}) - ${airport.city}, ${airport.state.abbr}`,
                }))
              );
            }
          } catch (e) {
            setErrorMessage("Something went wrong.");
          }
        })();
      } else {
        // If the input value changes and is less than the minimum length, either they
        // are newly typing (which means this is going to be empty anyway) or they hit
        // backspace when they were at the minimum characters. It's weird to keep the
        // dropdown list after they backspace, so just reset it.
        setOptions([]);
      }
    }, [inputValue]);

    const loadingText = useMemo(() => {
      if (!inputValue) {
        return "Start typing an airport name or location";
      }
      if (inputValue.length < MINIMUM_SEARCH_CHARACTERS) {
        return "Type more letters to get suggestions";
      }
      if (loading) {
        return "Loading...";
      }
      return "";
    }, [inputValue, loading]);

    return (
      <div css={{ marginBottom: "1rem" }}>
        {/* Influenced by this code sample: https://mui.com/material-ui/react-autocomplete/#asynchronous-requests */}
        <Autocomplete
          // Without this, if we type something and exit without selecting, the next
          // time we open it the old options will still be there.
          onClose={() => setOptions([])}
          loading={!!loadingText}
          loadingText={loadingText}
          onInputChange={(event, newValue) => {
            setInputValue(newValue);
          }}
          options={options}
          renderInput={(params) => (
            <TextField {...params} label={placeholder} />
          )}
          onChange={(event, newValue) => onChange(newValue?.name || "")}
        />
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
