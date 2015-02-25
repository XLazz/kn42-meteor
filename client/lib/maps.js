Template.showMapPlace.helpers({
	debug: function () {
		return Session.get('debug');
	},

  placeMapOptions: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
			console.log('GoogleMaps loaded', this);
			var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
//			GoogleMaps.initialize();
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('placeMap', function(map) {
				
        // Add a marker to the map once it's ready
				
				if (Session.get('debug'))
					console.log('GoogleMaps ready loading markers ', userPlace, this);

				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(userPlace.location.coords.latitude,userPlace.location.coords.longitude),
					map: map.instance,
					title: userPlace.place_id
				});	
				if (Session.get('debug'))
					console.log ('adding marker ', marker);
      });

      // Map initialization options
      return {
        center: new google.maps.LatLng(userPlace.location.coords.latitude, userPlace.location.coords.longitude),
        zoom: 18
      };
    } else {
			console.log('GoogleMaps not yet loaded');
			GoogleMaps.load();
//			GoogleMaps.load({ v: '3', key: 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA' });
			
		}
  }
});