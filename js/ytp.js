/* globals jQuery */

// YouTube player starting code from https://developers.google.com/youtube/iframe_api_reference#Getting_Started
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var ytplayer;
function onYouTubeIframeAPIReady() {
  jQuery('body').prepend('<div id="youtube-player"></div>');
  ytplayer = new YT.Player('youtube-player', {
    height: '200',
    width: '200'
  });
  jQuery('#youtube-player').attr({
    'style': 'position: absolute; opacity: 50%; z-index: 20;',
    'frameborder': '0',
    'allow': 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    'allowfullscreen': ''
  });
  jQuery('#youtube-player').hide();
}
