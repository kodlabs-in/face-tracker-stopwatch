'use client';
import { InfoHint } from '@/components/InfoHint';
import { ToggleSwitch } from '@/components/ToggleSwitch';

type CameraTrackerProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraStatus: 'Camera off' | 'Camera on' | 'Permission denied';
  presenceStatus: 'Present' | 'Away' | 'Detecting...';
  alertnessStatus: 'Awake' | 'Sleeping' | 'Detecting...';
  detectionActive: boolean;
  detectionLoopRunning: boolean;
  lastSeenAt: number | null;
  absenceGraceRemainingMs: number;
  sleepGraceRemainingMs: number;
  eyesClosed: boolean;
  errorMessage: string | null;
  autoModeEnabled: boolean;
  onAutoModeChange: (next: boolean) => void;
  onEnableCamera: () => Promise<void>;
  onDisableCamera: () => void;
  showDebug?: boolean;
};

function badgeClass(value: string): string {
  if (value === 'Camera on' || value === 'Present' || value === 'Running' || value === 'Awake') {
    return 'badge success';
  }

  if (value === 'Permission denied' || value === 'Away' || value === 'Sleeping') {
    return 'badge warning';
  }

  return 'badge neutral';
}

export function CameraTracker({
  videoRef,
  cameraStatus,
  presenceStatus,
  alertnessStatus,
  detectionActive,
  detectionLoopRunning,
  lastSeenAt,
  absenceGraceRemainingMs,
  sleepGraceRemainingMs,
  eyesClosed,
  errorMessage,
  autoModeEnabled,
  onAutoModeChange,
  onEnableCamera,
  onDisableCamera,
  showDebug = false
}: CameraTrackerProps) {
  const isCameraOn = cameraStatus === 'Camera on';

  return (
    <section className="card camera-tracker-card">
      <h2 className="section-title">
        Camera Tracker
        <InfoHint
          label="Camera tracker info"
          text="Uses local face and eye tracking in your browser only. Timer auto-pauses if you are away or sleeping."
        />
      </h2>

      <div className="status-grid tracker-status-grid">
        <span className={badgeClass(cameraStatus)}>Camera: {cameraStatus}</span>
        <span className={badgeClass(presenceStatus)}>Presence: {presenceStatus}</span>
        <span className={badgeClass(alertnessStatus)}>Alertness: {alertnessStatus}</span>
      </div>

      <div className="toggle-row tracker-toggle-row">
        <label className="switch-label" htmlFor="auto-mode">
          Auto camera tracking
        </label>
        <ToggleSwitch
          id="auto-mode"
          label="Auto camera tracking"
          checked={autoModeEnabled}
          onChange={onAutoModeChange}
        />
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      <div className="video-shell">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          width={640}
          height={480}
        />
      </div>

      <div className="button-row">
        {isCameraOn ? (
          <button type="button" onClick={onDisableCamera}>
            Disable Camera
          </button>
        ) : (
          <button type="button" onClick={onEnableCamera}>
            Enable Camera
          </button>
        )}
      </div>

      {showDebug ? (
        <details>
          <summary>Debug</summary>
          <ul className="debug-list">
            <li>detection loop running: {String(detectionLoopRunning)}</li>
            <li>detection active: {String(detectionActive)}</li>
            <li>eyes closed: {String(eyesClosed)}</li>
            <li>last seen timestamp: {lastSeenAt ? `${Math.round(lastSeenAt)} ms` : 'n/a'}</li>
            <li>absence grace countdown: {Math.ceil(absenceGraceRemainingMs)} ms</li>
            <li>sleep grace countdown: {Math.ceil(sleepGraceRemainingMs)} ms</li>
          </ul>
        </details>
      ) : null}
    </section>
  );
}
