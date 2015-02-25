//Let's get getPlaces when location set
/* LoadPlaces = function(userPlace){
	var userPlace = Session.get('userPlace');
	userId = Meteor.userId();
	radius = Session.get('radius');
	Meteor.call( 'getPlaces', userId, userPlace, radius, function(err,results){
//			console.log('gotPlaces inside MerchantsCache http call for 2 ', userPlace, results);
	});
}; */

Template.lifelog.helpers({
	ifDebug: function(){
		console.log('lifelog helper ifDebug ', moment().format("MM/DD HH:mm:ss.SSS"), Session.get('debug'));
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
		return Session.get('userPlaceId');
	},	
  searching: function() {
		Session.set('renderTime', moment().valueOf());
		if (Session.get('debug'))
		 console.log('lifelog helper searching 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
		var userId = Meteor.userId();
		var userPlace = UserPlaces.findOne({userId: userId});
    if (userPlace) {
				console.log('lifelog helper searching 1.5 ', moment().format("MM/DD HH:mm:ss.SSS"));
				return;
		}
		if (Session.get('debug'))
			console.log('searching UserPlaces empty lets search ', UserPlaces.findOne(), UserPlaces.findOne({userId: userId}));
		Session.set('getPlaces', true);
		if (Session.get('debug'))
			console.log('searchin session 2 ', Session.get('getPlacesNotReady'), Session.get('getPlaces'));	
		if (!Session.get('getPlacesNotReady')){
			var limit = 20;
			var searchHandle = Meteor.subscribe('downloadPlaces', userId, limit);
			Session.set('getPlacesNotReady', ! searchHandle.ready());		
		}	
		if (Session.get('debug'))
			console.log('lifelog helper searching 2 ', moment().format("MM/DD HH:mm:ss.SSS"));
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
			console.log('Meteor.call event removevenuesFsqr', this, results);
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
//		console.log('locations helper debug 1 ', moment().format("MM/DD HH:mm:ss.SSS") );
		return Session.get('debug');
	},
	userId: function(){
		Session.set('elsewhere', false);
		if (Session.get('debug'))
			console.log('locations helper userId 1 ', moment().format("MM/DD HH:mm:ss.SSS") );
		return Meteor.userId();
	},
	locations: function(){
		if (Session.get('debug'))
			console.log('locations helper places 1 ', moment().format("MM/DD HH:mm:ss.SSS") );
		var places;
		var userId = Meteor.userId();
		if (!userId) 
			return;
		
		Session.set('query', false);
		Session.set('searching', false);
		if (Session.get('debug'))
			console.log('locations helper places 2 ', moment().format("MM/DD HH:mm:ss.SSS"), userId);
//		console.log('locations helper 2 ',UserPlaces.findOne({userId: userId}));
		if (!Session.get('radius')) {
			Session.set('radius', 50);
		}
		places = UserPlaces.find(
			{userId: userId}, 
			{
				sort: {timestamp: -1},
				limit: 10,
				fields: {name:1,vicinity:1,timestamp:1,timestampEnd:1,icon:1,place_id:1,foursquareChk:1,status:1},
				transform: function(doc){		
					if (doc.status == 'confirmed')
						doc.confirmed = true;
					if (doc.status == 'travel')
						doc.travel = true;
					if (doc.status == 'fitness')
						doc.fitness = true;
					if ((doc.status != 'travel') && (doc.status != 'fitness'))
						doc.stationary = true;
					if (!doc.timestampEnd) {
						doc.timestampEnd = moment().valueOf();
						doc.finished = 'in progress';
						doc.progress = 'in progress';
					} else {
						doc.finished = moment(doc.timestampEnd).format("MM/DD/YY HH:mm");
					}
					var duration = parseInt(doc.timestamp) - parseInt(doc.timestampEnd);
					doc.timespent = moment.duration(duration).humanize();
					doc.timestart = moment(doc.timestamp).format("MM/DD/YY HH:mm");
					doc.userPlaceId = doc._id;
					if (!doc.place_id)
						updateEmptyPlaces();
					var place = Places.findOne({place_id: doc.place_id});						
					if (!place) 
						place = MerchantsCache.findOne({place_id: doc.place_id},{fields:{_id:0}});		
/* 					if (!place)
						updateEmptyNames(); */
					if (place) {
						doc.name = place.name;
						doc.vicinity = place.vicinity;
						doc.icon = place.icon;
					} else {
						updateEmptyPlaces();
					}
					if ((Session.get('userPlaceId')) && (doc._id == Session.get('userPlaceId')))
						doc.showbut = true;
					if (doc.foursquareChk) {
						var fsqr = ifChecked(doc.foursquareChk);
						doc.fsqrName = fsqr.name;
						doc.fsqrDat = fsqr.date;
					}
/* 					var count = UserPlaces.find({userId: userId, place_id: doc.place_id}).count();
					doc.count = count; */
					return doc;
				}
			}
		);
		if (Session.get('debug'))
			console.log('locations helper places 3 ', moment().format("MM/DD HH:mm:ss.SSS"), userId);
		return places;
	},
	showBut: function() {
//		console.log('locations helper showbut 1 ', moment().format("MM/DD HH:mm:ss.SSS"), this);	
		var showBut;
		if (Session.get('userPlaceId')) {
//			console.log('locations helper places 2.4 show buts ', Session.get('userPlace')._id , this._id);
			if (Session.get('userPlaceId') == this._id) {
				if (Session.get('debug'))
					console.log('locations helper places 2.5 show buts ', Session.get('userPlaceId') , this._id);
				showBut = true;
			}
		}
		return showBut;
	},
	geoMerchant: function() {
		if (Session.get('debug'))
			console.log('locations helper geoMerchant 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
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
		if (Session.get('userPlaceId')) {
			if (Session.get('userPlaceId') == this._id) {
//					console.log('geoMerchant show buts ', Session.get('userPlace')._id , this._id);
				place.showbut = true;
			}
		}
		return place;
//		} 
	},	
	
/* 	ifUpdatePlace: function() {
		console.log('locations helper ifUpdatePlace 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
		if (Session.get('ifUpdatePlace'))
			return;
		Session.set('ifUpdatePlace', true);
		Meteor.setTimeout(function(){
			Meteor.call('getGPlace', this.place_id, function(err, results){
				console.log('getGPlace in lifelog ', results);
				Session.set('ifUpdatePlace', false);
				return;
			});		
		}, 2000);
	}, */
	
	'showExp': function(){
		return Session.get('showExp');
	},
	updating: function() {
		updateEmptyPlaces();
		return Session.get('updatePlaces');
	},

	ifUpdating:function() {
		return Session.get('updatePlaces');
	}
});

Template.showlocations.rendered = function() {
  var $item = $(this.find('.buttons-row'));
  Meteor.defer(function() {
    $item.removeClass('loading');
  });
	console.log('showlocations.rendered 3 ', moment().format("MM/DD HH:mm:ss.SSS"), ( - Session.get('renderTime') + moment().valueOf())/1000 );
}

Template.showlocations.events({
	"click .selectplace": function (event, template) {
		var userId = Meteor.userId();
		var radius = 50;
		var name =[];
//		var userPlaceId = $(event).attr("id");
//		var userPlaceId = template.find('.selectplace').attr();
		var userPlaceId = event.currentTarget.id;
		var userPlace = UserPlaces.findOne(userPlaceId);

		if (Session.get('debug'))
			console.log('click on div before inside 0 ', userPlaceId, userPlace, 'place_id ', userPlace.place_id);		
		if (userPlace.place_id) {
			console.log('click on div inside 0 with place_id ',userPlaceId, userPlace.place_id);		
		} else {
			// no place_id in userPlaces, we will call getGLoc in methods
//			var location = userPlace.location;
			var radius = 500;
			var initiator = 'showlocations.events';
			if (userPlace.foursquareId) {
				userPlace.fsqrName = VenuesCheckins.findOne({id: userPlace.foursquareId}).venue.name;
				name = userPlace.fsqrName.split(" ");
			}

//			var location = userPlace.location.latitude +','+ userPlace.location.longitude;
			var params = {
				location: userPlace.location,
				radius: 20,
				name: name[0],
				foursquareId: userPlace.foursquareId
			};
			console.log('click on div before call inside 1 no place_id ',userPlaceId, userPlace, name[0]);		
			Meteor.call('getGLoc', userId, params, initiator, function(err, results){
				console.log('getGLoc call  ', params, results, initiator, userPlace.place_id);			
				if (results) 
					if (results.results[0])
						if (results.results[0].place_id) {
							userPlace.place_id = results.results[0].place_id;
							console.log('getGLoc call  ', params, results.results[0], initiator, userPlace.place_id);		
							UserPlaces.update(userPlaceId, {$set: {place_id: userPlace.place_id, status: 'confirmed'}});	
						}
				return userPlace;
			});
		}

		console.log('click on div before call 0 ', userPlaceId, userPlace, userPlace.place_id);		
		var place = Places.findOne({place_id: userPlace.place_id});
		if (!place)
			place = MerchantsCache.findOne({place_id: userPlace.place_id});
		if (!place){
			console.log('Google call getGPlace in showlocations events  selectplace ', userPlace.place_id, userPlace);
			getGPlace(userPlace.place_id);
		}
		
		console.log('click on div before call 1 ',userPlaceId, userPlace.place_id, place, userPlace);			
		if (userPlace) {
			Session.set('userPlaceId', userPlaceId);
		} else if (place) {
			// Session.set('userPlace', place);
		}	
		console.log ('Session userPlaceId ', Session.get('userPlaceId'));
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
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		if (Session.get('debug'))
			console.log('places selectPlace ', userPlace.location.coords, userPlace.location, Session.get('elsewhere'), userPlace, this);
		
		gotPlaces = MerchantsCache.find({'coords.latitude': userPlace.location.coords.latitude, 'coords.longitude': userPlace.location.coords.longitude});
//		gotPlaces = MerchantsCache.find({lat: Session.get('userPlace').latitude, lng: Session.get('userPlace').longitude});
		if (gotPlaces) {
			if (gotPlaces.count()) {
				if (Session.get('debug'))
					console.log('got places from MerchantsCache ', gotPlaces.count(), gotPlaces.fetch(), Session.get('userPlaceId'));
				return gotPlaces;		
			}	
		}
		
//		console.log('gotPlaces no MerchantsCache ', userPlaces.findOne({user_history_location_id: Session.get('userPlace').user_history_location_id}, {sort: {started: -1}}), Session.get('radius')); 
		var params = {
			radius: radius,
			location: userPlace.location
		}
		var initiator = 'selectPlace.helpers';
		var gotPlaces = Meteor.call('getGLoc', userId, params, initiator, function(err, results){
			console.log('selectPlace helpers getGLoc results ', results.results);	
			return results;
		});
		
		console.log(' got places - from call ', userPlace, gotPlaces);
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
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		Session.set('radius', radius);
		console.log('selectPlace click .elsewhere ', userPlace.location, userPlace, radius);
//		Meteor.call('removeAllPlaces', Meteor.userId());
		var initiator = 'click elsewhere';
		var params = {
			location: userPlace.location,
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
		if (Session.get('debug'))
			console.log('locationModal events setlocations ', event.currentTarget.id, this );		
		
//		Meteor.call('removeAllPlaces');
		var place_id = this.place_id;
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		// if (!userPlace.userPlaceId)
			// userPlace.userPlaceId = userPlace._id;
		if (Session.get('debug'))
			console.log('set location', ' userPlaceId ',userPlace._id, ' this.place_id ', place_id , ' userPlace ', userPlace);	
		if (allloc) {
			if (!AutoPlaces.findOne({place_id:place_id}))
				AutoPlaces.insert({userId:userId, place_id:place_id, timestamp: moment().valueOf()});
			Meteor.call('UserLocationsUpdate', userId, userPlace._id, place_id, function(err,results){
				console.log('UserLocationsUpdate call results ', results);
			});
		} else {
			if (Session.get('debug'))
				console.log('setlocations updating UserPlaces ', userPlace._id, ' place_id ', place_id );	
			UserPlaces.update(userPlace._id, {$set: {place_id: place_id, status: 'confirmed'}});	
		}

		if (!Places.findOne({place_id: place_id})) {
			var myPlace = MerchantsCache.findOne({place_id: place_id},{fields:{_id:0, 'address.components': 0, reviews: 0, photos: 0}});
			console.log('setlocation MerchantsCache.findOne ', place_id, myPlace);
			myPlace.updated = moment().valueOf();
			Places.insert(myPlace);
		}
		console.log('userPlace  ', userPlace.place_id, userPlace);
		var experience;
		////////////////////////////// UPDATE updatePlace!!!
		Meteor.call('updatePlace', userId, userPlace, experience);	
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
		var userPlaceId = $(event.delegateTarget).attr("id");
		console.log('click .exp ', this, userPlaceId);
		
		Session.set('userPlaceId', userPlaceId);
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






