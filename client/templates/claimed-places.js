Template.claimedPlaces.helpers({
  isAdmin: function() {
    return Meteor.user() && Meteor.user().admin;
  },
  
  claimed: function() {
		var userId = Meteor.user();
		//userId: userId
		var claimedId = Session.get('claimedId');
		var claimed = ClaimedPlaces.findOne(claimedId);
		console.log(' claimedId ', claimedId, claimed);
		return claimed;
  },
	experiences: function(){
		userId = Meteor.userId();
		var userLocation = Session.get('userLocation');
		var services = Experiences.findOne({ userId: userId });
		console.log('experiences Experiences ', userLocation._id, Session.get('userLocation'), services);
		return services;
		if (services.count()) {
			console.log('experiences Experiences return ', services.fetch());
			return services;
		}
		var services = Services.find({place_id: userLocation.place_id});
		console.log('experiences Services ',userLocation.place_id, services.fetch());
		if (services.count()) {
			return services;
		}
	},
});

Template.claimedPlaces.events({
  'submit form': function(event) {
    event.preventDefault();

/*     var text = $(event.target).find('[name=text]').val();
    ClaimedPlaces.insert({ name: text, date: new Date });

    alert('Saved latest news'); */
  },
});

AutoForm.addHooks("claimedPlaces", {
  onError: function () {
    console.log("onError hook called with arguments", arguments);
    console.log("onError hook context:", this);
  },
  onSuccess: function () {
    console.log("onSuccess hook called with arguments", arguments);
    console.log("onSuccess hook context:", this);
		Overlay.hide();
  },
});
AutoForm.addHooks(null, {
	onSuccess: function () {
		console.log("onSuccess on all input/update/method forms!", this);
		Overlay.hide();
	}
});