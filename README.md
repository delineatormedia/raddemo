# radDemo
radDemo is a tool for creating controllable presentations from video files.

radDemo is at version 0.3.2 and is still in alpha. Don't use in production yet unless you know what you are doing and
love to tinker.

## Usage Instructions

- Run `npm i @delineator/raddemo`.
- Or download an official release.
- Or download the `dist/` directory.

radDemo can be used as a library or as an ES6 module. To use it as a library, refer to `demo-library.html` and
`demo-library.js` for a usage example. To use it as an ES6 module, refer to `demo-module.html` and `demo-module.js` for
a usage example.

## Development Instructions

1. Run `npm install`.
2. Run `npm run watch` to watch for changes and build.
3. Run `npm run build` to build.

There is also a special `dist/debug/` folder created during the build which can be used to see console.log output
for debugging.

## Thanks

- Video UI icons from [FontAwesome](https://github.com/FortAwesome/Font-Awesome).
- Keyboard controls from [KeyboardJS](https://github.com/RobertWHurst/KeyboardJS).

## Potential Future TODOs
- Add support for Vimeo video hosting
- Add support for multiple video formats