Template.claimPlace.helpers({
  sTypes: function () {
/*     return [
      {label: "2013", value: 2013},
      {label: "2014", value: 2014},
      {label: "2015", value: 2015}
    ]; */
    return PlaceServices.find({},{sort:{type:1}}).map(function (c) {
      return {label: c.type, value: c._id};
    });
  },
	coords: function () {
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
/* 		var result = GeoLog.findOne(userPlace.geoId);
		
		console.log('current userLocation ', userPlace.geoId, userPlace, result);
		if (result) {
		//Getting coords from Geolog
			var coords = result.location.coords;
		} else {
			var coords = userPlace.location.coords;
		} */
//		coords2 = results.location.coords.latitude + ',' + result.location.coords.longitude;
		var coords = userPlace.location.coords;
		console.log('current userPlace ', coords, userPlace);
		coords.latitude_harsh = parseFloat(coords.latitude).toFixed(4);
		coords.latitude = parseFloat(coords.latitude);
		coords.longitude_harsh = parseFloat(coords.longitude).toFixed(4);
		coords.longitude = parseFloat(coords.longitude);
		return coords;
	},
	place_id: function () {
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		var place_id = userPlace.place_id;
		return place_id;
	},
	userId: function(){
		return Meteor.userId();
	},
	created: function(){
		return new Date();
	},
});

Template.claimPlace.events({
	'submit form': function(event){
		Overlay.hide();
	},
});

AutoForm.addHooks("claimPlace", {
  onError: function () {
    console.log("onError hook called with arguments", arguments);
    console.log("onError hook context:", this);
  },
  onSuccess: function () {
    console.log("onSuccess hook called with arguments", arguments);
    console.log("onSuccess hook context:", this);
		Overlay.hide();
  },
});


AutoForm.addHooks(null, {
/*   onError: function () {
    console.log("onError hook called with arguments", arguments);
    console.log("onError hook context:", this);
  },
	onSuccess: function () {
		console.log("onSuccess on all input/update/method forms!", arguments, this);
//		event.preventDefault();
		Overlay.hide();
	},
	after: {
		insert: function(error, result) {
			if (error) {
				console.log("Insert Error:", error);
			} else {
				console.log("Insert Result:", result);
			}
		},
		update: function(error, result) {
			if (error) {
				console.log("Update Error:", error, this);
			} else {
				console.log("Updated!", result, this);
			}
		}
	} */
});

Template.claimedPlaces.helpers({
  isAdmin: function() {
    return Meteor.user() && Meteor.user().admin;
  },
  
  claimed: function() {
		var userId = Meteor.user();
		//userId: userId
		var claimedId = Session.get('claimedId');
		var claimed = ClaimedPlaces.findOne(claimedId);
		console.log(' claimedId ', claimedId, claimed);
		return claimed;
  },
	experiences: function(){
		userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		var services = Experiences.findOne({ userId: userId });
		console.log('experiences Experiences ', userLocation._id, Session.get('userLocation'), services);
		return services;
		if (services.count()) {
			console.log('experiences Experiences return ', services.fetch());
			return services;
		}
		var services = Services.find({place_id: userLocation.place_id});
		console.log('experiences Services ',userLocation.place_id, services.fetch());
		if (services.count()) {
			return services;
		}
	},
});

Template.claimedPlaces.events({
  'submit form': function(event) {
    event.preventDefault();
		Overlay.hide();

/*     var text = $(event.target).find('[name=text]').val();
    ClaimedPlaces.insert({ name: text, date: new Date });

    alert('Saved latest news'); */
  },
});

Template.showMapClaim.helpers({
	debug: function () {
		return Session.get('debug');
	},
  claimedMapOptions: function() {
		var location;
    // Make sure the maps API has loaded
		if (Session.get('claimedId')) {
			location = ClaimedPlaces.findOne(Session.get('claimedId'));			
		} 
		if (location) {
			var name = location.name;
		} else {
			var place = UserPlaces.findOne(Session.get('userPlaceId'));
			location = place.location;
			var name = place.name;
		}
		
		GoogleMaps.load();
    if (GoogleMaps.loaded()) {
			console.log('GoogleMaps loaded');
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('claimedMap', function(map) {
				console.log('GoogleMaps ready loading markers ', location);
        // Add a marker to the map once it's ready

				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(location.coords.latitude,location.coords.longitude),
					map: map.instance,
					title: 'Name: ' + name 
				});	
				console.log ('adding marker ', marker);

      });
      // Map initialization options
      return {
        center: new google.maps.LatLng(location.coords.latitude, location.coords.longitude),
        zoom: 16
      };
    } else {
			GoogleMaps.load();
//			GoogleMaps.load({ v: '3', key: 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA' });
			console.log('GoogleMaps not yet loaded');
		}
  }
});

AutoForm.addHooks("claimedPlaces", {
  onError: function () {
    console.log("onError hook called with arguments", arguments);
    console.log("onError hook context:", this);
  },
  onSuccess: function () {
    console.log("onSuccess hook called with arguments", arguments);
    console.log("onSuccess hook context:", this);
		Overlay.hide();
  },
});