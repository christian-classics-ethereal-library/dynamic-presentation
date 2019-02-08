var $ = window.jQuery;

$(document).ready(function(){
    // TODO: Switch these automatically
    switchVerse('v1', 'data-v1')
    switchVerse('v2', 'data-v2')
    switchVerse('v3', 'data-v3')
    switchVerse('v4', 'data-v4')
    fillDynamicOptions();
});

/**
 * @brief Change the size of a notes.
 */
function setNoteHeight(h) {
    $('svg g rect[data-y]').each(function(){
        var y = parseFloat(this.attributes['data-y']['value']) * h;
        this.setAttribute('y', y);
        var height = parseFloat(this.attributes['data-height']['value']) * h;
        this.setAttribute('height', height);
    });
    // TODO: Move the lyrics.
    resizeSVGHeight();
}

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
        var text = $(els[i]).attr(verseAttr).replace(/^[ -]*/, "");
        els[i].innerHTML = text;
        squishText(els[i]);
    }
}

/**
 * @brief Change the Y position of the lyrics in a dynamic.svg.
 * @param string id the html id surrounding the svgs that you want to change.
 * @param string yPositionAttr 'data-y-bottom' or 'data-y' (see tools/dynamic.py).
 */
function textYPosition(id, yPositionAttr) {
    // TODO: Change this to be affected by new note heights
    // (no longer require attributes to be set here).
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

window.setNoteHeight = setNoteHeight;
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

/**
 * @brief Return the current font size of the lyrics, or 0 if there are no lyrics.
 */
function getFontPixelSize() {
    var size = $('svg text[data-v1]').attr('font-size');
    if (size == undefined) {
        return 0;
    } else if (size.indexOf("pt") != -1) {
        return parseFloat(size.replace("pt", "")) * (4/3)
    } else if (size.indexOf("px") != -1) {
        return parseFloat(size.replace("px", ""))
    }
    return 0;
}

/**
 * @brief Return the current pixel value for the note height.
 */
function getNoteHeight() {
    var denominator = parseFloat($('svg g rect[data-height]').attr('data-height'));
    var numerator = parseInt($('svg g rect[data-height]').attr('height'));
    return numerator/denominator;
}

/**
 * @brief Resize all SVGs based on the current note height and font size.
 */
function resizeSVGHeight() {
    var nh = getNoteHeight();
    var fs = getFontPixelSize();
    $('svg').each(function(){
        var noteRange = parseFloat(this.attributes['data-noterange']['value']);
        var h = (noteRange * nh) + fs;
        this.setAttribute('height', h);
    });
}

/**
 * @brief Squish text so it doesn't go beyond the boundaries of its box.
 *  Also possibly removes hypens or adds non-breaking spaces to squished text elements.
 * @param el The element that you want to squish the text on.
 */
function squishText(el) {
    var text = el.innerHTML;
    // Setting a specific letter width isn't perfect since "One" is wider than "ly,"
    // TODO: Consider using a monospace font for the lyrics.
    var widthPerLetter = getFontPixelSize() * .7;
    var boxWidth = $(el).attr('data-textlength');

    if (text.length * widthPerLetter >= boxWidth) {
        // Apply the textLength attribute if we need to squish these letters.
        $(el).attr('textLength', boxWidth);

        // Add a non-breaking space if it doesn't end in a hyphen.
        // (this syllable is the end of a word)
        text = text.replace(/([^-])$/,"$1&nbsp;");

        // If we need to squish this letter, it's okay to remove any trailing hyphens,
        // as long as removing those won't stretch the letter out.
        // (this syllable is the middle of a word, but is squished against its continuation)
        if ((text.length - 1) * widthPerLetter >= boxWidth) {
            text = text.replace(/[ -]*$/,"");
        }
    } else {
        $(el).attr('textLength', null);
    }
    el.innerHTML = text;
}
