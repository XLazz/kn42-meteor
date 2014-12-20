//Let's get getPlaces when location set
/* LoadPlaces = function(userLocation){
	var userLocation = Session.get('userLocation');
	userId = Meteor.userId();
	radius = Session.get('radius');
	Meteor.call( 'getPlaces', userId, userLocation, radius, function(err,results){
//			console.log('gotPlaces inside MerchantsCache http call for 2 ', userLocation, results);
	});
}; */

getGPlace = function(place_id){
	var callGoogle;
	var place;
//	var place = Places.findOne({place_id: place_id});
//	if (!place) {
		
	if (Session.get('googleCall')) {
		var now = moment().valueOf() - Session.get('googleCall');
		console.log('getGPlace session 1 ', Session.get('googleCall'), now);
		if (moment().valueOf() - Session.get('googleCall') > 2) {
			console.log('getGPlace session 2 ', Session.get('googleCall'), now);
			Session.set('googleCall', false);	
		}
	}
	console.log('getGPlace session 3 ', Session.get('googleCall'), place_id);
	if (!Session.get('googleCall')){
		console.log('Google call getGPlace in getGPlace function ', place_id);
		Meteor.call('getGPlace', place_id, function(err, results) {
			console.log('getGPlace ', results);
			if (results) {
				if (results.result.place_id.length > 25) {
					var initiator = 'getGPlace function';
					Meteor.call('getGLoc', Meteor.userId(), Session.get('userLocation').location, 30, initiator);
				}
				Session.set('googleCall', false);	
				return results;
			}
		});
		Session.set('googleCall', moment().valueOf());
	}
	if (!place)
		return;
	return place;
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
  searching: function() {
    if (!UserPlaces.findOne({userId: userId})) {
      Session.set('query', true);
			console.log('calling php server for json for ', userId );
			Meteor.call('getLocations', userId, 'list', function(err,results){
				if (results)
					console.log('calling php server for json 2 ', results.length);
			});
		} else {
      Session.set('query', false);
			Session.set('searching', false);
		}		
    return Session.get('searching');
  }
});

Template.lifelog.events({
	"click .reloadlocations": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('reloadlocations events ');
		
		Session.set('googleCall', moment().valueOf());
		Meteor.call('removeAllLocations', Meteor.userId(), function(err, results){
			setTimeout(function(){
    //do what you need here
				Session.set('googleCall', false);
			}, 100);		
		});
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
		geologs = GeoLog.find({}, {sort: {timestamp: -1}});
		if (!geologs)
			Meteor.call('getLocations', Meteor.userId(), 'list');
		return geologs;
	},
	
	locations: function(){
		if (!Meteor.userId()) {
			return;
		}
		console.log('locations helper ', userId );
		var places;
		var userId = Meteor.userId();
    if (!UserPlaces.findOne({userId: userId})) {
      Session.set('query', true);
		} else {
      Session.set('query', false);
			Session.set('searching', false);
		}
		console.log('locations ',this);
		if (!Session.get('radius')) {
			Session.set('radius', 50);
		}
		places = UserPlaces.find(
			{userId: userId}, 
			{
				sort: {timestamp: -1},
				transform: function(doc){		
					var then = doc.timestamp;
					var now = doc.timestampEnd;
					if (now) 
						doc.finished = moment(now).format("MM/DD/YY HH:mm");
					if (!now) {
						now = moment().valueOf();
						doc.finished = 'in progress';
					}
					var duration = then - now;
					duration = moment.duration(duration).humanize();
					doc.timespent = duration;
					doc.started = moment(then).format("MM/DD/YY HH:mm");
					var count = UserPlaces.find({userId: userId, place_id: doc.place_id}).count();
					doc.count = count;
					return doc;
				}
			}
		);
		if (!places)
			return;
		console.log('locations helper places ', userId, places.fetch() );
		if (!places.count()){

		} 
		return places;
	},

	geoPlace: function() {

		var place = Places.findOne({'place_id': this.place_id});
		if (!place)
			return;
		if (!Session.get('userLocation'))
			return;
		if (Session.get('userLocation')._id == this._id)
			place.showbut = true;
		return place;
	},
	
	geoMerchant: function() {
		var userId = Meteor.userId();
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = MerchantsCache.findOne({'place_id': this.place_id});
		if (!place)
			return;
		if (Session.get('userLocation'))
			if (Session.get('userLocation')._id == this._id)
				place.showbut = true;
		if ((!place) && (!Session.get('googleCall'))){
			console.log('Google call getGPlace in geoMerchant function showlocations ', this.place_id);
//			getGPlace(this.place_id);
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
//		var userLocationId = $(event).attr("id");
//		var userLocationId = template.find('.selectplace').attr();
		var userLocationId = event.currentTarget.id;
		var userLocation = UserPlaces.findOne(userLocationId);
		console.log('click on div before call 0 ',userLocationId, userLocation);		
		var place = Places.findOne({place_id: userLocation. userLocationId});
		if (!place)
			place = MerchantsCache.findOne({place_id: userLocation.place_id});
		if (!place){
			console.log('Google call getGPlace in showlocations events  selectplace ', userLocation.place_id);
			getGPlace(userLocation.place_id);
		}
		console.log('click on div before call 1 ',userLocationId,  userLocation.place_id, place);			
		if (userLocation) {
			Session.set('userLocation', userLocation);
		} else if (place) {
			Session.set('userLocation', place);
		}
		
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
	gPlaces: function(){
		userId = Meteor.userId();
		var location;
		var radius = 30;
		var userLocation = Session.get('userLocation');
		console.log('places selectPlace ', userLocation.location.coords, userLocation.location, Session.get('elsewhere'), this);
		
		gotPlaces = MerchantsCache.find({'coords.latitude': userLocation.location.coords.latitude, 'coords.longitude': userLocation.location.coords.longitude});
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
			return results;
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
		console.log('selectPlace click .elsewhere ', userLocation.location, userLocation, radius);
//		Meteor.call('removeAllPlaces', Meteor.userId());
		var initiator = 'click elsewhere';
		var gotPlaces = Meteor.call('getGLoc', userId, userLocation.location, radius, initiator, function(err, results){
			console.log('selectPlace helpers getGLoc results ', results);	
			if (!results)
				return;
			return results.results;
		});

		console.log('selectPlace events elsewhere outside ', this );
//		LoadPlaces();
		return;
	},

	"click .setlocations": function (event, template) {
		var userId = Meteor.userId();
//		Session.set("showCreateDialog", true);
		var allloc = template.find('#allloc').checked;
		console.log('locationModal events setlocations ', Session.get("showCreateDialog"), $(event.currentTarget).attr("id"), this );		
		var updated_loc = this;
		
//		Meteor.call('removeAllPlaces');
		var place_id = $(event.currentTarget).attr("id");
		var userLocation = Session.get('userLocation');
		console.log('set location', userLocation._id, place_id);	
		dateNow = new Date();
		if (allloc) {
			if (!AutoPlaces.findOne({place_id:place_id}))
				AutoPlaces.insert({userId:userId,place_id:place_id,created:dateNow});
			Meteor.call('UserLocationsUpdate', userId, userLocation._id, place_id, function(err,results){
				console.log('UserLocationsUpdate call results ', results);
			});
		}
		UserPlaces.update(userLocation._id, {$set: {place_id: place_id, confirmed: true, travel: ''}});	

		if (!Places.findOne({place_id: place_id})) {
			var myPlace = MerchantsCache.findOne({place_id: place_id},{fields:{_id:0, 'address.components': 0, reviews: 0, photos: 0}});
			Places.insert(myPlace);
		}
		var userLocation = UserPlaces.findOne(userLocation._id);	
		console.log('UserLocations  ', userLocation.place_id, userLocation);
		var experience;
		userLocation.status = 'confirmed';
		Meteor.call('updatePlace', userId, userLocation, experience);	
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






