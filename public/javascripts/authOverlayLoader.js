(function () {
  if (window.__authOverlayLoaderInitialized) {
    return;
  }
  window.__authOverlayLoaderInitialized = true;

  var mount = document.getElementById("auth-overlay-mount") || document.body;
  if (!mount) {
    return;
  }

  var loadOverlay = async function () {
    try {
      if (document.getElementById("auth-overlay")) {
        return;
      }

      var response = await fetch("/components/auth-overlay.html", {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        return;
      }

      var html = await response.text();
      var template = document.createElement("template");
      template.innerHTML = html;

      var fragment = template.content.cloneNode(true);
      var scripts = Array.from(fragment.querySelectorAll("script"));
      scripts.forEach(function (script) {
        script.remove();
      });

      mount.appendChild(fragment);

      scripts.forEach(function (oldScript) {
        var script = document.createElement("script");
        if (oldScript.src) {
          script.src = oldScript.src;
        } else {
          script.textContent = oldScript.textContent;
        }
        document.body.appendChild(script);
      });

      window.__authOverlayLoaded = true;
      var readyEvent = new Event("auth-overlay:ready");
      window.dispatchEvent(readyEvent);
      document.dispatchEvent(readyEvent);
    } catch (error) {
      console.error("[Auth Overlay Loader] Failed to load overlay:", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadOverlay);
  } else {
    loadOverlay();
  }
})();
