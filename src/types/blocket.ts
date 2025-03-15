import type { BlocketAd } from 'blocket.js';

export type BlocketAccessToken = {
  user: null;
  isLoggedIn: false;
  bearerToken: string;
};

export interface BlocketResponse {
  data: BlocketAd[];
}
