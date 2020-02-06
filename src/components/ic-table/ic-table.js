(function() {
  InnovicTableController.$inject = [
    "$scope",
    "NgTableParams",
    "ngTableEventsChannel",
    "$attrs"
  ];

  function InnovicTableController(
    $scope,
    NgTableParams,
    ngTableEventsChannel,
    $attrs
  ) {
    var ctrl = this;
    var serverRows;

    ctrl.$onInit = function() {
      ctrl.attrs = $attrs;
    };

    ctrl.$onChanges = function(changes) {
      if (
        changes.source &&
        changes.source.currentValue &&
        changes.source.currentValue.rows
      ) {
        serverRows = angular.copy(changes.source.currentValue.rows);
        /* The passed config is a bit different when it comes to what ng-table expects.
      Making a few changes for ng-table compatibility */
        resolveConfig();
        //resolveSource();
        ctrl.tableParams = new NgTableParams(
          { sorting: ctrl.config.sorting },
          { dataset: serverRows }
        );
        ngTableEventsChannel.onAfterReloadData(
          handleOnAfterReloadData,
          $scope,
          ctrl.tableParams
        );
      }
    };

    ctrl.switchEditMode = switchEditMode;
    ctrl.handleLastColumnKeyDown = handleLastColumnKeyDown;
    ctrl.save = save;
    ctrl.del = del;
    ctrl.addRow = addRow;
    ctrl.edit = edit;

    function edit(row) {
      ctrl.onRowEdit({ item: row });
    }

    function del(row) {
      if (ctrl.onRowDelete) {
        if (row.Id) {
          ctrl.updatingTable = true;
          ctrl.onRowDelete({ row: row }).then(
            function() {
              ctrl.updatingTable = false;
              removeRow(row);
            },
            function(error) {
              console.log(
                "Something went wrong. Please report this behavior immediately."
              );
            }
          );
        }
      }
      if (!ctrl.updatingTable) {
        removeRow(row);
      }
    }

    function save(row, rowForm) {
      if (!rowForm.$pristine && rowForm.$valid) {
        ctrl.updatingTable = true;
        ctrl.onRowSave({ row: row }).then(
          function(item) {
            ctrl.updatingTable = false;
            angular.extend(row, item);
            rowForm.$setPristine();
          },
          function(reason) {
            Notification.error({
              message: reason,
              delay: null
            });
          }
        );
      }
    }

    function switchEditMode(currentMode) {
      /* Since this function flips the flag value at the end, 
    ctrl.isEditing = true means that 
    the table is going to quit the edit mode*/
      if (ctrl.isEditing) {
        enableSorting();
        resetTable();
        if (ctrl.onTableSave) {
          var validRowForms = _.filter(ctrl.tableForm.$$controls, function(
            control
          ) {
            return control.$name === "rowForm" && control.$valid;
          });
          var validRows = _.pluck(
            _.pluck(validRowForms, "rowData"),
            "$modelValue"
          );
          ctrl.onTableSave({ rows: validRows });
        }
      } else {
        if (ctrl.onTableEdit) {
          ctrl.onTableEdit();
        }
        disableSorting();
        resetTable();
      }

      ctrl.isEditing = !currentMode;
    }

    function resolveConfig() {
      // Sorting Resolution: ng-table expects sortable property in columns for sorting to work
      var columns = ctrl.config.columns;

      _.each(columns, function(column) {
        if (column.isSortable) {
          column.sortable = column.field;
        }
      });
    }

    // function resolveSource() {
    //   ctrl.select.resolveSource();
    // }

    function disableSorting() {
      var columns = ctrl.config.columns;

      _.each(columns, function(column) {
        if (column.isSortable) {
          column.sortable = false;
        }
      });

      // Resets to default row sort order i.e. without any sorting applied
      ctrl.tableParams.sorting({});
    }

    function enableSorting() {
      var columns = ctrl.config.columns;

      _.each(columns, function(column) {
        if (column.isSortable) {
          column.sortable = column.field;
        }
      });
    }

    function resetTable() {
      ctrl.tableForm.$setPristine();
      ctrl.tableParams.settings().dataset = angular.copy(serverRows);
      ctrl.tableParams.reload();
    }

    function handleLastColumnKeyDown(event, row, rowForm, rowIndex) {
      if (event.keyCode === 9) {
        if (rowIndex === ctrl.lastRowIndex) {
          addRow();
        }
        save(row, rowForm);
      }
    }

    function removeRow(row) {
      ctrl.tableParams.settings().dataset = _.without(
        ctrl.tableParams.settings().dataset,
        _.findWhere(ctrl.tableParams.settings().dataset, {
          $$hashKey: row.$$hashKey
        })
      );

      ctrl.tableParams.reload();
    }

    function addRow() {
      var newRow = angular.copy(ctrl.config.rowObject);

      ctrl.tableParams.settings().dataset.push(newRow);

      /* Sets the count for number of rows to be displayed on a single page. 
    Will always be equal to total rows and hence there will always be a single page.
    Which is how it should be in edit mode.*/
      ctrl.tableParams.count(ctrl.tableParams.settings().dataset.length);

      ctrl.tableParams.reload();
      ctrl.lastRowIndex = ctrl.tableParams.settings().dataset.length - 1;
    }

    ctrl.typeAhead = {
      onSelect: function(
        typeAheadResult,
        row,
        affectedRowProps,
        externalOnSelect
      ) {
        selectiveCopy(typeAheadResult, row, affectedRowProps);
        if (externalOnSelect) {
          externalOnSelect(typeAheadResult);
        }
      }
    };

    ctrl.select = {
      onChange: function(selectResult, row, affectedRowProps) {
        selectiveCopy(selectResult, row, affectedRowProps);
      },
      resolve: function(row, select) {
        var selected = {};
        var source = {};

        // First check for source in tableSource
        if (ctrl.source.rows[select.optionSourceName]) {
          source = ctrl.source.rows[select.optionSourceName];
        } else if (ctrl.source[select.optionSourceName]) {
          source = ctrl.source[select.optionSourceName];
        }

        selected[select.optionBinding.display] =
          row[select.selectBinding.display];
        selected[select.optionBinding.value] = row[select.selectBinding.value];

        return { selected: selected, source: source };
      }
    };

    ctrl.rowSelection = {
      onClick: function(button) {
        var rows = ctrl.tableParams.settings().dataset;
        var rowSelectColumnConfig = _.findWhere(ctrl.config.columns, {
          fieldType: "row-select"
        });
        var propertyToSearch = {};
        propertyToSearch[rowSelectColumnConfig.field] = true;
        var selectedRows = _.where(rows, propertyToSearch);

        button.onClick(selectedRows);
      }
    };

    ctrl.utility = {
      active: function(active) {
        if (active !== undefined) {
          return active;
        } else {
          return true;
        }
      },
      showIf: function(row, showIf) {
        if (showIf !== undefined) {
          return showIf(row);
        } else {
          return true;
        }
      },
      enableIf: function(row, enableIf) {
        if (enableIf !== undefined) {
          return enableIf(row);
        } else {
          return true;
        }
      }
    };

    function selectiveCopy(from, to, map) {
      for (var property in map) {
        to[property] = from[map[property]];
      }
    }

    function handleOnAfterReloadData(tableParams) {
      ctrl.visibleRowCount = tableParams.data.length;
      ctrl.onFilter({ rows: tableParams.data });
    }
  }

  angular.module("innovic-components").component("icTable", {
    templateUrl: "components/ic-table/ic-table.html",
    controller: InnovicTableController,
    bindings: {
      title: "@",
      config: "<",
      source: "<",
      onRowDelete: "&",
      onRowSave: "&",
      onRowEdit: "&",
      onTableSave: "&",
      onTableEdit: "&",
      onFilter: "&"
    }
  });
})();
