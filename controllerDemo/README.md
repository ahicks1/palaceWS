# Palace Game Controller
## Build system:
This app is using typescript to compile to javascript and systemJS to load the modules in browser.

The bootstrapping code in index.html is as follows:
> \<script src="scripts/system.js">\</script> \
> \<script src="scripts/main.js">\</script> \
> \<script> \
> SystemJS.import("controllerDemo/controllerProtocol"); \
> \</script>
