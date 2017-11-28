angular.module('mainCtrl', [])

.controller('MainController', function($rootScope, $location, Auth, socketio, $scope) {
	var vm = this;
	vm.loggedIn = Auth.isLoggedIn();

	if(vm.loggedIn) {
		$location.path('/chats/profile');
	}
	else {
        //$location.path('/chats/login');
    }
	
	$rootScope.$on('$routeChangeSuccess', function() {

        vm.loggedIn = Auth.isLoggedIn();
        
        vm.loadUserCredetial();

		Auth.getUser()
		.then(function(data) {
			vm.user = data.data;
            return vm.user;
		});
	});

	vm.doLogin = function() {
		vm.processing = true;

		vm.error = '';

    	if(vm.loginData.email && vm.loginData.password) {
        	Auth.login(vm.loginData.email, vm.loginData.password) 
    		.success(function(data) {
    			vm.processing = false;

    			var liveUser = Auth.getUser()
    			.then(function(data) {
    				vm.user = data.data;
                    return vm.user;
    			});


    			if(data.success) {
    				$location.path('/chats/profile');
                }
                else {
                    vm.error = data.message;
                    alert(vm.error);
                }
            });
        }
        else {
            alert('Please enter the proper value');
            return false;
        }
    }

    vm.doLogout = function() {
        var user = Auth.getDetails();
        var userid = user.userid;
        socketio.emit('disconnect me', userid);

        Auth.logout();
        jq('.navbar-collapse.in').collapse('hide');
        $location.path('/chats/logout');
    }


    vm.signupUser = function(isValid) {
        vm.message = '';

        if(vm.userData.username && vm.userData.email && vm.userData.password) {

            Auth.create(vm.userData)
                .then(function(response) {
                    vm.userData = {};
                    vm.message = response.data.message;
                    alert(vm.message);
                    $location.path('/chats/');
                });
        }
        else {
            alert('Please enter the proper value');
            return false;
        }
    }

    vm.loadUserCredetial = function() {
        setTimeout(function(){
            var user = Auth.getDetails();
            var userid = user.userid;
            
            if ($location.path() == '/chats/profile') {
                socketio.emit('new user', userid);
            }
        }, 1000);
    }


/*------------------------------------------------------------------
--------------------------------------------------------------------
------------------------  Socket Functions -------------------------
--------------------------------------------------------------------
------------------------------------------------------------------*/
var userDetails, userid, username, date, time, classname, receiver, receiverId, editId, 
    dateTime, liveUser, private, userMesId, senderChatId, 
    receiverChatId, totalUser = [];

    var userfun = function () {
        userDetails = Auth.getDetails();
        userid = userDetails.userid;
        username = userDetails.username;
    }
    userfun();

    vm.clickedMe = function (data) {

        userfun();
        vm.mesEdit = false;
		vm.mesNew = true;

        jq('.user-list ul li').removeClass('active');
        jq('#'+data).addClass('active');
        jq('.user-list ul li.active').find('.fa-comment-o').fadeOut(300);
        receiver = jq('.left .user-list ul li.active').text().trim();
        receiverId = data;
        senderChatId = userid + '_' + receiverId;
        receiverChatId = receiverId + '_' + userid;

        jq('.user-details').attr('id', receiverId);
        jq('.message-input').css('display','block');
        jq('#new-message').val('');

        if(userid) {
          socketio.emit('get individual messages', {user: userid, requestId: senderChatId});
        }

        if(jq('#'+data).hasClass('live')){
          private = 1;
        } 
        else private = 0;
        setTimeout(vm.markAsRead, 5000);
	}

    // change the name while editing the message
    vm.editMe = function (datas) {
        vm.mesEdit = true;
        vm.mesNew = false;
        editId = datas;
        var data = jq('#' + datas + ' .mes').text();
        jq('.message-input input[name="edit"]').val(data).focus();
    }

    // delete messages
    vm.deleteMe = function (datas) {
        var sendTime = time;
        socketio.emit('delete message', {
          message : 'Your message has been removed.',
          messageid : datas,
          time: dateTime,
          from: senderChatId,
          to : receiverChatId
        });
	}

    // messages details
    vm.toggleOption = function (data) {
        jq('#'+data).toggleClass('show-option');
        jq('#'+data).find('.options').fadeToggle(100);
    }

  	// mark read after viewing 
    vm.markAsRead = function () {
        jq('.message ul li b').removeClass('unread');
        socketio.emit('mark as read', {myid: senderChatId, userid: userid, receiverid: receiverId});
    }

    // Generate id
    vm.ID = function () {
       return username.trim() +'-'+ receiver.trim() +'-' + Math.random().toString(36).substr(2, 9).trim();
    };

    // Update time per second
    vm.updateTime = function () {
        date = dates();
        time = formatAMPM();
        dateTime = date + '_' + time;
        function dates() {
          var dt = new Date();
          var years = dt.getFullYear();
          var months = dt.getMonth()+1;
          var date = dt.getDate();
          months = months < 10 ? '0' + months : months;
          date = date < 10 ? '0' + date : date;
          var fullDate = years + '/' + months + '/' + date;
          return fullDate;
        }
        function formatAMPM() {
          var dt = new Date();
          var hours = dt.getHours();
          var minutes = dt.getMinutes();
          var seconds = dt.getSeconds();
          var ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          hours = hours < 10 ? '0'+ hours : hours;
          minutes = minutes < 10 ? '0'+minutes : minutes;
          var strTime = hours + ':' + minutes + ' ' + ampm;
          return strTime;
        }
    }
    vm.updateTime();
    setInterval(vm.updateTime, 1000);
    
    // emit the private message and ofline message
    vm.privatemessage = function (data) {
        if(!data) {
            return false;
        }
        if (vm.mesNew) {
            var mesId = vm.ID(); 
            var usermsg = data;
            vm.newMsg = '';
            var sliceTime = dateTime.slice(11, 19);

            vm.printMessageLocally (mesId, username, usermsg, sliceTime, 'my-info-one', false, false, false, false, false);

            if(private) {
                socketio.emit('private message', {
                  userid: userid,
                  toid: receiverId,
                  from: username,
                  message : usermsg,
                  messageid : mesId,
                  to : receiver,
                  time: dateTime,
                  unread: 0,
                  schatid: senderChatId,
                  rchatid: receiverChatId
                });
            }
            else {
                socketio.emit('ofline private message', {
                  userid: userid,
                  toid: receiverId,
                  from: username,
                  message : usermsg,
                  messageid : mesId,
                  to : receiver,
                  time: dateTime,
                  unread: 1,
                  schatid: senderChatId,
                  rchatid: receiverChatId
                });
            }
        }
        // edit message
        else if (vm.mesEdit) {
            var mes = data;
            var Id = editId;
			vm.mesEdit = false;
			vm.mesNew = true;
            socketio.emit('edit message', {
              message : mes,
              messageid : editId,
              time : dateTime,
              from: senderChatId,
              to : receiverChatId
            });
        }
    }

    // scroll to bottom
    vm.printMessageLocally = function (Id, Sender, Content, Time, Class, Edit, Delete, File, Image, Compressed) {
        var data = { 
                id: Id, 
                sender: Sender, 
                content: Content, 
                time: Time, 
                class: Class, 
                edit: Edit,
                delete: Delete,
                file: File,
                image: Image,
                compressed: Compressed
            }

        $scope.messageOne.push(data);
    }
  
    // Upload Files
    vm.files = [];
    vm.upload = function () {
       
        var mesObj = [];
        var sliceTime = dateTime.slice(11, 19);
        vm.newMsg = '';
        for(i = 0; i < vm.files.length; i++){
            var mesId = vm.ID(); 
            var fileUrl = vm.files[i].url;
            var fileName = vm.files[i].name;
            var File = vm.files[i].file;
            var image = vm.files[i].image;
            var compressed = vm.files[i].archived;
            var obj = {
                fname : fileName,
                file : File,
                img : image,
                arch : compressed 
            }

        
            if(private) {
                var privateData = { userid: userid, toid: receiverId, from: username, file : obj, messageid : mesId, to : receiver, time: dateTime, unread: 0, schatid: senderChatId, rchatid: receiverChatId };
                mesObj.push(privateData);
            }
            else {
                var oflinePrivateData = { userid: userid, toid: receiverId, from: username, file : obj, messageid : mesId, to : receiver, time: dateTime, unread: 1, schatid: senderChatId, rchatid: receiverChatId };
                mesObj.push(oflinePrivateData);
            }


            vm.printMessageLocally(mesId, username, fileUrl, sliceTime, 'my-info-one files', false, false, File, image, compressed);


            var filedata = vm.files[i]._file;
            console.log(filedata);
            Auth.uploadFile(filedata) 
                .success(function(data) {
                    if(data.success) {
                        for (var i = 0; i < mesObj.length; i++) {
                            if(mesObj[i].file.fname == data.fname) {
                                if(mesObj[i].unread == 0) {
                                    console.log(mesObj[i]);
                                    socketio.emit('private file', mesObj[i]);
                                }
                                else {
                                    socketio.emit('ofline private file', mesObj[i]);
                                }
                            }
                        }
                    }
                });
        }

    }

    // Download Attachment
    vm.downloadMe = function (datas) {
        var anchor = angular.element('<a/>');
        anchor.attr({
            href: datas,
            target: '_blank',
            download: datas.substr(datas.lastIndexOf('/')+1)
        })[0].click();
    }
    // load all the users from database (contacts)
    socketio.on('load contacts', function (docs){
        console.log(docs);
        jq('.left .user-list ul li').remove();
        var xx;
        vm.contacts = [];
        for (var i = 0; i < docs.length; i++) {
          if(docs[i].username == username) {}
          else {
            xx = {
                userid: docs[i].userid,
                username: docs[i].username
            }
            vm.contacts.push(xx);
          }
        };
        for (var i = 0; i < docs.length; i++) {
            for (var j = 0; j < docs[i].unread.length; j++) {
              if( docs[i].unread[j] == userid) {
                jq('.left .user-list ul li#' + docs[i].userid).find('.fa-comment-o').css('display','block');
              }
            }
        };
    });

    // load the old chat messages from database
    socketio.on('load old messages', function (docs){
        console.log(docs);
        jq('.message ul li').remove();
        $scope.messageOne = [];
        vm.messageFile = [];
        vm.messageTwo = [];
        for (var i = 0; i < docs.mes.length; i++) {
            if((docs.mes[i].sender == username || docs.mes[i].receiver == username) && (docs.mes[i].sender == receiver || docs.mes[i].receiver == receiver)){
                if(docs.mes[i].sender == username) {
                    var xx = docs.mes[i].dateTime;
                    var date = xx.slice(0, 10);
                    var savedTime = xx.slice(11, 19);

                    vm.printMessageLocally (docs.mes[i].messageId, docs.mes[i].sender, docs.mes[i].message, savedTime, 'my-info-one', docs.mes[i].edited, docs.mes[i].deleted, docs.mes[i].files, docs.mes[i].image, docs.mes[i].archived);
                }
                else { 
                    var xx = docs.mes[i].dateTime;
                    var date = xx.slice(0, 10);
                    var savedTime = xx.slice(11, 19);

                    vm.printMessageLocally (docs.mes[i].messageId, docs.mes[i].sender, docs.mes[i].message, savedTime, 'my-info-two', docs.mes[i].edited, docs.mes[i].deleted, docs.mes[i].files, docs.mes[i].image, docs.mes[i].archived);
                }
            }
        }
        for (var i = 0; i < docs.stat.length; i++) {
          jq('.message ul li#' + docs.stat[i] + ' b').addClass('unread');
        }
    });

    // load the live user name from server
    socketio.on('liveuser', function(data){
        console.log(data);
        jq('.left .user-list ul li').each(function () {
            jq(this).removeClass('live');
            for (var i = 0; i < data.length; i++) {
                if(jq(this).attr('id') == data[i]) {
                    jq(this).addClass('live'); 
                }
            }
        });
    });

    // load the chat messages from server
    socketio.on('private', function(data){
        if(data.from == receiver) {
            var sliceTime = data.time.slice(11, 19);
            vm.printMessageLocally (data.id, data.from, data.message, sliceTime, 'my-info-two', false, false, false, false, false);
        }
        else {
            jq('.left .user-list ul li').each(function () {
              if(jq(this).text().trim() == data.from){
                  jq(this).find('.fa-comment-o').css('display','block');
              }
            });
        }
    });

    // update edited message
    socketio.on('edit mes', function(data){
        var xx = data.time;
        var date = xx.slice(0, 10);
        var savedTime = xx.slice(11, 16);
        jq('#'+ data.Id ).addClass('edited');
        jq('#'+ data.Id + ' .mes').text(data.message).siblings('.options').children('.time').text(savedTime);
        jq('#new-message').val('');
    });

    // update delted message
    socketio.on('delete msg', function(data){
        var xx = data.time;
        var date = xx.slice(0, 10);
        var savedTime = xx.slice(11, 16);              
        jq('#'+data.Id + ' .mes').text(data.message).css('color', '#aaa').siblings('.options').children('.time').text(savedTime);
        jq('#'+data.Id).find('.fa-pencil-square-o').remove();
        jq('#'+data.Id).find('.fa-trash-o').css('pointer-events', 'none');
        jq('#'+data.Id+'.my-info-two').find('.fa').addClass(' fa-trash-o').css('pointer-events', 'none');
    });

    // Update file message
    socketio.on('fileDadta', function(data){

        if(data.from == receiver) {
            var sliceTime = data.time.slice(11, 19);
            vm.printMessageLocally (data.id, data.from, data.filePath, sliceTime, 'my-info-two', false, false, data.file, data.img, data.archived);
        }
        else {
            jq('.left .user-list ul li').each(function () {
              if(jq(this).text().trim() == data.from){
                  jq(this).find('.fa-comment-o').css('display','block');
              }
            });
        }
    });

})


.directive('ngFileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.ngFileModel);
            var isMultiple = attrs.multiple;
            var modelSetter = model.assign;
            element.bind('change', function () {
                var values = [];
                angular.forEach(element[0].files, function (item) {
                    var value;
                    var ext = item.name.split('.').pop().toLowerCase();
                    if(jq.inArray(ext, ['gif','png','jpg','jpeg']) == -1) {
                        
                        if(jq.inArray(ext, ['zip','rar']) == -1) {
                            value = {
                                name: item.name,
                                size: item.size,
                                class: 'my-info-two files',
                                file: 1,
                                image: 0,
                                archived: 0,
                                url: URL.createObjectURL(item),
                                _file: item
                            };
                        }
                        else {
                            value = {
                                name: item.name,
                                size: item.size,
                                class: 'my-info-two files',
                                file: 0,
                                image: 0,
                                archived: 1,
                                url: URL.createObjectURL(item),
                                _file: item
                            };
                        }
                    }
                    else {
                        value = {
                            name: item.name,
                            size: item.size,
                            class: 'my-info-two files',
                            file: 0,
                            image: 1,
                            archived: 0,
                            url: URL.createObjectURL(item),
                            _file: item
                        };   
                    }

                    values.push(value);
                });
                scope.$apply(function () {
                    if (isMultiple) {
                        modelSetter(scope, values);
                    } else {
                        modelSetter(scope, values[0]);
                    }
                });
            });
        }
    };
}]).directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeFunc = scope.$eval(attrs.customOnChange);
      element.bind('change', onChangeFunc);
    }
  };
}).directive('schrollBottom', function () {
  return {
    scope: {
      schrollBottom: "="
    },
    link: function (scope, element) {
      scope.$watchCollection('schrollBottom', function (newValue) {
        if (newValue)
        {
            jq('body').animate({
                scrollTop: jq(element)[0].scrollHeight + 40
            }, 400);
        }
      });
    }
  }
});

