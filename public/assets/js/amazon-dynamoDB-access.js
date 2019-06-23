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
    var docClient = new AWS.DynamoDB.DocumentClient();

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
            // check if user profile image is already uploaded and set profile image
            if(data.Item.ProfileImage == false) {
                document.getElementById('profile-image1').src = "https://s3.ap-northeast-2.amazonaws.com/com.mymentormenteeimage/default.jpg";
            } else {
                document.getElementById('profile-image1').src = data.Item.ProfileImageURL;
            }

            document.getElementById('username').innerHTML = data.Item.Username;
            document.getElementById('useryear').innerHTML = data.Item.Year + ' student';
            document.getElementById('useremail').innerHTML = data.Item.Email;
            document.getElementById('userjoined').innerHTML = data.Item.Joined;
            if(data.Item.grade === undefined) {
                document.getElementById('usergrade').innerHTML = 0;
            } else {
                document.getElementById('usergrade').innerHTML = data.Item.grade;
            }
        }
    });
}

function startPage() {
    checkSignIn();
    getUserData();
}