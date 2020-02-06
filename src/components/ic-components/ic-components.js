(function() {
  IcComponentsController.$inject = ["appService"];

  function IcComponentsController(appService) {
    var ctrl = this;

    ctrl.$onInit = function() {
      ctrl.icTable = {
        config: {
          columns: [
            {
              field: "Name",
              fieldType: "text",
              title: "Name",
              filter: {
                Name: "text"
              },
              isSortable: true,
              isLast: true,
              required: true
            },
            {
              field: "action",
              fieldType: "command",
              title: "",
              buttons: {
                editRow: {
                  active: false
                },
                deleteRow: {
                  active: false
                }
              }
            }
          ],
          rowObject: {
            Name: null
          },
          buttons: {
            saveTable: {
              glyphicon: "remove"
            }
          }
        }
      };

      appService.initIcTable().then(function(data) {
        ctrl.icTable.source = angular.copy(data);
      });
    };
  }

  var IcComponentsComponent = {
    templateUrl: "components/ic-components/ic-components.html",
    controller: IcComponentsController
  };

  angular
    .module("innovic-components")
    .component("icComponents", IcComponentsComponent);
})();
