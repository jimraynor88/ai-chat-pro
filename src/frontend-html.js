import { CSS } from "./frontend-css.js";
import { CSS2 } from "./frontend-css-2.js";
import { getHtmlBody } from "./frontend-body.js";

export function getHtmlHead(t) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0b0d10">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230b0d10'/%3E%3Crect x='12' y='14' width='40' height='28' rx='8' fill='%23f6821f'/%3E%3Cpath d='M22 41l-4 9 11-9z' fill='%23f6821f'/%3E%3Ccircle cx='24' cy='28' r='3' fill='%230b0d10'/%3E%3Ccircle cx='32' cy='28' r='3' fill='%230b0d10'/%3E%3Ccircle cx='40' cy='28' r='3' fill='%230b0d10'/%3E%3C/svg%3E"><title>${t.app_name}</title>
<style>${CSS}</style>
<style>${CSS2}</style>
</head>
${getHtmlBody(t)}
`;
}
