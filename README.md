# Web to Kindle

This project now targets Netlify Functions instead of Heroku.

## Netlify settings

- Base directory: leave empty
- Package directory: leave empty
- Build command: leave empty
- Publish directory: `public`
- Functions directory: `netlify/functions`

## Environment variables

- `SCREENSHOT_URL`: default page to capture when no `?url=` query string is provided
- `AWS_LAMBDA_JS_RUNTIME`: `nodejs20.x`

## Usage

The site root redirects to the screenshot function:

- `/.netlify/functions/screenshot`
- `/?url=https://example.com`
