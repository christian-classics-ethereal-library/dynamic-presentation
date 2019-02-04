var Reveal = require("reveal.js");
Reveal.configure({
    keyboard: {
        68: function(){window.toggleDynamicOptions();},
    }
});
Reveal.addKeyBinding( { keyCode: 68, key: 'D',description: 'Toggle Dynamic Presentation Options' },
    function(){window.toggleDynamaicOptions();},
);

Reveal.initialize({
    "controlsTutorial": false,
    "transition": "none"
});
