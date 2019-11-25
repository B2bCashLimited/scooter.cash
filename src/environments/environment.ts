// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  apiUrl: '//test-backend.b2b.cash:9900/api/v1',   // Backend REST/RPC API url
  oauthUrl: '//test-backend.b2b.cash:9900/oauth',  // Backend oauth API url
  production: false,                               // environment flag --prod
  serverUrl: '//test.b2b.cash:9900',               // Project's build server url
  front: '//test-b2b-promo.b2b.cash/',
  client: '//scooter.cash',
  chatUrl: '//ws-test.b2b.cash',                   // Chat url
  yandexMetrikaKey: 51618332,
  gtagKey: 'UA-122916494-1',
  envName: 'dev',
  defaultLanguage: 'Ru',
  agmApiKey: 'AIzaSyBZWNUPUbZykaFHJTcG7FDScX-Ufv8wlc8', // The angular-google-maps API key
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
