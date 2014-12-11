//Let's get getPlaces when location set
LoadPlaces = function(userLocation){
	var userLocation = Session.get('userLocation');
	userId = Meteor.userId();
	radius = Session.get('radius');
	Meteor.call( 'getPlaces', userId, userLocation, radius, function(err,results){
//			console.log('gotPlaces inside MerchantsCache http call for 2 ', userLocation, results);
	});
};

Template.lifelog.helpers({
	ifDebug: function(){
		console.log('ifDebug ', Session.get('debug'));
		if (Session.get('debug')) {
			return 'checked';
		}	else {
			return;
		}
	},
	userId: function(){
		var userId = Meteor.userId();
		return userId;
	},
	showCreateDialog: function () {
		console.log('showCreateDialog kn42 helper ', this);
		return Session.get("showCreateDialog");
	},
	userLocationId: function(){
		return Session.get('userLocation')._id;
	},	
});

Template.lifelog.events({

	
	"click .reloadlocations": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('reloadlocations events ');
		Meteor.call('removeAllLocations', Meteor.userId());
//		Meteor.call('getLocations', Meteor.userId(), 'list');
//		Meteor.call('getLocations','list',function(err,results));
	},
	"click .updatelocations": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('updatelocations events ');
		Meteor.call('getLocations', Meteor.userId(), 'list', function(err, results){
			console.log('getLocations http call ', results);
		});
//		Meteor.call('getLocations','list',function(err,results));
	},
});

Template.showlocations.helpers({
	ifDebug: function(){
//		console.log('ifDebug ', Session.get('debug'));
		return Session.get('debug');
	},
	userId: function(){
		Session.set('elsewhere', false);
		return Meteor.userId();
	},
	latest: function(){
		var merchantLatest = MerchantsCache.findOne({}, {sort: {updated: -1}});
		if (merchantLatest) {
				return merchantLatest.updated;
			}
	},
	
	geologs: function(){
		return GeoLog.find({}, {sort: {timestamp: -1}});
	},
	
	locations: function(){
		if (!Meteor.userId()) {
			return;
		}
		var places;
		var userId = Meteor.userId();
		console.log('locations ',this);
		if (!Session.get('radius')) {
			Session.set('radius', 50);
		}
		places = UserPlaces.find(
			{userId: userId}, 
			{
				sort: {started: -1},
				transform: function(doc){		
					var then = doc.timestamp;
					var now = doc.timestampEnd;
					if (!now) {
						now = moment().valueOf();
					};
					var duration = then - now;
					duration = moment.duration(duration).humanize();
					doc.timespent = duration;
					doc.started = moment(then).format("MM/DD/YY HH:mm");
					doc.finished = moment(now).format("MM/DD/YY HH:mm");
					return doc;
				}
			}
		);
		if (!places){
			console.log('calling php server for json for ', userId );
			Meteor.call('getLocations', userId, 'list', function(err,results){
				console.log('calling php server for json 2 ', results.length);
			});
		} 
		return places;
	},

	geoPlace: function() {
		var place;
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		place = Places.findOne({place_id: this.place_id});
//		console.log('geoPlace ', this, this.place_id, place);
		return place;
	},
	
	geoMerchant: function() {
		var userId = Meteor.userId();
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = MerchantsCache.findOne({'place_id': this.place_id});
		return place;
		
		if (!place) {
			var radius = 50;
			console.log('getGLoc call 0 ', userId, this, radius);
			Meteor.call('getGLoc', userId, this.location, radius, function(err, results) {
				console.log('getGLoc call 1 ', results);
				return results;
			});
		} else {
			if (!Session.get('userLocation')) {
				Session.set('userLocation', place);
			}
		}
//		console.log('geoMerchant ', this, this.place_id, place);
		return place;
	},	
	
	'showExp': function(){
		return Session.get('showExp');
	},
	
	updated: function() {
//		Meteor.setInterval(Meteor.call('getLocations','list'), 1000000);	
	}
});

Template.showlocations.events({

	"click .selectplace": function (event, template) {
		var userId = Meteor.userId();
		var radius = 50;
		var userLocationId = $(event.currentTarget).attr("id");
		var userLocation = UserPlaces.findOne(userLocationId);
		
		var place = Places.findOne({place_id: userLocation.place_id});
		if (!place)
			place = MerchantsCache.findOne({place_id: userLocation.place_id});
			
		console.log('click on div before call ', userLocation.place_id, userLocationId, userLocation, place.name);
		
/* 		if (!place) {
			Meteor.call('getGLoc', userId, this.location, radius, function(err, results) {
				console.log('getGLoc events call 1 ', results);
				return results;
			});
			return;
		} */

		if (!place){
			Meteor.call('getGPlace', userLocation.place_id, function(err, results) {
				console.log('getGPlace events call 1 ', results);
				return results;
			});
		} else {
//			console.log('click on div before call 2 ', userLocation.place_id, userLocationId, userLocation, place.name);
		}
		Session.set('userLocation', userLocation);
		
//		Session.get('userLocationId');
	},	

	'click .cancel': function(event, template) {
		console.log('showlocations click .cancel ', this);
		Session.set('searching', false);
	}
});

Template.selectPlace.helpers({

	wait: function(){
		console.log('wait initiated ', Session.get('searching'));
		if (Session.get('searching') == true) {
			console.log('Session searching', Session.get('searching'));
//			return {'wait': Session.get('searching')};
		}
		return;
	},
	places: function(){
		var location;
		var radius = 30;
		var userLocation = Session.get('userLocation');
		console.log('places selectPlace ', userLocation.location, Session.get('elsewhere'), this);
		
		gotPlaces = MerchantsCache.find({'coords.latitude': userLocation.location.coords.latitude, 'coords.longitude': userLocation.location.coords.longitude, 'googlePlace.place_id': {$exists: true }});
//		gotPlaces = MerchantsCache.find({lat: Session.get('userLocation').latitude, lng: Session.get('userLocation').longitude});
		if (gotPlaces) {
			if (gotPlaces.count()) {
				console.log('got places from MerchantsCache ', gotPlaces.count(), gotPlaces.fetch(), Session.get('userLocation').user_history_location_id);
				return gotPlaces;		
			}	
		}
		
//		console.log('gotPlaces no MerchantsCache ', UserLocations.findOne({user_history_location_id: Session.get('userLocation').user_history_location_id}, {sort: {started: -1}}), Session.get('radius')); 
		
		var gotPlaces = Meteor.call('getGLoc', userId, userLocation.location, radius, function(err, results){
			console.log('selectPlace helpers getGLoc results ', results.results);	
			return results.results;
		});
		
		console.log(' got places - from call ', userLocation, gotPlaces);
		return gotPlaces;
	},
});

Template.selectPlace.events({
	'click .cancel': function(event, template) {
		console.log('selectPlace click .cancel ', this);
		// Session.set("showCreateDialog", false);
		var radius = 50;
		Session.set('radius', radius);
		Session.set('searching', false);
		Session.set('changeplace', false);
		Overlay.hide();
	},
	
	"click .elsewhere": function (event, template) {
		
//		Session.set('gotPlaces', gotPlaces);	
		var radius = Session.get('radius') + 200;
		var elsewhere = 1;
		var userLocation = Session.get('userLocation');
		Session.set('radius', radius);
//		Meteor.call('removeAllPlaces', Meteor.userId());
		var gotPlaces = Meteor.call('getGLoc', userId, userLocation.location, radius, function(err, results){
			console.log('selectPlace helpers getGLoc results ', results.results);	
			return results.results;
		});

		console.log('selectPlace events elsewhere outside ', this );
//		LoadPlaces();
		return;
	},

	"click .setlocations": function (event, template) {
//		Session.set("showCreateDialog", true);
		var allloc = template.find('#allloc').checked;
		if (allloc) {
			console.log('checkbox allloc ', this, $( "input:checked" ).val());
			Session.set('allloc', true);
		} else {
			console.log('checkbox allloc off ', this, $( "input:checked" ).val());
			Session.set('allloc', false);	
		}
		
		console.log('locationModal events setlocations ', Session.get("showCreateDialog"), $(event.currentTarget).attr("id"), this );
		
		var updated_loc = this;
		
//		Meteor.call('removeAllPlaces');

		var place_id = $(event.currentTarget).attr("id");

		var placeName = template.find('#place-' + place_id).value;
/* 		icon = $(template.find('img')).attr("src");
		console.log('icon find ', icon); */
		
		var userLocation = Session.get('userLocation');

		console.log('set location', userLocation.user_history_location_id, place_id, placeName);	

		place = MerchantsCache.find({place_id: place_id}, {fields:{_id: 0}}).fetch()[0];
		place.user_history_location_id = userLocation.user_history_location_id;
		myId = Places.findOne({user_history_location_id: userLocation.user_history_location_id});		
		console.log(' Places.findOne ', myId);
		
		if (!Session.get('allloc')) {
			UserLocations.update({_id: userLocation._id}, {$set: {name: place.name, place_id: place_id, icon2: place.icon, confirmed: 1, travel: ''}});	
		} else {
			Meteor.call('UserLocationsUpdate', Meteor.userId(), userLocation._id, place_id, place.name, function(err,results){
				console.log('UserLocationsUpdate call results ', results);
			});

			UserLocations.update({_id: userLocation._id}, {$set: {name: place.name, place_id: place_id, icon2: place.icon, confirmed: 1, travel: ''}});	
		}
		var userLocation = UserLocations.findOne({_id: userLocation._id});
		Session.set('userLocation', userLocation);
	
		console.log('UserLocations  ', userLocation, place);
	
/* 		var query = {}
		var name = userLocation.name;
		name = name.split(" ");
		query.what = name[0];
		query.radius = 50;
		Meteor.call('venuesFsqr', Meteor.userId(), userLocation, query, function(err, results) {
			console.log('Meteor.call venuesFsqr', results);
			return results;
		}); */
		// And add it to the confirmed places

		
		if (!myId) {
			console.log(' Places.findOne inserting for ', myId, place.name);
			Places.insert(place);	
		} else {
			console.log(' Places.findOne upserting for ', myId._id, place.name);
			Places.update({_id: myId._id}, {$set: place});
		}
		// Session.set("showCreateDialog", false);

		var radius = 50;
		Session.set('radius', radius);		
		console.log(' place_id event ', place_id, 'Places', place.name);
//		Session.set('searching', false);
		Session.set('changeplace', false);
		Overlay.hide();
	},
	
	'click #allloc': function (event, template) {
		if ($( "input:checked" ).val()) {
			console.log('checkbox allloc ', this, $( "input:checked" ).val());
			Session.set('allloc', true);
		} else {
			console.log('checkbox allloc off ', this, $( "input:checked" ).val());
			Session.set('allloc', false);	
		}
	},
});

Template._show_exp.events({
	'click .experience': function(event, template) {
		var userLocationId = $(event.delegateTarget).attr("id");
		console.log('click .exp ', this, userLocationId);
		Session.set('userLocationId', userLocationId);
//		Session.set('currentPlace');
	// Session.set("showCreateDialog", false);
	},
});

Template.overlay.events({
	'click .cancel':function () {
		console.log('overlay click .cancel');
		Overlay.hide();
	}
});

/* UI.registerHelper('ifConfirmed', function (context, options) {
  // extract boolean value from data context. the data context is
  // always an object -- in this case it's a wrapped boolean object.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
  var isBlock = this.valueOf();
	isBlock = isNaN(isBlock);
	console.log('isBlock ifConfirmed ', isBlock, this.valueOf(), this);

  if (!isBlock) {
    return Template._show_exp;
  } else {
    return Template._no_exp;
	}
}); */






