//GLOBAL VARIABLES
PlayersList = new Mongo.Collection('players');
NumberClicks = 0

//METHODS - SHOULD BE PLACED OUTSIDE OF CLIENT/SERVER CONDITIONALS
Meteor.methods({

    'createPlayer': function(playerNameVar, playerScoreVar){
        //console.log("Creating a player.");
        check(playerNameVar, String);
        check(playerScoreVar, Number);
        var currentUserId = Meteor.userId();
        if (currentUserId) {
            PlayersList.insert ({name: playerNameVar, 
                score: playerScoreVar,
                createdBy: currentUserId
            });
        }
        else{
            console.log ("Sorry! Must be logged in to create player.")
        }
    },

    'removePlayer': function(selectedPlayer){
        //console.log("Removing a player.");
        check(selectedPlayer, String);
        var currentUserId = Meteor.userId();
        if (currentUserId) {
            PlayersList.remove({_id:selectedPlayer,createdBy:currentUserId});
        }
        else{
            console.log ("Sorry! Must be logged in to delete a player.")
        }
    },

    'updateScore': function(selectedPlayer, scoreIncrement){
        //console.log("Removing a player.");
        check(selectedPlayer, String);
        check(scoreIncrement, Number);
        var currentUserId = Meteor.userId();
        if (currentUserId) {
            PlayersList.update({_id:selectedPlayer}, 
                {$inc: {score: scoreIncrement}});
        }
        else{
            console.log ("Sorry! Must be logged in to update a score.")
        }
    }


});


//SERVER CODE
if (Meteor.isServer) {
    
    //PUBLISHING DATA (FOR SECURITY)
    Meteor.publish('thePlayers', function(){
        var currentUserId = this.userId
        return PlayersList.find({createdBy: currentUserId});
    });
}

//CLIENT CODE
if (Meteor.isClient) {
    
    //SUBSCRIBING TO DATA (FOR SECURITY)
    Meteor.subscribe('thePlayers');

    //CLIENT HELPER FUNCTIONS
    Template.leaderboard.helpers ({

        'player': function() {
            //console.log("Finding players...");
            var currentUserId = Meteor.userId();
            var thesePlayers = PlayersList.find({createdBy: currentUserId},
                                                {sort:{score:-1, name: 1}});
            //console.log("Found players.");
            return thesePlayers;
        },

        'countplayers' : function() { 
            //console.log("Counting players...");
            var currentUserId = Meteor.userId();

            var playerCount = PlayersList.find({createdBy: currentUserId}).count();
            //console.log("Counted players.");
            return playerCount;
        },

        'selectedClass': function() {
            var playerId = this._id;
            var selectedPlayer = Session.get ('selectedPlayer')
            if (playerId == selectedPlayer) {
                return "selected";
            }
        },

        'selectedPlayer' : function() {
            var selectedPlayer = Session.get ('selectedPlayer');
            return PlayersList.findOne({_id: selectedPlayer});
        }

    })

    //CLIENT EVENTS
    Template.leaderboard.events ({

        'click .player': function() {
            NumberClicks++;
            var playerId = this._id;
            Session.set('selectedPlayer', playerId); 
            // var selectedPlayer = Session.get('selectedPlayer');
            // console.log (selectedPlayer + " " + NumberClicks);
        },     

        'click .increment' : function() {
            var selectedPlayer = Session.get ('selectedPlayer');
            Meteor.call('updateScore', selectedPlayer, 5)
        },

        'click .decrement' : function() {
            var selectedPlayer = Session.get ('selectedPlayer');
            Meteor.call('updateScore',selectedPlayer, -5)
        },

        'click .remove' : function() {
            var selectedPlayer = Session.get ('selectedPlayer');
            if (confirm("Do you really want to remove " + 
                    PlayersList.findOne({_id: selectedPlayer}).name + 
                    " permanently?") == true) {
                Meteor.call('removePlayer', selectedPlayer)
            }
        }

    })

    Template.addPlayerForm.events ({
        'submit form': function(event) {
            event.preventDefault();

            var playerNameVar = event.target.playerName.value;
            var playerScoreVar = Number(event.target.playerScore.value);

            Meteor.call('createPlayer', playerNameVar, playerScoreVar)
            event.target.playerName.value = "";
            event.target.playerScore.value = "";

        }
    });  


}

