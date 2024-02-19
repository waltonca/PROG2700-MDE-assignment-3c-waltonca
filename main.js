// IIFE
(() => {

    //create map in leaflet and tie it to the div called 'theMap'
    let map = L.map('theMap').setView([44.650627, -63.597140], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

    // Add a custom bus icon for the marker
    let busIcon = L.icon({
        iconUrl: 'bus.png',
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50]
    });

    let geojsonLayer = L.geoJson(null, {
        pointToLayer(feature, latlng) {
            return L.marker(latlng, { icon: busIcon , rotationAngle: `${feature.properties.rotationAngle}`});
        },
        onEachFeature(feature, layer) {
            if (feature.properties && feature.properties.popupContent) {
                layer.bindPopup(feature.properties.popupContent);
            }
        }
    }).addTo(map);

    let isFetching = false; 

    function fetchBusData() {
        // next need to fetch real time transit data of bus, use this api https://prog2700.onrender.com/hrmbuses
        if (isFetching) {
            return; // if we are fetching data, then do nothing, even if the function is called again
        }
        isFetching = true; // set the flag to true to indicate that we are fetching data
        fetch('https://prog2700.onrender.com/hrmbuses')
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);
                // Filter the resulting data so that you keep buses on routes 1-10 only.
                let filteredData = data.entity.filter((bus) => {
                    return Number(bus.vehicle.trip.routeId) >= 1 && Number(bus.vehicle.trip.routeId) <= 10;
                });
                console.log(filteredData);

                // I need this to attach the popup to the marker
                function onEachFeature(feature, layer) {
                    // does this feature have a property named popupContent?
                    if (feature.properties && feature.properties.popupContent) {
                        layer.bindPopup(feature.properties.popupContent);
                    }
                }

                // convert raw data into GEOJSON format
                // here is the sample data
                // var geojsonFeature = {
                //     "type": "FeatureCollection",
                //     "features": [
                //       {
                //         "type": "Feature",
                //         "geometry": {
                //           "type": "Point",
                //           "coordinates": [-63.54113006591797, 44.681758880615234]
                //         },
                //         "properties": {
                //           "name": "route 1",
                //           "popupContent": "This is where the Rockies play!"
                //         }
                //       },
                //       {
                //         "type": "Feature",
                //         "geometry": {
                //           "type": "Point",
                //           "coordinates": [-63.57884979248047, 44.676239013671875]
                //         },
                //         "properties": {
                //           "name": "route 1",
                //           "popupContent": "This is where the Rockidedeede !"
                //         }
                //       }
                //     ]
                // }
                let features = filteredData.map(item=>{
                    return {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [item.vehicle.position.longitude, item.vehicle.position.latitude]
                        },
                        "properties": {
                            "name": `route ${item.vehicle.trip.routeId}`,
                            "popupContent": `This is route :${item.vehicle.trip.routeId}!\n
                            The start date is ${item.vehicle.trip.startDate}!\n
                            Time is :${new Date(item.vehicle.timestamp * 1000).toDateString()}
                            `,
                            "rotationAngle": item.vehicle.position.bearing
                        }
                    }
                
                });

                let geojsonFeature = {
                    "type": "FeatureCollection",
                    "features": features
                }

                geojsonLayer.clearLayers(); // Clear existing markers, in case always add new markers
                geojsonLayer.addData(geojsonFeature); // Add new markers

                isFetching = false; // reset the flag after the fetch is complete
                
            })
            .catch((err) => {
                console.log(err);
                isFetching = false; // reset the flag if there is an error during the fetch
            })
    }


    // auto refresh the map
    fetchBusData();
    setInterval(fetchBusData, 15000);

})()