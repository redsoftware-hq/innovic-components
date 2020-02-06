(function() {
  appService.$inject = ["$http", "$q"];

  function appService($http, $q) {
    var service = {
      initIcTable: initIcTable
    };

    return service;

    function initIcTable() {
      var deferred = $q.defer();

      $http({
        method: "GET",
        url: "data/ic-table.json",
        dataType: "JSON"
      }).then(
        function(response) {
          deferred.resolve(response.data);
        },
        function(error) {
          var message = "Unable to Search Components";
          console.log(message);
          deferred.reject(message);
        }
      );

      return deferred.promise;
    }
  }

  angular.module("innovic-components").factory("appService", appService);
})();
