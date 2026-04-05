# Big Red

A browser-based physics game. A large red ball (Big Red) rolls across procedurally generated terrain, hunting 21 small coloured balls split into teams. When the countdown expires a finish gate opens on the right side of the world. The team with the most survivors through the gate wins — ties are broken by total health or fastest crossing time, depending on your settings.

[Try it out](https://bigred.robbutz.com)

## Gameplay

**The small balls**

- Each ball has a "bicycle engine" — rotational energy drives it forward. They never fully stop.
- Balls climb hills automatically, spinning harder on steep slopes to avoid getting stuck.
- Each ball has individual health. Sustained contact with Big Red drains it; a ball that reaches zero is eliminated.
- Balls are organised into teams. A team's row in the scoreboard dims and strikes through when every member has been eliminated.

**Big Red**

- Big Red rolls relentlessly from left to right, crushing any small ball he touches.
- Every kill makes him slightly bigger (and harder to dodge).
- He bounces realistically off the terrain, the ceiling, and the small balls — collisions use proper mass-ratio physics so he barely flinches.
- When a small ball is eliminated, Big Red gets a brief uphill spin boost to keep the pressure on.

**The finish gate**

- When the timer hits zero, a gate appears on the right edge of the world.
- The doors close over roughly 12 seconds. Balls that make it through before the doors shut are safe; stragglers are cut off.
- Once the gate is fully closed, the winning team is declared:
  - The team with the most survivors wins.
  - **Tiebreaker — Highest health:** if survivor counts are equal, the team with the greatest combined remaining health wins.
  - **Tiebreaker — Fastest through gate:** the team whose last member crossed earliest wins.
- If no ball makes it through, Big Red wins.

**Start screen options**

| Option         | Choices                                     | Effect                                                                      |
| -------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| Length of game | 2 / 3 / 5 / 10 / 20 min                     | How long before the gate opens                                              |
| Landscape      | Rocky / Average / Gentle                    | Terrain roughness — affects how many hills there are and how steep they get |
| Tiebreaker     | Highest total health / Fastest through gate | How ties on survivor count are broken                                       |

**Controls**

| Input             | Action                                     |
| ----------------- | ------------------------------------------ |
| Play Again button | Return to start screen after a game ends   |
| Space             | Return to start screen (keyboard shortcut) |
| P                 | Pause / unpause Big Red                    |
| O                 | Toggle slow-motion for all balls           |

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
  audio.js         Web Audio engine — synthesized sounds and sample playback
  sounds.js        Base64-encoded audio samples (loaded async at startup)
  index.js         Entry point — wires canvas, UI refs, and start-screen controls
  styles/
    main.scss        Root stylesheet (imports all partials)
    _variables.scss  CSS custom properties
    _base.scss       Reset and global styles
    _layout.scss     App shell, overlays, start/end screens
    _game.scss       Health bars and team scoreboard
index.html
```

## License

MIT — see [LICENSE.md](LICENSE.md).
