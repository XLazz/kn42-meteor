Tracker.autorun(function() {
  if (Session.get('getPlaces')) {
		console.log('Tracker getPlaces ', Session.get('getPlaces'), Session.get('getPlacesNotReady'));
		// if (Session.get('phpCall'))
			// return
/* 		var userId = Meteor.userId();
		var limit = 20;
    var searchHandle = Meteor.subscribe('downloadPlaces', userId, limit);
    Session.set('getPlacesNotReady', ! searchHandle.ready()); */
  }
  if (Session.get('loadFsqr')) {
    var searchHandle = Meteor.subscribe('CheckinsFsqr', Session.get('query'));
    Session.set('searching', ! searchHandle.ready());
		if (searchHandle.ready())
			Session.set('loadFsqr', false);
		console.log('calling fsqr ', Meteor.userId() );
		if (!Session.get('FsqrCall'))
			Session.set('FsqrCall', 0);
		if (moment().valueOf() - Session.get('FsqrCall') > 1000) { 
			Session.set('FsqrCall', moment().valueOf());
/* 			Meteor.call('checkinsFsqr', Meteor.userId(), function(err, results){
				var timestamp = moment().valueOf();
				Session.set('FsqrCall', timestamp);
				return;
			}); */
		}
  }
});