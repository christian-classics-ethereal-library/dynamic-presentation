<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Laravel') }}</title>

    <script src="{{ asset('js/app.js') }}" defer></script>
    <script src="{{ asset('js/slides.js') }}" defer></script>
    <link href="{{ asset('css/reveal.css') }}" rel="stylesheet">
    <link href="{{ asset('css/dynamic.css') }}" rel="stylesheet">
</head>
<body>
    <div class="reveal">
        <div id='dynamicOptions' class='overlay'>
            <header>
                <a class="close" href="#" onclick='window.toggleDynamicOptions();'>
                    <span class="icon"></span>
                </a>
            </header>
            <div class='viewport'>
                <div class='viewport-inner'>
                    @if (isset($audio))
                        <audio id='audio' controls>
                            <source src="{{$audio}}" type="audio/mpeg">
                        </audio>
                        <br/>
                    @endif
                    <b>Dynamic Options</b><br/>
                    <span class='url'>{{Request::url()}}?dp-noteHeight=<i class='noteHeight'></i>&dp-fontSize=<i class='fontSize'></i><i class='displayOpts'></i></span>
                    <div style="background-color: gray;">
                        <b>Note Height: </b>
                        <input type="range" value="20" min="1" max="20" step="1"
                            onchange='window.setNoteHeight(this.value);
                                window.jQuery(".noteHeight").html(this.value);'>
                        <i class='noteHeight'></i>
                        <br/>
                        <b>Notes Per Line: </b>
                        <input type="range" value="12" min="6" max="24" step="1"
                            onchange='window.setNotesPerLine(this.value);
                                window.jQuery(".notesPerLine").html(this.value);'>
                        <i class='notesPerLine'></i>
                        <br/>
                        <b>Font Size: </b>
                        <input type="range" value="20" min="10" max="50" step="1"
                            onchange='window.setFontSize(this.value);
                                window.jQuery(".fontSize").html(this.value);'>
                        <i class='fontSize'></i>
                    </div>
                </div>
            </div>
        </div>
        <a href='#' id='openDynamicOptions'>&#x2699;</a>
        <div class="slides">
            @foreach ($slides as $key => $slide)
                @if (isset($slide['name']))
                    <section id="{{ $slide['name'] }}">
                        {!! $slide['content'] !!}
                    </section>
                @else
                    <section id="{{$key}}">
                    @foreach ($slide as $subslide)
                        <section id="{{$subslide['name']}}">
                            {!! $subslide['content'] !!}
                        </section>
                    @endforeach
                    </section>
                @endif
            @endforeach
        </div>
    </div>
</body>
</html>
