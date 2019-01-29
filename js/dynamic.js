$(document).ready(function(){
    // TODO: Switch these automatically
    switchVerse('v0', 'data-v1')
    switchVerse('v1', 'data-v2')
    switchVerse('v2', 'data-v3')
    switchVerse('v3', 'data-v4')
    textYPosition('data-y-bottom');
});

/**
 * @brief changes the text within an svg to be that specified by a different attribute.
 * @param string id the html id surrounding the svgs that you want to change.
 * @param string verseAttr The attribute containing the text that you want to switch to.
 */
function switchVerse(id, verseAttr) {
    // TODO: Remove the text even when the verse we want isn't present.
    var els = $('#' + id + ' svg g text[' + verseAttr + ']');
    for (var i = 0; i < els.length; i++) {
        els[i].innerHTML = $(els[i]).attr(verseAttr);
    }
}

function textYPosition(yPositionAttr) {
    var els = $('svg g text[' + yPositionAttr + ']');
    for (var i = 0; i < els.length; i++) {
        $(els[i]).attr('y', $(els[i]).attr(yPositionAttr));
    }
}
