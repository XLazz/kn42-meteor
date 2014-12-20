Tracker.autorun(function() {
  if (Session.get('query')) {
    var searchHandle = Meteor.subscribe('booksSearch', Session.get('query'));
    Session.set('searching', ! searchHandle.ready());
		if (searchHandle.ready())
			Session.set('query', false);
  }
});