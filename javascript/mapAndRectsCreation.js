//initialize the map
L.mapbox.accessToken = 'pk.eyJ1IjoiY2hlbnhpMTAyMSIsImEiOiJjaW81czVsb3UwMjAxdzNrandidHF3eTl3In0.KscIyN8_aLsmYzW3LSHLfA';

var map = L.mapbox.map('map', 'mapbox.streets').setView([34, 116], 4);

var svg = d3.select("#blank").append("svg").attr("height", height).attr("width", width);

var height = 500;
var width = 900;
var padding = 50;

var months, AQI, cities;
var monthInfo, AQIInfo, cityInfo;

var xScale;
var yScale;


var pollutionLevel = {green: 50, yellow: 100, lightRed: 150, darkRed: 200, purple: 300};
var pollutionLevelValue = [50, 100, 150, 200, 300];
//for a specific city, put the name as key and a array of 365 data as values
var cityDailyAQIObj = {};



var svgRect = d3.select("#rectPlot");

var choice; // The city that is choosen on the map

var cityIcon = L.Icon.extend({
    options: {
        iconSize:     [38, 95],
        shadowSize:   [50, 64],
        iconAnchor:   [22, 94],
        popupAnchor:  [-3, -76],
        labelAnchor:  [6, 0]
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

		//load the daily data 
		var curCityName = "";
		var curCityValuesForYear = [];

		d3.csv("data/AllCities_English_CSV.csv", function (error, data) {
			if(error) console.log(error);
			curCityName = data[0].City;
			console.log("first city: "+curCityName);
			data.forEach( function (d){
				if(d.City !== curCityName){
					var curArray = curCityValuesForYear;
					var city = d.City;

					console.log(city);
					//put the city and its data into the object
					cityDailyAQIObj[""+city] = curArray;

					//initialize for next city
					curCityValuesForYear = [];
					curCityName = d.City;
					curCityValuesForYear.push(d.AQI);
				}

				else{
					curCityValuesForYear.push(d.AQI);
				}

			});
			//now I've got all cites with 1 year data everyday
			// console.log(cityDailyAQIObj);
			
		});

	});

});


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
			marker.addTo(map);

			marker.on("click", function () {
				console.log(this._popup.getContent());
				var cityName = this._popup.getContent();

				//get the data of the whole year by city name
				var cityDailyAQI = cityDailyAQIObj[""+cityName];
				var percentageOfDaysInDifferentLevels = getPercentageOfDaysInDifferentLevels(cityDailyAQI);
				console.log(percentageOfDaysInDifferentLevels);
				//now draw the donut chart
				drawDonutChart(percentageOfDaysInDifferentLevels);

			});
			
		}	
	});
}

function drawDonutChart(inputDataArray){
	d3.selectAll("#donutChartDiv svg").remove();
	var donutChartSvg = d3.select("#donutChartDiv").append("svg").attr("id","donutChartSvg").append("g");

	donutChartSvg.append("g")
		.attr("class", "slices");
	donutChartSvg.append("g")
		.attr("class", "labels");
	donutChartSvg.append("g")
		.attr("class", "lines");

	var width = 960,
        height = 450,
        radius = Math.min(width, height) / 2;
	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) {
			return d.value;
		});

	var arc = d3.svg.arc()
		.outerRadius(radius * 0.8)
		.innerRadius(radius * 0.4);
	var outerArc = d3.svg.arc()
		.innerRadius(radius * 0.9)
		.outerRadius(radius * 0.9);
    

	donutChartSvg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	var key = function(d){ 
		console.log("in key func, return"+d.data.label);
		return d.data.label; 
	};

	var color = d3.scale.ordinal()
	.domain(["Excellent", "Good", "Light pollution", "Moderate Pollution", "Severe Pollution", "Very Severe"])
	.range(["#00FF00", "#FFFF00", "#7FF9933", "#FF0033", "#CC0000", "#660066"]);

	function processData(){
		var labels = color.domain();
		return labels.map(function (label){
			var index = labels.indexOf(label);
			var keys = Object.keys(inputDataArray);
			var key = keys[index];
			var value = inputDataArray[""+key];
			console.log( value );
			//console.log(inputDataArray);
			return { label: label, value: value };
		})
	}
	var data1 = processData();
	console.log(pie(data1));

	/* ------- PIE SLICES -------*/
	var slice = donutChartSvg.select("#donutChartSvg .slices").selectAll("#donutChartSvg path.slice")
		.data(pie(data1), key);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { 
			return color(d.data.label); 
		})
		.attr("class", "slice");

	slice.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return arc(interpolate(t));
			};
		})

	slice.exit().remove();

	/* ------- TEXT LABELS -------*/

	var text = donutChartSvg.select(".labels").selectAll("text")
		.data(pie(data1), key);

	text.enter()
		.append("text")
		.attr("dy", ".35em")
		.text(function(d) {
			return d.data.label;
		});
	
	function midAngle(d){
		return d.startAngle + (d.endAngle - d.startAngle)/2;
	}

	text.transition().duration(1000)
		.attrTween("transform", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate("+ pos +")";
			};
		})
		.styleTween("text-anchor", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start":"end";
			};
		});

	text.exit()
		.remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/

	var polyline = donutChartSvg.select("#donutChartDiv .lines").selectAll("#donutChartDiv polyline")
		.data(pie(data1), key);
	
	polyline.enter()
		.append("polyline");

	polyline.transition().duration(1000)
		.attrTween("points", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [arc.centroid(d2), outerArc.centroid(d2), pos];
			};			
		});
	
	polyline.exit().remove();

}

function getPercentageOfDaysInDifferentLevels(aqiValuesArray){
	var greenDays = 0;
	var yellowDays = 0;
	var orangeDays = 0;
	var lightRedDays = 0;
	var darkRedDays = 0;
	var purpleDays = 0;
	
	aqiValuesArray.forEach(function (d){
		if(d <= pollutionLevel.green) greenDays++;
		else if(d<= pollutionLevel.yellow) yellowDays++;
		else if(d<= pollutionLevel.ornage) orangeDays++;
		else if(d<= pollutionLevel.lightRed) lightRedDays++;
		else if(d<= pollutionLevel.darkRed) darkRedDays++;
		else purpleDays++;
	});

	// calculate the percentage
	var sumNumber = aqiValuesArray.length;
	var percentageOfDays = { greenPercent: greenDays/sumNumber, yellowPercent:yellowDays/sumNumber,
		orangePercent: orangeDays/sumNumber,  lightRedPercent: lightRedDays/sumNumber, 
		darkRedPercent: darkRedDays/sumNumber, purplePercent: purpleDays/sumNumber };

	return percentageOfDays;
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
	for(var i=0; i<pollutionLevelValue.length; i++){
		if( aqiLevel<= pollutionLevelValue[i] ) return i;
	}
	return pollutionLevelValue.length;
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
	
	
