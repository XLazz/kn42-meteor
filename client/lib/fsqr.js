CheckedFsqr = function(userPlaceId){
	var userPlace =  UserPlaces.findOne(userPlaceId);
	if (!userPlace)  
		return ;
	
	if (userPlace.foursquareChk) {
		var checkedFsqr = VenuesCheckins.findOne({
				id: userPlace.foursquareChk
			},{	
				limit: 1, sort: {createdAt: -1},
				transform: function(doc){
	//				doc.timestamp = doc.timestamp+300*60;
					doc.createdDate = moment(doc.createdAt*1000).format("MM/DD/YY HH:mm");
//					console.log('checkedFsqr inside ', doc);
					var venueFsqr = VenuesFsqr.findOne({id: doc.venueId});
					if (venueFsqr)
						doc.name = venueFsqr.name;
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
		
	var checkedFsqr = VenuesCheckins.findOne({
			userId: Meteor.userId(),	
			createdAt: { $gt: userPlace.timestamp/1000, $lt: userPlace.timestampEnd/1000}	
		},{	
			limit: 1, sort: {createdAt: -1},
			transform: function(doc){
				var timestamp = moment(userPlace.timestamp).format("MM/DD/YY HH:mm");
				var timestampEnd = moment(userPlace.timestampEnd).format("MM/DD/YY HH:mm");
				doc.date = moment(doc.createdAt*1000).format("MM/DD/YY HH:mm");
				var venueFsqr = VenuesFsqr.findOne({id: doc.venueId});
				if (venueFsqr)
					doc.name = venueFsqr.name;
//				console.log('inside  VenuesCheckins.findOne ', timestamp, timestampEnd, doc.date, doc);
//				doc.timestamp = doc.timestamp+300*60;
				return doc;
			}
		}
	);

//	console.log('function checkedFsqr 2 ', userPlace, checkedFsqr);
	if (checkedFsqr) {
		UserPlaces.update(userPlaceId, {$set: {foursquareChk: checkedFsqr.id}});
		return checkedFsqr;
	}
}

CheckinFsqr = function(userLocationId, radius_search){
	if (!userLocationId)  
		return ;
	var userLocation =  UserPlaces.findOne(userLocationId);
	if (!userLocation)  
		return ;
	if (!userLocation.location)  
		return ;	
	if (!userLocation.location.coords)  
		return ;				
//	console.log('checkinFsqr 1 ', userLocation.location.coords);
	var coords = userLocation.location.coords;
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;

	var radius_search = Session.get('radius_search');
	if (!radius_search) {
		var radius_search = 0.005;
		Session.set('radius_search', radius_search);
	}
	var latup = parseFloat(coords.latitude) + radius_search;
	var latdown = parseFloat(coords.latitude) - radius_search;
	var lngup = parseFloat(coords.longitude) + radius_search;
	var lngdown = parseFloat(coords.longitude) - radius_search;
	var checkinFsqr = VenuesCache.find(
		{'location.lat': { $gte: latdown, $lte: latup }, 'location.lng': { $gte: lngdown, $lte: lngup }},
		{
			transform: function(doc){	
				doc.distance = calculateDistance(doc.location.lat, doc.location.lng, coords.latitude, coords.longitude);
				doc.distance = Math.round(doc.distance * 100) / 100;
//				console.log('checkinFsqr inside ', doc.distance, doc);
				return doc;
			},
			sort: {distance: -1}
		}	
	);
	console.log('checkinFsqr 2 ', userLocationId, checkinFsqr.fetch(), latdown, latup, lngdown, lngup);
	if (checkinFsqr.fetch()) {
		checkinFsqr = checkinFsqr.fetch();
		checkinFsqr.radius_search = radius_search;
		return checkinFsqr;		
	}
}

GetVenuesCheckins = function(){
	var userPlaceId = this._id;
	console.log('GetVenuesCheckins function ', this._id);
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
	var userPlaceId = this._id;
	console.log('goFsqr 0 ', venueId);
	var venues = Meteor.call('goFsqr', Meteor.userId(), userPlaceId, venueId, function(err, results) {
		console.log('Meteor.call goFsqr', venueId, results);
		return results;
	});
}
			
Template.venues.helpers({
	ifDebug: function(){
		return Session.get('debug');
	},	
	checkedFsqr: function(){
//		console.log('venues checkedFsqr 1 ', this._id, this);
		var checkedFsqr = CheckedFsqr(this._id);
//		console.log('venues checkedFsqr 2 ', this._id, checkedFsqr);
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
/* 	getVenuesCheckins: function() {
		console.log('venuesSelected GetVenuesCheckins ');
		GetVenuesCheckins();
	}, */
	
	checkedFsqr: function(){
		var currentLoc = this;
		var checkedFsqr = CheckedFsqr(this._id);
		console.log('checkedFsqr 1 ', checkedFsqr, this._id, this);
		return checkedFsqr;
	},
	checkinFsqr: function(){
		console.log('checkinFsqr session ', Session.get('selectFsqr'));
		if (Session.get('selectFsqr')){
			var checkinFsqr = VenuesCache.findOne({id:Session.get('selectFsqr')});
			if (!checkinFsqr)
				Session.set('selectFsqr', false);
			return checkinFsqr;
		}
		var checkinFsqr = CheckinFsqr(this._id);
		venueNum = 0;
		console.log('checkinFsqr 3 ', venueNum, Session.get('venueNum'), checkinFsqr[venueNum], checkinFsqr);
		return checkinFsqr[0];
	},
	findFsqr: function(){
		var userLocation = this._id;
		var venue;
//		var venue = loadFsqr(userLocation);
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
	'click .checkFsqr': function(event, template) {
		console.log('clicked checkFsqr ', this._id);
		userLocation = this._id;
		var venue = loadFsqr(userLocation);
		return venue;
	},
	'click .otherFsqr': function(event, template) {
		Session.set('selectFsqr', false);
		console.log('clicked otherFsqr ', this._id);
		Overlay.show('selectFsqr');	
		return venue;
	},
	'click .goFsqr': function(event, template) {
		// we are checking in Fsqr
		console.log('clicked goFsqr ', this._id, this, $(event.currentTarget).attr("id"));
		var venueId = $(event.currentTarget).attr("id");
		var venue = goFsqr(venueId);
		if (venue.meta.code == 200)
			Session.set('note', true);
		return venue;
	},
});

Template.selectFsqr.helpers({

	wait: function(){
		console.log('wait initiated ', Session.get('searching'));
		if (Session.get('searching') == true) {
			console.log('Session searching', Session.get('searching'));
//			return {'wait': Session.get('searching')};
		}
		return;
	},
	radius: function(){
		return Session.get('radius_search');
	},
	venues: function(){
		userId = Meteor.userId();
		var userLocation = UserPlaces.findOne({userId: userId},{sort: {timestamp: -1}});
		var venues = CheckinFsqr(userLocation._id);
		return venues;
	},
});

Template.selectFsqr.events({
	'click .cancel': function(event, template) {
		console.log('selectPlace click .cancel ', this);
		// Session.set("showCreateDialog", false);
		Session.set('searching', false);
		Session.set('changeplace', false);
		Session.set('radius_search', false);
		Overlay.hide();
	},
	
	"click .elsewhere": function (event, template) {
		
//		Session.set('gotPlaces', gotPlaces);	

		var radius_search = 2*Session.get('radius_search');
		Session.set('radius_search', radius_search);
		var elsewhere = 1;
		console.log('selectPlace events elsewhere outside ', this );
//		LoadPlaces();
		return;
	},

	"click .setlocations": function (event, template) {
		var userId = Meteor.userId();
		console.log('selectFsqr events select ', this.id, this.name );
		Session.set('selectFsqr', this.id);
		Session.set('radius_search', false);
//		Session.set("showCreateDialog", true);
		Overlay.hide();
	},

});
