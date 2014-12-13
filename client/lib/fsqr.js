
Template.venues.helpers({
	venuesNearby: function(){

		var userId = Meteor.userId();
		if (!userId) {return} ;
		var callFsqr;
		var query = {}
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		var userLocation = Session.get('userLocation');
		if (!userLocation) {
			userLocation = UserPlaces.findOne({userId: userId},{sort: {timestamp: -1}});
			Session.set('userLocation', userLocation);
		}
		var userLocation = Session.get('userLocation');
		if (!userLocation)  {return} ;
		console.log('venuesNearby 1 ', userLocation.location.coords);
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;

		var radius_search = 0.1;
		latup = userLocation.location.coords.latitude + radius_search;
		latdown = userLocation.location.coords.latitude - radius_search;
		lngup = userLocation.location.coords.longitude + radius_search;
		lngdown = userLocation.location.coords.longitude - radius_search;
//		var venues = VenuesCache.find({'location.lat': /42.*/,'location.lng': /87.*/});
		var venues = VenuesCache.find({'location.lat': { $gt: latdown, $lt: latup }, 'location.lng': { $gt: lngdown, $lt: lngup }});
		console.log('venuesNearby 1.3 found venues in VenuesCache ', userLocation.location.coords.latitude, userLocation.location.coords.longitude, venues.count());
/* 		if (venues) {
			console.log('venuesNearby ', venues.foursquare);
			return venues.foursquare;
		} */

		if (!venues) {
			console.log('venuesNearby 2 ', venues.fetch());
			callFsqr = true;
		} else {
			if (!venues.foursquare) {
				console.log('venuesNearby 3 ', venues.fetch());
				callFsqr = true;
			} else {
				console.log('venuesNearby 3.5 ', venues.foursquare);
				if (!venues.foursquare.length) {
					console.log('venuesNearby 3.6 ', venues.foursquare);
					callFsqr = true;
				} else {
//					console.log('venuesNearby 3.7 ', venues.foursquare);
					var name = venues.foursquare[0].name;
					name = name.substr(0,name.indexOf(' '));		
					if (query.what !== name) {				
						console.log('venuesNearby 3.8 ', query.what, venues.foursquare[0]);
						callFsqr = true;
					} else {
						console.log('venuesNearby 3.9 names are same. skipping call ', query.what, venues.foursquare[0].name);
					}
				}
			}
		}
		var timediff = moment().valueOf() - Session.get('fsqrStamp');
		console.log('venuesNearby 5 ', userLocation.geoId, query.what, callFsqr, timediff, venues.fetch());	
//		if ((!venues) && ((Session.get('fsqrStamp') < moment().valueOf() - 10) || (!Session.get('fsqrStamp'))) ) {	
		if ((callFsqr) && ((moment().valueOf() - Session.get('fsqrStamp') > 1000) || (!Session.get('fsqrStamp'))) ) {
			Session.set('fsqrStamp', moment().valueOf());
/* 			venues = Meteor.call('venuesFsqr', userId, userLocation, query, function(err, results) {
				console.log('Meteor.call venuesFsqr', results);
				return results;
			}); */
			console.log('Meteor.call outside venuesFsqr', venues);
		}
		if (venues) {
			return venues;
		}
	},
});

Template.venuesSelected.helpers({	
	venuesSelected: function(){
		var userId = Meteor.userId();
		var callFsqr;
		var query = {}
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		var userLocation = Session.get('userLocation');
		console.log('venuesSelected 1 ', userLocation);
		if (userLocation.name) {
			var name = userLocation.name;
			name = name.split(" ");
			query.what = name[0];
			query.radius = 50;
			console.log('venuesSelected 1.2 looking for ', name, query);
		}
		if (!userId) {return} ;
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;

		var venues = VenuesCache.findOne(
		{
			latitude: userLocation.latitude,
			longitude: userLocation.longitude,
		});
		console.log('venuesSelected 1.3 found venues in VenuesCache ', venues);
/* 		if (venues) {
			console.log('venuesNearby ', venues.foursquare);
			return venues.foursquare;
		} */
		if (!userLocation)  {return} ;
		if (!venues) {
			console.log('venuesSelected 2 ', venues);
			callFsqr = true;
		} else {
			if (!venues.foursquare) {
				console.log('venuesSelected 3 ', venues);
				callFsqr = true;
			} else {
				console.log('venuesSelected 3.5 ', venues.foursquare);
				if (!venues.foursquare.length) {
					console.log('venuesSelected 3.6 ', venues.foursquare);
					callFsqr = true;
				} else {
//					console.log('venuesSelected 3.7 ', venues.foursquare);
					var name = venues.foursquare[0].name;
					name = name.split(" ");
					name = name[0];
					if (query.what !== name) {				
						console.log('venuesSelected 3.8 ', query.what, name, venues.foursquare[0].name);
						callFsqr = true;
					} else {
						console.log('venuesSelected 3.9 names are same. skipping call ', query.what, venues.foursquare[0].name);
					}
				}
			}
		}
		var timediff = moment().valueOf() - Session.get('fsqrStamp');
		console.log('venuesSelected 5 ', userLocation.user_history_location_id, query.what, callFsqr, timediff, venues);	
//		if ((!venues) && ((Session.get('fsqrStamp') < moment().valueOf() - 10) || (!Session.get('fsqrStamp'))) ) {	
		if ((callFsqr) && ((moment().valueOf() - Session.get('fsqrStamp') > 1000) || (!Session.get('fsqrStamp'))) ) {
			Session.set('fsqrStamp', moment().valueOf());
			Meteor.call('venuesFsqr', userId, userLocation, query, function(err, results) {
				console.log('Meteor.call venuesSelected venuesFsqr', results);
				return results;
			});
		}
		if (venues) {
			return venues.foursquare;
		}
	},
});


Template.venues.events({
	"click .updatevenues": function (event, template) {
		var userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		var query = {};
		
		var venues;
		
		if (!Meteor.userId()) {
			return;
		}
		if (!userLocation) {
			var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;
		} else {
			var place_id = userLocation.place_id;
			query.what = name.substr(0,name.indexOf(' '));
			query.radius = 200;
		}
		console.log('updatevenues events ', query.what, userLocation );
/* 		Meteor.call('removevenuesFsqr', userId, userLocation, query, function(err, results) {
			console.log('Meteor.call event removevenuesFsqr', userLocation.name, results);
			return results;
		}); */
		venuse = Meteor.call('venuesFsqrNearby', userId, userLocation, function(err, results) {
			console.log('Meteor.call event venuesFsqr', userLocation.place_id, results);
			return results;
		});
		return venues;
	},
	


});

