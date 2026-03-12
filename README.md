# Focus Timer

Built BY Kodlabs  
Website: [kodlabs.in](https://kodlabs.in)

Focus Timer is a browser-based study stopwatch that combines manual controls with webcam-driven automation.  
It helps students keep genuine focus time by running the timer only when they are present and alert.

## Features
- Lets you set a starting stopwatch value (`HH:MM:SS`)
- Supports manual `Start`, `Pause`, and `Reset`
- Supports hands-free study tracking in auto mode (no repeated button taps needed)
- Uses webcam presence detection to auto control timer behavior
- Detects prolonged eye closure and triggers a buzzer alert
- Adds parental lock to protect `Pause` and `Disable Camera` actions

## Why This Is Useful for Students
- Measures real study time more accurately by counting only attentive time.
- Reduces distraction from manual timer control during study sessions.
- Encourages active focus because timer pauses when student is away/sleepy.
- Helps parents/guardians enforce sessions using the parental lock.

## How It Works

### 1) Stopwatch Engine
- The stopwatch is timestamp-based (not plain interval counting).
- It tracks elapsed time accurately using current time deltas.
- `Reset` returns to the latest configured initial value.

### 2) Camera + Presence Tracking
- On `Enable Camera`, the app asks for webcam permission.
- Frames are processed locally using **MediaPipe Tasks Vision (Face Landmarker)**.
- If a face is detected, user is treated as **Present**.
- If no face is detected continuously beyond grace period (default `3000ms`), user becomes **Away**.

### 3) Sleep/Eye-Closure Detection
- Uses eye-blink blendshape scores from face landmarks.
- If eyes remain closed continuously for configured sleep grace (default `2000ms`), status becomes **Sleeping**.
- In auto mode, timer runs only when user is `Present` and `Awake`.

### 4) Buzzer Alert
- If sleeping state continues for `10 seconds`, a siren-style buzzer starts.
- `Stop Buzzer` silences it.
- Buzzer resets when user is alert again.

### 5) Parental Lock
- You can configure a password and enable lock mode.
- When enabled, `Pause` and `Disable Camera` require password confirmation.
- This is a frontend usability lock (not enterprise-grade tamper-proof security).

## Privacy and Safety
- All camera/video processing happens in the browser.
- No video frames are uploaded to backend services.
- No identity recognition is implemented.
- Eye-closure is a heuristic, not medical diagnosis.

## UI Behavior (Responsive)
- Designed for desktop and mobile.
- On small screens, stopwatch and camera stay in the main focus area.
- Secondary controls (parental lock, buzzer settings, advanced section) are available via sidebar/drawer.

## Tech Stack
- Next.js (App Router)
- TypeScript
- React client components
- MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- Vitest for tests

## Project Structure
- `app/page.tsx` — main page and UI orchestration
- `components/Stopwatch.tsx` — stopwatch UI
- `components/CameraTracker.tsx` — camera UI and status
- `hooks/useStopwatch.ts` — stopwatch logic
- `hooks/usePresenceDetection.ts` — camera + presence + sleep detection loop
- `lib/faceDetector.ts` — MediaPipe landmarker initialization
- `lib/sleepDetection.ts` — eye closure/sleep heuristics
- `lib/formatTime.ts`, `lib/parseTimeInput.ts` — time helpers

## Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Scripts
```bash
npm run dev
npm run build
npm run start
npm run test
```

## Optional Environment Variable
- `NEXT_PUBLIC_FACE_LANDMARKER_MODEL_URL`  
  Use your own hosted `face_landmarker.task` model URL.

## Known Limitations
- Detection quality depends on lighting, camera angle, and occlusion.
- Background tabs/mobile OS power policies may throttle camera/frame processing.
- Browser autoplay policies may block audio until user interaction.
