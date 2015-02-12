CheckedFsqr = function(userPlaceId){
	var userPlace =  UserPlaces.findOne(userPlaceId);
	if (!userPlace)  
		return ;
	
	if (userPlace.foursquareId) {
		var checkedFsqr = CheckinsFsqr.findOne({
				id: userPlace.foursquareId
			},{	
				limit: 1, sort: {createdAt: -1},
				transform: function(doc){
	//				doc.timestamp = doc.timestamp+300*60;
					doc.date = moment(doc.createdAt*1000).format("MM/DD/YY HH:mm");
					return doc;
				}
			}
		);
//		console.log('function checkedFsqr 1 ', userPlace, checkedFsqr);
		if (checkedFsqr)
			return checkedFsqr;				
	}
	
	if (!userPlace.timestampEnd)
		userPlace.timestampEnd = moment().valueOf();
	console.log('function checkedFsqr 0.5 ', userPlace.foursquareId);
	var timestampFsqr;
	var nameFsqr;
		
	var checkedFsqr = CheckinsFsqr.findOne({
			userId: Meteor.userId(),	
			createdAt: { $gt: userPlace.timestamp/1000+300*60, $lt: userPlace.timestampEnd/1000+300*60}	
		},{	
			limit: 1, sort: {createdAt: -1},
			transform: function(doc){
//				doc.timestamp = doc.timestamp+300*60;
				doc.date = moment(doc.createdAt*1000).format("MM/DD/YY HH:mm");
				return doc;
			}
		}
	);

	console.log('function checkedFsqr 2 ', userPlace, checkedFsqr);
	if (checkedFsqr) {
		UserPlaces.update(userPlaceId, {$set: {foursquareChk: checkedFsqr.id, foursquareId: checkedFsqr.venue.id}});
		return checkedFsqr;
	}
}

CheckinFsqr = function(userLocationId){
	if (!userLocationId)  
		return ;
	var userLocation =  UserPlaces.findOne(userLocationId);
	if (!userLocation)  
		return ;
	if (!userLocation.location)  
		return ;	
	if (!userLocation.location.coords)  
		return ;				
	console.log('checkinFsqr 1 ', userLocation.location.coords);
	var coords = userLocation.location.coords;
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;

	var radius_search = 0.1;
	latup = coords.latitude + radius_search;
	latdown = coords.latitude - radius_search;
	lngup = coords.longitude + radius_search;
	lngdown = coords.longitude - radius_search;
	var checkinFsqr = VenuesCache.findOne({'location.lat': { $gt: latdown, $lt: latup }, 'location.lng': { $gt: lngdown, $lt: lngup }});
	console.log('checkinFsqr 2 ', userLocationId, checkinFsqr);
	if (checkinFsqr)
		return checkinFsqr;		
}

GetCheckinsFsqr = function(){
	var userPlaceId = this._id;
	console.log('GetCheckinsFsqr function ', this._id);
	var venues = Meteor.call('checkinsFsqr', Meteor.userId(), userPlaceId, function(err, results) {
		console.log('Meteor.call checkinsFsqr', results);
		return results;
	});
}

loadFsqr = function(userLocationId){
//			if (userLocation)
//				Session.set('userLocation', userLocation);
	console.log('venuesNearby 0 ', userLocationId);
	if (!userLocationId)  
		return ;
	var userLocation =  UserPlaces.findOne(userLocationId);
	if (!userLocation)  
		return ;
	if (!userLocation.location)  
		return ;	
	if (!userLocation.location.coords)  
		return ;				
	console.log('venuesNearby 1 ', userLocation.location.coords);
	var coords = userLocation.location.coords;
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;
	var query = {};

	var venues = Meteor.call('venuesFsqr', Meteor.userId(), coords, query, function(err, results) {
		console.log('Meteor.call venuesFsqr', results);
		return results;
	});
}

goFsqr = function(venueId){
//			if (userLocation)
//				Session.set('userLocation', userLocation);
	console.log('goFsqr 0 ', venueId);
	var venues = Meteor.call('goFsqr', Meteor.userId(), venueId, function(err, results) {
		console.log('Meteor.call goFsqr', results);
		return results;
	});
}
			
Template.venues.helpers({
	ifDebug: function(){
		return Session.get('debug');
	},	
	checkedFsqr: function(){
		console.log('venues checkedFsqr 1 ', this._id, this);
		var checkedFsqr = CheckedFsqr(this._id);
		console.log('venues checkedFsqr 2 ', this._id, checkedFsqr);
		return checkedFsqr;
	},

	checkinFsqr: function(){
		var checkinFsqr = CheckinFsqr(this._id);
		return checkinFsqr;
	},
	
	findFsqr: function(){
		var userLocation = this._id;
		var venue = loadFsqr(userLocation);
		console.log(' findFsqr ', venue);
		return venue;
	},
	
});

Template.venuesSelected.helpers({	
	ifDebug: function(){
		return Session.get('debug');
	},	
	getCheckinsFsqr: function() {
		console.log('venuesSelected GetCheckinsFsqr ');
		GetCheckinsFsqr();
	},
	
	checkedFsqr: function(){
		console.log('venuesSelected checkedFsqr ', this._id, this);
		var checkedFsqr = CheckedFsqr(this._id);
		return checkedFsqr;
	},

	checkinFsqr: function(){
		var checkinFsqr = CheckinFsqr(this._id);
		return checkinFsqr;
	},
	
	findFsqr: function(){
		var userLocation = this._id;
		var venue = loadFsqr(userLocation);
		console.log(' findFsqr ', venue);
		return venue;
	},
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

Template.venuesSelected.events({
	'click #checkFsqr': function(event, template) {
		console.log('clicked checkFsqr ', this._id);
/* 		Meteor.call('checkinsFsqr',  Meteor.userId(), this._id, function(err,results){
			console.log('checkinsFsqr call result ', results[0].venue);
		}); */
		var query = {};
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		userLocation = this._id;
		var venue = loadFsqr(userLocation);
		return venue;
	},
	'click .goFsqr': function(event, template) {
		console.log('clicked goFsqr ', this._id, this, $(event.currentTarget).attr("id"));
/* 		Meteor.call('checkinsFsqr',  Meteor.userId(), this._id, function(err,results){
			console.log('checkinsFsqr call result ', results[0].venue);
		}); */
		
		var venueId = $(event.currentTarget).attr("id");
		var venue = goFsqr(venueId);
		return venue;
	},
});
