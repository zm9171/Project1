//$(document).ready(function () {

function getLocation(from, to) {
    var destinationArray = [from, to];

    for (var i = 0; i < destinationArray.length; i++) {

        $.ajax({
            url: 'https://geocoder.api.here.com/6.2/geocode.json',
            type: 'GET',
            dataType: 'jsonp',
            jsonp: 'jsoncallback',
            data: {
                //searchtext: startpoint,
                searchtext: destinationArray[i],
                app_id: 'wcU125hOha6uKl56A00d',
                app_code: 'DD3bbz78Ju_Tb88oKzx0kA',
                gen: '9'
            },
            success: function (data) {
                //alert(JSON.stringify(data));
                var lat = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
                var long = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
                console.log(lat,long);
            }
        });
    }
};

function calculateRouteFromAtoB(platform) {
    var router = platform.getRoutingService(),
        routeRequestParams = {
            mode: 'fastest;publicTransport',
            representation: 'display',
            waypoint0: '41.85003,-87.65005', // Fernsehturm
            waypoint1: '41.7948,-87.5917', // Kurfürstendamm
            routeattributes: 'waypoints,summary,shape,legs',
            maneuverattributes: 'direction,action'
        };
    console.log(router);
    router.calculateRoute(
        routeRequestParams,
        onSuccess,
        onError
    );
}

function onSuccess(result) {
    console.log(result);
    var route = result.response.route[0];
    addRouteShapeToMap(route);
    addManueversToMap(route);
    addWaypointsToPanel(route.waypoint);
    addManueversToPanel(route);
    addSummaryToPanel(route.summary);
    // ... etc.
}

function onError(error) {
    alert('Ooops!');
}

//Boilerplate map initialization code starts below:

var mapContainer = document.getElementById('map'),
    routeInstructionsContainer = document.getElementById('panel');

//Step 1: initialize communication with the platform
var platform = new H.service.Platform({
    app_id: 'wcU125hOha6uKl56A00d',
    app_code: 'DD3bbz78Ju_Tb88oKzx0kA',
    //         app_id: 'DemoAppId01082013GAL',
    //   app_code: 'AJKnXv84fjrb0KIHawS0Tg',
    useCIT: true,
    useHTTPS: true
});
//var pixelRatio = window.devicePixelRatio || 1;
var defaultLayers = platform.createDefaultLayers({
    // tileSize: pixelRatio === 1 ? 256 : 512,
    // ppi: pixelRatio === 1 ? undefined : 320
});

//Step 2: initialize a map  - not specificing a location will give a whole world view.
var map = new H.Map(mapContainer,
    defaultLayers.normal.map, {
        //pixelRatio: pixelRatio
        center: {
            lat: 52.5160,
            lng: 13.3779
        },
        zoom: 13
    });

//Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// Create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);

var bubble;

function openBubble(position, text) {
    if (!bubble) {
        bubble = new H.ui.InfoBubble(
            position,
            // The FO property holds the province name.
            {
                content: text
            });
        ui.addBubble(bubble);
    } else {
        bubble.setPosition(position);
        bubble.setContent(text);
        bubble.open();
    }
}

function addRouteShapeToMap(route) {
    //var lineString = new H.geo.LineString(),
    var strip = new H.geo.Strip(),
        routeShape = route.shape,
        polyline;

    routeShape.forEach(function (point) {
        var parts = point.split(',');
        strip.pushLatLngAlt(parts[0], parts[1]);
        //lineString.pushLatLngAlt(parts[0], parts[1]);
    });

    polyline = new H.map.Polyline(strip, {
        style: {
            lineWidth: 4,
            strokeColor: 'rgba(0, 128, 255, 0.7)'
        }
    });
    // Add the polyline to the map
    map.addObject(polyline);
    // And zoom to its bounding rectangle
    map.setViewBounds(polyline.getBounds(), true);
}

function addManueversToMap(route) {
    var svgMarkup = '<svg width="18" height="18" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="8" cy="8" r="8" ' +
        'fill="#1b468d" stroke="white" stroke-width="1"  />' +
        '</svg>',
        dotIcon = new H.map.Icon(svgMarkup, {
            anchor: {
                x: 8,
                y: 8
            }
        }),
        group = new H.map.Group(),
        i,
        j;

    // Add a marker for each maneuver
    for (i = 0; i < route.leg.length; i += 1) {
        for (j = 0; j < route.leg[i].maneuver.length; j += 1) {
            // Get the next maneuver.
            maneuver = route.leg[i].maneuver[j];
            // Add a marker to the maneuvers group
            var marker = new H.map.Marker({
                lat: maneuver.position.latitude,
                lng: maneuver.position.longitude
            }, {
                    icon: dotIcon
                });
            marker.instruction = maneuver.instruction;
            group.addObject(marker);
        }
    }

    group.addEventListener('tap', function (evt) {
        map.setCenter(evt.target.getPosition());
        openBubble(
            evt.target.getPosition(), evt.target.instruction);
    }, false);

    // Add the maneuvers group to the map
    map.addObject(group);
}

function addWaypointsToPanel(waypoints) {

    var nodeH3 = document.createElement('h3'),
        waypointLabels = [],
        i;

    for (i = 0; i < waypoints.length; i += 1) {
        waypointLabels.push(waypoints[i].label)
    }

    nodeH3.textContent = waypointLabels.join(' - ');

    routeInstructionsContainer.innerHTML = '';
    routeInstructionsContainer.appendChild(nodeH3);
}

function addSummaryToPanel(summary) {
    var summaryDiv = document.createElement('div'),
        content = '';
    content += '<b>Total distance</b>: ' + summary.distance + 'm. <br/>';
    content += '<b>Travel Time</b>: ' + summary.travelTime.toMMSS() + ' (in current traffic)';


    summaryDiv.style.fontSize = 'small';
    summaryDiv.style.marginLeft = '5%';
    summaryDiv.style.marginRight = '5%';
    summaryDiv.innerHTML = content;
    routeInstructionsContainer.appendChild(summaryDiv);
}

function addManueversToPanel(route) {

    var nodeOL = document.createElement('ol'),
        i,
        j;

    nodeOL.style.fontSize = 'small';
    nodeOL.style.marginLeft = '5%';
    nodeOL.style.marginRight = '5%';
    nodeOL.className = 'directions';

    // Add a marker for each maneuver
    for (i = 0; i < route.leg.length; i += 1) {
        for (j = 0; j < route.leg[i].maneuver.length; j += 1) {
            // Get the next maneuver.
            maneuver = route.leg[i].maneuver[j];

            var li = document.createElement('li'),
                spanArrow = document.createElement('span'),
                spanInstruction = document.createElement('span');

            spanArrow.className = 'arrow ' + maneuver.action;
            spanInstruction.innerHTML = maneuver.instruction;
            li.appendChild(spanArrow);
            li.appendChild(spanInstruction);

            nodeOL.appendChild(li);
        }
    }

    routeInstructionsContainer.appendChild(nodeOL);
}


Number.prototype.toMMSS = function () {
    return Math.floor(this / 60) + ' minutes ' + (this % 60) + ' seconds.';
}

calculateRouteFromAtoB(platform);

//})