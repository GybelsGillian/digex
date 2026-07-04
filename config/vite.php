<?php

use craft\helpers\App;
// 
return [
    'checkDevServer' => true,
    'devServerInternal' => 'http://localhost:3000', // Wat is de interne URL van de dev server voor Vite. Voor hot reloading
    'devServerPublic' => App::env('PRIMARY_SITE_URL') . ':3000', // Wat is de publieke URL van de dev server voor Vite. Voor hot reloading
    'manifestPath' => App::env('CRAFT_WEB_ROOT') . '/dist/.vite/manifest.json', // Waar staat het manifest bestand (eenmaal de scss gebuild is naar css, wordt in deze file de link tussen de scss en css bestanden opgeslagen)
    'serverPublic' => App::env('PRIMARY_SITE_URL') . '/dist/', // naar waar moeten de bestanden gelinkt worden eenmaal ze gebuild zijn
    'useDevServer' => App::env('ENVIRONMENT') === 'dev' || App::env('CRAFT_ENVIRONMENT') === 'dev', // Wanneer de omgeving dev is, gebruik de dev server (instelbaar in .env). Zodat hot reloading werkt
];