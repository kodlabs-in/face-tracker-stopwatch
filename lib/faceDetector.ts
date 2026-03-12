import type {
  Category,
  Classifications,
  FaceLandmarker as MpFaceLandmarker,
  FaceLandmarkerResult
} from '@mediapipe/tasks-vision';

export type FaceLandmarkerConfig = {
  modelAssetPath?: string;
  minDetectionConfidence?: number;
  minPresenceConfidence?: number;
  minTrackingConfidence?: number;
};

const DEFAULT_MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';
const DEFAULT_WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';

let landmarkerPromise: Promise<MpFaceLandmarker> | null = null;

export async function createFaceLandmarker(config: FaceLandmarkerConfig = {}): Promise<MpFaceLandmarker> {
  if (landmarkerPromise) {
    return landmarkerPromise;
  }

  landmarkerPromise = (async () => {
    const vision = await import('@mediapipe/tasks-vision');
    const resolver = await vision.FilesetResolver.forVisionTasks(DEFAULT_WASM_ROOT);

    return vision.FaceLandmarker.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath: config.modelAssetPath ?? process.env.NEXT_PUBLIC_FACE_LANDMARKER_MODEL_URL ?? DEFAULT_MODEL_PATH,
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      minFaceDetectionConfidence: config.minDetectionConfidence ?? 0.6,
      minFacePresenceConfidence: config.minPresenceConfidence ?? 0.6,
      minTrackingConfidence: config.minTrackingConfidence ?? 0.5
    });
  })();

  return landmarkerPromise;
}

function findBlendshape(categories: Category[], name: string): number {
  const item = categories.find((category) => category.categoryName === name);
  return item?.score ?? 0;
}

function getPrimaryBlendshapes(result: FaceLandmarkerResult): Classifications | null {
  return result.faceBlendshapes[0] ?? null;
}

export function hasDetectedFace(result: FaceLandmarkerResult): boolean {
  return result.faceLandmarks.length > 0;
}

export function getEyeClosureScores(result: FaceLandmarkerResult): { leftEyeClosedScore: number; rightEyeClosedScore: number } {
  const blendshapes = getPrimaryBlendshapes(result);

  if (!blendshapes) {
    return { leftEyeClosedScore: 0, rightEyeClosedScore: 0 };
  }

  return {
    leftEyeClosedScore: findBlendshape(blendshapes.categories, 'eyeBlinkLeft'),
    rightEyeClosedScore: findBlendshape(blendshapes.categories, 'eyeBlinkRight')
  };
}

export function resetFaceDetectorSingleton(): void {
  landmarkerPromise = null;
}
