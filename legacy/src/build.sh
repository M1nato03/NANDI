#!/bin/sh
cd "$(dirname "$0")"
{ cat shell.html; printf '\n<style>\n'; cat extra.css; printf '\n</style>\n<script>\n'; cat content.js; printf '\n'; cat cases.js; printf '\n'; cat puzzles.js; printf '\n'; cat lessons_gita.js; printf '\n'; cat lessons_charaka.js; printf '\n'; cat app_a.js; printf '\n'; cat learn_ui.js; printf '\n'; cat pz_ui.js; printf '\n'; cat app_z.js; printf '\n</script>\n'; } > ../prime-pocket.html
{ printf '<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">'; cat ../prime-pocket.html; printf '</body></html>'; } > ../preview.html
wc -c ../prime-pocket.html
