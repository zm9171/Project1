//$(document).ready(function () {

    function getWeather(city) {
        var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" +
            city + "&units=imperial&appid=9017eb1defd779b9b948d111f75e9386";
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(function (response) {
            //results = response.data;
            console.log(response);
            lat = parseFloat(response.coord.lat);
            lon = parseFloat(response.coord.lon);

            var coordinateStart = {
                lat: lat,
                lng: lon
            }
            var coordinateEnd = {
                lat: 39.76838,
                lng: -86.15084
            }

            moveMapTo(map, coordinateStart);
            addPolylineToMap(map, coordinateStart, coordinateEnd);
        })
    };

//})