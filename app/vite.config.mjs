// Vite configuration for app-top.
//
// This replaces create-react-app / react-scripts 3. The two things that setup
// forced on every build are gone with it: no NODE_OPTIONS=--openssl-legacy-provider
// (that existed only because webpack 4 hashed assets with MD4, which OpenSSL 3
// refuses) and no CI=false (that existed only because react-scripts promoted
// eslint warnings to errors whenever CI was set).
//
// Note the file extension: app/package.json deliberately has no "type": "module",
// because src/templateDocs.js is a CommonJS Node script that must keep running as
// `node src/templateDocs.js`. Naming this config .mjs lets it use ESM regardless.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Every component lives in a plain .js file rather than .jsx — a create-react-app
// habit that react-scripts allowed. esbuild only assumes JSX in .jsx/.tsx, so it
// has to be told to read this project's own .js files as JSX. The pattern is
// anchored to *this* src/ directory so that .js files in node_modules (many of
// which are CommonJS and would not survive a JSX parse) are left alone.
const srcDir = path.join(import.meta.dirname, 'src', path.sep);
const jsxInSrcRE = new RegExp(
  `^${srcDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\.jsx?$`,
);

export default defineConfig({
  plugins: [
    react({
      // The app is React 16 and every JSX file imports React explicitly, exactly
      // as create-react-app required. The classic runtime keeps that contract, so
      // JSX still compiles to React.createElement, no source file has to change,
      // and no React upgrade is implied.
      jsxRuntime: 'classic',
    }),
  ],
  define: {
    // refractor (react-syntax-highlighter -> refractor/core.js) reads the Node
    // `global` at module-evaluation time. webpack 4 injected a shim for it in
    // every CommonJS module it bundled; this is the equivalent substitution.
    // Rollup's CommonJS handling already covers this in the production build —
    // it is the dev server's pre-bundled deps that would otherwise throw
    // "global is not defined" the first time a code block renders.
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // react-markdown 4 -> unified -> vfile -> replace-ext all `require('path')`.
      // webpack 4, which create-react-app 3 used, silently substituted a browser
      // implementation of Node's `path` for them. Vite deliberately does not, so
      // supply the same shim explicitly: without it those modules would still
      // load, but any code path touching vfile's path accessors would throw where
      // it previously worked.
      path: 'path-browserify',
    },
  },
  esbuild: {
    include: jsxInSrcRE,
    // Vite's default exclude is /\.js$/, which would cancel the include above.
    exclude: [],
    loader: 'jsx',
  },
  optimizeDeps: {
    esbuildOptions: {
      // The dev server's dependency scanner is a separate esbuild pass that walks
      // index.html into src/ before any Vite plugin runs, so it needs telling about
      // the JSX-in-.js convention as well. Scoped with the same anchored pattern
      // rather than a blanket `loader: {'.js': 'jsx'}`, which would also apply to
      // every CommonJS dependency being pre-bundled.
      plugins: [
        {
          name: 'app-top:jsx-in-js',
          setup(build) {
            build.onLoad({ filter: jsxInSrcRE }, async ({ path: file }) => ({
              contents: await readFile(file, 'utf8'),
              loader: 'jsx',
            }));
          },
        },
      ],
    },
  },
  build: {
    // Matches BUILD_DIR in the Makefile and pages_build_output_dir in wrangler.toml.
    outDir: 'build',
    // create-react-app emitted sourcemaps alongside the bundle; keep doing that.
    sourcemap: true,
  },
});
