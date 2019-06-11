AWS.config.update({
    region: "ap-northeast-2",
    endpoint: 'dynamodb.ap-northeast-2.amazonaws.com',
    accessKeyId: "AKIA4NDWRPCLZQ7TIRHQ",
    secretAccessKey: "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"
});

var docClient = new AWS.DynamoDB.DocumentClient();

// 권한없이 url을 통한 우회 접속 시 차단
function checkSignIn() {
    if(!sessionStorage['accessToken']) {
        alert('First, sign in to use the service!!!');
        window.location.replace('index.html');
        return;
    } else {
        //
    }
}

function getUserData() {
    var accessToken = JSON.parse(sessionStorage['accessToken']);
    var userid = accessToken.payload['cognito:username'];

    var params = {
        TableName :"MyMentorDB",
        Key: {
            "Username": userid
        }
    };
    docClient.get(params, function(err, data) {
        if(err) {
            console.log('something bad happened!!!');
        } else {
            // console.log(data);
            document.getElementById('username').innerHTML = data.Item.Username;
            document.getElementById('useryear').innerHTML = data.Item.Year + ' student';
            document.getElementById('useremail').innerHTML = data.Item.Email;
            document.getElementById('usergrade').innerHTML = data.Item.grade;
        }
    });
}

function startPage() {
    checkSignIn();
    getUserData();
}