
L.mapbox.accessToken = 'pk.eyJ1IjoiY2hlbnhpMTAyMSIsImEiOiJjaW81czVsb3UwMjAxdzNrandidHF3eTl3In0.KscIyN8_aLsmYzW3LSHLfA';
var map = L.mapbox.map('map', 'mapbox.streets')
  .setView([34, 116], 4);

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

var pollution = ["green", "yellow", "orange", "red", "purple"]

var fiveCities = ["Beijing", "Chengdu", "Guangzhou", "Shanghai", "Shenyang"];

var svgRect = d3.select("#rectPlot");

var choice; // The city that is choosen on the map

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

});

d3.csv("data/map.csv", function (error, data) {
	AQIInfo = data;
	AQI = AQIInfo.map(function (info) {
		return {
			site: info["City"],
			year: Number(info["Year"]),
			AQI: Number(info["AQI"]),
			x: Number(info["x"]),
			y: Number(info["y"]),
			quality: Number(info["Quality Number"])
		};
	})

	AQI.forEach(function (d) {
  		d.LatLng = new L.LatLng(d.x, d.y);
	});
	AQI.forEach(function (d) {
 		map.addLayer(L.circle([d.x, d.y], 8000));
 	});

 	var svgMap = d3.select(map.getPanes().overlayPane).append("svg")
	.attr("class", "leaflet-zoom-animated")
	.attr("width", window.innerWidth)
	.attr("height", window.innerHeight);

	var	g = svgMap.append("g").attr("class", "leaflet-zoom-hide");

	var circles = g.selectAll("circle")
	.data(AQI)
	.enter().append("circle")
	.attr("id", function (d) {
		return d.site;
	})
	.style("fill", function (d) {
		return pollution[d.quality];
	})
	.style("opacity", 0.9)
	.on("click", function () {
		console.log(this.id);
		var name = this.id;
		d3.select("#cityName").text(name);
		choice = cities.filter(function (d) {
			return d.site == name;
		});
		svgRect.select("svg").remove();
		var rectSvg = svgRect.append("svg").attr("width", width).attr("height", height);
		
		rectSvg.selectAll("rect").data(choice).enter()
		.append("rect").attr("width", 30).attr("height", 30)
		.attr("x", function (d) {
			return ((d.day - 1) % 30) * 30;
		})
		.attr("y", function (d) {
			return (Math.floor((d.day - 1) / 30) + 1) * 30;
		})
		.style("fill", function (d) {
			return pollution[d.quality];
		})
		.style("stroke","black");
		// svgRect.append("rect").attr("width", 30).attr("height", 30).attr("x", 100).attr("y", 100)
		// .style("fill", "red");
	});

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
		circles.attr("cx", function (d) { return map.latLngToLayerPoint(d.LatLng).x; })
		circles.attr("cy", function (d) { return map.latLngToLayerPoint(d.LatLng).y; })
		circles.attr("r", function (d) { return 0.2 * Math.pow(2, map.getZoom()); });	
	}
	
	update();
	map.on("moveend", update);
});