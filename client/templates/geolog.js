Meteor.subscribe('basic');

Session.set('location', Geolocation.currentLocation());
var location = {};

Template.geolog.helpers({
	userId: function(){
		var userId = Meteor.userId();
		return userId;
	},
});

Template.coords.helpers({

	geologs: function(){
		return GeoLog.find({userId: Meteor.userId()}, {sort: {timestamp: -1}, 
			transform: function(doc){	
				if (doc.status)
					doc.stationary = true;
				if (doc.confirmed)
					doc.place_id = doc.confirmed;
				return doc;
			}
		});
	},

	geoPlace: function() {
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.place_id.
		if (!this.place_id) {
			console.error('geoPlace this ', this);
			return;
		}
		var place = Places.findOne({place_id: this.place_id});
//		console.log('geoPlace ', this.place_id);
		return place;
	},
	
	userPlace: function(){
		return UserPlaces.findOne(Session.get('userPlaceId'));
	},
	
	geoMerchant: function() {
		var userId = Meteor.userId();
		if (!this.place_id) {
			console.error('geoMerchant this ', userId, this);
			return;
		}
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = MerchantsCache.findOne({'place_id': this.place_id});
		if (!place) {
			var radius = 50;
			console.log('getGLoc calling ', userId, this)
			var params = {
				location: this.location,
				radius: radius
			};
			var initiator = 'geoMerchant';
/* 			Meteor.call('getGLoc', userId, params, initiator, function(err, results) {
				console.log('getGLoc call in geoMerchant ', userId, this.location, results);
				return results;
			}); */
		}
//		console.log('geoMerchant ', this.place_id);
		return place;
	},
});

Template.coords.events({
	"click .geolog": function (event, template) {
		console.log(' click geolog ', this._id, this);
		var initiator = 'geolog click';
		var params = {
			location: this.location,
			radius: 100
		};
		Meteor.call('getGLoc', Meteor.userId(), params, initiator);
		return;
	},
});

Template.footergeo.helpers({
	userId: function(){
		return Meteor.userId();
	},
	status: function(){
		if (Session.get('geoback')) {
			return 'running';
		} else {
			return 'stopped';
		}
	},
	isChecked: function(){
		console.log('isChecked ', Session.get('debug'));
		return Session.get('debug');
	},
	
	button: function(){
		if (Session.get('geoback')){
			return 'Stop';		
		} else {
			return 'Start';
		}
	}
});

Template.footergeo.events({
	
	'click #getNow': function() {
//		UpdateGeo();
		var location =  Geolocation.currentLocation();
		console.log('click #getNow general event ', location, this);
		if (Meteor.isCordova) {
			// cordova
			UpdateGeoCordova();
			return;
		}
		// browser
		UpdateGeo();
	},
	'click #getBackground': function(event) {
		console.log('Geolocation.getBackground browser event check ', location, Session.get('geoback'), this);
		var btn = event.currentTarget;
		var dest = document.getElementById('btnFeedback');
		if (!Meteor.isCordova) {
//			return;	
			if (Session.get('geoback') != true) {
				console.log('Geolocation.getBackground browser event set true ', location, Session.get('geoback'), this);
//				dest.innerHTML = 'Started';
				btn.innerHTML = 'Stop';
				Session.set('geoback', true);
				Session.set('interval', 300000);
				UpdateGeo();
				PollingGeo();
				return;
			}
			console.log('Geolocation.getBackground browser event set false ', location, Session.get('geoback'), this);
//			dest.innerHTML = 'Stopped';
			btn.innerHTML = 'Start';
			Session.set('geoback', false);
			PollingGeo();
			return;
		}
/////////////////////////
		if (!Session.get('geoback')){
			btn.innerHTML = 'Start';
			Session.set('geoback', true);
//			Meteor.user.update({'profile.geoback': true});
			Session.set('interval', 500000);
			PollingGeo();
			return;	
		} else {
			btn.innerHTML = 'Stop';
			Session.set('geoback', false);
			Meteor.user.update({'profile.geoback': ''});
			Session.set('interval', 5000000);
			PollingGeo();
			return;
		}
/* 		if (!GeolocationBG2.isStarted) {
			if (!GeolocationBG2.start()) {
				dest.innerHTML = 'ERROR: Not Started, unable to start';
				return;
			}
			if (!GeolocationBG2.isStarted) {
				dest.innerHTML = 'ERROR: Not Started, status = false';
				return;
			}
//			dest.innerHTML = 'Started (every few minutes there should be an update)';
			btn.innerHTML = 'Stop';
			Session.set('geoback', true);
			Session.set('interval', 300000);
			UpdateGeoCordova();
			PollingGeo();
			console.log('Geolocation.getBackground cordova event set true ', Session.get('interval'), Session.get('geoback'), this);
			return;
		}
		if (!GeolocationBG2.stop()) {
			dest.innerHTML = 'ERROR: Not Stopped, unable to stop';
			return;
		}
		if (GeolocationBG2.isStarted) {
			dest.innerHTML = 'ERROR: Not Stopped, status = true';
			return;
		}
	//	dest.innerHTML = 'Stopped';
		btn.innerHTML = 'Start';
		Session.set('geoback', false);
		Session.set('interval', 5000000);
		PollingGeo();
		return;
 */	},
	
	"click .deletedata": function (event, template) {
		console.log('delete geodata events ');
		Meteor.call('deleteGeoData', Meteor.userId());
	},	



});

if (Meteor.isCordova) {
  GeolocationBG2.config({
    url: 'http://kn42.xlazz.com:3000/api/geolocation',
    debug: Session.get('debug'),
  });
  // triggered by a start button
  // GeolocationBG2.start();
}


