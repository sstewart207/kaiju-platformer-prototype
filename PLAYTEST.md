# DualSense playtest

## Latest feedback and revised build

October 27 update: Shane reports testing a physical DualSense on October 26 and says it works. Browser, connection type and individual checklist results were not recorded, so the USB/Bluetooth-specific rows below remain unverified. Another movement-feel pass is optional; no new drift problem was reported.

The user reported disliking the floating world, repeatedly falling through gaps, and having to counter-steer with diagonal inputs. The revised course uses continuous grass terrain, low terraces and wide walkable connections. Its camera is aligned with movement, velocity look-ahead is removed, stick filtering is stronger, and grounded idle movement is locked against slope correction.

Retest first: leave the stick untouched for ten seconds; move right and release without holding any other direction; then walk the main route without jumping. Stepping off the path must land on grass. These software checks pass with synthetic input; the user's actual USB/Bluetooth controller behavior still needs confirmation.

Open https://sstewart207.github.io/kaiju-platformer-prototype/ on the Chromebook. No account or installation is required. For local development on the laptop, use http://127.0.0.1:4173/ while its preview server is running, or launch `Start Game.cmd` and use the URL it opens.

Connect the DualSense over USB or pair it through Windows Bluetooth. Focus the game page and press a controller button. Chrome or Edge is the suggested test browser. The game relies on the browser's standard Gamepad mapping; no remapping utility is required by the game. If another program is translating the controller, record that in the results.

| Control | Action |
| --- | --- |
| Left stick / D-pad | Move; stick tilt controls speed |
| Cross (✕) | Jump; hold for a higher jump. Select in menus |
| Options | Pause / resume |
| D-pad up/down or left stick up/down | Select Resume or Restart in the pause menu |
| Circle (○) | Return from pause to the game |
| Triangle (△) | Restart the course |

Release the stick/buttons after pausing, restarting or reconnecting before pressing the next action. This prevents held inputs from clicking through menus or moving the character unexpectedly.

## What to check

- [ ] Start from the title screen with Cross; holding it must not immediately jump in-game.
- [ ] Move in every direction using both the left stick and D-pad. Check slow movement, full-speed diagonals and drift while untouched.
- [ ] Compare a short Cross tap with a held jump. Land repeatedly and change direction in the air.
- [ ] Ride the moving platform and finish the course with the controller.
- [ ] Pause with Options, select both menu buttons, resume with Cross/Circle/Options, restart with Triangle, and select Play Again after finishing.
- [ ] Disconnect during movement: the game must pause. Reconnect, release controls, and resume; no stuck movement or automatic menu confirmation.
- [ ] Switch to keyboard and back. Controls shown on screen should follow the last input used.

## Results

Automated status: controller decoding/dead zones/button edges and browser input/menu/disconnect checks pass using synthetic Gamepad snapshots. Physical USB and Bluetooth playtests are **pending**.

| Field | USB | Bluetooth |
| --- | --- | --- |
| Tester / date | Pending | Pending |
| Browser / version | | |
| Controller recognized | | |
| Completed course | | |
| Jump and camera feel | | |
| Buttons / menus correct | | |
| Disconnect / reconnect | | |
| Other controller software running | | |
| Problems / reproduction steps | | |
