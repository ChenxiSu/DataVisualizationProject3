//initialize the map
L.mapbox.accessToken = 'pk.eyJ1IjoiY2hlbnhpMTAyMSIsImEiOiJjaW81czVsb3UwMjAxdzNrandidHF3eTl3In0.KscIyN8_aLsmYzW3LSHLfA';

var map = L.mapbox.map('map', 'mapbox.streets').setView([34, 116], 4);

var svg = d3.select("#blank").append("svg").attr("height", 500).attr("width", width);

var height = 500;
var width = 900;
var padding = 50;

var months, AQI, cities;
var monthInfo, AQIInfo, cityInfo;

var xScale;
var yScale;

var ChinaData = new Array();
var USData = new Array();

var color = ["#dd3497", "#6a51a3"];

var pollution = ["green", "yellow", "orange", "red"]
var pollutionLevel = [50,100,150,200,300];

var fiveCities = ["Beijing", "Chengdu", "Guangzhou", "Shanghai", "Shenyang"];

var svgRect = d3.select("#rectPlot");

var choice; // The city that is choosen on the map

var cityIcon = L.Icon.extend({
    options: {
        iconSize:     [38, 95],
        shadowSize:   [50, 64],
        iconAnchor:   [22, 94],
        popupAnchor:  [-3, -76],
        labelAnchor: [6, 0]
    }
});

d3.csv("data/cities.csv", function (error, data) {
	cityInfo = data;
	cities = cityInfo.map(function (info) {
		return {
			site: info["City"],
			year: Number(info["Year"]),
			AQI: Number(info["AQI"]),
			day: Number(info["Day"]),
			quality: Number(info["Quality Number"])
		};
	})


	d3.csv("data/map.csv", function (error, mapData) {
	
		AQIInfo = mapData;
		console.log(mapData);
		AQI = AQIInfo.map(function (info) {
			
			return {
				site: info["City"],
				year: Number(info["Year"]),
				AQI: Number(info["Average_AQI"]),
				x: Number(info["x"]),
				y: Number(info["y"]),
			};
		});

		// add marker for each city to the map
		setTheMapWithIcon(0);
		
		//update markers in the map after scrollerBar changed
		var aqiScrollerBar = d3.select("#aqiRange");

		aqiScrollerBar.on("input", function (){
			var curAQI = this.value;
			updateMapIcon(curAQI);
		});

		//



	});

});





  //   AQI.forEach(function (d) {
 	// 	map.addLayer(L.circle([d.x, d.y], 0));
 	// });

 // 	var svgMap = d3.select(map.getPanes().overlayPane).append("svg")
	// 	.attr("class", "leaflet-zoom-animated")
	// 	.attr("width", window.innerWidth)
	// 	.attr("height", window.innerHeight);

	// var	g = svgMap.append("g").attr("class", "leaflet-zoom-hide");

	// var images = g.selectAll("image")
	// 	.data(AQI)
	// 	.enter().append("image")
	// 	.attr("id", function (d) {
	// 		return d.site;
	// 	})
	// 	.attr("xlink:href", function (d) {
	// 		var temp = d.quality;
	// 		return "img/" + temp + ".svg";
	// 	})
	// 	.style("opacity", 0.9)
	// 	.on("click", function () {
	// 		console.log(this.id);
	// 		var name = this.id;
	// 		d3.select("#cityName").text(name);
	// 		choice = cities.filter(function (d) {
	// 			return d.site == name;
	// 		});
	// 		svgRect.select("svg").remove();
	// 		var rectSvg = svgRect.append("svg").attr("width", width).attr("height", height);		
	// 		rectSvg.selectAll("rect").data(choice).enter()
	// 		.append("rect").attr("width", 30).attr("height", 30)
	// 		.attr("x", function (d) {
	// 			return ((d.day - 1) % 30) * 30;
	// 		})
	// 		.attr("y", function (d) {
	// 			return (Math.floor((d.day - 1) / 30) + 1) * 30;
	// 		})
	// 		.style("fill", function (d) {
	// 			return pollution[d.quality];
	// 		})
	// 		.style("stroke","black");
	// 	});


function updateMapIcon(lowestAQI){
	if(lowestAQI != 0){
		d3.selectAll(".leaflet-marker-icon").remove();
		setTheMapWithIcon(lowestAQI);
	}
}
	
//set the map with icons	
function setTheMapWithIcon(aqiValue){
	AQI.forEach(function (d) {
		if(d.AQI > aqiValue){
			d.LatLng = new L.LatLng(d.x, d.y);
			var index = getIconIndex(d.AQI);
			var curIcon = setIconByIndex(index);
			var marker = new L.marker(d.LatLng, {icon: curIcon}).bindPopup(d.site);
			
			marker.on("click", function () {
				console.log(this._popup.getContent());
			});
			marker.addTo(map);
		}	
	});
}

function setIconByIndex(index){
	if(index == 0) return new cityIcon({iconUrl: 'img/green-location.svg'});
	else if(index == 1) return new cityIcon({iconUrl: 'img/yellow-location.svg'});
	else if(index == 2) return new cityIcon({iconUrl: 'img/orange-location.svg'});
	else if(index == 3) return new cityIcon({iconUrl: 'img/lightRed-location.svg'});
	else if(index == 4) return new cityIcon({iconUrl: 'img/darkRed-location.svg'});
	else if(index == 5) return new cityIcon({iconUrl: 'img/purple-location.svg'});
}
	
function getIconIndex(aqiLevel){
	for(var i=0; i<pollutionLevel.length; i++){
		if( aqiLevel<= pollutionLevel[i] ) return i;
	}
	return pollutionLevel.length;
}

function translateSVG() {
	var viewBoxLeft = document.querySelector("svg.leaflet-zoom-animated").viewBox.animVal.x;
	var viewBoxTop = document.querySelector("svg.leaflet-zoom-animated").viewBox.animVal.y;
	// Reszing width and height incase of window resize
	svgMap.attr("width", window.innerWidth);
	svgMap.attr("height", window.innerHeight);
	// Adding the ViewBox attribute to our SVG to contain it
	svgMap.attr("viewBox", function () {
	    return "" + viewBoxLeft + " " + viewBoxTop + " "  + window.innerWidth + " " + window.innerHeight;
	});
	// Adding the style attribute to our SVG to transkate it
	svgMap.attr("style", function () {
	    return "transform: translate3d(" + viewBoxLeft + "px, " + viewBoxTop + "px, 0px);";
	});
}

function update() {
	translateSVG();
	images.attr("x", function (d) { return map.latLngToLayerPoint(d.LatLng).x; })
	images.attr("y", function (d) { return map.latLngToLayerPoint(d.LatLng).y; })
	images.attr("height", function (d) { return 0.5 * Math.pow(2, map.getZoom()); })	
	images.attr("width", function (d) { return 0.5 * Math.pow(2, map.getZoom()); });	
}
	
	
