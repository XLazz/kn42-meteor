//Let's get getPlaces when location set
/* LoadPlaces = function(userLocation){
	var userLocation = Session.get('userLocation');
	userId = Meteor.userId();
	radius = Session.get('radius');
	Meteor.call( 'getPlaces', userId, userLocation, radius, function(err,results){
//			console.log('gotPlaces inside MerchantsCache http call for 2 ', userLocation, results);
	});
}; */

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
		var userId = Meteor.userId();
    if (UserPlaces.findOne({userId: userId})) {
			console.log('searching UserPlaces 1 ', UserPlaces.findOne({userId: userId}));
			if (UserPlaces.findOne({userId: userId})._id) {
				console.log('searching UserPlaces 2 ', UserPlaces.findOne({userId: userId}));
				return;
			}
		}

		console.log('searching UserPlaces empty lets search ', UserPlaces.findOne(), UserPlaces.findOne({userId: userId}));
		Session.set('getPlaces', true);
		console.log('searchin session 2 ', Session.get('getPlacesNotReady'), Session.get('getPlaces'));	
		if (!Session.get('getPlacesNotReady')){
			var limit = 20;
			var searchHandle = Meteor.subscribe('downloadPlaces', userId, limit);
			Session.set('getPlacesNotReady', ! searchHandle.ready());		
		}	
    return Session.get('getPlacesNotReady');
  },
	ifdedup: function(){
		return Session.get('dedup');	
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
			Session.set('getPlacesNotReady', false);
//			Session.set('getPlaces', false);
/* 			setTimeout(function(){
    //do what you need here
				Session.set('googleCall', false);
			}, 100);		 */
		});
		Meteor.call('removevenuesFsqr', userId, function(err, results) {
			console.log('Meteor.call event removevenuesFsqr', userLocation.name, results);
			return results;
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
			Session.set('getPlaces', false);
			Session.set('getPlacesNotReady', false);
		});
//		Meteor.call('getLocations','list',function(err,results));
	},
	"click .dedup": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('dedup events ');
		Session.set('dedup', true);
		//		Meteor.call('getLocations','list',function(err,results));
	},	
	"click .dedupstop": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('dedup events ');
		Session.set('dedup', false);
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
			console.log('locations helper geolog empty. call php getLocations ' );
			// Meteor.call('getLocations', Meteor.userId(), 'list');
		return geologs;
	},
	
	
	locations: function(){
		if (!Meteor.userId()) {
			return;
		}
		
		var places;
		var userId = Meteor.userId();
//		console.log('locations helper 1 ', userId );
    if (!UserPlaces.findOne({userId: userId})) 
			return;
		if (!UserPlaces.findOne({userId: userId})._id)
			return;
			
		Session.set('query', false);
		Session.set('searching', false);

		console.log('locations helper 2 ',UserPlaces.findOne({userId: userId}));
		if (!Session.get('radius')) {
			Session.set('radius', 50);
		}
		places = UserPlaces.find(
			{userId: userId}, 
			{
				sort: {timestamp: -1},
				limit: 20,
				transform: function(doc){		
					var then = parseInt(doc.timestamp);
					var now = parseInt(doc.timestampEnd);
					if (now) 
						doc.finished = moment(now).format("MM/DD/YY HH:mm");
					if (!now) {
						now = moment().valueOf();
						doc.finished = 'in progress';
					}
					var duration = then - now;
					duration = moment.duration(duration).humanize();
					doc.timespent = duration;
					doc.timestart = moment(then).format("MM/DD/YY HH:mm");
					doc.timestart2 = moment(doc.timestamp).format("MM/DD/YY HH:mm");
/* 					doc.then = moment(then) ;
					doc.then2 = doc.timestamp; */
					var count = UserPlaces.find({userId: userId, place_id: doc.place_id}).count();
					doc.count = count;
					return doc;
				}
			}
		);
		if (!places)
			return;
//		console.log('locations helper places ', userId, places.fetch() );
		if (!places.count()){

		} 
		return places;
	},

	geoPlace: function() {
		var userId = Meteor.userId();
		var place = Places.findOne({'place_id': this.place_id});
		if (!place)
			return;
		if (!Session.get('userLocation'))
			return;
		if (Session.get('userLocation')._id == this._id)
			place.showbut = true;
		
		if (Session.get('dedup')) {
			//remove dup places
			var lastPlace = UserPlaces.findOne({userId: userId, timestamp: {$lt: this.timestamp}}, {limit:1, sort: {timestamp: -1}});
	//		console.log('lastPlace ', lastPlace.user_history_location_id, this.user_history_location_id, lastPlace.place_id, this.place_id);
			if (lastPlace) {
				if ((lastPlace.place_id == this.place_id)&&(!lastPlace.finished)) {
					console.log('removing dup Place ', this.user_history_location_id, this.place_id);
					UserPlaces.remove(this._id);
				}
			}
		}
		return place;
	},
	
	geoMerchant: function() {
		var userId = Meteor.userId();
//		if (this.place_id) {
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = MerchantsCache.findOne({'place_id': this.place_id});
		if (!place) {
			place = {};
			place.name = 'unknown';
			place.unknown = true;
		}
		if (Session.get('userLocation')) {
			if (Session.get('userLocation')._id == this._id) {
//					console.log('geoMerchant show buts ', Session.get('userLocation')._id , this._id);
				place.showbut = true;
			}
		}
		return place;
//		} 
	},	
	
	
	checkinFsqr: function(){
		if (!this.timestampEnd)
			this.timestampEnd = moment().valueOf();
		var checkinFsqr;
		var timestampFsqr;
		var nameFsqr;
		if (this.foursquareId) {
			checkinFsqr = VenuesCheckins.findOne({id: this.foursquareId});
		} else {
			checkinFsqr = VenuesCheckins.findOne(
			{
				userId:this.userId,	
				createdAt: { $gt: this.timestamp/1000+300*60, $lt: this.timestampEnd/1000+300*60}	},{	limit: 1, sort: {createdAt: -1}
			});
		}
		if (checkinFsqr) {
			timestampFsqr = checkinFsqr.createdAt;
			checkinFsqr.date = moment.unix(timestampFsqr).format("MM/DD/YY HH:mm");
			nameFsqr = checkinFsqr.venue.name;
		}
			
/* 		console.log('locations helper checkinFsqr ', this.userId, nameFsqr, this.timestamp/1000+300*60, this.timestamp/1000, timestampFsqr, this.timestampEnd/1000+300*60, checkinFsqr  ); */
		return checkinFsqr;		
	},
	
	'showExp': function(){
		return Session.get('showExp');
	},
	updated: function() {
//		Meteor.setInterval(Meteor.call('getLocations','list'), 1000000);	
	},
	updatePlaces: function() {
		if (Session.get('updatePlaces'))
			return;
		var emptyPlaces = UserPlaces.find({userId: Meteor.userId(), place_id:''});
		if (emptyPlaces)
			Session.set('updatePlaces', true);
		var initiator = 'unknown lifelog';
		Meteor.call('updatePlaces', Meteor.userId(), initiator, function(err, results) {
			console.log('updatePlaces call  ', Meteor.userId(), this.location, results);
			Meteor.setTimeout(function(){
        Session.set('updatePlaces', false);
			}, 5000);

			return results;
		});
	},
	ifUpdating:function() {
		return Session.get('updatePlaces');
	}
});

Template.showlocations.events({
	"click .selectplace": function (event, template) {
		var userId = Meteor.userId();
		var radius = 50;
		var name =[];
//		var userLocationId = $(event).attr("id");
//		var userLocationId = template.find('.selectplace').attr();
		var userLocationId = event.currentTarget.id;
		var userLocation = UserPlaces.findOne(userLocationId);

		console.log('click on div before inside 0 ',userLocationId, userLocation, 'place_id ', userLocation.place_id);		
		if (userLocation.place_id) {
			console.log('click on div inside 0 with place_id ',userLocationId, userLocation, userLocation.place_id);		
		} else {
			var location = userLocation.location;
			var radius = 500;
			var initiator = 'showlocations.events';
			if (userLocation.foursquareId) {
				userLocation.fsqrName = VenuesCheckins.findOne({id: userLocation.foursquareId}).venue.name;
				name = userLocation.fsqrName.split(" ");
			}

			var location = userLocation.location.latitude +','+ userLocation.location.longitude;
			var params = {
				location: userLocation.location,
				radius: 20,
				name: name[0],
				foursquareId: userLocation.foursquareId
			};
			console.log('click on div before call inside 1 no place_id ',userLocationId, userLocation, name[0]);		
			Meteor.call('getGLoc', userId, params, initiator, function(err, results){
				console.log('getGLoc call  ', params, results, initiator, userLocation.place_id);			
				if (results) 
					if (results.results[0])
						if (results.results[0].place_id) {
							userLocation.place_id = results.results[0].place_id;
							console.log('getGLoc call  ', params, results.results[0], initiator, userLocation.place_id);		
							UserPlaces.update(userLocationId, {$set: {place_id: userLocation.place_id, confirmed: true, travel: ''}});	
						}
				return userLocation;
			});
		}

		console.log('click on div before call 0 ', userLocationId, userLocation, userLocation.place_id);		
		var place = Places.findOne({place_id: userLocation.userLocationId});
		if (!place)
			place = MerchantsCache.findOne({place_id: userLocation.place_id});
		if (!place){
			console.log('Google call getGPlace in showlocations events  selectplace ', userLocation.place_id, userLocation);
			getGPlace(userLocation.place_id);
		}
		
		console.log('click on div before call 1 ',userLocationId, userLocation.place_id, place, userLocation);			
		if (userLocation) {
			Session.set('userLocation', userLocation);
		} else if (place) {
			Session.set('userLocation', place);
		}
		
		
		console.log ('Session userLocation ', Session.get('userLocation'));
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
		var params = {
			radius: radius,
			location: userLocation.location
		}
		var initiator = 'selectPlace.helpers';
		var gotPlaces = Meteor.call('getGLoc', userId, params, initiator, function(err, results){
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
		var params = {
			location: userLocation.location,
			radius: radius
		};
		var gotPlaces = Meteor.call('getGLoc', userId, params, initiator, function(err, results){
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
			console.log('setlocation MerchantsCache.findOne ', place_id, myPlace);
			myPlace.updated = moment().valueOf();
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






