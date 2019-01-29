$(document).ready(function(){
    // TODO: Switch these automatically
    switchVerse('v0', 'data-v1')
    switchVerse('v1', 'data-v2')
    switchVerse('v2', 'data-v3')
    switchVerse('v3', 'data-v4')
    textYPosition('data-y-bottom');
});

/**
 * @brief Change the lyrics in a dynamic.svg to a different verse.
 * @param string id the html id surrounding the svgs that you want to change.
 * @param string verseAttr 'data-v#' where # is a verse number (see tools/dynamic.py).
 */
function switchVerse(id, verseAttr) {
    // TODO: Remove the text even when the verse we want isn't present.
    var els = $('#' + id + ' svg g text[' + verseAttr + ']');
    for (var i = 0; i < els.length; i++) {
        els[i].innerHTML = $(els[i]).attr(verseAttr);
    }
}

/**
 * @brief Change the Y position of the lyrics in a dynamic.svg.
 * @param string yPositionAttr 'data-y-bottom' or 'data-y' (see tools/dynamic.py).
 */
function textYPosition(yPositionAttr) {
    var els = $('svg g text[' + yPositionAttr + ']');
    for (var i = 0; i < els.length; i++) {
        $(els[i]).attr('y', $(els[i]).attr(yPositionAttr));
    }
}
