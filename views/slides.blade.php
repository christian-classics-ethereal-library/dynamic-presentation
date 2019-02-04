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
                    <b>Dynamic Options</b><br/>
                </div>
            </div>
        </div>
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
