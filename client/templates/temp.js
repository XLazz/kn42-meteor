

Template.test.helpers({
	ifUser: function (){
		if (!Session.get('userLocation')) {
			place = UserPlaces.findOne({userId: userId},{sort: {timestamp: -1}});
			// if (place)
				// Session.set('userLocation', place);
		}
		if (Meteor.userId()) {return 'true'};
	},
	
	currentUser: function(){
		if (!Meteor.userId()) {return;}
		console.log('curr user ',  Meteor.user());
		return Meteor.user();
	},
	mytypes: function(){
		var myTypes = Places.find({},{fields:{types:1}});
//		console.log(' types ', myTypes.fetch());
		myTypes.forEach(function (item, index, array) {
//			console.log(' foreach ', item.types );
			item.types.forEach(function (item2, index, array) {

				var myId = Services.findOne({type:item2});
//				console.log(' foreach ', item2, myId );
				if (!myId._id) {
//					console.log(' inserting ', item2 );
					Services.insert({type:item2});
				}
			});
		});
		return Services.find({});
	},
	status: function() {
		if (Session.get('geoback')) {
			return 'running';
		} else {
			return 'stopped';
		}
	},
	checkinsFsqr: function(){
		var userId = Meteor.userId();
		var checkinsFsqr = VenuesCheckins.find(
			{userId:userId},
			{
				sort: {createdAt: -1}, 
				limit: 20,
				transform: function(doc){
					doc.date =  moment.unix(doc.createdAt).format("MM/DD/YY hh:mm"); 
					// console.log('checkinsFsqr -1 ', doc.createdAt, doc.date, doc.id );
					return doc;
				}
			}
		);
		console.log('checkinsFsqr 0 ', checkinsFsqr.fetch() );
		if (checkinsFsqr && checkinsFsqr.count()){
			checkinsFsqr.count = checkinsFsqr.count();
		} 
	
		if (!Session.get('FsqrCall'))
			Session.set('FsqrCall', 0);
		if (moment().valueOf() - Session.get('FsqrCall') > 3000) { 
			console.log('checkinsFsqr 1 ', (moment().valueOf() - Session.get('FsqrCall')) );
			Session.set('FsqrCall', moment().valueOf());
			Meteor.call('checkinsFsqr', Meteor.userId(), function(err, results){
				var timestamp = moment().valueOf() + 5000;
				Session.set('FsqrCall', timestamp);
				return;
			});
		}
		console.log('checkinsFsqr ', checkinsFsqr.fetch());
		return checkinsFsqr;
	},
	ifFsqr: function(){
		return Session.get('checkinsFsqr');
	},

	myTube: function(){
		Tracker.autorun(function () {
				Meteor.subscribe("userData", Meteor.userId());
		//    Meteor.subscribe("allUserData");
		});
		
/* 		var options = {
			access_token: Meteor.user().services.google.accessToken,
			userId: Meteor.user().services.google.id,
			me: 'me',
		};
		GoogleApi.get('/plus/v1/people/me', options, function(err, results){
			console.log('GoogleApi ', err, results);	
		}); */

/* 		var options = {
			access_token: Meteor.user().services.google.accessToken,
			userId: Meteor.user().services.google.id,
			me: 'me',
		};
		GoogleApi.get('/plus/v1/people/me', options, function(err, results){
			console.log('GoogleApi ', err, results);	
		});		 */
	
		if (Meteor.user() && !Meteor.loggingIn()) {
				var url = "https://www.googleapis.com/youtube/v3/channels";
				var params = {
					access_token: Meteor.user().services.google.accessToken,
					part: "snippet",
					mine: "true"
				};
				console.log('cjecking myTube params ', params);
				if (!Meteor.user().services.google.accessToken) {
					console.log('empty accessToken ', Meteor.user().services.google);
					return;
				}
/* 				Meteor.http.get(url, {params: params}, function (err, result) {
						console.log('checikng tube2 ',result.statusCode, result.data);
						var retdata =  result.data;
						console.log('cjecking myTube 3 ', result);
						Session.set("myTube", retdata.items);
				}); */
		}
		var myTube = Session.get("myTube");
		console.log('myTube ', myTube);
		return myTube;
	}
	
});

Template.test.events({
	"click .test": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		var userId = Meteor.userId();
		console.log('test events ');
		cordova.call('getEmail', function (err, result) {
			console.log('getemail ',result);
			console.error('getemail ', err);
		}); 
			
		return friends;
	},
	"click .checkinsFsqr": function (event, template) {
		if (!Meteor.userId()) {
			return;
		}
		var ifFsqr = Session.get('checkinsFsqr');
		if (!ifFsqr) {
			Session.set('checkinsFsqr', true);
		} else {
			Session.set('checkinsFsqr', false);
		}
	},
	"click .getTube": function (event, template) {
		Tracker.autorun(function () {
				Meteor.subscribe("userData", Meteor.userId());
		//    Meteor.subscribe("allUserData");
		});

		console.log('userData ', Meteor.user());

		var options = {
			access_token: Meteor.user().services.google.accessToken,
/* 			part: "snippet",
			mine: "true" */
			userId: Meteor.user().services.google.id,
			me: 'me',
		};
/* 		GoogleApi.get('/plus/v1/people', options, function(err, results){
			console.log('GoogleApi ', err, results);	
		});		 */
/* var result = GoogleMaps.getDistance("Melbourne", "Sydney");
console.log(result); */

// from tests

/*   var result = GoogleMaps.getDistance(
    "100 East Main Street, Louisville KY, 40202",
    "500 East Main Street, Louisville KY, 40202"
  );
  var expect = {
    duration: 139,
    duration_nice: "2 mins",
    distance: 1036,
    distance_nice: "1.0 km"
  } */
	var params;
	var geolog = GeoLog.findOne({}, {sort: {timestamp: -1}});
// from tests
	var params = {
		latlng: geolog.location.coords.latitude +','+ geolog.location.coords.longitude,
		radius: 50,
	}
/* 	Meteor.call('googleMaps', params, function(err, results){
		console.log('googleMaps ', params, err, results);
	}); */
	Meteor.call('googleMapsPlaces', params, function(err, results){
		console.log('googleMapsPlaces ', params, err, results);
	});
/* 	var result = GoogleMaps.getDistance("Melbourne", "Sydney");
	console.log(result);

// from tests

  var result = GoogleMaps.getDistance(
    "100 East Main Street, Louisville KY, 40202",
    "500 East Main Street, Louisville KY, 40202"
  );
  var expect = {
    duration: 139,
    duration_nice: "2 mins",
    distance: 1036,
    distance_nice: "1.0 km"
  } */
		
		return Meteor.user();
	},
});

