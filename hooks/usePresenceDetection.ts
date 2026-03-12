'use client';

import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FaceLandmarker as MpFaceLandmarker } from '@mediapipe/tasks-vision';
import {
  createFaceLandmarker,
  getEyeClosureScores,
  hasDetectedFace,
  resetFaceDetectorSingleton
} from '@/lib/faceDetector';
import { areEyesClosed, isSleepingFromEyeClosure } from '@/lib/sleepDetection';

type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

type UsePresenceDetectionOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  gracePeriodMs?: number;
  detectionIntervalMs?: number;
  minDetectionConfidence?: number;
  eyeClosedThreshold?: number;
  sleepGraceMs?: number;
};

type UsePresenceDetectionReturn = {
  cameraEnabled: boolean;
  permissionState: PermissionState;
  detectionActive: boolean;
  personPresent: boolean;
  eyesClosed: boolean;
  isSleeping: boolean;
  lastSeenAt: number | null;
  detectionLoopRunning: boolean;
  absenceGraceRemainingMs: number;
  sleepGraceRemainingMs: number;
  cameraStatus: 'Camera off' | 'Camera on' | 'Permission denied';
  presenceStatus: 'Present' | 'Away' | 'Detecting...';
  alertnessStatus: 'Awake' | 'Sleeping' | 'Detecting...';
  errorMessage: string | null;
  enableCamera: () => Promise<void>;
  disableCamera: () => void;
};

function mapMediaError(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return 'Unable to access camera.';
  }

  switch (error.name) {
    case 'NotAllowedError':
      return 'Camera permission denied. Please allow access and try again.';
    case 'NotFoundError':
      return 'No camera device was found.';
    case 'NotReadableError':
      return 'Camera is currently in use by another application.';
    case 'OverconstrainedError':
      return 'Requested camera constraints are not supported.';
    default:
      return `Camera error: ${error.message || error.name}`;
  }
}

function isEmbeddedContext(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function usePresenceDetection(options: UsePresenceDetectionOptions): UsePresenceDetectionReturn {
  const {
    videoRef,
    gracePeriodMs = 3000,
    detectionIntervalMs = 200,
    minDetectionConfidence = 0.6,
    eyeClosedThreshold = 0.55,
    sleepGraceMs = 2000
  } = options;

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [detectionActive, setDetectionActive] = useState(false);
  const [personPresent, setPersonPresent] = useState(false);
  const [eyesClosed, setEyesClosed] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(null);
  const [detectionLoopRunning, setDetectionLoopRunning] = useState(false);
  const [absenceGraceRemainingMs, setAbsenceGraceRemainingMs] = useState(gracePeriodMs);
  const [sleepGraceRemainingMs, setSleepGraceRemainingMs] = useState(sleepGraceMs);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<MpFaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastProcessedAtRef = useRef(0);
  const eyesClosedSinceAtRef = useRef<number | null>(null);
  const detectionErrorCountRef = useRef(0);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setDetectionLoopRunning(false);
  }, []);

  const stopStream = useCallback(() => {
    if (!streamRef.current) {
      return;
    }

    for (const track of streamRef.current.getTracks()) {
      track.stop();
    }

    streamRef.current = null;
  }, []);

  const disableCamera = useCallback(() => {
    stopLoop();
    stopStream();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    eyesClosedSinceAtRef.current = null;
    setCameraEnabled(false);
    setDetectionActive(false);
    setPersonPresent(false);
    setEyesClosed(false);
    setIsSleeping(false);
    setLastSeenAt(null);
    setAbsenceGraceRemainingMs(gracePeriodMs);
    setSleepGraceRemainingMs(sleepGraceMs);
  }, [gracePeriodMs, sleepGraceMs, stopLoop, stopStream, videoRef]);

  const runDetectionLoop = useCallback(() => {
    if (!cameraEnabled || !detectionActive || !videoRef.current || !detectorRef.current) {
      stopLoop();
      return;
    }

    const video = videoRef.current;

    const tick = () => {
      if (!cameraEnabled || !detectionActive || !videoRef.current || !detectorRef.current) {
        stopLoop();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
      const now = performance.now();

      if (now - lastProcessedAtRef.current < detectionIntervalMs) {
        return;
      }
      lastProcessedAtRef.current = now;

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0 || video.paused || video.ended) {
        return;
      }

      let result: ReturnType<MpFaceLandmarker['detectForVideo']>;
      try {
        result = detectorRef.current.detectForVideo(video, now);
        detectionErrorCountRef.current = 0;
      } catch {
        detectionErrorCountRef.current += 1;
        if (detectionErrorCountRef.current === 1) {
          setErrorMessage('Detection is temporarily unavailable. Keep the camera active and try again.');
        }
        return;
      }

      const faceDetected = hasDetectedFace(result);

      if (faceDetected) {
        setLastSeenAt(now);
        setPersonPresent(true);
        setAbsenceGraceRemainingMs(gracePeriodMs);

        const eyeScores = getEyeClosureScores(result);
        const currentlyEyesClosed = areEyesClosed(eyeScores, eyeClosedThreshold);
        setEyesClosed(currentlyEyesClosed);

        if (currentlyEyesClosed) {
          if (eyesClosedSinceAtRef.current === null) {
            eyesClosedSinceAtRef.current = now;
            setSleepGraceRemainingMs(sleepGraceMs);
            setIsSleeping(false);
          } else {
            const sleeping = isSleepingFromEyeClosure(eyesClosedSinceAtRef.current, now, sleepGraceMs);
            setIsSleeping(sleeping);
            setSleepGraceRemainingMs(Math.max(0, sleepGraceMs - (now - eyesClosedSinceAtRef.current)));
          }
        } else {
          eyesClosedSinceAtRef.current = null;
          setIsSleeping(false);
          setSleepGraceRemainingMs(sleepGraceMs);
        }

        return;
      }

      eyesClosedSinceAtRef.current = null;
      setEyesClosed(false);
      setIsSleeping(false);
      setSleepGraceRemainingMs(sleepGraceMs);

      setLastSeenAt((prev) => {
        if (prev === null) {
          setPersonPresent(false);
          setAbsenceGraceRemainingMs(gracePeriodMs);
          return null;
        }

        const elapsedAway = now - prev;
        setAbsenceGraceRemainingMs(Math.max(0, gracePeriodMs - elapsedAway));

        if (elapsedAway > gracePeriodMs) {
          setPersonPresent(false);
        }

        return prev;
      });
    };

    if (rafRef.current === null) {
      setDetectionLoopRunning(true);
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [
    cameraEnabled,
    detectionActive,
    detectionIntervalMs,
    eyeClosedThreshold,
    gracePeriodMs,
    sleepGraceMs,
    stopLoop,
    videoRef
  ]);

  const enableCamera = useCallback(async () => {
    setErrorMessage(null);

    if (!window.isSecureContext) {
      setPermissionState('unavailable');
      setErrorMessage('Camera requires a secure context (HTTPS or localhost).');
      return;
    }

    // Block camera start when app is embedded to reduce clickjacking/embed abuse risk.
    if (isEmbeddedContext()) {
      setPermissionState('unavailable');
      setErrorMessage('Camera is blocked in embedded views. Open this app in a direct tab.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState('unavailable');
      setErrorMessage('Camera access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;
      setCameraEnabled(true);
      setPermissionState('granted');

      const video = videoRef.current;
      if (!video) {
        setErrorMessage('Video element is not ready yet. Please retry.');
        disableCamera();
        return;
      }

      video.srcObject = stream;
      await video.play();

      const detector = await createFaceLandmarker({ minDetectionConfidence });
      detectorRef.current = detector;
      detectionErrorCountRef.current = 0;
      setDetectionActive(true);
      runDetectionLoop();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setPermissionState('denied');
      }
      setErrorMessage(
        error instanceof DOMException
          ? mapMediaError(error)
          : 'Face detection model failed to load. Check model configuration and try again.'
      );
      disableCamera();
    }
  }, [disableCamera, minDetectionConfidence, runDetectionLoop, videoRef]);

  useEffect(() => {
    if (cameraEnabled && detectionActive) {
      runDetectionLoop();
    }
  }, [cameraEnabled, detectionActive, runDetectionLoop]);

  useEffect(() => {
    if (!navigator.permissions?.query) {
      return;
    }

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const syncPermission = () => {
      if (cancelled || !permissionStatus) {
        return;
      }

      if (permissionStatus.state === 'denied') {
        setPermissionState('denied');
        setErrorMessage('Camera permission was revoked. Enable it again to continue.');
        disableCamera();
      } else if (permissionStatus.state === 'granted') {
        setPermissionState('granted');
      } else {
        setPermissionState('prompt');
      }
    };

    navigator.permissions
      .query({ name: 'camera' as PermissionName })
      .then((status) => {
        if (cancelled) {
          return;
        }
        permissionStatus = status;
        syncPermission();
        status.onchange = syncPermission;
      })
      .catch(() => {
        // Ignore unsupported/blocked Permissions API edge cases.
      });

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [disableCamera]);

  useEffect(() => {
    const stopOnExit = () => {
      disableCamera();
    };

    window.addEventListener('pagehide', stopOnExit);
    window.addEventListener('beforeunload', stopOnExit);

    return () => {
      window.removeEventListener('pagehide', stopOnExit);
      window.removeEventListener('beforeunload', stopOnExit);
    };
  }, [disableCamera]);

  useEffect(() => {
    return () => {
      stopLoop();
      stopStream();

      if (detectorRef.current && typeof detectorRef.current.close === 'function') {
        detectorRef.current.close();
      }

      detectorRef.current = null;
      resetFaceDetectorSingleton();
    };
  }, [stopLoop, stopStream]);

  const cameraStatus = useMemo(() => {
    if (permissionState === 'denied') {
      return 'Permission denied';
    }

    return cameraEnabled ? 'Camera on' : 'Camera off';
  }, [cameraEnabled, permissionState]);

  const presenceStatus = useMemo(() => {
    if (!cameraEnabled || !detectionActive) {
      return 'Detecting...';
    }

    return personPresent ? 'Present' : 'Away';
  }, [cameraEnabled, detectionActive, personPresent]);

  const alertnessStatus = useMemo(() => {
    if (!cameraEnabled || !detectionActive || !personPresent) {
      return 'Detecting...';
    }

    return isSleeping ? 'Sleeping' : 'Awake';
  }, [cameraEnabled, detectionActive, personPresent, isSleeping]);

  return {
    cameraEnabled,
    permissionState,
    detectionActive,
    personPresent,
    eyesClosed,
    isSleeping,
    lastSeenAt,
    detectionLoopRunning,
    absenceGraceRemainingMs,
    sleepGraceRemainingMs,
    cameraStatus,
    presenceStatus,
    alertnessStatus,
    errorMessage,
    enableCamera,
    disableCamera
  };
}
