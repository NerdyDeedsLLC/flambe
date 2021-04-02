(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('cDbTable', ['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.cDbTable = {}));
}(this, (function (exports) { 'use strict';

    class __DBTable extends Array {
      constructor(props) {
        super(props);
        console.log('__DBTable :', __DBTable, "\n   - Props : ", props, this);
        Object.assign(this, props);
        this.__name = props.__name;
        this.parent = props.__parent;
        this.root = props.__root;

        this.isIterable = object => object != null && typeof object[Symbol.iterator] === 'function'; //console.log('this.root.createInstance({name:this.name}) :', this.root.createInstance({name:this.name}));


        this.root.bindTableInstance(this.__name, this); // Object.assign(this, );

        return; // WRITING a record to the table
      }

    }

    exports.__DBTable = __DBTable;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=c_DBTable.js.map
