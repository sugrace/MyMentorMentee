function initRenderPage() {
    if(!sessionStorage['accessToken']) {
        console.log('ok');
    } else {
        var accessToken = JSON.parse(sessionStorage['accessToken']);
        alert(`Already signed in as ${accessToken.payload['cognito:username']}`);
        window.location.replace('index.html');
    }
}

function signInById() {
    const poolData = { UserPoolId : 'ap-northeast-2_HlI8qUsem',
        ClientId : '6dci0nnp78qfagug9segfpdc3l'
    };

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var userName = document.getElementById("username").value;
    var userPW = document.getElementById("userpw").value;

    var authenticationData = {
        Username : userName,
        Password : userPW,
    };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    var userData = {
        Username : userName,
        Pool : userPool
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    var jwtIdToken; // important!!!
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            jwtIdToken = result.idToken;
            //console.log(accessToken);
            sessionStorage.accessToken = JSON.stringify(jwtIdToken);
            //console.log(result);
            console.log(JSON.parse(sessionStorage['accessToken']).payload.email);
            console.log('sign in success!!!');
            window.location.replace("index.html");
        },
        onFailure: function(err) {
            console.log(err);
            alert(err.message);
        },
    });
}