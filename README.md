# Big Red

A browser-based physics game. A large red ball (Big Red) chases 21 small coloured balls across procedurally generated terrain. When the countdown reaches zero, a finish gate opens on the right side of the world. The first team to get all its surviving members through the gate escapes. If Big Red reaches the gate before any team completes, Big Red wins.

## Gameplay

- Small balls have a "bicycle engine" — rotational energy drives them forward. They never fully stop.
- Big Red rolls faster and grows the longer the chase goes on.
- The finish gate closes over time; stragglers can be cut off by the closing doors.
- If no team fully escapes before the gate closes, the result is a draw.

**Keyboard shortcuts**

| Key   | Action                          |
|-------|---------------------------------|
| Space | Start / restart the game        |
| P     | Pause / unpause Big Red         |
| O     | Toggle slow-motion for all balls|

## Development

Requires Node.js. Uses [Parcel](https://parceljs.org/) as the bundler and Sass for styles.

```bash
npm install
npm run dev      # start dev server with hot reload
npm run build    # production build → dist/
```

## Project structure

```
src/
  game.js          Main game loop, physics, rendering
  index.js         Entry point — wires canvas and UI refs
  styles/
    main.scss      Root stylesheet (imports all partials)
    _variables.scss  CSS custom properties
    _base.scss       Reset and global styles
    _layout.scss     App shell, scoreboard, overlays
    _game.scss       Health bars and team scoreboard
index.html
```

## License

MIT — see [LICENSE.md](LICENSE.md).
