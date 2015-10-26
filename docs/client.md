## client-side usage

Starting with version 3.0.0, this library is compatible with [Browserify],
so it can be easily used in a web application.

You can either browserify the library yourself, or use predefined commands
from within the module's root folder:

* install all the library's dependencies:
```
$ npm install
```
* create the client-side version of the library: 
```
$ npm run browserify
```
This generates file `spex.js` within the module's root folder. The library exposes global variable `spexLib`,
to be used for the library initialization, as shown in the example below:
 
```html
<script src="spex.js"></script>
<script>
    var spex = spexLib(Promise);
</script>
```

[Browserify]:https://github.com/substack/node-browserify