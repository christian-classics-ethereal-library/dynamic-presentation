/* globals YT */

// YouTube player starting code from https://developers.google.com/youtube/iframe_api_reference#Getting_Started
let firstScriptTag = document.getElementsByTagName('script')[0];
let iframeApi = document.createElement('script');
iframeApi.src = 'https://www.youtube.com/iframe_api';
firstScriptTag.parentNode.insertBefore(iframeApi, firstScriptTag);

let ytplayer;
function onYouTubeIframeAPIReady () {
  let bodyTag = document.getElementsByTagName('body')[0];
  let playerDiv = document.createElement('div');
  playerDiv.id = 'youtube-player';
  playerDiv.style =
    'position: absolute; opacity: 50%; z-index: 20; display: none;';
  playerDiv.frameborder = '0';
  playerDiv.allow =
    'accelerometer; autoplay; clipboard-write; ' +
    'encrypted-media; gyroscope; picture-in-picture';
  playerDiv.allowfullscreen = '';
  bodyTag.insertBefore(playerDiv, bodyTag.firstChild);
  ytplayer = new YT.Player('youtube-player', {
    height: '200',
    width: '200',
    events: {
      onStateChange: onPlayerStateChange
    }
  });
  window.ytplayer = ytplayer;
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
window.ytplayer = ytplayer;

function onPlayerStateChange (event) {
  // If the video has ended
  if (event.data === 0) {
    // Call stop() on the YouTubePlayer
    let player = window.rmx.players[window.rmx.playerToolkitNum];
    if (player) {
      player.stop();
    }
  }
}
