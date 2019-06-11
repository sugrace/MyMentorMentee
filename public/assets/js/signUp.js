function initRenderPage() {
    if(!sessionStorage['accessToken']) {
        // console.log('ok');
    } else {
        var accessToken = JSON.parse(sessionStorage['accessToken']);
        alert(`Already signed in as ${accessToken.payload['cognito:username']}`);
        window.location.replace('index.html');
    }
}

function initRenderNavBar() {
    if(!sessionStorage['accessToken']) {
        document.getElementById('myNav').innerHTML += '<li><a href="signup.html" class="button primary">Sign Up</a></li>';
        document.getElementById('myNav').innerHTML += '<li><a href="login.html" class="button primary">Sign In</a></li>';
    } else {
        var accessToken = JSON.parse(sessionStorage['accessToken']);
        document.getElementById('myNav').innerHTML += '<li><a href="mypage.html">My Page</a></li>';
        document.getElementById('myNav').innerHTML += '<li>'+ accessToken.payload['cognito:username'] +'</li>';
        document.getElementById('myNav').innerHTML += '<li><a href="login.html" class="button primary" onclick="signOut()">Sign out</a></li>';
    }
    //console.log(accessToken);
}

function signOut() {
    sessionStorage.clear();
    window.location.replace("index.html");
}

function submitById() {
// AWS.config.region = 'us-northeast-2'
const poolData = { UserPoolId : 'ap-northeast-2_HlI8qUsem',
    ClientId : '6dci0nnp78qfagug9segfpdc3l'
};

var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

var attributeList = [];

var userName = document.getElementById("username").value;
var userMail = document.getElementById("usermail").value;
var userPW = document.getElementById("userpw").value;
var userYearSelector = document.getElementById('useryear');
var userYear = userYearSelector[userYearSelector.selectedIndex].value;

var userEmailAttribute = {
    Name : 'email',
    Value : userMail
};

var userYearAttribute = {
    Name : 'custom:year',
    Value : userYear
}

var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(userEmailAttribute);
var attributeYear = new AmazonCognitoIdentity.CognitoUserAttribute(userYearAttribute);

attributeList.push(attributeEmail);
attributeList.push(attributeYear);

console.log(attributeList);

userPool.signUp(userName, userPW, attributeList, null, function(err, result){
    if (err) {
        alert(err.message);
        console.log(err);
        return;
    }
    cognitoUser = result.user;
    console.log('User name is ' + cognitoUser.getUsername());
    alert('Check your email to activate your account!');
    window.location.replace("index.html");
});
}