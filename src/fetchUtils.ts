import axios from "axios";

import { throttle } from "lodash";

const AIR_PORT_CODES_API_KEY = process.env.REACT_APP_AIRPORT_CODES_API_KEY;
const AIR_PORT_CODES_API_SECRET =
  process.env.REACT_APP_AIRPORT_CODES_API_SECRET;

const AIR_PORT_CODES_API_HOST = "https://www.air-port-codes.com/api/v1";

interface AirportInfo {
  name: string;
  city: string;
  iata: string;
  state: {
    name: string;
    abbr: string;
  };
}

interface AirportResponse {
  airports: AirportInfo[];
}

// TODO: memoize like a badass
export const fetchAirportInfo = throttle(
  async (searchStr: string): Promise<AirportInfo[]> => {
    const response = await axios.get<AirportResponse>(
      `${AIR_PORT_CODES_API_HOST}/autocomplete`,
      {
        params: {
          term: searchStr,
          countries: "us",
          // This means only give us airports, as opposed to heliports, railways, etc
          type: "a",
        },
        headers: {
          "APC-Auth": AIR_PORT_CODES_API_KEY,
          "APC-Auth-Secret": AIR_PORT_CODES_API_SECRET,
        },
      }
    );
    return response.data.airports || [];
  },
  200,
  { leading: true, trailing: true }
);
