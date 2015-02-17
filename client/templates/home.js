var FEATURED_COUNT = 4;
var i = 0;

findExperiences = function(){
	var services = PlaceServices.findOne({
		place_id: Session.get('currentPlace')
	});
	if (services) {
		console.log('experiences ', services);
		return services.experiences;
	}
	var currentPlace = Places.findOne({place_id: Session.get('currentPlace')});
	if (currentPlace){
		console.log('experiences ', currentPlace.types);
		return currentPlace.types;
	}
}

Template.homeinside.helpers({	
  // selects FEATURED_COUNT number of recipes at random
/*   featuredRecipes: function() {
    var recipes = _.values(RecipesData);
    var selection = [];
    
    for (var i = 0;i < FEATURED_COUNT;i++)
      selection.push(recipes.splice(_.random(recipes.length - 1), 1)[0]);
    return selection;
  }, */
  
/*   activities: function() {
    return Activities.latest();
  }, */
	debug: function () {
		return Session.get('debug');
	},  
  latestNews: function() {
    return News.latest();
  },
});

Template.home.events({

});

Template.homeinside.helpers({
	ifUser: function (){
		if (Meteor.userId()) {return 'true'};
	},
	
	currentUser: function(){
		if (!Meteor.userId()) {return;}
		console.log('curr user ',  Meteor.user());
		return Meteor.user();
	},
});

Template.homelocation.helpers({
	ifUser: function(){
		var user = Meteor.user();
		console.log(' user ', user);
		return user;
	},
	ifDebug: function(){
		return Session.get('debug');
	},	
	claimed: function(){
		return Session.get('claimed');
	},
	currentlocation: function(){
		if (!Meteor.userId()) {return;};
		var currentlocation;
		userId = Meteor.userId();
		if (!GeoLog.findOne({userId: userId}))
			return;
		if (!GeoLog.findOne({userId: userId}, {sort: {timestamp: -1}}).status) {
			console.log('currentlocation moving');
			currentlocation = GeoLog.findOne(
				{userId: userId}, 
				{
					sort: {timestamp: -1},
					transform: function(doc){	
						doc.timespent = moment.duration(parseInt(doc.timestamp) - moment().valueOf()).humanize();
						doc.started = moment(doc.timestamp).format("MM/DD/YY HH:mm");
						doc.finished = 'on the move!';
						console.log('currentlocation ', doc);
						return doc;
					}
				}
			);
		} else {
			// since we are stationary - getting user places
			console.log('currentlocation stationary');
			currentlocation = UserPlaces.findOne(
				{userId: userId}, 
				{
					sort: {timestamp: -1},
					transform: function(doc){	
						if (!doc.timestampEnd) {
							doc.timestampEnd =  moment().valueOf()
							doc.finished = 'in progress';
						} else {
							doc.finished = moment(doc.timestampEnd).format("MM/DD/YY HH:mm");
						}
						doc.status = 'stationary';
						doc.timespent = moment.duration(parseInt(doc.timestampEnd) - parseInt(doc.timestamp)).humanize();
						doc.temp = doc.timestampEnd - doc.timestamp
						doc.started = moment(doc.timestamp).format("MM/DD/YY HH:mm");
						doc.autoPlace =  AutoPlaces.findOne({userId: userId, place_id: doc.geo_place_id});
						if (doc.autoPlace)
							doc.place_id = doc.autoPlace.place_id;
						if (doc.place_id) {
							var count = UserPlaces.find({userId: userId, place_id: doc.place_id}).count();
							doc.count = count;
						}
						console.log('currentlocation ', doc);
						return doc;
					}
				}
			);
		}
//		console.log('currentlocation ', this, this.place_id);
		return currentlocation;
	},
	
	userPlace: function() {
		userId = Meteor.userId();
//		console.log('userPlace 0 ', this, this.status);
/* 		if (!this.status) {
//			console.log('userPlace 0.5 ', this, this.status);
			return;
		}
		if (this.status !== 'stationary') {
//			console.log('userPlace 1 ', this, this.status);
			return;
		} */
		var place;
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		place = UserPlaces.findOne({userId:userId, place_id: this.place_id},{sort: {timestamp: -1}});
		//console.log('userPlace place_id ', this.place_id, ' place ', place);
		if (!place)
			return;
		Session.set('userLocation', place);
		var count = UserPlaces.find({userId:userId, place_id: this.place_id}).count();
		place.count = count;
	//	console.log('userPlace 2 ', this, this.place_id, place, count);
		return place;
	},

/* 	placeSubst: function() {
		var place;
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		place = PlacesSubst.findOne({old_place_id: this.place_id});
//		console.log('PlacesSubst ', this.place_id, place);
		return place;
	}, */
	
	geoPlace: function() {
		var place;
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		place = Places.findOne({place_id: this.place_id});
		if (!place)
			return;
//		console.log('geoPlace ', this.place_id, place);
		if ((!Session.get('userLocation')) && place) {
			Session.set('userLocation', place);
		}
		return place;
	},

	geoMerchant: function() {
		var userId = Meteor.userId();
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = MerchantsCache.findOne({'place_id': this.place_id});
		if (!place) {
			var radius = 50;
			if ((!place) && (!Session.get('googleCall'))){
				console.log('Google call getGLoc in geoMerchant homelocation ', this.place_id, this.place, this);
				var initiator = 'homelocation geoMerchant';
				// if (!this.location)
					// return;
				var params = {
					location: this.location,
					radius: radius
				};

/* 				Meteor.call('getGLoc', userId, params, initiator, function(err, results) {
					if (results)
						Session.set('googleCall', false);	
				}) */;
				Session.set('googleCall', moment().valueOf());
			}
				
		} else {
			if (!place)
				return;
			if ((!Session.get('userLocation')) && place) {
				Session.set('userLocation', place);
			}
		}
//		console.log('geoMerchant ', this, this.place_id, place);
		return place;
	},	
	
/* 	checkedFsqr: function(){
		if (!this.timestampEnd)
			this.timestampEnd = moment().valueOf();
		var timestampFsqr;
		var nameFsqr;
		console.log('checkin fsqr ', timestamp, timestampEnd);
		var checkedFsqr = VenuesCheckins.findOne({
				userId:this.userId,	
				createdAt: { $gt: this.timestamp/1000+300*60, $lt: this.timestampEnd/1000+300*60}	
			},{	
				limit: 1, sort: {createdAt: -1},
				transform: function(doc){
	//				doc.timestamp = doc.timestamp+300*60;
					doc.date = moment(doc.createdAt*1000).format("MM/DD/YY HH:mm");
					var venue = VenuesFsqr.findOne({venueId:doc.venueId});
					doc.name = venue.name;
					console.log('checkin fsqr 2 ', timestamp, timestampEnd, doc.createdAt, doc.date, doc.name);
					return doc;
				}
			}
		);
		console.log('checkedFsqr ', this, checkedFsqr);
		if (checkedFsqr)
			return checkedFsqr;		
	},
	
	checkinFsqr: function(){
		var userLocationId = this._id;
		if (!userLocationId)  
			return ;
		var userLocation =  UserPlaces.findOne(userLocationId);
		if (!userLocation.location)  	
			return ;	
		if (!userLocation.location.coords)  
			return ;				
		console.log('checkinFsqr 1 ', userLocation.location.coords);
		var coords = userLocation.location.coords;
//		var userLocation = GeoLog.findOne({userId: userId}, {sort: {created: -1}}).location;

		var radius_search = 0.1;
		latup = coords.latitude + radius_search;
		latdown = coords.latitude - radius_search;
		lngup = coords.longitude + radius_search;
		lngdown = coords.longitude - radius_search;
		var checkinFsqr = VenuesCache.findOne({'location.lat': { $gt: latdown, $lt: latup }, 'location.lng': { $gt: lngdown, $lt: lngup }});
		console.log('checkinFsqr 2 ', this, checkinFsqr);
		if (checkinFsqr)
			return checkinFsqr;		
	}, */
	
	findFsqr: function(){
		var userLocation = this._id;
		var venue = loadFsqr(userLocation);
		console.log(' findFsqr ', venue);
		return venue;
	},
	
	currentplace: function(){
		userLocation = Session.get('userLocation');
		if (!userLocation)
			return;
		if (!userLocation.user_history_location_id)
			return;
		var place = Places.findOne({place_id: userLocation.place_id});
		
		if (!place) {
			place = MerchantsCache.findOne({place_id: userLocation.place_id});
		}
		if (!place) {
			console.log('no content, going for call to getPlaces');
			Meteor.call( 'getPlaces', Meteor.userId(), userLocation, 50, function(err, results){
				console.log('Meteor.call getPlaces', results);
				return {'currentplace': results};
			});
			return place;
		}
		
		if (!userLocation.name) {
			UserLocations.update({_id: userLocation._id}, {$set:{name: place.name}});
		}
			
		place.timespent = moment(userLocation.started).fromNow();
		console.log('currentplace started ', userLocation.started );
		return place;
	},
	
	placeconfirmed: function(){
		currentPlace = UserLocations.findOne({user_history_location_id: Session.get('userLocation').user_history_location_id, confirmed: 1});
		if (currentPlace) {
			console.log('experiences placeconfirmed ', currentPlace.place_id);
			return currentPlace;
		}
	},
	
	service: function(){
		if (!Meteor.userId()) {return;};
		var lastGeoLog = GeoLog.findOne({userId: Meteor.userId(), place_id: {$not: {$size: 0}}}, {sort: {timestamp: -1}});
		if (!lastGeoLog) {return};
		if (!lastGeoLog.status) {
			if (!Session.get('geoback')) {
				return 'service is not running';
			} else {
				return 'we are waiting for more data to see if you are stationary';
			}
		}
		return lastGeoLog.status;	
	},	

	changeplace: function(){
		return Session.get('changeplace');
	},
	
	showexpselect: function(){
		return Session.get('showexp');
	},
	
	exp1: function(){
		$('#input-tags').selectize({
				delimiter: ',',
				persist: false,
				create: function(input) {
						return {
								value: input,
								text: input
						}
				}
		});	
	}
});

Template.homelocation.events({
	'click #checkFsqr': function(event, template) {
		console.log('clicked checkFsqr ', this._id);
/* 		Meteor.call('checkinsFsqr',  Meteor.userId(), this._id, function(err,results){
			console.log('checkinsFsqr call result ', results[0].venue);
		}); */
		var query = {};
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		userLocation = this._id;
		var venue = loadFsqr(userLocation);
		return venue;
	},
});

Template.homeinside.events({
	'click .goprofile': function(event, template) {
		Router.go('about');
	},
	'click .change': function (event, template) {
		var place_id = $(event.currentTarget).attr("id");
		Session.set('radius', 50);
		console.log('changing place ', place_id);
		return Session.set('changeplace', true);
	},
	"click .expselect": function (event, template) {
		Session.set('showexp', true);
	},	
});

Template.selectExperience.helpers({
	userId: function(){
		return Meteor.userId();
	},
	experiences: function(){
		userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		var services = Experiences.findOne({ userId: userId, place_id: userLocation.place_id });
//		console.log('experiences Experiences ', userLocation._id, Session.get('userLocation'), services);
		return services;
		if (services.count()) {
			console.log('experiences return ', services.fetch());
			return services.fetch();
		}
		var services = PlaceServices.find({place_id: userLocation.place_id});
		console.log('experiences Services ',userLocation.place_id, services.fetch());
		if (services.count()) {
			return services;
		}
	},
	types: function(){
		userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		var currentPlace = Places.findOne({place_id: userLocation.place_id});
		console.log('experiences Places ', userLocation.place_id, currentPlace);
		if (currentPlace){		
			return currentPlace.types;
		}
		currentPlace = MerchantsCache.findOne({place_id: userLocation.place_id});
		console.log('experiences MerchantsCache ', userLocation.place_id, currentPlace);		
		return currentPlace.types;
	},
	
	currentPlace: function() {
		var userLocation = Session.get('userLocation');
		console.log('experiences userLocation ', userLocation.place_id, userLocation);
		return userLocation;
	},
});

Template.selectExperience.events({
	'submit form': function(event, template){
	},
	'keydown .form-control': function(event, template){
/* 		var timer = null;
		$('#experience').keydown(function(){
					 clearTimeout(timer); 
					 timer = setTimeout(doStuff, 1000)
		}); */

		function doStuff() {
				alert('do stuff');
		}
		var what = template.find('.form-control');
		var whatname = template.find('.form-control').name;
		var text = template.find('.inner-editor');
		var form = template.find('#experiencesForm1');
		console.log('experiences selectExperience.events ', form.text, what, text, form );
/* 		var experience = $( "#select-" + Session.get('userLocation').user_history_location_id +"-empty").val();
//		var experiences = $.csv.toArray(experiences);
		console.log('experiences selectExperience.events ', experience);
		Experiences.insert({
			userId: Meteor.userId(),
			experience: experience,
			place_id: Session.get('userLocation').place_id,
			created: new Date(),
		});		
		return experience; */
	},
});

Template.buttons.helpers({
	buttonsPlace: function(){
		if (Session.get('userLocation')) {
			place = UserPlaces.findOne(Session.get('userLocation')._id);
			
//			console.log('buttons location ', Session.get('userLocation').place_id, ' confirmed ', place.confirmed, place._id, place.name);
			return place;
		}
	},
	session: function(){
		return Session.get('userLocation');
	},
});

Template.buttons.events({
	"click .confirm": function (event, template) {
		var userId = Meteor.userId();
		var locId = Session.get('userLocation')._id;
		console.log('buttons click .confirm curr event ', locId, Session.get('userLocation'));
		var place = UserPlaces.findOne(locId);
		var myPlace = Places.findOne({place_id:place.place_id}, {fields: {name: 1}});
		if (myPlace) {
			place.name = myPlace.name
			console.log('click .confirm buttons confirming userLocation 1 ', locId, place, myPlace );
		} else {
			var merchant = MerchantsCache.findOne({place_id:place.place_id}, {fields:{_id:0}});
			place.name = merchant.name
			Places.insert(merchant);
		}		
		console.log('click .confirm buttons confirming userLocation ', locId, place.name );
//		console.log('click .confirm buttons confirming userLocation ', place.place_id, place.name );
		if (!place.name) {
			alert('Cant confirm Unknown. Please click on Change button first');
			return;
		}
		UserPlaces.upsert(locId, {$set: {confirmed: true, travel: ''}});	
		var experience;
		place.status = 'confirmed';
		place.userplaceId = locId;
		Meteor.call('updatePlace', userId, place, experience);
	},	 
	"click .undo": function (event, template) {
		var userId = Meteor.userId();
		var location = Session.get('userLocation');
		var locId = location._id
		console.log('click .confirm buttons confirming userLocation ',locId );
		UserPlaces.upsert(locId, {$set: {confirmed: '', travel: ''}});
		
		var experience;
		location.status = '';
		location.userplaceId = locId;
		Meteor.call('updatePlace', userId, location, experience);
	},	
	"click .locations": function (event, template) {
		var radius = 50;
		var timestamp;
		var userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		console.log('locations events 1 ',this.place_id, userLocation);
//		Meteor.call('getLocations','list');
/* 		Meteor.call('getGLoc', userId, userLocation.location, radius, function(err, results){
			console.log('locations events getGLoc results ', results.results);	
		}); */
		console.log('locations events ', Session.get('userLocation'));	
		Session.set('searching', false);
		Session.set('radius', radius);
		Overlay.show('selectPlace');	
	},
	"click .travel": function (event, template) {
//		alert('coming soon');
		var userId = Meteor.userId();
		var location = Session.get('userLocation');
		var locId = location._id
		console.log('click .travel buttons confirming userLocation ',locId );
		UserPlaces.upsert(locId, {$set: {confirmed: '', travel: true}});		
		var experience;
		location.status = 'travel';
		location.userplaceId = locId;
		Meteor.call('updatePlace', userId, location, experience);
	},		
	
});

Template.buttons.rendered = function() {
  var $item = $(this.find('.buttons-row'));
  Meteor.defer(function() {
    $item.removeClass('loading');
  });
}

Template.claimIt.helpers({
	"claimed": function (event, template) {
		userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		if (!userLocation)
			return;
		var result = GeoLog.findOne(userLocation.geoId);
//			console.log('claimed userLocation ',userLocation.geoId , userLocation, result );
		if (result) {		
			var coords = result.location.coords;
		} else {
			if (!userLocation.location)
				return;		
			if (!userLocation.location.coords)
				return;		
			var coords = userLocation.location.coords;
		}
		var claimed = findClaimed(userId, coords);
		if (!claimed) 
			return
		Session.set('claimed', claimed);
		return claimed;
	},	
});

Template.claimIt.events({
	"click .claim": function (event, template) {
		event.preventDefault();
		userId = Meteor.userId();	

//		alert('coming soon');
		var userLocation = Session.get('userLocation');
		if (!userLocation) {
			alert('You need to start geolog service before we can set you');
			return;
		}
		var locId = userLocation._id;
		console.log('click claim userlocation ', userLocation);
		userLocation = UserPlaces.findOne(userLocation._id);
		if (!userLocation.confirmed) {
			alert('Please confirm the place befor claiming it');
			return;
		}
		console.log('click .claim buttons confirming userLocation ',locId );

		// Populate services
		var myTypes = Places.find({},{fields:{types:1}});
		console.log(' types ', myTypes.fetch());
		myTypes.forEach(function (item, index, array) {
			if (item.types[0]) {
//				console.log(' foreach 1 ', item.types );
				item.types.forEach(function (item2, index, array) {

					var myId = PlaceServices.findOne({type:item2});
					console.log(' foreach 2 ', item2, myId );
					if (!myId) {
						PlaceServices.insert({type:item2});
					}
				});
			}
		});
		Overlay.show('claimPlace');	
	},	
	"click .editClaim": function (event, template) {
		event.preventDefault();
//		var claimedId = template.find('.editClaim').attr('id');
		var claimedId = $(event.currentTarget).attr("id")
		console.log('click .editClaim ',claimedId );
		Session.set('claimedId', claimedId);
		// ClaimedPlaces.insert({place_id: place_id});
		// UserPlaces.upsert(locId, {$set: {claimed: true}});		
		Overlay.show('claimedPlaces');	
	},	
});

UI.registerHelper('ifConfirmed2', function () {
  // extract boolean value from data context. the data context is
  // always an object -- in this case it's a wrapped boolean object.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
  var isBlock = this.valueOf();
//	isBlock = Number.isInteger(isBlock);
	if (!Session.get('userLocation'))
		return Template._no_exp2;
	
//	console.log('isBlock ifConfirmed2 ', isBlock, Session.get('userLocationId'), this.valueOf(), this);

  if (isBlock == Session.get('userLocation').user_history_location_id) {
		console.log('isBlock check ', isBlock);
    return Template._show_exp2;
  } else {
//		console.log('isBlock check 2 ', isBlock);
    return Template._no_exp2;
	}
});

Template.common_kn.helpers({
	status: function() {
		if (Session.get('geoback')) {
			return 'running';
		} else {
			return 'stopped';
		}
	},
	ifService: function() {
		return Session.get('geoback')
	},
});

