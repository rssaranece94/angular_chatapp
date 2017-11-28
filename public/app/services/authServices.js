angular.module('authServices', ['btford.socket-io'])


.factory('Auth', function($http, $q, AuthToken){
	

	var authFactory = {};


	authFactory.sendMail = function(mailData) {
		return $http.get('/chat/sendemail', mailData);
	}

	authFactory.create = function(userData) {
		return $http.post('/chat/signup', userData);
	}

	authFactory.uploadFile = function(data) {

		var fd = new FormData();
        fd.append('file', data);

        return $http.post('/chat/files',fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        });
	}
		
	authFactory.login = function (email, password) {
		return $http.post('/chat/authenticate', {
			email: email,
			password: password
		})
		.success(function (data) {
			AuthToken.setToken(data.token);
			return data;
		})
	}

	authFactory.logout = function() {
		AuthToken.setToken();
		AuthToken.setUserDetails();
	}

	authFactory.isLoggedIn = function() {
		if(AuthToken.getToken()) {
			return true;
		}
		else {
			return false;
		}
	}
	authFactory.getUser = function() {
		if(AuthToken.getToken()) {
			return $http.get('/chat/me')
					.success(function (data) {
						AuthToken.setUserDetails(data.userid, data.username);
						authFactory.getDetails();
					});
		}

		else
			return $q.reject({ message: "User has no token"});
	}
	authFactory.getDetails = function() {
		if(AuthToken.getToken()) {
			var data = {
				userid: AuthToken.getUserId(),
				username: AuthToken.getUserName()
			}
			return data;
		}

		else
			return $q.reject({ message: "User has no token"});
	}
	return authFactory;
})

.factory('AuthToken', function($window) {
	var authTokenFactory = {};

	authTokenFactory.getToken = function () {
		return $window.localStorage.getItem('token');
	}

	authTokenFactory.setToken = function(token) {
		if(token) {
			return $window.localStorage.setItem('token', token);
		}
		else {
			return $window.localStorage.removeItem('token');
		}
	}
	authTokenFactory.getUserId = function () {
		return $window.localStorage.getItem('userid');
	}
	authTokenFactory.getUserName = function () {
		return $window.localStorage.getItem('username');
	}

	authTokenFactory.setUserDetails = function(id, name) {
		if(id) {
				$window.localStorage.setItem('userid', id);
				$window.localStorage.setItem('username', name);
		}
		else {
				$window.localStorage.removeItem('userid');
				$window.localStorage.removeItem('username');
		}
	}

	return authTokenFactory;
})

.factory('AuthInterceptor', function($q, $location, AuthToken) {

	var interceptorFactory = {};

	interceptorFactory.request = function(config) {

		var token = AuthToken.getToken();

		if(token) {
			config.headers.Authorization = token;
		}

		return config;
	}

	interceptorFactory.responseError = function(response) {
		if(response.status == 401) {
				AuthToken.setToken();
				AuthToken.setUserDetails();
				alert('Your section has expired please login');
				$location.path('/chats/login');
		}

		return $q.reject(response);
	}

	return interceptorFactory;

})

.factory('socketio', ['$rootScope', function ($rootScope) {
  	
	var socket = io.connect();

	return {

		on: function(eventName, callback) {
			socket.on(eventName, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					callback.apply(socket, args);
				});
			});
		},

		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				var args = arguments;
				$rootSchope.apply(function() {
					if(callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};


}]);