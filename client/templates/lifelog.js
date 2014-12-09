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

	"click .locations2": function (event, template) {
//		Modal.show('locationModal2');
		console.log('locations events 2 ',Session.get("showCreateDialog"), this);
	},
	"click .reloadlocations": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('reloadlocations events ');
		Meteor.call('removeAllLocations', Meteor.userId());
		Meteor.call('getLocations', Meteor.userId(), 'list');
//		Meteor.call('getLocations','list',function(err,results));
	},
	"click .updatelocations": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		console.log('updatelocations events ');
		Meteor.call('getLocations', Meteor.userId(), 'list');
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
	locations: function(){
		var userLocations;
		console.log('locations ',this);
		if (!Meteor.userId()) {
			return;
		}
		if (!Session.get('radius')) {
			Session.set('radius', 50);
		}
		
		if (UserLocations.find({userId: Meteor.userId()}).count() === 0 ){
			console.log('calling php server for json ', Session.get('userLocation'), UserLocations.find({userId: Meteor.userId()}).count());
			Meteor.call('getLocations', Meteor.userId(), 'list', function(err,results){
				console.log('calling php server for json 2 ', results);
			});
		} else {
//			console.log('calling mongo for json', Session.get('userLocations'));
//			console.log(' checking mongo UserLocations ', UserLocations.find({}, {sort: {started: -1}}));
			userLocations = UserLocations.find({
				userId: Meteor.userId()
			}, {
				sort: {started: -1},
				transform: function(doc){
//					console.log('inside userLocations ', doc);
					if (Session.get('userLocation')) {
						if (doc.user_history_location_id == Session.get('userLocation').user_history_location_id) {
							doc.selected = 1;
						}
					}
					var content =	Places.findOne({place_id: doc.place_id}, {fields:{user_history_location_id: 0, selected:0}});
					
					if (!content) {
						content = MerchantsCache.findOne({place_id: doc.place_id}, {fields:{user_history_location_id: 0, selected:0}});
						if (!content) {
							console.log('no content from MerchantsCache.findOne({place_id: doc.place_id}), callin server for userlocation ', doc.place_id, doc.user_history_location_id);
	//						if (Session.get('lastCall') > new Date().valueOf() + 500) {
	//							Session.set('lastCall', new Date().valueOf());

								Meteor.call( 'getPlaces', Meteor.userId(), doc, Session.get('radius'), function(err,results){
									console.log('gotPlaces MerchantsCache http call for 2 ', Session.get('radius'), results);
									return;
								});					
	//						}
						}
					}
						
					var then = doc.started;
					var now = doc.finished;
					if (!now) {
						now = moment().format("YYYY-MM-DD HH:mm:ss");
//						now = moment(now).format
					};
					var duration = moment(now,"YYYY-MM-DD HH:mm:ss").diff(moment(then,"YYYY-MM-DD HH:mm:ss"));
					duration = moment.duration(duration).humanize();
					doc.names = content;
					if (content) {
						content.timespent = duration;
						content.started = moment(doc.started).format("MM/DD/YY");
					}
					
//					console.log('locations inside MerchantsCache transform for 1 ', doc.place_id, doc);
//					console.log('locations inside MerchantsCache transform for 2 ', doc.place_id, duration, now);
					Session.set('currentPlace', doc.place_id);
					doc = _.extend(doc, _.omit(content, '_id'));
					return doc;
				}
			});
			
			var test = userLocations.forEach(function (item, index, array) {
				var then = item.started;
				var now = item.finished;
				if (now) {
					var duration = moment(now,"DD/MM/YYYY HH:mm:ss").diff(moment(then,"DD/MM/YYYY HH:mm:ss"));
					duration = moment.duration(duration).humanize();
//					console.log('inserting item ', item.started, item.finished, duration, moment(item.started).fromNow());
				}			
			});
			
			
//			var duration = moment.duration(finished - started).humanize()
//			var hours = duration.asHours();
//			userlocation['timespent'] = 
//			console.log('userLocations', userLocations, test);
			return userLocations;
		}
		
	},
	
	'showExp': function(){
		return Session.get('showExp');
	},
	
	updated: function() {
//		Meteor.setInterval(Meteor.call('getLocations','list'), 1000000);	
	}
});

Template.showlocations.events({

	"click .div-locations": function (event, template) {
		var userLocationId = $(event.currentTarget).attr("id");
		var userLocation = UserLocations.findOne({user_history_location_id: userLocationId});
		
		var place = MerchantsCache.findOne({place_id: userLocation.place_id});
		console.log('click on div before call ', userLocationId, userLocation, place);
		
		if (!place) {
			Meteor.call( 'getPlaces', Meteor.userId(), userLocation, 50, function(err,results){
				Session.set('lastCall', new Date().valueOf());
				place = results;
				console.log('click on div inside call ', userLocationId, place);
				UserLocations.update({_id: userLocation._id}, {$set:{name: place.name}});
				return;
			});

			return;
		}
		console.log('click on div ', userLocationId, place);
		if (!userLocation.name){
			var myId = UserLocations.findOne({user_history_location_id: userLocationId});
			UserLocations.update({_id: myId._id}, {$set:{name: place.name}});
			userLocation = UserLocations.findOne({user_history_location_id: userLocationId});
//			Session.set('userLocation', userLocation);
		}
		userLocation = UserLocations.findOne({user_history_location_id: userLocationId});
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
		console.log('places selectPlace ', Session.get('userLocation').place_id, Session.get('elsewhere'), this);
		
		gotPlaces = MerchantsCache.find({lat: Session.get('userLocation').latitude, lng: Session.get('userLocation').longitude, place_id: {$exists: true }});
//		gotPlaces = MerchantsCache.find({lat: Session.get('userLocation').latitude, lng: Session.get('userLocation').longitude});
		if (gotPlaces.count()) {
			console.log('got places from MerchantsCache ', gotPlaces.count(), gotPlaces.fetch(), Session.get('userLocation').user_history_location_id);
			return gotPlaces;		
		}
		
		console.log('gotPlaces no MerchantsCache ', UserLocations.findOne({user_history_location_id: Session.get('userLocation').user_history_location_id}, {sort: {started: -1}}), Session.get('radius'));
		
		Meteor.call( 'getPlaces', Meteor.userId(), Session.get('userLocation'), Session.get('radius'), function(err,results){
//			Session.set('searching', false);
			console.log('gotPlaces MerchantsCache http call for 2 ', Session.get('radius'), results);
//			return results;
		});

		
		// Nothing yet, lets load from php
		
		console.log(' got places - from call ', gotPlaces.count(), gotPlaces, Session.get('userLocation').user_history_location_id, Session.get('gotPlaces'));
//		return gotPlaces;
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
		Session.set('radius', radius);
		Session.set('searching', true);
//		Meteor.call('removeAllPlaces', Meteor.userId());
		Meteor.call(
			'getPlaces', 
			Meteor.userId(), 
			Session.get('userLocation'), 
			radius, 
			elsewhere,
			function(err,results){
				gotPlaces = results;
				console.log('selectPlace events elsewhere inside ', Session.get('userLocation').user_history_location_id, radius, results , this );
				Session.set('searching', false);
				return gotPlaces;
			}
		);

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

UI.registerHelper('ifConfirmed', function (context, options) {
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
});






