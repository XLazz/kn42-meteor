/* Places.helpers({
  userHistoryLocation: function() {
    return MerchantsCache.findOne(this.user_history_location_id);
  }
});

Authors.helpers({
  fullName: function() {
    return this.firstName + ' ' + this.lastName;
  },
  places: function() {
    return UserLocations.find({ user_history_location_id: this._id });
  }
}); */
/* 
Books = new Mongo.Collection('books');
Authors = new Mongo.Collection('authors');

Books.helpers({
  author: function() {
    return Authors.findOne(this.authorId);
  }
});

Authors.helpers({
  fullName: function() {
    return this.firstName + ' ' + this.lastName;
  },
  books: function() {
    return Books.find({ authorId: this._id });
  }
}); */