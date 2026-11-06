// What decides the scene mode (sceneMode.ts), shared with the inline script that applies it before the
// first paint (app/layout.tsx), so a phone never flashes the 3D loader.

// The width from which the scene (and the content on its monitor) is used.
export const SCENE_MEDIA = "(min-width: 900px)";

// Sets <html data-scene="3d" | "static"> as the page is parsed: 3D needs SCENE_MEDIA and WebGL 2.
export const SCENE_MODE_SCRIPT = `(function () {
  var mode = "static";
  try {
    if (window.matchMedia(${JSON.stringify(SCENE_MEDIA)}).matches) {
      var gl = document.createElement("canvas").getContext("webgl2");
      if (gl) {
        mode = "3d";
        var lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
      }
    }
  } catch (e) {}
  document.documentElement.dataset.scene = mode;
})();`;
