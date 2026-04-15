# Project Rules & Instructions

## Asset Preservation
- **CRITICAL**: Never delete or rename `public/epiano.sf2`. This is a custom high-quality soundfont required for the electric piano playback features.
- **CRITICAL**: Never delete or rename `public/lyrics.txt`. This contains the synchronized lyrics data for the application.

## Development Guidelines
- Always ensure that MIDI playback logic in `src/App.tsx` prioritizes loading `public/epiano.sf2` before falling back to CDN or default soundfonts.
- Maintain the "easter egg" status of the song quote in `README.md` and the specific song logic in `src/App.tsx`. Do not remove the quote or the logic that enables lyrics for specific MIDI files.
