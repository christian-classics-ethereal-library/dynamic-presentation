var $ = window.jQuery;

$(document).ready(function(){
    // TODO: Switch these automatically
    switchVerse('v0', 'data-v1')
    switchVerse('v1', 'data-v2')
    switchVerse('v2', 'data-v3')
    switchVerse('v3', 'data-v4')
    textYPosition('v0', 'data-y-bottom');
    textYPosition('v1', 'data-y-bottom');
    fillDynamicOptions();
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
 * @param string id the html id surrounding the svgs that you want to change.
 * @param string yPositionAttr 'data-y-bottom' or 'data-y' (see tools/dynamic.py).
 */
function textYPosition(id, yPositionAttr) {
    var els = $('#' + id + ' svg g text[' + yPositionAttr + ']');
    for (var i = 0; i < els.length; i++) {
        $(els[i]).attr('y', $(els[i]).attr(yPositionAttr));
    }
}

/**
 * @brief Show or hide dynamic options.
 */
function toggleDynamicOptions() {
    if ($('#dynamicOptions').hasClass('visible')) {
        $('#dynamicOptions').removeClass('visible');
    } else {
        $('#dynamicOptions').addClass('visible');
    }
}

window.switchVerse = switchVerse;
window.textYPosition = textYPosition;
window.toggleDynamicOptions = toggleDynamicOptions;

/**
 * @brief Count the number of verses in this dynamic presentation.
 */
function countVerses() {
    // Grab the first SVG
    var svgSelector = '.slides > section:first-of-type > section:first-of-type svg'
    var i;
    for (i = 1; i < 10; i++) {
        var selector = svgSelector + " [data-v" + i + "]";
        if ($(selector).length == 0) {
            return i - 1;
        }
    }
    return i;
}

/**
 * @brief Fill the dynamic options with the controls for this song.
 */
function fillDynamicOptions() {
    for ( var i = 1; i <= countVerses(); i++) {
        var option = "<div>";
        option += "Verse " + i;
        option += "<a href='#' onclick='window.textYPosition(\"v"+i+"\",\"data-y-bottom\");'>"
        option += "Text on bottom";
        option += "</a>";
        option += "<a href='#' onclick='window.textYPosition(\"v"+i+"\",\"data-y\");'>"
        option += "Text on notes";
        option += "</a>";
        option += "</div><br/>";
        $('#dynamicOptions .viewport-inner').append(option);
    }
}
