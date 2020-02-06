(function() {
  InnovicPanelComponentController.$inject = ["$transclude"];

  function InnovicPanelComponentController($transclude) {
    var ctrl = this;

    ctrl.$onInit = function() {
      ctrl.hasTransclusion = function(name) {
        return $transclude.isSlotFilled(name);
      };
    };
  }

  var InnovicPanelComponent = {
    bindings: {
      icTitle: "@",
      icStyle: "@",
      theme: "@",
      isCollapsible: "<",
      isCollapsed: "<",
      collapseClass: "@",
      hideHeading: "<"
    },
    templateUrl: "components/ic-panel/ic-panel.html",
    transclude: {
      topRight: "?icTopRight",
      body: "icBody",
      footer: "?icFooter"
    },
    controller: InnovicPanelComponentController
  };

  angular
    .module("innovic-components")
    .component("icPanel", InnovicPanelComponent);
})();
