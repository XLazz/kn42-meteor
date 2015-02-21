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

/*     var text = $(event.target).find('[name=text]').val();
    ClaimedPlaces.insert({ name: text, date: new Date });

    alert('Saved latest news'); */
  },
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
AutoForm.addHooks(null, {
	onSuccess: function () {
		console.log("onSuccess on all input/update/method forms!", this);
		Overlay.hide();
	}
});

Template.showMapClaim.helpers({
	debug: function () {
		return Session.get('debug');
	},
  claimedMapOptions: function() {
    // Make sure the maps API has loaded
		var claimedId = Session.get('claimedId');
		var claimed = ClaimedPlaces.findOne(claimedId);
    if (GoogleMaps.loaded()) {
			console.log('GoogleMaps not loaded');
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('claimedMap', function(map) {
				console.log('GoogleMaps ready');
        // Add a marker to the map once it's ready

				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(claimed.coords.latitude,claimed.coords.longitude),
					map: map.instance,
					title: 'Name: ' + claimed.name 
				});	
				console.log ('adding marker ', marker);

      });
      // Map initialization options
      return {
        center: new google.maps.LatLng(claimed.coords.latitude, claimed.coords.longitude),
        zoom: 16
      };
    } else {
//			GoogleMaps.load();
//			GoogleMaps.load({ v: '3', key: 'AIzaSyAQH9WdmrwMKphSHloMai5iYlcS5EsXMQA' });
			console.log('GoogleMaps not yet loaded');
		}
  }
});