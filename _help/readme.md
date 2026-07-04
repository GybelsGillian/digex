1. Start een eigen project vanaf de template 
2. Pas de inhoud van `/ddev/config.yaml` aan met een unieke waarde bij `name:`
3. Controleer - in de menubalk - of Docker Desktop aan staat 
4. Voer `ddev composer install` uit
5. Voer `ddev npm install` uit
6. Voer `ddev craft setup` uit om de Craft CMS installatie te voltooien
    1. Kies steeds voor de default voorgestelde antwoorden
7. Start het project op via `ddev launch` of `ddev restart`
8. Voeg aan de `.env` toe:
```env
CRAFT_ENVIRONMENT=dev
CRAFT_DEV_MODE=true
```
10. Schrijf je **JavaScript** en **scss** in de `/src/*` folder
    1. Importeer de scss in het javascript bestand dat je laadt in de template
11. In de head van de template laad je het **JavaScript** bestand uit de source folder `{{ craft.vite.script('src/js/app.js', false) }}`
