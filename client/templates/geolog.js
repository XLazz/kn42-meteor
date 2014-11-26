Meteor.subscribe('basic');

Session.set('location', Geolocation.currentLocation());
var location = {};
var friends = ["Mike", "Stacy", "Andy", "Rick"];

PollingGeo = function(){
	var myInterval = Session.get('interval');
	var watchGPS;
	console.log('Polling geo 1 ', myInterval, Session.get('geoback'));
	// auto-re-run by Cordova every ~30000 ms (30 sec)
	if (Session.get('geoback') == true) {
		var runGeo = function() {
			
			if (Meteor.isCordova) {
				console.log('Polling geo 2 cordova ', myInterval, Session.get('geoback'));
				UpdateGeoCordova();
			} else {
				console.log('Polling geo 2 browser ', myInterval, Session.get('geoback'));
				UpdateGeo();
			}
		}
		var watchGPS = Meteor.setInterval(runGeo, myInterval);
		Session.set('watchGPS', watchGPS);
	} else {
		console.log('Cleaning interval ', myInterval, Session.get('geoback'), Session.get('watchGPS'));		
		Meteor.clearInterval(Session.get('watchGPS'));
	}
}

function UpdateGeo(){
//	var handle = Deps.autorun(function () {
		var location = Geolocation.currentLocation();
		console.log('UpdateGeo event ', location, this);
		GeoLog.insert({
			location: location.coords,
			uuid: Meteor.uuid(),
			device: 'browser',
			userId: Meteor.userId(),
			created: new Date()
		});	
		Meteor.call('submitCoords',  Meteor.userId(), location.timestamp, location.coords, function(err,results){
			console.log('submitting coords ', Meteor.userId(), location.coords, ' results ', results);
			gotPlaces = results;
			Session.set('gotPlaces', gotPlaces);
		});
		
//		Session.set('interval', 60000);
//	});
	return location;
};

UpdateGeoCordova = function(){
	GeolocationFG.get(function(location) {
		console.log('UpdateGeoCordova ',  location, this);
		GeoLog.insert({
			location: location.coords,
			uuid: GeolocationBG2.uuid(),
			device: GeolocationBG2.device(),
			userId: Meteor.userId(),
			created: new Date()
		});
		Meteor.call('submitCoords',  Meteor.userId(), location.timestamp, location.coords, function(err,results){
			console.log('submitting coords ', Meteor.userId(), location.coords, ' results ', results);
			gotPlaces = results;
			Session.set('gotPlaces', gotPlaces);
		});
//		Session.set('interval', 60000);
	});
}

Template.geolog.helpers({
	userId: function(){
		var userId = Meteor.userId();
		return userId;
	},
});

Template.coords.helpers({
	geologs: function(){
		var userId = Meteor.userId();
		if (!userId) {
			return;
		}
		var geologs = GeoLog.find({userId: userId}, {sort: {created: -1}, limit: 5}).fetch();
		var api_key2 = Meteor.users.find({_id: userId}, {api_key:1, _id:0}).fetch();
		api_key = api_key2[0].api_key;
/* 		coords = Meteor.call('uploadCoords', userId, api_key, function(err,results){
			console.log('Meteor.call coords ', api_key, results);
			return results;
		});		 */
/* 		var coords2 = GeoLog.find({api_key: api_key}, {sort: {created: -1}, limit: 5).fetch();
		console.log('Geolog find coords2 for key ', api_key2, api_key, ' result ', coords2); */
		return geologs;
	},
});

Template.footergeo.helpers({
	userId: function(){
		return Meteor.userId();
	},
	status: function(){
		var running = Session.get('geoback');
		if (Session.get('geoback')) {
			running = 'running';
		} else {
			running  = 'stopped';
		}
		console.log('footergeo.helpers ', running, Session.get('geoback'), Session.get('interval'));
//		PollingGeo();	
		return running;
	},
});

Template.footergeo.events({
	
	'click #getNow': function() {
//		UpdateGeo();
		var location =  Geolocation.currentLocation();
		console.log('click #getNow general event ', location, this);
		if (Meteor.isCordova) {
			// cordova
/* 			Deps.autorun(function () {
				var location = Geolocation.currentLocation();
				console.log('Cordova click #getNow event with check ',  Geolocation.error(), 'if error ', location, this);
				GeoLog.insert({
					location: location,
					uuid: Meteor.uuid(),
					device: 'browser',
					userId: Meteor.userId(),
					created: new Date(),
					error: Geolocation.error()
				});	
			});
			return; */
			GeolocationFG.get(function(location) {
				console.log('Cordova click #getNow event with check ',  location, this);
				GeoLog.insert({
					location: location.coords,
					uuid: GeolocationBG2.uuid(),
					device: GeolocationBG2.device(),
					userId: Meteor.userId(),
					created: new Date()
				});
			});
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
				Session.set('interval', 120000);
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
		if (!GeolocationBG2.isStarted) {
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
			Session.set('interval', 120000);
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
		Session.set('interval', 500000);
		PollingGeo();
		return;
	},
	
	"click .deletedata": function (event, template) {
		console.log('delete geodata events ');
		Meteor.call('deleteGeoData', Meteor.userId());
//		Meteor.call('getLocations','list',function(err,results));
	},	
});

if (Meteor.isCordova) {
  GeolocationBG2.config({
    url: 'https://192.168.1.113:3000/api/geolocation',
    debug: true
  });
  // triggered by a start button
  // GeolocationBG2.start();
}


