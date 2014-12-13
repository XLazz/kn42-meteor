Template.claimedPlaces.helpers({
  isAdmin: function() {
    return Meteor.user() && Meteor.user().admin;
  },
  
  claimed: function() {
		var userId = Meteor.user();
		//userId: userId
    var claimed = ClaimedPlaces.find({});
		console.log(' claimed ', claimed);
		return claimed;
  }
});

Template.claimedPlaces.events({
  'submit form': function(event) {
    event.preventDefault();

    var text = $(event.target).find('[name=text]').val();
    ClaimedPlaces.insert({ name: text, date: new Date });

    alert('Saved latest news');
  },
  
  'click .login': function() {
    Meteor.loginWithTwitter();
  }
})