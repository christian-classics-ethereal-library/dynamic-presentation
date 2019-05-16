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
    @if (isset($scripts))
        @foreach ($scripts as $script)
            <script src="{{ $script }}" defer></script>
        @endforeach
    @endif
    <link href="{{ asset('css/reveal.css') }}" rel="stylesheet">
    <link href="{{ asset('css/dynamic.css') }}" rel="stylesheet">
    <style>
        #dynamicOptions:not(.visible) {
            opacity: 0;
        }
    </style>
</head>
<body>
    <div class="reveal">
                    @if (isset($audio))
                        <audio id='audio'>
                            <source src="{{$audio}}" type="audio/mpeg">
                        </audio>
                    @endif
        <div class="slides">
            @foreach ($slides as $key => $slide)
                @if (isset($slide['name']))
                    <section id="{{ $slide['name'] }}" {!! $slide['attributes'] ?? '' !!}>
                        {!! $slide['content'] ?? '' !!}
                    </section>
                @else
                    <section id="{{$key}}">
                    @foreach ($slide as $subslide)
                        <section id="{{$subslide['name']}}" {!! $subslide['attributes'] ?? '' !!}>
                            {!! $subslide['content'] ?? '' !!}
                        </section>
                    @endforeach
                    </section>
                @endif
            @endforeach
        </div>
    </div>
</body>
</html>
