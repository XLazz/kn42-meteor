/* // Server
Meteor.publishComposite('MerchantsByLocation', function(location) {
    return {
        find: function() {
            // Find posts made by user. Note arguments for callback function
            // being used in query.
            return MerchantsCache.find({ place_id: place_id });
    children: [
        {
            find: function(post) {
                // Find post author. Even though we only want to return
                // one record here, we use "find" instead of "findOne"
                // since this function should return a cursor.
                return Meteor.users.find(
                    { _id: post.authorId },
                    { limit: 1, fields: { profile: 1 } });
            }
        },
        {
            find: function(post) {
                // Find top two comments on post
                return Comments.find(
                    { postId: post._id },
                    { sort: { score: -1 }, limit: 2 });
            },
            children: [
                {
                    find: function(comment, post) {
                        // Find user that authored comment.
                        return Meteor.users.find(
                            { _id: comment.authorId },
                            { limit: 1, fields: { profile: 1 } });
                    }
                }
            ]
        }
    ]
    }
}); */