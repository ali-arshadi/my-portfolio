// Full-screen loader for the 3D scene: an amber ring, the desk lamp's colour, filling around the
// percentage, with a caption. It is server-rendered and shown only in 3D mode until the scene is ready
// (globals.css, on <html data-scene>); DeskCanvas's LoadStatus moves the ring and the number, lights the
// ring up at 100% and then reveals the scene.
export const LOADER_RING = { radius: 44, length: 2 * Math.PI * 44 };

export function Loader() {
  return (
    <div
      id="loader"
      className="loader"
      role="progressbar"
      aria-label="Loading the desk scene"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <div className="loader-ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle
            className="loader-track"
            cx="50"
            cy="50"
            r={LOADER_RING.radius}
          />
          <circle
            className="loader-fill"
            cx="50"
            cy="50"
            r={LOADER_RING.radius}
            strokeDasharray={LOADER_RING.length}
            strokeDashoffset={LOADER_RING.length}
          />
        </svg>
        <p className="loader-value" aria-hidden="true">
          <span data-loader-value>0</span>
          <span className="loader-percent">%</span>
        </p>
      </div>
      <p className="loader-caption">Setting up the desk</p>
    </div>
  );
}
