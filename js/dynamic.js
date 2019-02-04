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
    // TODO: Don't get rid of text that we need (show the chorus on verse two).
    $('#' + id + ' svg g text').each(function(){this.innerHTML = "";});

    var els = $('#' + id + ' svg g text[' + verseAttr + ']');
    for (var i = 0; i < els.length; i++) {
        // Remove the hypens that start a syllable. We don't need two hypens per word.
        text = $(els[i]).attr(verseAttr).replace(/^[ -]*/, "");

        // Setting a specific letter width isn't perfect since "One" is wider than "ly,"
        // TODO: Consider using a monospace font for the lyrics.
        var widthPerLetter = 13;
        var boxWidth = $(els[i]).attr('data-textlength');

        if (text.length * widthPerLetter >= boxWidth) {
            // Apply the textLength attribute if we need to squish these letters.
            $(els[i]).attr('textLength', boxWidth);

            // If we need to squish this letter, it's okay to remove any trailing hyphens,
            // as long as removing those won't stretch the letter out.
            if ((text.length - 1) * widthPerLetter >= boxWidth) {
                text = text.replace(/[ -]*$/,"");
            }
        } else {
            $(els[i]).attr('textLength', null);
        }
        els[i].innerHTML = text;
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
