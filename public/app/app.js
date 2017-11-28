angular.module('MyApp', ['appRoutes', 'mainCtrl', 'authServices'])

.config(function($httpProvider) {
	$httpProvider.interceptors.push('AuthInterceptor');
});