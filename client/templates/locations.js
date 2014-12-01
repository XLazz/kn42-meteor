//Let's get getPlaces when location set
LoadPlaces = function(userLocationId){
	if (Session.get('userLocationId')){
		var userLocationId = Session.get('userLocationId');
		userLocation = UserLocations.findOne({user_history_location_id: Session.get('userLocationId')}, {sort: {started: -1}});
		userId = Meteor.userId();
		radius = Session.get('radius');
		console.log('gotPlaces autorun 1 for userLocationId ', Session.get('userLocationId'), userLocation);
		Meteor.call( 'getPlaces', userId, userLocation, radius, function(err,results){
			console.log('gotPlaces inside MerchantsCache http call for 2 ', userLocation, results);
		});
	}
};

Template.locations.helpers({
	userId: function(){
		var userId = Meteor.userId();
		return userId;
	},
	showCreateDialog: function () {
		console.log('showCreateDialog kn42 helper ', this);
		return Session.get("showCreateDialog");
	},
	userLocationId: function(){
		return Session.get('userLocationId');
	},	
});


/* Template.kn42_locations.rendered = function(){

	var id = '#100';
	var el = $(this).find('#lat-100').value;
	console.log(' checking el in rendered ', el, ' for ', id);
}; */

/* (function( $ ){
   $.fn.jqueryFunc = function() {
      console.log('hello world');
      return this;
   }; 
})( jQuery ); */
/* Template.kn42_locations.events({  
  'click button.modal': function(event, template) {
    var name = template.$(event.target).data('modal-template');
    Session.set('activeModal', name);
  }
}); */

/* Template.kn42_locations.helpers({
	showCreateDialog: function () {
		console.log('showCreateDialog kn42 helper ', this);
		return Session.get("showCreateDialog");
	},
	userLocationId: function(){
		return Session.get('userLocationId');
	},
	showPlace: function(){
		console.log('showPlace ',this);
		var id = Session.get('userLocationId');
//		id = '#lat-' + id;
		var el = $(this).find({'history_location_id': id}).value;
		console.log(' checking el in showPlace ', el, ' for ', id);
		if (el) {
			console.log(' checking el showPlace 2 ', el, ' for ', id);
			return 'yes';
		} else {
			console.log(' checking el showPlace 3 ', el, ' for ', id);
	//		return 'no';
	//		return 'yes';
			var dummy = '';
		}		
	},


}); */


Template.locations.events({
	"click .locations2": function (event, template) {
//		Modal.show('locationModal2');
		Session.set("showCreateDialog", true);
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
	userId: function(){
		Session.set('elsewhere', false);
		return Meteor.userId();
	},
	locations: function(){
		var userLocations;
		console.log('locations ',this);
		if (!Meteor.userId()) {
			return;
		}
		if (UserLocations.find({userId: Meteor.userId()}).count() === 0 ){
			console.log('calling php server for json ', Session.get('userLocations'));
			Meteor.call('getLocations', Meteor.userId(), 'list', function(err,results){
				console.log('calling php server for json 2 ', results);
				userLocations = results;		
	//			Players.update(Session.get("userLocations"), {$inc: {score: 5}});
/* 				if (UserLocations.find().count() === 0) {
					Meteor.call('UpdateDB',Session.get('userLocations'),function(err,results){
						console.log('called UpdateDB');
					});
				} */
				return userLocations;
			});
		} else {
			console.log('calling mongo for json', Session.get('userLocations'));
//			console.log(' checking mongo UserLocations ', UserLocations.find({}, {sort: {started: -1}}));
			userLocations = UserLocations.find({
				userId: Meteor.userId()
			}, {
				sort: {started: -1},
				transform: function(doc){
					console.log('inside userLocations ', doc);
					var content = MerchantsCache.findOne({place_id: doc.place_id});
					doc.names = content;
					console.log('locations inside MerchantsCache transform for 1 ', doc.place_id, doc);
					console.log('locations inside MerchantsCache transform for 2 ', doc.place_id, content);
					return _.extend(doc, _.omit(content, '_id'));
					return doc;
				}
			});
			console.log('userLocations', userLocations);
			return userLocations;
		}
		
	},
	updated: function() {
//		Meteor.setInterval(Meteor.call('getLocations','list'), 1000000);	
	}
});

Template.showlocations.events({

	"click .locations": function (event, template) {
		Session.set('searching', false);
		console.log('locations events ',this);
		Session.set('radius', 50);
		var userLocationId = $(event.currentTarget).attr("id");
		var lat = template.find('#lat-' + userLocationId).value;
		var lng = template.find('#lng-' + userLocationId).value;
		Session.set('userLocationId', userLocationId);
		Session.set('lat', lat);
		Session.set('lng', lng);
		Session.set('getplaces', false);
//		Meteor.call('getLocations','list');
		console.log('locations events ', Session.get('userLocationId'), lat, lng);	
		Overlay.show('selectPlace');	
	},	

	"click .locations2": function (event, template) {
		Session.set("showCreateDialog", true);
		console.log('locations events 2 ',Session.get("showCreateDialog"), this);
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
			return {'wait': Session.get('searching')};
		}
		return;
	},
	places: function(){
		var location;
		console.log('places selectPlace ', Session.get('userLocationId'), Session.get('elsewhere'), this);
		
/* 		if (!Session.get('elsewhere')) {
			gotPlaces = UserLocations.find({
				user_history_location_id: Session.get('userLocationId')
			}, {
				sort: {started: -1},
				transform: function(doc){
					var content = Places.find({user_history_location_id: doc.user_history_location_id}).fetch();
					doc.names = content;
					console.log('gotPlaces inside Places transform for 1 ', doc.user_history_location_id, doc);
					console.log('gotPlaces inside Places transform for 2 ', doc.user_history_location_id, content[0]);
					return _.extend(doc, _.omit(content, '_id'));
				}
			});
			console.log('gotPlaces outside Places transform for ', Session.get('userLocationId'), gotPlaces);
			if (!gotPlaces) {Session.set('elsewhere', true)};
//			return gotPlaces;
		} */
				

		
//		return gotPlaces.fetch();
		
		// see if we have it loaded already in MerchantsCache
/* 		gotPlaces = UserLocations.find({
			user_history_location_id: Session.get('userLocationId')
		}, {
			sort: {started: -1},
			transform: function(doc){
				var content = MerchantsCache.find({lat: doc.latitude, lng: doc.longitude}).fetch();
				console.log('gotPlaces inside MerchantsCache transform for 1 ', Session.get('userLocationId'), doc);
				console.log('gotPlaces inside MerchantsCache transform for 2 ', Session.get('userLocationId'), content);
				if (!content) {
					console.log('selectPlace fetched places from merchants (no content) ', doc);
					Session.set('getPlaces', true);
					Session.set('location', doc.content);
					location = doc;
				} else {
					console.log('selectPlace fetched places from merchants (width doc.content) 1 doc ', doc);
					console.log('selectPlace fetched places from merchants (width doc.content) 1 content ', content);
					return content;
				}
			}
		}); */
//		userLocation = UserLocations.findOne({user_history_location_id: Session.get('userLocationId')}, {sort: {started: -1}});
		gotPlaces = MerchantsCache.find({
			lat: UserLocations.findOne({user_history_location_id: Session.get('userLocationId')}, {sort: {started: -1}}).latitude, lng: UserLocations.findOne({user_history_location_id: Session.get('userLocationId')}, {sort: {started: -1}}).longitude
			}
		);
		if (gotPlaces.count()) {
			console.log('got places from MerchantsCache ', gotPlaces.count(), gotPlaces, Session.get('userLocationId'), Session.get('gotPlaces'));
			return gotPlaces;		
		}
		
		console.log('gotPlaces MerchantsCache http call for 1 ', UserLocations.findOne({user_history_location_id: Session.get('userLocationId')}, {sort: {started: -1}}), Session.get('radius'));
		
		Meteor.call( 'getPlaces', Meteor.userId(), UserLocations.findOne({user_history_location_id: Session.get('userLocationId')}, {sort: {started: -1}}), Session.get('radius'), function(err,results){
			console.log('gotPlaces MerchantsCache http call for 2 ', Session.get('radius'), results);
			return;
		});

		
		// Nothing yet, lets load from php
		
		console.log(' got places - from call ', gotPlaces.count(), gotPlaces, Session.get('userLocationId'), Session.get('gotPlaces'));
//		return gotPlaces;
	},
});

/* Template.locationModal.events({
	'click .cancel': function(event, template) {
		console.log('click .cancel ',Session.get("showCreateDialog"), this);
		Session.set("showCreateDialog", false);
		var radius = 50;
	},
	"click .setlocations": function (event, template) {
//		Session.set("showCreateDialog", true);
		console.log('locationModal events  ', Session.get("showCreateDialog"), $(event.currentTarget).attr("id"), this );
		
		var updated_loc = this;
		
//		Meteor.call('removeAllPlaces');

		var place_id = $(event.currentTarget).attr("id");
		if (place_id == '0') {
			place_id = '';
			Meteor.call('removeAllPlaces', Meteor.userId());
			var radius = Session.get('radius') + 200;
			Session.set('radius', radius);
			Session.set('getplaces', true);
			Meteor.call('getPlaces', Session.get('lat'), Session.get('lng'), Session.get('radius'), function(err,results){
				gotPlaces = results;
				Session.set('gotPlaces', gotPlaces);
			});
			return;
		}
		var placeName = template.find('#place-' + place_id).value

		var userLocationId = Session.get('userLocationId');
		var lat = Session.get('lat');
		var lng = Session.get('lng');
		Session.set('place_id', place_id);
		Session.set('placeName', placeName);
		console.log('set location', Session.get('userLocationId'), place_id, placeName);	
		var setPlace = ['yes'];
		console.log('setPlace ', setPlace);
		
		var dbPlacesCount = Places.find({userLocationId: userLocationId}).count();
		console.log('dbPlacesCount ', dbPlacesCount);
		if (dbPlacesCount === 0 ) {
			console.log('inserting Places ', dbPlacesCount);
			Meteor.call('UpdatePlaces', userLocationId, lat, lng, place_id, placeName, function(err,results){
			});
		} else {
			console.log('checking Places ', Places.find().fetch());		
			console.log('checking Places ', Places.find({userLocationId: userLocationId}).count(), Places.find().fetch());	
		}
		var myFetch = Places.find().fetch();
		var myId = UserLocations.findOne({user_history_location_id: userLocationId});		
		UserLocations.update({_id: myId._id}, {$set: {name: Session.get('placeName')}});		
		Session.set("showCreateDialog", false);
		console.log(' place_id event ', place_id, 'Places' , myFetch, 'UserLocations', UserLocations.find({user_history_location_id: userLocationId}).fetch());
		
	}
}); */

Template.selectPlace.events({
	'click .cancel': function(event, template) {
		console.log('selectPlace click .cancel ',Session.get("showCreateDialog"), this);
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
		Session.set('radius', radius);
		Session.set('elsewhere', true);
		Session.set('searching', true);
//		Meteor.call('removeAllPlaces', Meteor.userId());
		Meteor.call(
			'getPlaces', 
			Meteor.userId(), 
			UserLocations.findOne({user_history_location_id: Session.get('userLocationId')}, {sort: {started: -1}}), 
			Session.get('radius'), 
			function(err,results){
				gotPlaces = results;
			}
		);

		console.log('locationModal events elsewhere ', Session.get("elsewhere"), $(event.currentTarget).attr("id"), this );
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

		var placeName = template.find('#place-' + place_id).value

		var userLocationId = Session.get('userLocationId');
		var lat = Session.get('lat');
		var lng = Session.get('lng');
		Session.set('place_id', place_id);
		Session.set('placeName', placeName);
		console.log('set location', userLocationId, place_id, placeName);	
/* 		var setPlace = ['yes'];
		console.log('setPlace ', setPlace); */
		
/* 		var dbPlacesCount = Places.find({userLocationId: userLocationId}).count();
		console.log('dbPlacesCount ', dbPlacesCount);
		if (dbPlacesCount === 0 ) {
			console.log('inserting Places ', dbPlacesCount);

//			Meteor.call('UpdatePlaces', userLocationId, lat, lng, place_id, placeName, function(err,results){});
		} else {
			console.log('checking Places ', Places.find().fetch());		
			console.log('checking Places ', Places.find({userLocationId: userLocationId}).count(), Places.find().fetch());	
		}
		var myFetch = Places.find().fetch(); */
		
		if (!Session.get('allloc')) {
			var myId = UserLocations.findOne({user_history_location_id: userLocationId});		
			UserLocations.update({_id: myId._id}, {$set: {name: placeName, place_id: place_id}});	
		} else {
			Meteor.call('UserLocationsUpdate', Meteor.userId(), userLocationId, place_id, placeName, function(err,results){
				console.log('UserLocationsUpdate call results ', results);
			});
		}
		// And add it to the confirmed places
		place = MerchantsCache.find({place_id: place_id}, {fields:{_id: 0}}).fetch()[0];
		place.user_history_location_id = userLocationId;
		myId = Places.findOne({user_history_location_id: userLocationId});		
		console.log(' Places.findOne ', myId);
		
		if (!myId) {
			console.log(' Places.findOne inserting for ', myId, place);
			Places.insert(place);	
		} else {
			console.log(' Places.findOne upserting for ', myId._id, place);
			Places.update({_id: myId._id}, {$set: place});
		}
		// Session.set("showCreateDialog", false);

		var radius = 50;
		Session.set('radius', radius);		
		console.log(' place_id event ', place_id, 'Places', place);
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

Template.overlay.events({
	'click .cancel':function () {
		console.log('overlay click .cancel');
		Overlay.hide();
	}
});

/* Template.locationModal.helpers({
	// places: function(){
		// var gotIt = Session.get("gotPlaces");
		// if (Session.get('location') == location){
			// console.log(' got places already ', Session.get('location'));
		// } else {
			// console.log(' running locationModal.helper places function ', Session.get('location'), Session.get('lat'), Session.get('lng'));
			// Meteor.call('getPlaces', Session.get('lat'), Session.get('lng'), function(err,results){
				// var gotPlaces = JSON.parse(results.content).google_places.results;
				// Session.set('gotPlaces', gotPlaces);
				// Modal.show('locationModal');
				// console.log('gotPlace', gotPlaces);
			// });
		// };
		// var location = Session.get('location');
		// return Session.get('gotPlaces');
	// }
}); */



