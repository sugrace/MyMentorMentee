function initRenderPage() {
    if(!sessionStorage['accessToken']) {
        console.log('ok');
    } else {
        var accessToken = JSON.parse(sessionStorage['accessToken']);
        alert(`Already signed in as ${accessToken.payload['cognito:username']}`);
        window.location.replace('index.html');
    }
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

var userEmail = {
    Name : 'email',
    Value : userMail
};

var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(userEmail);

attributeList.push(attributeEmail);

console.log(attributeList);
console.log(userPW);

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