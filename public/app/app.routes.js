angular.module('appRoutes', ['ngRoute'])

.config(['$routeProvider', '$compileProvider', '$locationProvider', function($routeProvider, $compileProvider, $locationProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);


	$routeProvider

	.when('/chats/', {
		templateUrl: 'app/views/pages/home.html',
		controller: 'MainController',
		controllerAs: 'main'
	})
	.when('/chats/login', {
		templateUrl: 'app/views/pages/login.html'
	})
	.when('/chats/signup', {
		templateUrl: 'app/views/pages/signup.html'
	})
	.when('/chats/profile', {
		templateUrl: 'app/views/pages/profile.html'
	})
	.when('/chats/logout', {
		templateUrl: 'app/views/pages/logout.html'
	})
	.when('/chats/settings', {
		templateUrl: 'app/views/pages/settings.html'
	})

	$locationProvider.html5Mode(true);
}]);