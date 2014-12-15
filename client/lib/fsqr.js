
Template.venues.helpers({
	venuesNearby: function(){
		var userId = Meteor.userId();
		if (!Meteor.user().profile.foursquareId)
			return;
		if (!userId) {return} ;
		var callFsqr;
		var venues;
		var query = {}
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		var userLocation = Session.get('userLocation');
		if (!userLocation) {
			userLocation = UserPlaces.findOne({userId: userId},{sort: {timestamp: -1}});
//			if (userLocation)
//				Session.set('userLocation', userLocation);
		}
		var userLocation = Session.get('userLocation');
		if (!userLocation)  
			return ;
		if (!userLocation.location)  
			return ;	
		if (!userLocation.location.coords)  
			return ;				
		console.log('venuesNearby 1 ', userLocation.location.coords);
		var coords = userLocation.location.coords;
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;

		var radius_search = 0.1;
		latup = coords.latitude + radius_search;
		latdown = coords.latitude - radius_search;
		lngup = coords.longitude + radius_search;
		lngdown = coords.longitude - radius_search;
//		var venues = VenuesCache.find({'location.lat': /42.*/,'location.lng': /87.*/});
		var venues = VenuesCache.find({'location.lat': { $gt: latdown, $lt: latup }, 'location.lng': { $gt: lngdown, $lt: lngup }});
		console.log('venuesNearby 1.3 found venues in VenuesCache ', coords.latitude, coords.longitude, venues.count());

		if (!venues.length) {
			console.log('venuesNearby 2 lets call ', venues.fetch());
			callFsqr = true;
		} 
		var timediff = moment().valueOf() - Session.get('fsqrStamp');
		if (Session.get('fsqrStamp')) {
			var timediff = moment().valueOf() - Session.get('fsqrStamp');
			if (timediff > 10000)
				Session.set('fsqrStamp', false);
		}
		console.log('venuesNearby 5 ', coords, query.what, callFsqr, timediff, venues.fetch());	
		if ((callFsqr) && Session.get('fsqrStamp')) {
			Session.set('fsqrStamp', moment().valueOf());
/* 			venues = Meteor.call('venuesFsqr', userId, coords, query, function(err, results) {
				console.log('Meteor.call venuesFsqr', results);
//				Session.set('fsqrStamp', false);
				return results;
			}); */
			console.log('Meteor.call outside venuesFsqrNearby', venues);
		}
		console.log('Meteor.call event after venuesFsqr', userLocation.place_id, venues);
		if (!venues)
			return	
		return venues;
	},
});

Template.venuesSelected.helpers({	
	venuesSelected: function(){
		var userId = Meteor.userId();
		if (!userId) {return} ;
		if (!Meteor.user().profile.foursquareId)
			return;
		var venues;
		var callFsqr;
		var query = {}
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		var userLocation = Session.get('userLocation');
		if (!userLocation)
			return;
		console.log('venuesSelected 1 ', userLocation);
		var place = Places.findOne({place_id: userLocation.place_id});
		if (!place)
			return;
		var coords = userLocation.location.coords;
		if (place.name) {
			var name = place.name;
			name = name.split(" ");
			if (name[0] == 'The') {
				query.what = name[1];
			} else {
				query.what = name[0];
			}
			query.radius = 50;
			console.log('venuesSelected 1.2 looking for ', name, query);
		}
		if (Session.get('fsqrStamp')) {
			var timediff = moment().valueOf() - Session.get('fsqrStamp');
			if (timediff > 10000)
				Session.set('fsqrStamp', false);
		}
		console.log('venuesNearby 5 ', coords, query.what, timediff, Session.get('fsqrStamp'));	
		if (!Session.get('fsqrStamp')) {
			console.log('venuesNearby 6 calling fsqr ', coords, query.what, callFsqr, timediff);	
			Session.set('fsqrStamp', moment().valueOf());
/* 			var venues = Meteor.call('venuesFsqr', userId, coords, query, function(err, results) {
				console.log('Meteor.call venuesFsqr', results);
//				Session.set('fsqrStamp', false);
				return results;
			}); */
			console.log('Meteor.call outside venuesFsqr', venues);
		}		
		console.log('Meteor.call event after venuesFsqr', userLocation.place_id, venues);
		if (!venues)
			return	
		return venues;
		
	},
});


Template.venues.events({
	"click .updatevenues": function (event, template) {
		var userId = Meteor.userId();
		if (!Meteor.userId()) {
			return;
		}
		if (!Meteor.user().profile.foursquareId)
			return;

		var userLocation = Session.get('userLocation');
		var query = {};
		var venues;	

		if (!userLocation) {
			var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;
		} else {
			var place_id = userLocation.place_id;
			query.what = name.substr(0,name.indexOf(' '));
			query.radius = 200;
		}
		console.log('updatevenues events ', query.what, userLocation );
		if (!userLocation.location)
			return;
		if (!userLocation.location.coords)
			return;
		var coords = userLocation.location.coords;
/* 		Meteor.call('removevenuesFsqr', userId, userLocation, query, function(err, results) {
			console.log('Meteor.call event removevenuesFsqr', userLocation.name, results);
			return results;
		}); */
		
		venues = Meteor.call('venuesFsqr', userId, coords, function(err, results) {
			console.log('Meteor.call event venuesFsqr', userLocation.place_id, results);
			return results;
		});
		console.log('Meteor.call event after venuesFsqr', userLocation.place_id, venues);
		if (!venues)
			return	
		return venues;
	},
	


});

