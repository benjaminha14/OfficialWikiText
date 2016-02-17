// Loads the modules
var twilio = require('twilio');
var http = require("http");
var u = require("url");
var req = require("request");
var cheerio = require("cheerio");
var numUsersSearched = 0;
var client = new twilio.RestClient('ACf2830c92abe86227c9d89be45345bdc1', '8994c537a323c780a92af819a238c6db');
var Firebase = require('firebase');
var dataRef = new Firebase('https://wikitalk.firebaseio.com/');
var usersRef = dataRef.child("data");
var globalInput = "";


// Pass in parameters to the REST API using an object literal notation. The
// REST client will handle authentication and response serialzation for you.
http.createServer(function(request, response) {
    response.writeHead(700, {
        "Content-Type": "text/bold"
    });

   
    var parts = u.parse(request.url, true);
    var query = parts.query;
    var input = query.Body;
    
    var userNumber = query.From;
    var reply = "";
    var count = 0;

    /*
        takes the Wikipedia reply and sends it back to user
    */
    function respondToUser(reply,input) {
        addDataToFireBase(input);

        count++;

        if (count < 2) {
            client.sendMessage({

                to: userNumber,
                from: "+1844-743-9454",
                body: reply

            });
            //addDataToFireBase(input);
        }
        else {
            count = 0;
        }
    }



    /*
        if statement prevents double loop from occuring with a break in the console 
    */

    if (input == undefined) {
        return;
    }

    console.log("User input: " + input);


    /*
        takes input, web scrapes Wikipedia, and returns first paragraph of page
    */

    var url = "https://en.wikipedia.org/wiki/" + input;
    req(url, function(error, response, body) {
            
    var $ = cheerio.load(body);
    var firstPar = "";
    if (!error) {
    
        if(input == "HELLO") {
           firstPar = "Hi, I'm WikiText. Thanks for stopping by. You can look anything you want up just by texting this number with whatever you want to know about. You should get a reply back in under 30 seconds unless our server is down. Try to type in nouns and single words or phrases. Text \"TIPS\" for more help";
           console.log(firstPar);
           reply = firstPar;
               
        } else if (input == "TIPS") {
           firstPar = "In case your having trouble, try searching just nouns or phases. If that doesn't work, then take a look at your capitalization (i.e. Dj Khaled won't work, but DJ Khaled will) and if that, too doesn't work, try putting underscores (_) instead of spaces. If none of those work, then there is no wikipedia page for this topic.";
           console.log(firstPar);
        } else {
        
            if (!error) {
    
                firstPar = "" + $("#mw-content-text").find('p').eq(1);
                firstPar = firstPar.replace(/<(?:.|\n)*?>/gm, '');
                firstPar = firstPar.replace(/<[^>]*?>/gm, '');
                firstPar = firstPar.replace(/&quot;/g, "\"");
                firstPar = firstPar.replace(/\[(?:.|\n)*?\]/g, "");
                firstPar = firstPar.replace(/&#x2013;/g, "--");
                firstPar = firstPar.replace(/&#x2014;/g, "--");
                firstPar = firstPar.replace(/&apos;/g, "\'");
                firstPar = firstPar.replace(/&#xE9;/g, "é");
                reply = firstPar;
            } 
        }
            
        if(firstPar.length !== 0) {
            reply = firstPar;
        } else {
            reply = "Try again, we can't determine what '" + input + "' is. Try making your entry more specific.";
            //alex came up with this vv
             usersRef.child("FailedWords").push().set({
            "words": input
            });
       
            console.log(input + " did not work!");
        }
    } 
        respondToUser(reply, input);
        
    });
    
    response.end();

}).listen(process.env.PORT || 5000);

console.log("Port: "+(process.env.PORT || 5000));


/*
    add data to server so we can upload it to our website
*/

function addDataToFireBase(word) {
    
    
   usersRef.once("value", function(snapshot) {
            console.log(snapshot.val().numberOfSearches.Users);
            numUsersSearched = snapshot.val().numberOfSearches.Users;
            numUsersSearched++;
            usersRef.child("words").push().set({
                "words": word
            });
           
            
            usersRef.child("numberOfSearches").update({
                "Users": numUsersSearched
             });
            
        }, function(errorObject) {
            console.log("The read failed: " + errorObject.code);
    });
        
   
    
}