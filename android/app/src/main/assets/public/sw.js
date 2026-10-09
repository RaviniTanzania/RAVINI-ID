/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-b1bafff1'], (function (workbox) { 'use strict';

  importScripts("/sw-push.js");
  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "ddfcab0b1dc10d335961237ca8168cc7"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9655fc47010ba14ff0158651d4afe571"
  }, {
    "url": "pwa-192x192.png",
    "revision": "83f1cbc56e3e049aa1287f761e7bf013"
  }, {
    "url": "index.html",
    "revision": "4afc56e820612a2a48a9ac78943ef807"
  }, {
    "url": "icon.svg",
    "revision": "398fbf31830343f12c5e36b5cc8b3c35"
  }, {
    "url": "favicon.ico",
    "revision": "aea6167915a0a169080006efb835d775"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "243df081a57fbb7538148bd508addcf8"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/web-NNvanoU8.js",
    "revision": null
  }, {
    "url": "assets/web-DqArveBv.js",
    "revision": null
  }, {
    "url": "assets/web-CYclL1N3.js",
    "revision": null
  }, {
    "url": "assets/web-BnO69qkE.js",
    "revision": null
  }, {
    "url": "assets/index-DmNcalPd.css",
    "revision": null
  }, {
    "url": "assets/index-CUOoryFg.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "243df081a57fbb7538148bd508addcf8"
  }, {
    "url": "favicon.ico",
    "revision": "aea6167915a0a169080006efb835d775"
  }, {
    "url": "icon.svg",
    "revision": "398fbf31830343f12c5e36b5cc8b3c35"
  }, {
    "url": "pwa-192x192.png",
    "revision": "83f1cbc56e3e049aa1287f761e7bf013"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9655fc47010ba14ff0158651d4afe571"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "ddfcab0b1dc10d335961237ca8168cc7"
  }, {
    "url": "manifest.webmanifest",
    "revision": "f9af8ae4b05e7a745ea92d671353b73b"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/images\.unsplash\.com\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "unsplash-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
