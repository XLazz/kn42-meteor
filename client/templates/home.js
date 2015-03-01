var FEATURED_COUNT = 4;
var i = 0;

var SpecialOffers = new Meteor.Collection(null);

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
	ifUser: function (){
		var userId = Meteor.userId();
		return userId;
	},
	special: function() {
		var offers = SpecialOffers.findOne();
		if ( Meteor.userId())
			console.log('offers ', offers);
		return offers;	
	}
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
	'click .special': function (event, template) {
		Overlay.show('specials');	
	}
});

Template.homelocation.helpers({
	ifUser: function(){
		var user = Meteor.user();
		if (Session.get('debug'))
			console.log(' user ', moment().format("MM/DD HH:mm:ss.SSS"), user);
		return user;
	},
	ifDebug: function(){
		return Session.get('debug');
	},	
	claimed: function(){
		return Session.get('claimed');
	},
	currentlocation: function(){
		Session.set('renderTime', moment().valueOf());
		if (Session.get('debug'))
			console.log('currentlocation 1 ', moment().format("MM/DD HH:mm:ss.SSS"));
		userId = Meteor.userId();
		var currentlocation = {};
		if (!userId) 
			return currentlocation.status = 'please login';	

		var place;
		var autoPlace;

		if (Session.get('userPlaceId')) {
			var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		} else {		
			var userPlace = UserPlaces.findOne({userId:userId}, {sort: {timestamp: -1}});
			if (userPlace) {
				var userPlaceId = userPlace._id;
				Session.set('userPlaceId', userPlace._id);
			} 
		} 	
		
		if (Session.get('debug'))
			console.log('currentlocation 1.1 ', moment().format("MM/DD HH:mm:ss.SSS"), ' location ', Session.get('locationId'), ' userPlace ', userPlace );
			
		if (Session.get('locationId')) {
			var location = GeoLog.findOne(Session.get('locationId'));	
		} else {
			var location = GeoLog.findOne({userId:userId}, {sort: {timestamp: -1}});
			if ((!location) || (!Session.set('geoback'))){
				startGeo();
				return currentlocation.status = '...no data. Please turn on service';
			}
			Session.set('locationId', location._id);		
		} 
		if (!location) 
			return currentlocation.status = '...no data. Please turn on service';	
	
		if ((userPlace) && (!userPlace.place_id)) {
			var params = {
				radius: 20,
				location: userPlace.location,
				geoId: location._id,
				userPlaceId: userPlace._id
			}
			var initiator = 'homelocation helpers';
			console.log('currentlocation 1.15 selectPlace calloing getGLoc with ', params, initiator);	
			var gotPlaces = Meteor.call('getGLoc', userId, params, initiator, function(err, results){
				console.log('selectPlace helpers getGLoc results ', results.results);	
				return results;
			});
			return currentlocation.status = '...updating place';	
		}
	
		if (Session.get('debug'))
			console.log('currentlocation 1.2 ', moment().format("MM/DD HH:mm:ss.SSS"), ' location.stationary ', location.stationary, location.location.distance, location.location.coords.speed, userPlace );
		
		if (location.stationary) {	
			userPlace.showbut = true;
			if (location.stationary)
				userPlace.stationary = location.stationary;
			if (userPlace.status === 'confirmed')
				userPlace.confirmed = true;
			if (userPlace.status === 'travel')
				userPlace.travel = true;	
/* 			if (!userPlace.place_id) {
				var initiator = 'homelocation geoMerchant';
				// if (!this.location)
				// return;
				var params = {
					location: location.location,
					radius: 20
				};
				console.log('calling getGLoc ');
				Meteor.call('getGLoc', userId, params, initiator, function(err, results) {
					if (results)
						console.log('currentlocation 1.3 called getGLoc ', results);
				});
			} */
			if (!userPlace.name) {
				var place = Places.findOne({place_id: userPlace.place_id}, {fields:{name:1, vicinity:1, icon:1}});	
				// if (!place)
					// var place = MerchantsCache.findOne({place_id: userPlace.place_id}, {fields:{name:1, vicinity:1, icon:1}});	
				if (Session.get('debug'))
					console.log('currentlocation 1.4 ', moment().format("MM/DD HH:mm:ss.SSS"), ' location.stationary ', location.stationary, userPlace.place_id, place );
				if (place) {
					userPlace.name = place.name;
					userPlace.vicinity = place.vicinity;
					userPlace.icon = place.icon;
				}
			}
			
			if (Session.get('debug'))
				console.log('currentlocation 2.5 ', moment().format("MM/DD HH:mm:ss.SSS"), userPlace.place_id,  userPlace.stationary, userPlace.status, userPlace, place);	
			currentlocation = userPlace;
//			Session.set('userPlace', false);
		} else {
			currentlocation = location;
			currentlocation.travel = true;		
		}
		
		if (!currentlocation)
			return currentlocation.status = '...updating';	
		if (!userPlace.timestampEnd) {
			currentlocation.timestampEnd =  moment().valueOf()
			currentlocation.finished = 'in progress';
		} else {
			currentlocation.timestampEnd = userPlace.timestampEnd;
			currentlocation.finished = moment(userPlace.timestampEnd).format("MM/DD/YY HH:mm");
		}
		if (currentlocation.status == 'travel')
			currentlocation.travel = true;
		currentlocation.started = moment(userPlace.timestamp).format("MM/DD/YY HH:mm");
		currentlocation.timespent = moment.duration(parseInt(userPlace.timestamp) - parseInt(userPlace.timestampEnd)).humanize();

		/* 			currentlocation.autoPlace =  AutoPlaces.findOne({userId: userId, place_id: doc.geo_place_id});
		if (doc.autoPlace)
			doc.place_id = doc.autoPlace.place_id; */
		if (Session.get('debug'))
			console.log('currentlocation 5 ', moment().format("MM/DD HH:mm:ss.SSS"), currentlocation.stationary, currentlocation);

		return currentlocation;
	},
	
	geoPlace: function() {
		console.log('geoPlace 1 ', moment().format("MM/DD HH:mm:ss.SSS"), this.place_id, this);
		var place;
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		place = Places.findOne({place_id: this.place_id});
		if (!place) {
			var place = MerchantsCache.findOne({'place_id': this.place_id});
			console.log('geoPlace 1.5 ', moment().format("MM/DD HH:mm:ss.SSS"), this.place_id, place);
			if (place) {
				place.updated =  moment().valueOf();
				Places.insert(place);
			}
		}
//		console.log('geoPlace ', this.place_id, place);
/* 		if ((!Session.get('userPlace')) && place) {
			Session.set('userPlace', place);
		} */
		console.log('geoPlace 2 ', moment().format("MM/DD HH:mm:ss.SSS"), this.place_id, place);
		return place;
	},

	geoMerchant: function() {
		var userId = Meteor.userId();
		// We use this helper inside the {{#each posts}} loop, so the context
		// will be a post object. Thus, we can use this.authorId.
		var place = MerchantsCache.findOne({'place_id': this.place_id});
		if (!place) {
//			if (!this.place_id)
				updateEmptyPlaces();
		} 
		console.log('geoMerchant ', moment().format("MM/DD HH:mm:ss.SSS"), this, this.place_id, place);
		return place;
	},	
	
	findFsqr: function(){
		var userPlace = this._id;
//		var venue = loadFsqr(userPlace);
		console.log(' findFsqr ', venue);
		return venue;
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
	
	updating: function() {
		updateEmptyPlaces();
		return Session.get('updatePlaces');
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

Template.homelocation.rendered = function() {
  var $item = $(this.find('.buttons-row'));
  Meteor.defer(function() {
    $item.removeClass('loading');
  });
	console.log('homelocation.rendered 3 ', moment().format("MM/DD HH:mm:ss.SSS"), ( - Session.get('renderTime') + moment().valueOf())/1000);
}

Template.homelocation.events({
	'click #checkFsqr': function(event, template) {
		console.log('clicked checkFsqr ', this._id, this.location);
/* 		Meteor.call('checkinsFsqr',  Meteor.userId(), this._id, function(err,results){
			console.log('checkinsFsqr call result ', results[0].venue);
		}); */
		var query = {};
/* 		query.radius = 1000;
		query.what = 'coffee'; */
		userPlace = this._id;
		var venue = loadFsqr(this.location);
		return venue;
	},
});

Template.selectExperience.helpers({
	userId: function(){
		return Meteor.userId();
	},
	experiences: function(){
		userId = Meteor.userId();
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		var services = Experiences.findOne({ userId: userId, place_id: userPlace.place_id });
//		console.log('experiences Experiences ', userPlace._id, Session.get('userPlace'), services);
		return services;
		if (services.count()) {
			console.log('experiences return ', services.fetch());
			return services.fetch();
		}
		var services = PlaceServices.find({place_id: userPlace.place_id});
		console.log('experiences Services ',userPlace.place_id, services.fetch());
		if (services.count()) {
			return services;
		}
	},
	types: function(){
		userId = Meteor.userId();
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		var currentPlace = Places.findOne({place_id: userPlace.place_id});
		console.log('experiences Places ', userPlace.place_id, currentPlace);
		if (currentPlace){		
			return currentPlace.types;
		}
		currentPlace = MerchantsCache.findOne({place_id: userPlace.place_id});
		console.log('experiences MerchantsCache ', userPlace.place_id, currentPlace);		
		return currentPlace.types;
	},
	
	currentPlace: function() {
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		console.log('experiences userPlace ', moment().format("MM/DD/YY HH:mm:ss"), userPlace.place_id, userPlace);
		return userPlace;
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
/* 		var experience = $( "#select-" + Session.get('userPlace').user_history_location_id +"-empty").val();
//		var experiences = $.csv.toArray(experiences);
		console.log('experiences selectExperience.events ', experience);
		Experiences.insert({
			userId: Meteor.userId(),
			experience: experience,
			place_id: Session.get('userPlace').place_id,
			created: new Date(),
		});		
		return experience; */
	},
});

Template.buttons.helpers({
	buttonsPlace: function(){
		if (Session.get('debug'))
			console.log('buttonsPlace helper 1 ', moment().format("MM/DD HH:mm:ss.SSS"), ' this ', this, ' userplace ', Session.get('userPlaceId'));
//			console.log('buttons location ', Session.get('userPlace').place_id, ' confirmed ', place.confirmed, place._id, place.name);
		var userPlace = UserPlaces.findOne(Session.get('userPlaceId'));
		if (userPlace.status == 'confirmed')
			userPlace.confirmed = true;
		if (userPlace.status == 'travel')
			userPlace.travel = true;
		if (!userPlace.userPlaceId)
			userPlace.userPlaceId = userPlace._id;
		if (Session.get('debug'))
			console.log('buttonsPlace helper 2 ', moment().format("MM/DD HH:mm:ss.SSS"), ' userplace ', userPlace);		
		return userPlace
	},
	session: function(){
		return Session.get('userPlaceId');
	},
});

Template.buttons.events({
	"click .confirm": function (event, template) {
		var userId = Meteor.userId();
		var place = {};
		console.log('buttons click .confirm curr event ', this._id, this.name, event.currentTarget, this);

		UserPlaces.update(this._id, {$set: {status: 'confirmed'}});		
//		Session.set('userPlace', userPlace);
		if (!this.name) {
			place = Places.findOne({place_id:this.place_id}, {fields: {name: 1}});
			// if (place)
				// userPlace.name = place.name;
		}
		if (!place) {
			place = {};
			var myPlace = Places.findOne({place_id:this.place_id}, {fields: {name: 1}});
			if (myPlace) {			
				place.name = myPlace.name
				console.log('click .confirm buttons confirming userPlace 1 ', userPlace, myPlace );
			} else {
				var merchant = MerchantsCache.findOne({place_id:this.place_id}, {fields:{_id:0}});
				if (merchant) {
					console.log(merchant.name);
					console.log(place.name);
					place.name = merchant.name;
					Places.insert(merchant);
				}
			}		
			console.log('click .confirm buttons confirming userPlace ', place.name );
	//		console.log('click .confirm buttons confirming userPlace ', place.place_id, place.name );
			if (!place.name) {
				alert('Cant confirm Unknown. Please click on Change button first');
				return;
			}	
		}
		var experience;
		place.status = 'confirmed';
		place.userPlaceId = this._id;
		Meteor.call('updatePlace', userId, place, experience);
	},	 
	
	"click .undo": function (event, template) {
		var userId = Meteor.userId();
		var userPlace = {};
		userPlace.status = '';
		userPlace.userPlaceId = this._id;
		console.log('click .confirm buttons confirming userPlace ',this._id, event, this );
		UserPlaces.update(this._id, {$set: {status: ''}});	
		var experience;
		
		Meteor.call('updatePlace', userId, userPlace, experience);
	},	
	"click .locations": function (event, template) {
		var radius = 50;
		var timestamp;
		var userId = Meteor.userId();

		console.log('locations events 1 ',this.place_id);
		Session.set('searching', false);
		Session.set('radius', radius);
		Overlay.show('selectPlace');	
	},
	"click .travel": function (event, template) {
//		alert('coming soon');
		var userId = Meteor.userId();
		console.log('click .travel buttons confirming userPlace ',this._id );
		UserPlaces.update(this._id, {$set: {status: 'travel'}});		
		var experience;
		var userPlace = {};
		userPlace.status = 'travel';
		Meteor.call('updatePlace', userId, userPlace, experience);
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
		var userPlaceId = this.userPlaceId;
		if (Session.get('debug'))
			console.log('claimed 1 ', userPlaceId, this);
		if (!userPlaceId)
			return;
		var userPlace = UserPlaces.findOne(userPlaceId);			
		if (Session.get('debug'))
			console.log('claimed 1.5 ', userPlaceId , userPlace );
		if (userPlace) 	
			if (userPlace.location)
				if (userPlace.location.coords)
					var coords = userPlace.location.coords;
		if (Session.get('debug'))
			console.log('claimed 2 ', userPlaceId, userPlace.location.coords, userPlace);
		var claimed = findClaimed(userId, coords);
		if (!claimed) 
			return
		if (Session.get('debug'))
			console.log('claimed 3 ', userPlaceId, claimed);
		Session.set('claimed', claimed);
		return claimed;
	},	
});

Template.claimIt.events({
	"click .claim": function (event, template) {
		event.preventDefault();
		userId = Meteor.userId();	

//		alert('coming soon');
		var userPlaceId = Session.get('userPlaceId');
		if (!userPlaceId) {
			alert('You need to start geolog service before we can set you');
			return;
		}

		console.log('click claim userPlace ', userPlaceId);
		userPlace = UserPlaces.findOne(userPlaceId);
		if (!userPlace.status == 'confirmed') {
			alert('Please confirm the place before claiming it');
			return;
		}
		console.log('click .claim buttons confirming userPlace ', userPlaceId );

		// Populate services
		var myTypes = Places.find({},{fields:{types:1}});
		console.log(' types ', myTypes.fetch());
		myTypes.forEach(function (item, index, array) {
//			console.log(' adding types ', item);
			if (item[0]) {
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
		Session.set('claimedId', false);
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
	if (!Session.get('userPlaceId'))
		return Template._no_exp2;
	
//	console.log('isBlock ifConfirmed2 ', isBlock, Session.get('userPlaceId'), this.valueOf(), this);

  if (isBlock == Session.get('userPlaceId').user_history_location_id) {
		console.log('isBlock check ', isBlock);
    return Template._show_exp2;
  } else {
//		console.log('isBlock check 2 ', isBlock);
    return Template._no_exp2;
	}
});

/* Template.common_kn.helpers({
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
}); */


Template.specials.helpers({
	special: function(){
		var special = SpecialOffers.find({},{sort: {timestamp: -1}});
		console.log('specials ', special);
		return special;
		//return Session.get('special');
	}
});

Template.specials.events({
	'click .cancel': function(event, template) {
		console.log('selectPlace click .cancel ', this);
		// Session.set("showCreateDialog", false);
		var radius = 50;
		Session.set('radius', radius);
		Session.set('searching', false);
		Session.set('changeplace', false);
		Overlay.hide();
	},
});