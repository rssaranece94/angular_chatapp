var socket = io();
var date, time, classname, receiver, receiverId, editId, dateTime, liveUser, private, userMesId, senderChatId, receiverChatId, totalUser = [];


$(function () {

    $('.left .user-list ul').on('click', 'li',function () {
        $('.user-list ul li').removeClass('active');
        $(this).addClass('active');
        $('.user-list ul li.active').find('.fa-comment-o').css('display','none');
        $('.user-details').attr('id', receiverId);
        $('.message-input').css('display','block');
        $('#new-message').val('');
        //$('.header-cont .user p').text($('.user-list ul li.active').text());

        receiver = $('.left .user-list ul li.active').text();
        receiverId = $('.left .user-list ul li.active').attr('id');
        senderChatId = userid + '_' + receiverId;
        receiverChatId = receiverId + '_' + userid;

        socket.emit('get individual messages', {user: userid, requestId: senderChatId});
        
        if($(this).hasClass('live')){
          private = 1;
        } 
        else private = 0;
        setTimeout(markAsRead, 5000);
    });

    // clear input value
    $('#user-message').submit(function () {
        $('#new-message').val('');
    });

    // change the name while editing the message
    $('.right .message ul').on('click', 'li .options .fa-pencil-square-o', function () {
        editId = $(this).parents('li').attr('id');
        var data = $('#' + editId + ' .mes').text();
        $('.message-input input[name="mesdata"]').val(data).attr('name', 'editMes').focus();
    });

    // delete messages
    $('.right .message ul').on('click', 'li .options .fa-trash-o', function () {
        var data = 'Your message has been removed.';
        var mesId = $(this).parents('li').attr('id');
        var sendTime = time;
        socket.emit('delete message', {
          message : data,
          messageid : mesId,
          time: dateTime,
          from: senderChatId,
          to : receiverChatId
        });
    });

});
    // mark read after viewing 
    function markAsRead () {
        $('.message ul li b').removeClass('unread');
        socket.emit('mark as read', {myid: senderChatId, userid: userid, receiverid: receiverId});
    }

    // Generate id
    var ID = function () {
      return username+'_'+receiver+'_' + Math.random().toString(36).substr(2, 9);
    };

    // Update time per second
    updateTime = function () {
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
    updateTime();
    setInterval(updateTime, 1000);
    // send the trigger on user connection and disconnection
//    socket.emit('new user', userid);

    
    // emit the private message and ofline message
    function privatemessage () {
        if ($('.message-input  input').attr('name') == 'mesdata') {
            var mesId = ID();
            var usermsg = $('#new-message').val();

            var obj = {
              id: mesId,
              from: username,
              message: usermsg,
              time: dateTime
            };
            if(private) {
                socket.emit('private message', {
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
                socket.emit('ofline private message', {
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
            printMyMessage(obj);
            $('#new-message').val('');
        }
        // edit message
        else if ($('.message-input  input').attr('name') == 'editMes') {
            var mes = $('.message-input input').attr('name', 'mesdata').val();
            var Id = editId;

            socket.emit('edit message', {
              message : mes,
              messageid : editId,
              time : dateTime,
              from: senderChatId,
              to : receiverChatId
            });
        }
    }
         

    // // load all the users from database (contacts)
    // socket.on('load contacts', function (docs){
    //     $('.left .user-list ul li').remove();
    //     for (var i = 0; i < docs.length; i++) {
    //       if(docs[i].username == username) {}
    //       else $('.left .user-list ul').append('<li id="' + docs[i].userid + '">' + docs[i].username + '<span class="prop"><i class="fa fa-comment-o" aria-hidden="true"></i><i class="fa fa-check-circle-o" aria-hidden="true"></i></span></li>');
    //     };
    //     for (var i = 0; i < docs.length; i++) {
    //         for (var j = 0; j < docs[i].unread.length; j++) {
    //           if( docs[i].unread[j] == userid) {
    //             $('.left .user-list ul li#' + docs[i].userid).find('.fa-comment-o').css('display','block');
    //           }
    //         }
    //     };
    // });


    // load the old chat messages from database
    socket.on('load old messages', function (docs){
        $('.message ul li').remove();
        receiver = $('.left .user-list ul li.active').text();

        for (var i = 0; i < docs.mes.length; i++) {
          if((docs.mes[i].sender == username || docs.mes[i].receiver == username) && (docs.mes[i].sender == receiver || docs.mes[i].receiver == receiver)){
              if(docs.mes[i].sender == username) {
                var xx = docs.mes[i].dateTime;
                var date = xx.slice(0, 10);
                var savedTime = xx.slice(11, 19);

                if(docs.mes[i].edited == true) {
                    $('.message ul').append($('<li id="' + docs.mes[i].messageId + '" class="my-info-one edited"><b>' + docs.mes[i].sender + ': </b><span class="mes">' + docs.mes[i].message + '</span><span class="options"><i class="fa fa-pencil-square-o" aria-hidden="true"></i><i class="fa fa-trash-o" aria-hidden="true"></i><span class="time">' + savedTime + '</span></span></li>'));
                }
                else if (docs.mes[i].deleted == true){
                  $('.message ul').append($('<li id="' + docs.mes[i].messageId + '" class="my-info-one"><b>' + docs.mes[i].sender + ': </b><span class="mes" style="color:#aaa;">' + docs.mes[i].message + '</span><span class="options"><i class="fa fa-trash-o" aria-hidden="true" style="pointer-events: none;"></i><span class="time">' + savedTime + '</span></span></li>'));
                }
                else {
                    $('.message ul').append($('<li id="' + docs.mes[i].messageId + '" class="my-info-one"><b>' + docs.mes[i].sender + ': </b><span class="mes">' + docs.mes[i].message + '</span><span class="options"><i class="fa fa-pencil-square-o" aria-hidden="true"></i><i class="fa fa-trash-o" aria-hidden="true"></i><span class="time">' + savedTime + '</span></span></li>'));
                }
              }
              else { 
                var xx = docs.mes[i].dateTime;
                var date = xx.slice(0, 10);
                var savedTime = xx.slice(11, 19);
                
                if(docs.mes[i].edited == true) {
                    $('.message ul').append($('<li id="' + docs.mes[i].messageId + '" class="my-info-two edited"><b>' + docs.mes[i].sender + ': </b><span class="mes">' + docs.mes[i].message + '</span><span class="options"><span class="time">' + savedTime + '</span></span></li>'));
                }
                else if (docs.mes[i].deleted == true){
                    $('.message ul').append($('<li id="' + docs.mes[i].messageId + '" class="my-info-two"><b>' + docs.mes[i].sender + ': </b><span class="mes" style="color:#aaa;">' + docs.mes[i].message + '</span><span class="options"><i class="fa fa-trash-o" aria-hidden="true" style="pointer-events: none;"></i><span class="time">' + savedTime + '</span></span></li>'));
                }
                else {
                    $('.message ul').append($('<li id="' + docs.mes[i].messageId + '" class="my-info-two"><b>' + docs.mes[i].sender + ': </b><span class="mes">' + docs.mes[i].message + '</span><span class="options"><span class="time">' + savedTime + '</span></span></li>'));
                }
              }
          }
        };
        for (var i = 0; i < docs.stat.length; i++) {
          $('.message ul li#' + docs.stat[i] + ' b').addClass('unread');
        }
        scroll();
    });

    // // load the live user name from server
    // socket.on('liveuser', function(data){
    //     var removeItem = userid;
    //     data = $.grep(data, function(value) {
    //       return value != removeItem;
    //     });
    //     liveUser = data;
    //     $('.left .user-list ul li').each(function () {
    //     $(this).removeClass('live');
    //       for (var i = 0; i < data.length; i++) {
    //         if($(this).attr('id') == data[i]) {
    //             $(this).addClass('live'); 
    //         }
    //       }
    //     });
    // });


    // load the chat messages from server
    socket.on('private', function(data){
      if(data.from == receiver) {
        var sliceTime = data.time.slice(11, 19);
          $('.message ul').append($('<li id="' + data.id + '" class="my-info-two"><b>' + data.from + ': </b><span class="mes">' + data.message + '</span><span class="options"><i class="fa" aria-hidden="true"></i><span class="time">' + sliceTime + '</span></span></li>'));
      }
      else {
        $('.left .user-list ul li').each(function () {
          if($(this).text() == data.from){
              $(this).find('.fa-comment-o').css('display','block');
          }
        });
      }
      scroll();
    });

    // update edited message
    socket.on('edit mes', function(data){
        var xx = data.time;
        var date = xx.slice(0, 10);
        var savedTime = xx.slice(11, 16);
        $('#'+ data.Id ).addClass('edited');
        $('#'+ data.Id + ' .mes').text(data.message).siblings('.options').children('.time').text(savedTime);
        $('#new-message').val('');
    });

    // update delted message
    socket.on('delete msg', function(data){
        var xx = data.time;
        var date = xx.slice(0, 10);
        var savedTime = xx.slice(11, 16);              
        $('#'+data.Id + ' .mes').text(data.message).css('color', '#aaa').siblings('.options').children('.time').text(savedTime);
        $('#'+data.Id).find('.fa-pencil-square-o').remove();
        $('#'+data.Id).find('.fa-trash-o').css('pointer-events', 'none');
        $('#'+data.Id+'.my-info-two').find('.fa').addClass(' fa-trash-o').css('pointer-events', 'none');
    });

    // scroll to bottom
    function scroll() {
      var height = $('.right').height();
      var variableHeight = $('#mCSB_2_container').height();
      if(variableHeight >= height) {
        $('#mCSB_2_container').css("top",height - variableHeight);
      }
    }

    // print the sent messages
    function printMyMessage(data) {
        var sliceTime = data.time.slice(11, 19);
        $('.message ul').append($('<li id="' + data.id + '" class="my-info-one"><b>' + data.from + ': </b><span class="mes">' + data.message + '</span><span class="options"><i class="fa fa-pencil-square-o" aria-hidden="true"></i><i class="fa fa-trash-o" aria-hidden="true"></i><span class="time">' + sliceTime + '</span></span></li>'));
        scroll();
    }

